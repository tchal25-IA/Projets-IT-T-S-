
-- ============================================================================
-- ENUMS
-- ============================================================================
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');
CREATE TYPE public.referral_status AS ENUM ('pending', 'verified', 'rejected');
CREATE TYPE public.billing_cycle AS ENUM ('monthly', 'annual');
CREATE TYPE public.finance_kind AS ENUM ('income', 'expense');

-- ============================================================================
-- HELPERS
-- ============================================================================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS TEXT LANGUAGE plpgsql SET search_path = public AS $$
DECLARE code TEXT;
BEGIN
  LOOP
    code := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 4)) || (1000 + floor(random()*9000))::int;
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.profiles WHERE referral_code = code);
  END LOOP;
  RETURN code;
END $$;

-- ============================================================================
-- PROFILES
-- ============================================================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  email TEXT,
  work_country TEXT CHECK (work_country IN ('FR','CH','OTHER')),
  referral_code TEXT UNIQUE NOT NULL,
  referred_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.profiles TO authenticated;
GRANT UPDATE (display_name, work_country, email) ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles readable by authenticated" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "profiles updatable by owner" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================================
-- USER ROLES
-- ============================================================================
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_roles readable by self" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

-- ============================================================================
-- REFERRALS
-- ============================================================================
CREATE TABLE public.referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referee_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  status public.referral_status NOT NULL DEFAULT 'pending',
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.referrals TO authenticated;
GRANT ALL ON public.referrals TO service_role;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "referrals readable by parties" ON public.referrals FOR SELECT TO authenticated USING (auth.uid() = referrer_id OR auth.uid() = referee_id);
CREATE TRIGGER trg_referrals_updated BEFORE UPDATE ON public.referrals FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX idx_referrals_referrer ON public.referrals(referrer_id);

-- ============================================================================
-- SUBSCRIPTIONS
-- ============================================================================
CREATE TABLE public.subscriptions (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  selected TEXT[] NOT NULL DEFAULT '{}',
  billing public.billing_cycle NOT NULL DEFAULT 'monthly',
  referral_code_used TEXT,
  trial_ends_at TIMESTAMPTZ,
  pending_selected TEXT[],
  pending_billing public.billing_cycle,
  pending_effective_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.subscriptions TO authenticated;
GRANT ALL ON public.subscriptions TO service_role;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "subscriptions owner" ON public.subscriptions FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER trg_subscriptions_updated BEFORE UPDATE ON public.subscriptions FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================================
-- EVENTS + ATTACHMENTS
-- ============================================================================
CREATE TABLE public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ,
  location TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.events TO authenticated;
GRANT ALL ON public.events TO service_role;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "events owner" ON public.events FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER trg_events_updated BEFORE UPDATE ON public.events FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX idx_events_user_date ON public.events(user_id, starts_at);

CREATE TABLE public.event_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL,
  name TEXT NOT NULL,
  mime TEXT,
  size INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.event_attachments TO authenticated;
GRANT ALL ON public.event_attachments TO service_role;
ALTER TABLE public.event_attachments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "event_attachments owner" ON public.event_attachments FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- FINANCE ENTRIES
-- ============================================================================
CREATE TABLE public.finance_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind public.finance_kind NOT NULL,
  category TEXT,
  amount NUMERIC(12,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'EUR',
  occurred_on DATE NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.finance_entries TO authenticated;
GRANT ALL ON public.finance_entries TO service_role;
ALTER TABLE public.finance_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "finance owner" ON public.finance_entries FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER trg_finance_updated BEFORE UPDATE ON public.finance_entries FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX idx_finance_user_date ON public.finance_entries(user_id, occurred_on);

-- ============================================================================
-- DOCUMENTS (vie admin)
-- ============================================================================
CREATE TABLE public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  category TEXT,
  file_path TEXT NOT NULL,
  mime TEXT,
  size INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.documents TO authenticated;
GRANT ALL ON public.documents TO service_role;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "documents owner" ON public.documents FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER trg_documents_updated BEFORE UPDATE ON public.documents FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================================
-- LEADERBOARD VIEW (realtime ranking)
-- ============================================================================
CREATE VIEW public.leaderboard
WITH (security_invoker=on) AS
SELECT
  p.id AS user_id,
  COALESCE(p.display_name, 'Anonyme') AS display_name,
  COUNT(r.id) FILTER (WHERE r.status = 'verified') AS verified_count
FROM public.profiles p
LEFT JOIN public.referrals r ON r.referrer_id = p.id
GROUP BY p.id, p.display_name;
GRANT SELECT ON public.leaderboard TO authenticated;

-- ============================================================================
-- AUTO-PROFILE ON SIGNUP + REFERRAL LINK
-- ============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_code TEXT;
  v_ref_code TEXT;
  v_referrer UUID;
BEGIN
  v_code := public.generate_referral_code();
  v_ref_code := NEW.raw_user_meta_data->>'referral_code';

  IF v_ref_code IS NOT NULL AND v_ref_code <> '' THEN
    SELECT id INTO v_referrer FROM public.profiles WHERE referral_code = upper(v_ref_code) LIMIT 1;
  END IF;

  INSERT INTO public.profiles (id, display_name, email, referral_code, referred_by)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email,'@',1)),
    NEW.email,
    v_code,
    v_referrer
  );

  IF v_referrer IS NOT NULL THEN
    INSERT INTO public.referrals (referrer_id, referee_id, status)
    VALUES (v_referrer, NEW.id, 'pending')
    ON CONFLICT (referee_id) DO NOTHING;
  END IF;

  RETURN NEW;
END $$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- AUTO-VERIFY REFERRAL: email confirmed AND subscription created
-- ============================================================================
CREATE OR REPLACE FUNCTION public.try_verify_referral(_referee UUID)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_confirmed BOOLEAN;
  v_has_sub BOOLEAN;
BEGIN
  SELECT (email_confirmed_at IS NOT NULL) INTO v_confirmed FROM auth.users WHERE id = _referee;
  SELECT EXISTS(SELECT 1 FROM public.subscriptions WHERE user_id = _referee) INTO v_has_sub;

  IF v_confirmed AND v_has_sub THEN
    UPDATE public.referrals
    SET status = 'verified', verified_at = now()
    WHERE referee_id = _referee AND status = 'pending';
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.handle_subscription_change()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM public.try_verify_referral(NEW.user_id);
  RETURN NEW;
END $$;

CREATE TRIGGER trg_sub_verify AFTER INSERT OR UPDATE ON public.subscriptions
FOR EACH ROW EXECUTE FUNCTION public.handle_subscription_change();

CREATE OR REPLACE FUNCTION public.handle_email_confirmation()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.email_confirmed_at IS NOT NULL AND (OLD.email_confirmed_at IS NULL OR OLD.email_confirmed_at <> NEW.email_confirmed_at) THEN
    PERFORM public.try_verify_referral(NEW.id);
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER on_auth_user_confirmed
AFTER UPDATE OF email_confirmed_at ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_email_confirmation();

-- ============================================================================
-- REALTIME for leaderboard freshness
-- ============================================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.referrals;
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
