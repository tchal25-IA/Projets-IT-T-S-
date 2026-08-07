-- Questionnaire Sass (20 questions) stocké en JSON sur le profil
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS questionnaire_sass jsonb NOT NULL DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.profiles.questionnaire_sass IS
  'Réponses du questionnaire Sass (20 questions) à la 1ère connexion';
