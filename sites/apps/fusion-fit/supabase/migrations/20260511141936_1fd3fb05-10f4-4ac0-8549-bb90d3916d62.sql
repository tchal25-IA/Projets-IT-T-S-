-- Phase 1: Roles + Profiles + Invitations

-- Enum des rôles
CREATE TYPE public.app_role AS ENUM ('coach', 'abonne');

-- Table user_roles
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Fonction security definer pour check role (évite recursion RLS)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

-- Table profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  prenom TEXT NOT NULL DEFAULT 'Agent',
  email TEXT,
  objectif_principal TEXT DEFAULT '',
  discipline TEXT DEFAULT '',
  chrono_marathon TEXT DEFAULT 'Non renseigné',
  objectif_course TEXT DEFAULT '',
  profil_psycho TEXT DEFAULT '',
  niveau_agent INT NOT NULL DEFAULT 1,
  points_forts JSONB NOT NULL DEFAULT '[]'::jsonb,
  evenements JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Table invitations (coach -> abonné)
CREATE TABLE public.invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(24), 'base64'),
  coach_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '30 days')
);
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

-- RLS policies user_roles
CREATE POLICY "Users see own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Coachs see all roles" ON public.user_roles
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'coach'));

-- RLS policies profiles
CREATE POLICY "Users see own profile" ON public.profiles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Coachs see all profiles" ON public.profiles
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'coach'));
CREATE POLICY "Users update own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Coachs update all profiles" ON public.profiles
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'coach'));
CREATE POLICY "Insert own profile" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- RLS policies invitations
CREATE POLICY "Coachs manage own invitations" ON public.invitations
  FOR ALL TO authenticated 
  USING (auth.uid() = coach_id) 
  WITH CHECK (auth.uid() = coach_id);

-- Trigger : à la création d'un user, créer profile + assigner rôle
-- Premier user = coach automatiquement, sinon abonné
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  user_count INT;
  assigned_role public.app_role;
  invite_token TEXT;
BEGIN
  SELECT COUNT(*) INTO user_count FROM auth.users;
  
  -- Si premier user OU pas de token d'invitation -> coach (premier) ou abonné (sinon)
  invite_token := NEW.raw_user_meta_data->>'invitation_token';
  
  IF user_count = 1 THEN
    assigned_role := 'coach';
  ELSIF invite_token IS NOT NULL THEN
    -- Vérifier le token et marquer comme utilisé
    UPDATE public.invitations SET used_at = now() 
    WHERE token = invite_token AND used_at IS NULL AND expires_at > now();
    assigned_role := 'abonne';
  ELSE
    assigned_role := 'abonne';
  END IF;
  
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, assigned_role);
  
  INSERT INTO public.profiles (user_id, prenom, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'prenom', split_part(NEW.email, '@', 1)),
    NEW.email
  );
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger updated_at sur profiles
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TRIGGER profiles_touch_updated
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();