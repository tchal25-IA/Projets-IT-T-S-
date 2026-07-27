-- Validation quotidienne du programme du coach par l'abonné : l'abonné
-- valide la séance du jour prévue par son coach et donne un ressenti ;
-- le coach voit cet historique dans la fiche de l'abonné.
CREATE TABLE IF NOT EXISTS public.program_completions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id uuid NOT NULL REFERENCES public.programs(id) ON DELETE CASCADE,
  abonne_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  coach_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  jour text NOT NULL,
  date date NOT NULL DEFAULT current_date,
  titre text NOT NULL,
  ressenti_score integer CHECK (ressenti_score BETWEEN 1 AND 5),
  ressenti_note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (abonne_id, date)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.program_completions TO authenticated;
GRANT ALL ON public.program_completions TO service_role;
ALTER TABLE public.program_completions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "abonné gère ses validations" ON public.program_completions
  FOR ALL TO authenticated
  USING (auth.uid() = abonne_id)
  WITH CHECK (auth.uid() = abonne_id);

CREATE POLICY "coach lit les validations de ses abonnés" ON public.program_completions
  FOR SELECT TO authenticated
  USING (auth.uid() = coach_id);

CREATE TRIGGER program_completions_updated_at
  BEFORE UPDATE ON public.program_completions
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
