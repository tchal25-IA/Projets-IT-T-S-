
ALTER TABLE public.check_ins
  ADD COLUMN IF NOT EXISTS session_started_at timestamptz,
  ADD COLUMN IF NOT EXISTS session_ended_at timestamptz,
  ADD COLUMN IF NOT EXISTS session_duration_sec integer,
  ADD COLUMN IF NOT EXISTS session_ended boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS ressenti_score integer,
  ADD COLUMN IF NOT EXISTS ressenti_note text;

DROP VIEW IF EXISTS public.checkins;
CREATE VIEW public.checkins
WITH (security_invoker = true) AS
  SELECT id, user_id, date, temps, energie, humeur, blocs_completes, nb_blocs, serenite,
         session_started_at, session_ended_at, session_duration_sec, session_ended,
         ressenti_score, ressenti_note,
         created_at, updated_at
  FROM public.check_ins;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.checkins TO authenticated;
GRANT ALL ON public.checkins TO service_role;
