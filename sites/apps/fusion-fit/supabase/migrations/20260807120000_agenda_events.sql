-- Agenda : événements coach (groupe / libre) + inscriptions + rappel H-1

CREATE TABLE IF NOT EXISTS public.coach_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  titre text NOT NULL,
  objectif text,
  lieu text,
  starts_at timestamptz NOT NULL,
  capacity integer NOT NULL DEFAULT 10 CHECK (capacity > 0),
  audience text NOT NULL DEFAULT 'libre' CHECK (audience IN ('escouade', 'libre')),
  squad_id uuid,
  reminder_sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS coach_events_coach_idx ON public.coach_events(coach_id);
CREATE INDEX IF NOT EXISTS coach_events_starts_idx ON public.coach_events(starts_at);

ALTER TABLE public.coach_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "coach_events_coach_all" ON public.coach_events;
CREATE POLICY "coach_events_coach_all" ON public.coach_events
  FOR ALL TO authenticated
  USING (auth.uid() = coach_id)
  WITH CHECK (auth.uid() = coach_id AND public.has_role(auth.uid(), 'coach'));

-- Les abonnés du coach voient les événements (lecture)
DROP POLICY IF EXISTS "coach_events_abonne_select" ON public.coach_events;
CREATE POLICY "coach_events_abonne_select" ON public.coach_events
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.coach_assignments ca
      WHERE ca.coach_id = coach_events.coach_id
        AND ca.abonne_id = auth.uid()
    )
  );

CREATE TABLE IF NOT EXISTS public.event_registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.coach_events(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'invite' CHECK (status IN ('invite', 'inscrit', 'refuse')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (event_id, user_id)
);

CREATE INDEX IF NOT EXISTS event_registrations_user_idx ON public.event_registrations(user_id);
CREATE INDEX IF NOT EXISTS event_registrations_event_idx ON public.event_registrations(event_id);

ALTER TABLE public.event_registrations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "event_registrations_own" ON public.event_registrations;
CREATE POLICY "event_registrations_own" ON public.event_registrations
  FOR ALL TO authenticated
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.coach_events e
      WHERE e.id = event_registrations.event_id AND e.coach_id = auth.uid()
    )
  )
  WITH CHECK (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.coach_events e
      WHERE e.id = event_registrations.event_id AND e.coach_id = auth.uid()
    )
  );

-- Index sync programmes
CREATE INDEX IF NOT EXISTS program_assignments_template_idx
  ON public.program_assignments(template_id);

-- Rappel H-1 pour événements (inscrits + coach)
CREATE OR REPLACE FUNCTION public.send_event_reminders()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r record;
  n integer := 0;
  dest uuid;
BEGIN
  FOR r IN
    SELECT e.*
    FROM public.coach_events e
    WHERE e.reminder_sent_at IS NULL
      AND e.starts_at > now()
      AND e.starts_at <= now() + interval '65 minutes'
  LOOP
    -- Coach
    INSERT INTO public.notifications (user_id, type, title, body, link)
    VALUES (
      r.coach_id,
      'event_rappel',
      'Rappel événement (H-1)',
      coalesce(r.titre, 'Événement') || coalesce(' · ' || r.lieu, ''),
      '/fusionfit/agenda'
    );

    -- Inscrits
    FOR dest IN
      SELECT er.user_id FROM public.event_registrations er
      WHERE er.event_id = r.id AND er.status = 'inscrit'
    LOOP
      INSERT INTO public.notifications (user_id, type, title, body, link)
      VALUES (
        dest,
        'event_rappel',
        'Rappel événement (H-1)',
        coalesce(r.titre, 'Événement') || coalesce(' · ' || r.lieu, ''),
        '/fusionfit/agenda'
      );
    END LOOP;

    UPDATE public.coach_events SET reminder_sent_at = now() WHERE id = r.id;
    n := n + 1;
  END LOOP;
  RETURN n;
END;
$$;

GRANT EXECUTE ON FUNCTION public.send_event_reminders() TO authenticated;
GRANT EXECUTE ON FUNCTION public.send_event_reminders() TO service_role;
