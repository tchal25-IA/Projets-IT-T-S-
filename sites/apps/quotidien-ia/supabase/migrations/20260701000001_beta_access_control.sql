-- ============================================================================
-- BETA ACCESS CONTROL
-- Permet de bloquer/débloquer l'accès à un utilisateur crash-testeur
-- sans supprimer son compte ni ses données.
--
-- Usage admin (dashboard Supabase → SQL Editor) :
--   -- Bloquer un testeur :
--   UPDATE public.profiles SET beta_blocked = true WHERE email = 'testeur@email.com';
--
--   -- Débloquer :
--   UPDATE public.profiles SET beta_blocked = false WHERE email = 'testeur@email.com';
--
--   -- Lister les testeurs bloqués :
--   SELECT email, display_name FROM public.profiles WHERE beta_blocked = true;
-- ============================================================================

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS beta_blocked BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_beta_tester BOOLEAN NOT NULL DEFAULT false;

-- Autorise l'admin à modifier ces colonnes via service_role (déjà inclus dans GRANT ALL).
-- Les utilisateurs ne peuvent PAS modifier leurs propres flags.
REVOKE UPDATE (beta_blocked, is_beta_tester) ON public.profiles FROM authenticated;

-- ============================================================================
-- Vue admin des testeurs (accessible uniquement via service_role / SQL Editor)
-- ============================================================================
CREATE OR REPLACE VIEW public.beta_testers
WITH (security_invoker=off) AS
SELECT
  p.id,
  p.email,
  p.display_name,
  p.is_beta_tester,
  p.beta_blocked,
  p.created_at,
  s.selected AS modules,
  s.billing
FROM public.profiles p
LEFT JOIN public.subscriptions s ON s.user_id = p.id
WHERE p.is_beta_tester = true
ORDER BY p.created_at DESC;

-- Accessible uniquement au service_role
REVOKE SELECT ON public.beta_testers FROM authenticated, anon;
GRANT SELECT ON public.beta_testers TO service_role;
