-- Exercices : média démo + fatigue sur validations programme
ALTER TABLE public.coach_exercises
  ADD COLUMN IF NOT EXISTS media_url text,
  ADD COLUMN IF NOT EXISTS media_kind text;

ALTER TABLE public.program_completions
  ADD COLUMN IF NOT EXISTS fatigue_score integer;

-- Les athlètes rattachés peuvent lire le référentiel d'exercices de leur coach
-- (consignes, scaling, médias démo).
DROP POLICY IF EXISTS "coach_exercises_own" ON public.coach_exercises;
CREATE POLICY "coach_exercises_own" ON public.coach_exercises
  FOR ALL TO authenticated
  USING (auth.uid() = coach_id)
  WITH CHECK (auth.uid() = coach_id AND public.has_role(auth.uid(), 'coach'));

DROP POLICY IF EXISTS "coach_exercises_abonne_read" ON public.coach_exercises;
CREATE POLICY "coach_exercises_abonne_read" ON public.coach_exercises
  FOR SELECT TO authenticated
  USING (
    auth.uid() = coach_id
    OR EXISTS (
      SELECT 1 FROM public.coach_assignments ca
      WHERE ca.coach_id = coach_exercises.coach_id
        AND ca.abonne_id = auth.uid()
    )
  );
