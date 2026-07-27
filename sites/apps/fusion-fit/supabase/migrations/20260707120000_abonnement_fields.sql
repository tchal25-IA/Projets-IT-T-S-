-- Champs d'abonnement sur le profil (base pour le système d'abonnement à venir).
-- Lisibles par l'abonné (son profil) et par son coach (RLS "Coachs see assigned profiles").
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS abonnement_plan text NOT NULL DEFAULT 'decouverte',
  ADD COLUMN IF NOT EXISTS abonnement_statut text NOT NULL DEFAULT 'essai',
  ADD COLUMN IF NOT EXISTS abonnement_depuis date;
