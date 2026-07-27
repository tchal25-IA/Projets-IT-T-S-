-- Système de notifications générique (coach <-> abonné).
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,   -- destinataire
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,           -- émetteur
  type text NOT NULL,
  title text NOT NULL,
  body text,
  link text,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS notifications_user_idx
  ON public.notifications (user_id, created_at DESC);

GRANT SELECT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Le destinataire lit / met à jour (marque lu) / supprime ses notifications.
CREATE POLICY "user lit ses notifications" ON public.notifications
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "user maj ses notifications" ON public.notifications
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "user supprime ses notifications" ON public.notifications
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Création via fonction SECURITY DEFINER : autorisée seulement si émetteur =
-- destinataire OU si un lien coach<->abonné existe entre les deux.
CREATE OR REPLACE FUNCTION public.create_notification(
  p_user_id uuid, p_type text, p_title text, p_body text DEFAULT NULL, p_link text DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
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

-- Realtime (idempotent : ne casse pas si déjà ajoutée ou publication absente)
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN undefined_object THEN NULL;
END $$;
