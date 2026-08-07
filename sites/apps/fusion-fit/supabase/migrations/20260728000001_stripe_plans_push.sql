-- ============================================================
-- Stripe fields + protection abonnement + push subscriptions
-- ============================================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS stripe_customer_id text,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id text;

CREATE UNIQUE INDEX IF NOT EXISTS profiles_stripe_customer_uidx
  ON public.profiles (stripe_customer_id)
  WHERE stripe_customer_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS profiles_stripe_subscription_uidx
  ON public.profiles (stripe_subscription_id)
  WHERE stripe_subscription_id IS NOT NULL;

-- Bloque les updates client sur les champs abonnement / Stripe
CREATE OR REPLACE FUNCTION public.protect_abonnement_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF current_setting('app.bypass_abonnement_guard', true) = 'on' THEN
    RETURN NEW;
  END IF;

  IF NEW.abonnement_plan IS DISTINCT FROM OLD.abonnement_plan
     OR NEW.abonnement_statut IS DISTINCT FROM OLD.abonnement_statut
     OR NEW.abonnement_depuis IS DISTINCT FROM OLD.abonnement_depuis
     OR NEW.stripe_customer_id IS DISTINCT FROM OLD.stripe_customer_id
     OR NEW.stripe_subscription_id IS DISTINCT FROM OLD.stripe_subscription_id
  THEN
    RAISE EXCEPTION 'Champs abonnement réservés au serveur (Stripe webhook)';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_abonnement_fields ON public.profiles;
CREATE TRIGGER protect_abonnement_fields
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.protect_abonnement_fields();

-- RPC serveur (service role / SECURITY DEFINER) pour appliquer un plan
CREATE OR REPLACE FUNCTION public.apply_abonnement(
  p_user_id uuid,
  p_plan text,
  p_statut text,
  p_stripe_customer_id text DEFAULT NULL,
  p_stripe_subscription_id text DEFAULT NULL
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM set_config('app.bypass_abonnement_guard', 'on', true);
  UPDATE public.profiles
  SET
    abonnement_plan = COALESCE(p_plan, abonnement_plan),
    abonnement_statut = COALESCE(p_statut, abonnement_statut),
    abonnement_depuis = CASE
      WHEN p_statut = 'actif' AND abonnement_statut IS DISTINCT FROM 'actif'
        THEN CURRENT_DATE
      ELSE abonnement_depuis
    END,
    stripe_customer_id = COALESCE(p_stripe_customer_id, stripe_customer_id),
    stripe_subscription_id = COALESCE(p_stripe_subscription_id, stripe_subscription_id)
  WHERE user_id = p_user_id;
END;
$$;
REVOKE ALL ON FUNCTION public.apply_abonnement(uuid, text, text, text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.apply_abonnement(uuid, text, text, text, text) TO service_role;

-- Activer l'essai Découverte (appelable par l'utilisateur lui-même, une fois)
CREATE OR REPLACE FUNCTION public.activate_essai_decouverte()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Non authentifié';
  END IF;
  PERFORM set_config('app.bypass_abonnement_guard', 'on', true);
  UPDATE public.profiles
  SET
    abonnement_plan = 'decouverte',
    abonnement_statut = 'essai',
    abonnement_depuis = COALESCE(abonnement_depuis, CURRENT_DATE)
  WHERE user_id = auth.uid()
    AND (abonnement_statut IS NULL OR abonnement_statut IN ('essai', 'expire', 'annule') OR abonnement_plan = 'decouverte');
END;
$$;
REVOKE ALL ON FUNCTION public.activate_essai_decouverte() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.activate_essai_decouverte() TO authenticated;

-- ------------------------------------------------------------
-- Web Push subscriptions
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint text NOT NULL,
  p256dh text NOT NULL,
  auth text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, endpoint)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.push_subscriptions TO authenticated;
GRANT ALL ON public.push_subscriptions TO service_role;
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own push subs" ON public.push_subscriptions;
CREATE POLICY "Users manage own push subs" ON public.push_subscriptions
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ------------------------------------------------------------
-- Email outbox (best-effort, drained by server job / edge)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.email_outbox (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  to_email text NOT NULL,
  subject text NOT NULL,
  body text NOT NULL,
  kind text NOT NULL DEFAULT 'notif',
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  sent_at timestamptz
);

GRANT SELECT ON public.email_outbox TO authenticated;
GRANT ALL ON public.email_outbox TO service_role;
ALTER TABLE public.email_outbox ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own email outbox" ON public.email_outbox;
CREATE POLICY "Users read own email outbox" ON public.email_outbox
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.enqueue_email_for_user(
  p_user_id uuid,
  p_subject text,
  p_body text,
  p_kind text DEFAULT 'notif'
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email text;
  v_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Non authentifié';
  END IF;

  IF p_user_id <> auth.uid()
     AND NOT public.is_coach_of(auth.uid(), p_user_id)
     AND NOT public.is_coach_of(p_user_id, auth.uid())
  THEN
    RAISE EXCEPTION 'Non autorisé';
  END IF;

  SELECT email INTO v_email FROM public.profiles WHERE user_id = p_user_id;
  IF v_email IS NULL OR v_email = '' THEN
    RETURN NULL;
  END IF;

  INSERT INTO public.email_outbox (user_id, to_email, subject, body, kind)
  VALUES (p_user_id, v_email, p_subject, p_body, p_kind)
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;
REVOKE ALL ON FUNCTION public.enqueue_email_for_user(uuid, text, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.enqueue_email_for_user(uuid, text, text, text) TO authenticated;
