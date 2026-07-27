-- Permet d'assigner une séance perso soit récurrente (frequence_jours),
-- soit pour un JOUR PRÉCIS (date_seance). Si date_seance est renseignée,
-- la séance est proposée à l'abonné ce jour-là en priorité.
ALTER TABLE public.coach_sessions
  ADD COLUMN IF NOT EXISTS date_seance date;
