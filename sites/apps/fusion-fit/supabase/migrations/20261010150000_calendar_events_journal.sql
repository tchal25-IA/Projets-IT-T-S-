-- Agenda: calendar_event source de vérité (spec Agenda §6)
-- Messagerie: journal_entries + catégories message (spec Messagerie)

CREATE TABLE IF NOT EXISTS public.calendar_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  athlete_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type text NOT NULL CHECK (event_type IN (
    'session', 'appointment', 'external_activity', 'goal', 'rest', 'other'
  )),
  title text NOT NULL,
  description text,
  starts_at timestamptz NOT NULL,
  ends_at timestamptz,
  all_day boolean NOT NULL DEFAULT false,
  atelier_session_id uuid REFERENCES public.atelier_sessions(id) ON DELETE SET NULL,
  training_slot_id uuid,
  rpe_planned integer CHECK (rpe_planned IS NULL OR rpe_planned BETWEEN 1 AND 10),
  duration_min integer,
  load_ua integer GENERATED ALWAYS AS (
    CASE WHEN rpe_planned IS NOT NULL AND duration_min IS NOT NULL
      THEN rpe_planned * duration_min ELSE NULL END
  ) STORED,
  status text NOT NULL DEFAULT 'planned',
  meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS calendar_events_coach_idx ON public.calendar_events(coach_id, starts_at);
CREATE INDEX IF NOT EXISTS calendar_events_athlete_idx ON public.calendar_events(athlete_id, starts_at);

ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS calendar_events_coach ON public.calendar_events;
CREATE POLICY calendar_events_coach ON public.calendar_events
  FOR ALL TO authenticated
  USING (coach_id = auth.uid() OR athlete_id = auth.uid())
  WITH CHECK (coach_id = auth.uid());

-- Journal de bord (lié au fil / séances)
CREATE TABLE IF NOT EXISTS public.journal_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  athlete_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  conversation_id uuid,
  message_id uuid,
  atelier_session_id uuid REFERENCES public.atelier_sessions(id) ON DELETE SET NULL,
  category text NOT NULL DEFAULT 'note' CHECK (category IN (
    'note', 'sante', 'seance', 'nutrition', 'mental', 'alerte', 'bilan'
  )),
  body text NOT NULL,
  is_shared boolean NOT NULL DEFAULT true,  -- false = note privée coach
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS journal_entries_athlete_idx
  ON public.journal_entries(athlete_id, created_at DESC);

ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS journal_entries_access ON public.journal_entries;
CREATE POLICY journal_entries_access ON public.journal_entries
  FOR SELECT TO authenticated
  USING (
    coach_id = auth.uid()
    OR (athlete_id = auth.uid() AND is_shared = true)
  );

DROP POLICY IF EXISTS journal_entries_coach_write ON public.journal_entries;
CREATE POLICY journal_entries_coach_write ON public.journal_entries
  FOR ALL TO authenticated
  USING (coach_id = auth.uid())
  WITH CHECK (coach_id = auth.uid());

-- Catégorie sur messages (si colonne absente)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'messages' AND column_name = 'category'
  ) THEN
    ALTER TABLE public.messages
      ADD COLUMN category text DEFAULT 'general'
      CHECK (category IN ('general', 'sante', 'seance', 'nutrition', 'alerte', 'vocal', 'media'));
  END IF;
END $$;

COMMENT ON TABLE public.calendar_events IS 'Source de vérité temps Agenda (spec FusionFit)';
COMMENT ON TABLE public.journal_entries IS 'Journal de bord coach-athlète (notes partagées / privées)';
