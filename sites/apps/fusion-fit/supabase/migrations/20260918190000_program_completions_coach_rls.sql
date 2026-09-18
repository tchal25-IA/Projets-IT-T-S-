-- Lecture coach des validations : via assignment (pas seulement coach_id sur la ligne)
DROP POLICY IF EXISTS "coach lit les validations de ses abonnés" ON public.program_completions;
CREATE POLICY "coach lit les validations de ses abonnés" ON public.program_completions
  FOR SELECT TO authenticated
  USING (public.is_coach_of(auth.uid(), abonne_id));
