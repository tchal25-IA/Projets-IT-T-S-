-- Apply pending migrations that weren't executed against the DB
ALTER TABLE public.check_ins
  ADD COLUMN IF NOT EXISTS coach_comment text,
  ADD COLUMN IF NOT EXISTS session_source text NOT NULL DEFAULT 'base';

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

CREATE OR REPLACE FUNCTION public.set_session_comment(p_checkin_id uuid, p_comment text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.check_ins c
    JOIN public.coach_assignments ca ON ca.abonne_id = c.user_id
    WHERE c.id = p_checkin_id AND ca.coach_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Non autorisé : ce check-in n''appartient pas à un de vos abonnés.';
  END IF;
  UPDATE public.check_ins SET coach_comment = p_comment WHERE id = p_checkin_id;
END; $$;
REVOKE ALL ON FUNCTION public.set_session_comment(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.set_session_comment(uuid, text) TO authenticated;

CREATE TABLE IF NOT EXISTS public.coach_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  abonne_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  titre text NOT NULL,
  objectif text,
  blocs jsonb NOT NULL DEFAULT '[]'::jsonb,
  frequence_jours integer NOT NULL DEFAULT 3,
  actif boolean NOT NULL DEFAULT true,
  date_seance date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (coach_id, abonne_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.coach_sessions TO authenticated;
GRANT ALL ON public.coach_sessions TO service_role;
ALTER TABLE public.coach_sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "coach gère séances perso" ON public.coach_sessions;
CREATE POLICY "coach gère séances perso" ON public.coach_sessions
  FOR ALL TO authenticated
  USING (auth.uid() = coach_id AND public.has_role(auth.uid(), 'coach'))
  WITH CHECK (auth.uid() = coach_id AND public.has_role(auth.uid(), 'coach'));
DROP POLICY IF EXISTS "abonné lit sa séance perso" ON public.coach_sessions;
CREATE POLICY "abonné lit sa séance perso" ON public.coach_sessions
  FOR SELECT TO authenticated USING (auth.uid() = abonne_id);
DROP TRIGGER IF EXISTS coach_sessions_updated_at ON public.coach_sessions;
CREATE TRIGGER coach_sessions_updated_at
  BEFORE UPDATE ON public.coach_sessions
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

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
DROP POLICY IF EXISTS "abonné gère son avis" ON public.coach_reviews;
CREATE POLICY "abonné gère son avis" ON public.coach_reviews
  FOR ALL TO authenticated
  USING (auth.uid() = abonne_id)
  WITH CHECK (auth.uid() = abonne_id AND EXISTS (
    SELECT 1 FROM public.coach_assignments ca
    WHERE ca.coach_id = coach_reviews.coach_id AND ca.abonne_id = auth.uid()
  ));
DROP POLICY IF EXISTS "coach lit ses avis" ON public.coach_reviews;
CREATE POLICY "coach lit ses avis" ON public.coach_reviews
  FOR SELECT TO authenticated USING (auth.uid() = coach_id);
DROP POLICY IF EXISTS "abonné lit avis de son coach" ON public.coach_reviews;
CREATE POLICY "abonné lit avis de son coach" ON public.coach_reviews
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.coach_assignments ca
    WHERE ca.coach_id = coach_reviews.coach_id AND ca.abonne_id = auth.uid()
  ));
DROP TRIGGER IF EXISTS coach_reviews_updated_at ON public.coach_reviews;
CREATE TRIGGER coach_reviews_updated_at
  BEFORE UPDATE ON public.coach_reviews
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

DROP POLICY IF EXISTS "Abonné voit le profil de son coach" ON public.profiles;
CREATE POLICY "Abonné voit le profil de son coach" ON public.profiles
FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.coach_assignments ca
  WHERE ca.abonne_id = auth.uid() AND ca.coach_id = profiles.user_id
));

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS abonnement_plan text NOT NULL DEFAULT 'decouverte',
  ADD COLUMN IF NOT EXISTS abonnement_statut text NOT NULL DEFAULT 'essai',
  ADD COLUMN IF NOT EXISTS abonnement_depuis date;

CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  type text NOT NULL,
  title text NOT NULL,
  body text,
  link text,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS notifications_user_idx ON public.notifications (user_id, created_at DESC);
GRANT SELECT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "user lit ses notifications" ON public.notifications;
CREATE POLICY "user lit ses notifications" ON public.notifications
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "user maj ses notifications" ON public.notifications;
CREATE POLICY "user maj ses notifications" ON public.notifications
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "user supprime ses notifications" ON public.notifications;
CREATE POLICY "user supprime ses notifications" ON public.notifications
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.create_notification(
  p_user_id uuid, p_type text, p_title text, p_body text DEFAULT NULL, p_link text DEFAULT NULL
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE new_id uuid;
BEGIN
  IF p_user_id <> auth.uid() AND NOT EXISTS (
    SELECT 1 FROM public.coach_assignments ca
    WHERE (ca.coach_id = auth.uid() AND ca.abonne_id = p_user_id)
       OR (ca.abonne_id = auth.uid() AND ca.coach_id = p_user_id)
  ) THEN
    RAISE EXCEPTION 'Non autorisé : aucun lien avec ce destinataire.';
  END IF;
  INSERT INTO public.notifications (user_id, actor_id, type, title, body, link)
    VALUES (p_user_id, auth.uid(), p_type, p_title, p_body, p_link)
    RETURNING id INTO new_id;
  RETURN new_id;
END; $$;
REVOKE ALL ON FUNCTION public.create_notification(uuid, text, text, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_notification(uuid, text, text, text, text) TO authenticated;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_object THEN NULL;
END $$;

DROP POLICY IF EXISTS "avatars authenticated read" ON storage.objects;
DROP POLICY IF EXISTS "avatars scoped read" ON storage.objects;
CREATE POLICY "avatars scoped read" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'avatars' AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR EXISTS (
      SELECT 1 FROM public.coach_assignments ca
      WHERE (ca.coach_id = auth.uid() AND ca.abonne_id::text = (storage.foldername(name))[1])
         OR (ca.abonne_id = auth.uid() AND ca.coach_id::text = (storage.foldername(name))[1])
    )
  ));

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
DROP POLICY IF EXISTS "abonné gère ses validations" ON public.program_completions;
CREATE POLICY "abonné gère ses validations" ON public.program_completions
  FOR ALL TO authenticated
  USING (auth.uid() = abonne_id)
  WITH CHECK (auth.uid() = abonne_id);
DROP POLICY IF EXISTS "coach lit les validations de ses abonnés" ON public.program_completions;
CREATE POLICY "coach lit les validations de ses abonnés" ON public.program_completions
  FOR SELECT TO authenticated USING (auth.uid() = coach_id);
DROP TRIGGER IF EXISTS program_completions_updated_at ON public.program_completions;
CREATE TRIGGER program_completions_updated_at
  BEFORE UPDATE ON public.program_completions
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();