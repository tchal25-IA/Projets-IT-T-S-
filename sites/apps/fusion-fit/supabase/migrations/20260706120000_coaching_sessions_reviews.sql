-- Coaching : séances personnalisées par abonné, commentaires de séance,
-- notation du coach par les abonnés. + colonnes sur check_ins.

-- ─────────────────────────────────────────────────────────────────────
-- 1) check_ins : commentaire du coach + source de la séance jouée
-- ─────────────────────────────────────────────────────────────────────
ALTER TABLE public.check_ins
  ADD COLUMN IF NOT EXISTS coach_comment text,
  ADD COLUMN IF NOT EXISTS session_source text NOT NULL DEFAULT 'base';

-- Recréer la vue checkins avec les nouvelles colonnes
DROP VIEW IF EXISTS public.checkins;
CREATE VIEW public.checkins
WITH (security_invoker = true) AS
  SELECT id, user_id, date, temps, energie, humeur, blocs_completes, nb_blocs, serenite,
         session_started_at, session_ended_at, session_duration_sec, session_ended,
         ressenti_score, ressenti_note, coach_comment, session_source,
         created_at, updated_at
  FROM public.check_ins;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.checkins TO authenticated;
GRANT ALL ON public.checkins TO service_role;

-- Le coach ajoute un commentaire sur une séance de SON abonné, sans pouvoir
-- écraser les autres colonnes (contrôle via fonction SECURITY DEFINER).
CREATE OR REPLACE FUNCTION public.set_session_comment(p_checkin_id uuid, p_comment text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.check_ins c
    JOIN public.coach_assignments ca ON ca.abonne_id = c.user_id
    WHERE c.id = p_checkin_id AND ca.coach_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Non autorisé : ce check-in n''appartient pas à un de vos abonnés.';
  END IF;
  UPDATE public.check_ins SET coach_comment = p_comment WHERE id = p_checkin_id;
END;
$$;
REVOKE ALL ON FUNCTION public.set_session_comment(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.set_session_comment(uuid, text) TO authenticated;

-- ─────────────────────────────────────────────────────────────────────
-- 2) coach_sessions : séance personnalisée du coach pour un abonné
--    blocs = [{ pilier, titre, exercices: text[] }]
--    frequence_jours = cadence recommandée (tous les N jours)
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.coach_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  abonne_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  titre text NOT NULL,
  objectif text,
  blocs jsonb NOT NULL DEFAULT '[]'::jsonb,
  frequence_jours integer NOT NULL DEFAULT 3,
  actif boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (coach_id, abonne_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.coach_sessions TO authenticated;
GRANT ALL ON public.coach_sessions TO service_role;
ALTER TABLE public.coach_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "coach gère séances perso" ON public.coach_sessions
  FOR ALL TO authenticated
  USING (auth.uid() = coach_id AND public.has_role(auth.uid(), 'coach'))
  WITH CHECK (auth.uid() = coach_id AND public.has_role(auth.uid(), 'coach'));

CREATE POLICY "abonné lit sa séance perso" ON public.coach_sessions
  FOR SELECT TO authenticated
  USING (auth.uid() = abonne_id);

CREATE TRIGGER coach_sessions_updated_at
  BEFORE UPDATE ON public.coach_sessions
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ─────────────────────────────────────────────────────────────────────
-- 3) coach_reviews : note /5 + avis écrit, un par (coach, abonné)
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.coach_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  abonne_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating integer NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (coach_id, abonne_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.coach_reviews TO authenticated;
GRANT ALL ON public.coach_reviews TO service_role;
ALTER TABLE public.coach_reviews ENABLE ROW LEVEL SECURITY;

-- L'abonné gère son propre avis, et seulement pour un coach qui lui est rattaché.
CREATE POLICY "abonné gère son avis" ON public.coach_reviews
  FOR ALL TO authenticated
  USING (auth.uid() = abonne_id)
  WITH CHECK (
    auth.uid() = abonne_id AND EXISTS (
      SELECT 1 FROM public.coach_assignments ca
      WHERE ca.coach_id = coach_reviews.coach_id AND ca.abonne_id = auth.uid()
    )
  );

-- Le coach lit tous les avis le concernant.
CREATE POLICY "coach lit ses avis" ON public.coach_reviews
  FOR SELECT TO authenticated
  USING (auth.uid() = coach_id);

-- L'abonné peut lire les avis de SON coach (note moyenne publique côté fiche coach).
CREATE POLICY "abonné lit avis de son coach" ON public.coach_reviews
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.coach_assignments ca
    WHERE ca.coach_id = coach_reviews.coach_id AND ca.abonne_id = auth.uid()
  ));

CREATE TRIGGER coach_reviews_updated_at
  BEFORE UPDATE ON public.coach_reviews
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
