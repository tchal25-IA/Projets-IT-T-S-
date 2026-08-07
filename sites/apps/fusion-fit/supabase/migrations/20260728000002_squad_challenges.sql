-- ============================================================
-- Escouades sociales : défis + classements
-- ============================================================

CREATE TABLE IF NOT EXISTS public.squad_challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  squad_id uuid NOT NULL REFERENCES public.squads(id) ON DELETE CASCADE,
  coach_id uuid NOT NULL,
  titre text NOT NULL,
  description text DEFAULT '',
  metric text NOT NULL DEFAULT 'checkins', -- checkins | completions | xp
  target_value integer NOT NULL DEFAULT 5,
  starts_at date NOT NULL DEFAULT CURRENT_DATE,
  ends_at date NOT NULL DEFAULT (CURRENT_DATE + INTERVAL '7 days'),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.squad_challenge_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id uuid NOT NULL REFERENCES public.squad_challenges(id) ON DELETE CASCADE,
  abonne_id uuid NOT NULL,
  value integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (challenge_id, abonne_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.squad_challenges TO authenticated;
GRANT ALL ON public.squad_challenges TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.squad_challenge_progress TO authenticated;
GRANT ALL ON public.squad_challenge_progress TO service_role;

ALTER TABLE public.squad_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.squad_challenge_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Coach gère défis" ON public.squad_challenges;
CREATE POLICY "Coach gère défis" ON public.squad_challenges
  FOR ALL TO authenticated
  USING (auth.uid() = coach_id AND public.has_role(auth.uid(), 'coach'))
  WITH CHECK (auth.uid() = coach_id AND public.has_role(auth.uid(), 'coach'));

DROP POLICY IF EXISTS "Membres voient défis" ON public.squad_challenges;
CREATE POLICY "Membres voient défis" ON public.squad_challenges
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.squad_members sm
      WHERE sm.squad_id = squad_challenges.squad_id AND sm.abonne_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Coach gère progress défis" ON public.squad_challenge_progress;
CREATE POLICY "Coach gère progress défis" ON public.squad_challenge_progress
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.squad_challenges c
      WHERE c.id = challenge_id AND c.coach_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.squad_challenges c
      WHERE c.id = challenge_id AND c.coach_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Membres voient/update leur progress" ON public.squad_challenge_progress;
CREATE POLICY "Membres voient/update leur progress" ON public.squad_challenge_progress
  FOR SELECT TO authenticated
  USING (
    abonne_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.squad_challenges c
      JOIN public.squad_members sm ON sm.squad_id = c.squad_id
      WHERE c.id = challenge_id AND sm.abonne_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.squad_challenges c WHERE c.id = challenge_id AND c.coach_id = auth.uid()
    )
  );

CREATE POLICY "Membres upsert leur progress" ON public.squad_challenge_progress
  FOR INSERT TO authenticated
  WITH CHECK (
    abonne_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.squad_challenges c
      JOIN public.squad_members sm ON sm.squad_id = c.squad_id
      WHERE c.id = challenge_id AND sm.abonne_id = auth.uid()
    )
  );

CREATE POLICY "Membres update leur progress" ON public.squad_challenge_progress
  FOR UPDATE TO authenticated
  USING (abonne_id = auth.uid())
  WITH CHECK (abonne_id = auth.uid());

-- Classement hebdo d'une escouade (check-ins sur 7 jours)
CREATE OR REPLACE FUNCTION public.squad_leaderboard(p_squad_id uuid)
RETURNS TABLE(abonne_id uuid, prenom text, checkins_7j bigint, completions_7j bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    sm.abonne_id,
    COALESCE(p.prenom, 'Athlète') AS prenom,
    (
      SELECT COUNT(*) FROM public.check_ins ci
      WHERE ci.user_id = sm.abonne_id
        AND ci.created_at >= now() - INTERVAL '7 days'
    ) AS checkins_7j,
    (
      SELECT COUNT(*) FROM public.program_completions pc
      WHERE pc.abonne_id = sm.abonne_id
        AND pc.created_at >= now() - INTERVAL '7 days'
    ) AS completions_7j
  FROM public.squad_members sm
  LEFT JOIN public.profiles p ON p.user_id = sm.abonne_id
  WHERE sm.squad_id = p_squad_id
    AND (
      EXISTS (SELECT 1 FROM public.squads s WHERE s.id = p_squad_id AND s.coach_id = auth.uid())
      OR EXISTS (
        SELECT 1 FROM public.squad_members me
        WHERE me.squad_id = p_squad_id AND me.abonne_id = auth.uid()
      )
    )
  ORDER BY checkins_7j DESC, completions_7j DESC;
$$;
REVOKE ALL ON FUNCTION public.squad_leaderboard(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.squad_leaderboard(uuid) TO authenticated;
