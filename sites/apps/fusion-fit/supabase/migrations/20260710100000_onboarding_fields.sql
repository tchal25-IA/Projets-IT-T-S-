-- Questionnaire d'onboarding athlète (cartographie jour 1) :
-- identité, profil sportif & santé, objectifs moyen/long terme.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS nom text,
  ADD COLUMN IF NOT EXISTS sexe text,
  ADD COLUMN IF NOT EXISTS age integer CHECK (age IS NULL OR (age BETWEEN 10 AND 100)),
  ADD COLUMN IF NOT EXISTS taille_cm integer CHECK (taille_cm IS NULL OR (taille_cm BETWEEN 100 AND 250)),
  ADD COLUMN IF NOT EXISTS historique_sportif text,
  ADD COLUMN IF NOT EXISTS antecedents_blessures text,
  ADD COLUMN IF NOT EXISTS objectif_moyen_terme text,
  ADD COLUMN IF NOT EXISTS objectif_long_terme text,
  ADD COLUMN IF NOT EXISTS onboarding_done boolean NOT NULL DEFAULT false;
