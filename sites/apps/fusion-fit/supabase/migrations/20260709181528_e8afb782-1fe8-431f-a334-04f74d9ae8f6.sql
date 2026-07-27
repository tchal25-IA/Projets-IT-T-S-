CREATE TABLE IF NOT EXISTS public.weight_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date date NOT NULL DEFAULT CURRENT_DATE,
  weight_kg numeric(5,2) NOT NULL CHECK (weight_kg > 0 AND weight_kg < 500),
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, date)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.weight_entries TO authenticated;
GRANT ALL ON public.weight_entries TO service_role;

ALTER TABLE public.weight_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "weight_entries_owner_all" ON public.weight_entries
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "weight_entries_coach_select" ON public.weight_entries
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.coach_assignments ca
    WHERE ca.abonne_id = weight_entries.user_id
      AND ca.coach_id = auth.uid()
  ));

CREATE TRIGGER weight_entries_touch_updated_at
  BEFORE UPDATE ON public.weight_entries
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE INDEX IF NOT EXISTS weight_entries_user_date_idx
  ON public.weight_entries (user_id, date DESC);
