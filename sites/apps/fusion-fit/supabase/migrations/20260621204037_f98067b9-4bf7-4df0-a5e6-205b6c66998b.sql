
-- check_ins : colonnes manquantes
ALTER TABLE public.check_ins
  ADD COLUMN IF NOT EXISTS date date NOT NULL DEFAULT CURRENT_DATE,
  ADD COLUMN IF NOT EXISTS blocs_completes integer[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS nb_blocs integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS serenite integer NOT NULL DEFAULT 3,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

-- Dédupliquer les doublons (user_id, date) en gardant le plus récent
DELETE FROM public.check_ins a
USING public.check_ins b
WHERE a.user_id = b.user_id
  AND a.date = b.date
  AND a.created_at < b.created_at;

CREATE UNIQUE INDEX IF NOT EXISTS check_ins_user_date_uniq ON public.check_ins(user_id, date);

CREATE OR REPLACE VIEW public.checkins AS
  SELECT id, user_id, date, temps, energie, humeur, blocs_completes, nb_blocs, serenite, created_at, updated_at
  FROM public.check_ins;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.checkins TO authenticated;
GRANT ALL ON public.checkins TO service_role;

-- messages : to_user_id
ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS to_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.messages ALTER COLUMN conversation_id DROP NOT NULL;
CREATE INDEX IF NOT EXISTS messages_to_user_id_idx ON public.messages(to_user_id);
CREATE INDEX IF NOT EXISTS messages_from_user_id_idx ON public.messages(from_user_id);

DROP POLICY IF EXISTS "messages_direct_select" ON public.messages;
CREATE POLICY "messages_direct_select" ON public.messages
  FOR SELECT TO authenticated
  USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);

DROP POLICY IF EXISTS "messages_direct_insert" ON public.messages;
CREATE POLICY "messages_direct_insert" ON public.messages
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = from_user_id);

-- Vue athlete_stats
CREATE OR REPLACE VIEW public.athlete_stats AS
  SELECT
    p.user_id, p.prenom, p.email, p.niveau_agent, p.objectif_principal,
    COALESCE(c.total_checkins, 0)::int AS total_checkins,
    c.last_checkin, c.avg_energie, c.avg_humeur, c.avg_serenite
  FROM public.profiles p
  LEFT JOIN (
    SELECT user_id,
           COUNT(*) AS total_checkins,
           MAX(date)::text AS last_checkin,
           AVG(energie)::numeric(4,2) AS avg_energie,
           AVG(humeur)::numeric(4,2) AS avg_humeur,
           AVG(serenite)::numeric(4,2) AS avg_serenite
    FROM public.check_ins GROUP BY user_id
  ) c ON c.user_id = p.user_id
  WHERE EXISTS (
    SELECT 1 FROM public.coach_assignments ca
    WHERE ca.abonne_id = p.user_id AND ca.coach_id = auth.uid()
  );
GRANT SELECT ON public.athlete_stats TO authenticated;
GRANT ALL ON public.athlete_stats TO service_role;

-- Fonction validate_invitation
CREATE OR REPLACE FUNCTION public.validate_invitation(p_token text)
RETURNS TABLE(coach_id uuid, email text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT i.coach_id, i.email FROM public.invitations i
  WHERE i.token = p_token AND i.used_at IS NULL AND i.expires_at > now()
  LIMIT 1;
$$;
REVOKE ALL ON FUNCTION public.validate_invitation(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.validate_invitation(text) TO anon, authenticated;
