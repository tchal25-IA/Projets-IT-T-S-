-- 1) Table pour persister le simulateur Budget par utilisateur
CREATE TABLE IF NOT EXISTS public.user_budgets (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_budgets TO authenticated;
GRANT ALL ON public.user_budgets TO service_role;

ALTER TABLE public.user_budgets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own budget"
  ON public.user_budgets FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER trg_user_budgets_updated
  BEFORE UPDATE ON public.user_budgets
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 2) Étendre la période d'essai du parrain de 2 mois lorsqu'un filleul est vérifié
CREATE OR REPLACE FUNCTION public.try_verify_referral(_referee UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_confirmed BOOLEAN;
  v_has_sub BOOLEAN;
  v_referrer UUID;
BEGIN
  SELECT (email_confirmed_at IS NOT NULL) INTO v_confirmed FROM auth.users WHERE id = _referee;
  SELECT EXISTS(SELECT 1 FROM public.subscriptions WHERE user_id = _referee) INTO v_has_sub;

  IF v_confirmed AND v_has_sub THEN
    UPDATE public.referrals
       SET status = 'verified', verified_at = now()
     WHERE referee_id = _referee AND status = 'pending'
    RETURNING referrer_id INTO v_referrer;

    IF v_referrer IS NOT NULL THEN
      -- Ajoute 2 mois à la fin d'essai du parrain (ou +2 mois à partir de maintenant si expirée / absente)
      UPDATE public.subscriptions
         SET trial_ends_at = GREATEST(COALESCE(trial_ends_at, now()), now()) + INTERVAL '2 months',
             updated_at = now()
       WHERE user_id = v_referrer;
    END IF;
  END IF;
END $$;

-- 3) Sécurité : révoquer l'exécution publique/anonyme des fonctions SECURITY DEFINER exposées via l'API
-- Les rôles internes (triggers) continuent de fonctionner (elles s'exécutent en tant que propriétaire).
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_leaderboard(integer) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_referee_names(uuid[]) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.try_verify_referral(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.generate_referral_code() FROM PUBLIC, anon;

-- Les fonctions de triggers n'ont pas besoin d'être appelables via l'API du tout
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_email_confirmation() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_subscription_change() FROM PUBLIC, anon, authenticated;

-- Réaccorder aux authentifiés (et service_role) les fonctions qu'ils utilisent
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_leaderboard(integer) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_referee_names(uuid[]) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.try_verify_referral(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.generate_referral_code() TO service_role;