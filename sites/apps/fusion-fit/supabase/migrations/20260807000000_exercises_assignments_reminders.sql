-- Bibliothèque d'exercices du coach + assignation programmes + rappel créneau

CREATE TABLE IF NOT EXISTS public.coach_exercises (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nom text NOT NULL,
  consigne text,
  tags text[] NOT NULL DEFAULT '{}',
  scaling text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS coach_exercises_coach_idx ON public.coach_exercises(coach_id);

ALTER TABLE public.coach_exercises ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "coach_exercises_own" ON public.coach_exercises;
CREATE POLICY "coach_exercises_own" ON public.coach_exercises
  FOR ALL TO authenticated
  USING (auth.uid() = coach_id)
  WITH CHECK (auth.uid() = coach_id AND public.has_role(auth.uid(), 'coach'));

-- Attribution d'un template hebdo à un abonné ou une escouade (journal)
CREATE TABLE IF NOT EXISTS public.program_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  template_id uuid REFERENCES public.program_templates(id) ON DELETE SET NULL,
  abonne_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  squad_id uuid,
  program_id uuid REFERENCES public.programs(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT program_assignments_target CHECK (abonne_id IS NOT NULL OR squad_id IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS program_assignments_coach_idx ON public.program_assignments(coach_id);

ALTER TABLE public.program_assignments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "program_assignments_coach" ON public.program_assignments;
CREATE POLICY "program_assignments_coach" ON public.program_assignments
  FOR ALL TO authenticated
  USING (auth.uid() = coach_id)
  WITH CHECK (auth.uid() = coach_id AND public.has_role(auth.uid(), 'coach'));

-- Rappel créneau H-1
ALTER TABLE public.training_slots
  ADD COLUMN IF NOT EXISTS reminder_sent_at timestamptz;

-- RPC : envoie les rappels ~1h avant les créneaux validés
CREATE OR REPLACE FUNCTION public.send_creneau_reminders()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r RECORD;
  n integer := 0;
  window_start timestamptz := now() + interval '50 minutes';
  window_end timestamptz := now() + interval '70 minutes';
BEGIN
  FOR r IN
    SELECT id, abonne_id, coach_id, date_slot, lieu
    FROM public.training_slots
    WHERE status = 'valide'
      AND reminder_sent_at IS NULL
      AND date_slot >= window_start
      AND date_slot < window_end
  LOOP
    -- Notif abonné
    INSERT INTO public.notifications (user_id, actor_id, type, title, body, link)
    VALUES (
      r.abonne_id,
      r.coach_id,
      'creneau_rappel',
      'Rappel · créneau dans 1 h',
      COALESCE('Rendez-vous ' || to_char(r.date_slot AT TIME ZONE 'Europe/Paris', 'HH24:MI') ||
        CASE WHEN r.lieu IS NOT NULL AND r.lieu <> '' THEN ' · ' || r.lieu ELSE '' END, 'Créneau bientôt'),
      '/fusionfit/creneaux'
    );
    -- Notif coach
    INSERT INTO public.notifications (user_id, actor_id, type, title, body, link)
    VALUES (
      r.coach_id,
      r.abonne_id,
      'creneau_rappel',
      'Rappel · créneau dans 1 h',
      COALESCE('Créneau ' || to_char(r.date_slot AT TIME ZONE 'Europe/Paris', 'HH24:MI'), 'Créneau bientôt'),
      '/fusionfit/creneaux'
    );
    UPDATE public.training_slots SET reminder_sent_at = now() WHERE id = r.id;
    n := n + 1;
  END LOOP;
  RETURN n;
END;
$$;

GRANT EXECUTE ON FUNCTION public.send_creneau_reminders() TO authenticated;
GRANT EXECUTE ON FUNCTION public.send_creneau_reminders() TO service_role;

COMMENT ON FUNCTION public.send_creneau_reminders IS
  'À appeler périodiquement (cron ~5-15 min) pour notifier coach+abonné 1h avant un créneau validé';
