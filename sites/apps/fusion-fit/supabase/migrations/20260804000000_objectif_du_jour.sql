-- Objectif du jour (check-in) + objectifs secondaires (questionnaire)
ALTER TABLE public.check_ins
  ADD COLUMN IF NOT EXISTS objectif_du_jour text;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS objectifs_secondaires jsonb NOT NULL DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.check_ins.objectif_du_jour IS
  'Objectif travaillé ce jour (principal ou secondaire choisi au check-in)';
COMMENT ON COLUMN public.profiles.objectifs_secondaires IS
  'Liste d''objectifs secondaires issus du questionnaire d''accueil (jsonb array de strings)';

-- Recréer la vue checkins pour exposer objectif_du_jour
DROP VIEW IF EXISTS public.checkins;
CREATE VIEW public.checkins AS
SELECT
  id,
  user_id,
  date,
  temps,
  energie,
  humeur,
  objectif_du_jour,
  blocs_completes,
  nb_blocs,
  serenite,
  session_started_at,
  session_ended_at,
  session_duration_sec,
  session_ended,
  ressenti_score,
  ressenti_note,
  coach_comment,
  session_source,
  created_at,
  updated_at
FROM public.check_ins;
