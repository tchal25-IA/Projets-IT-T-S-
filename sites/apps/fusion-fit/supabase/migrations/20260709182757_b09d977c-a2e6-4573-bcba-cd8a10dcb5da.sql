ALTER TABLE public.program_completions
  ADD COLUMN IF NOT EXISTS session_started_at timestamptz,
  ADD COLUMN IF NOT EXISTS session_ended_at timestamptz,
  ADD COLUMN IF NOT EXISTS session_duration_sec integer;

COMMENT ON COLUMN public.program_completions.session_started_at IS 'Début du chronomètre de la séance du jour';
COMMENT ON COLUMN public.program_completions.session_ended_at IS 'Fin du chronomètre de la séance du jour';
COMMENT ON COLUMN public.program_completions.session_duration_sec IS 'Durée de la séance du jour en secondes';