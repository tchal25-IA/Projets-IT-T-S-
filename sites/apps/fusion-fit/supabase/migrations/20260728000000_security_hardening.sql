-- ============================================================
-- P0 Sécurité : invitation-only + RLS assignment + liens notifs
-- ============================================================

-- Helper : lien coach ↔ abonné existant
CREATE OR REPLACE FUNCTION public.is_coach_of(_coach uuid, _abonne uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.coach_assignments
    WHERE coach_id = _coach AND abonne_id = _abonne
  );
$$;
REVOKE ALL ON FUNCTION public.is_coach_of(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_coach_of(uuid, uuid) TO authenticated;

-- ------------------------------------------------------------
-- 1) handle_new_user : invitation obligatoire (sauf 1er compte = coach)
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  user_count INT;
  assigned_role public.app_role;
  invite_token TEXT;
  invite_coach UUID;
BEGIN
  SELECT COUNT(*) INTO user_count FROM auth.users;
  invite_token := NULLIF(TRIM(COALESCE(NEW.raw_user_meta_data->>'invitation_token', '')), '');

  IF user_count = 1 THEN
    -- Bootstrap : premier compte = coach (sans invitation)
    assigned_role := 'coach';
  ELSIF invite_token IS NULL THEN
    RAISE EXCEPTION 'Invitation requise pour créer un compte';
  ELSE
    SELECT coach_id INTO invite_coach
    FROM public.invitations
    WHERE token = invite_token
      AND used_at IS NULL
      AND expires_at > now();

    IF invite_coach IS NULL THEN
      RAISE EXCEPTION 'Invitation invalide ou expirée';
    END IF;

    UPDATE public.invitations
    SET used_at = now(), token = NULL
    WHERE token = invite_token;

    assigned_role := 'abonne';

    INSERT INTO public.coach_assignments (coach_id, abonne_id)
    VALUES (invite_coach, NEW.id)
    ON CONFLICT (abonne_id) DO NOTHING;

    INSERT INTO public.conversations (coach_id, abonne_id)
    VALUES (invite_coach, NEW.id)
    ON CONFLICT DO NOTHING;
  END IF;

  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, assigned_role);
  INSERT INTO public.profiles (user_id, prenom, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'prenom', split_part(NEW.email, '@', 1)),
    NEW.email
  );
  RETURN NEW;
END;
$function$;

-- ------------------------------------------------------------
-- 2) validate_invitation : pré-check anon (lecture seule)
-- ------------------------------------------------------------
DROP FUNCTION IF EXISTS public.validate_invitation(text);

CREATE OR REPLACE FUNCTION public.validate_invitation(p_token text)
RETURNS TABLE(coach_id uuid, email text, coach_prenom text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT i.coach_id, i.email, p.prenom
  FROM public.invitations i
  LEFT JOIN public.profiles p ON p.user_id = i.coach_id
  WHERE i.token = p_token
    AND i.used_at IS NULL
    AND i.expires_at > now()
  LIMIT 1;
$$;
REVOKE ALL ON FUNCTION public.validate_invitation(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.validate_invitation(text) TO anon, authenticated;

-- ------------------------------------------------------------
-- 3) Invitations : coach uniquement
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "Coachs manage own invitations" ON public.invitations;
CREATE POLICY "Coachs manage own invitations" ON public.invitations
  FOR ALL TO authenticated
  USING (auth.uid() = coach_id AND public.has_role(auth.uid(), 'coach'))
  WITH CHECK (auth.uid() = coach_id AND public.has_role(auth.uid(), 'coach'));

-- ------------------------------------------------------------
-- 4) Conversations : création seulement si assignment
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "Participants créent conversation" ON public.conversations;
CREATE POLICY "Participants créent conversation" ON public.conversations
  FOR INSERT TO authenticated
  WITH CHECK (
    (auth.uid() = coach_id OR auth.uid() = abonne_id)
    AND public.is_coach_of(coach_id, abonne_id)
  );

-- ------------------------------------------------------------
-- 5) Messages : participant + assignment
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "Participants envoient messages" ON public.messages;
CREATE POLICY "Participants envoient messages" ON public.messages
  FOR INSERT TO authenticated
  WITH CHECK (
    from_user_id = auth.uid()
    AND conversation_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = conversation_id
        AND (c.coach_id = auth.uid() OR c.abonne_id = auth.uid())
        AND public.is_coach_of(c.coach_id, c.abonne_id)
    )
  );

DROP POLICY IF EXISTS "messages_direct_insert" ON public.messages;
DROP POLICY IF EXISTS "messages_direct_select" ON public.messages;

-- ------------------------------------------------------------
-- 6) Programs : coach + assignment
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "Coach gère programmes" ON public.programs;
CREATE POLICY "Coach gère programmes" ON public.programs
  FOR ALL TO authenticated
  USING (
    auth.uid() = coach_id
    AND public.has_role(auth.uid(), 'coach')
    AND public.is_coach_of(coach_id, abonne_id)
  )
  WITH CHECK (
    auth.uid() = coach_id
    AND public.has_role(auth.uid(), 'coach')
    AND public.is_coach_of(coach_id, abonne_id)
  );

-- ------------------------------------------------------------
-- 7) Training slots : participants + assignment
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "Participants créent créneaux" ON public.training_slots;
CREATE POLICY "Participants créent créneaux" ON public.training_slots
  FOR INSERT TO authenticated
  WITH CHECK (
    proposed_by = auth.uid()
    AND (auth.uid() = abonne_id OR auth.uid() = coach_id)
    AND public.is_coach_of(coach_id, abonne_id)
  );

DROP POLICY IF EXISTS "Participants modifient créneaux" ON public.training_slots;
CREATE POLICY "Participants modifient créneaux" ON public.training_slots
  FOR UPDATE TO authenticated
  USING (
    (auth.uid() = abonne_id OR auth.uid() = coach_id)
    AND public.is_coach_of(coach_id, abonne_id)
  );

DROP POLICY IF EXISTS "Participants suppr créneaux" ON public.training_slots;
CREATE POLICY "Participants suppr créneaux" ON public.training_slots
  FOR DELETE TO authenticated
  USING (
    (auth.uid() = abonne_id OR auth.uid() = coach_id)
    AND public.is_coach_of(coach_id, abonne_id)
  );

-- ------------------------------------------------------------
-- 8) Notifications : whitelist des liens internes
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.create_notification(
  p_user_id uuid,
  p_type text,
  p_title text,
  p_body text DEFAULT NULL,
  p_link text DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_id uuid;
  v_link text;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Non authentifié';
  END IF;

  IF p_user_id <> auth.uid()
     AND NOT public.is_coach_of(auth.uid(), p_user_id)
     AND NOT public.is_coach_of(p_user_id, auth.uid())
  THEN
    RAISE EXCEPTION 'Non autorisé';
  END IF;

  -- Whitelist : chemins relatifs FusionFit uniquement
  IF p_link IS NULL OR p_link = '' THEN
    v_link := NULL;
  ELSIF p_link ~ '^/fusionfit([/?#].*)?$' THEN
    v_link := p_link;
  ELSE
    v_link := NULL;
  END IF;

  INSERT INTO public.notifications (user_id, actor_id, type, title, body, link)
  VALUES (p_user_id, auth.uid(), p_type, p_title, p_body, v_link)
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;
REVOKE ALL ON FUNCTION public.create_notification(uuid, text, text, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_notification(uuid, text, text, text, text) TO authenticated;
