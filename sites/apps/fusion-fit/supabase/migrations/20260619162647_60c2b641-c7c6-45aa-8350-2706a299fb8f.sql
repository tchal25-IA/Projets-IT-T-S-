
DROP POLICY IF EXISTS "Coach supprime assignment" ON public.coach_assignments;
CREATE POLICY "Coach supprime assignment" ON public.coach_assignments
  FOR DELETE
  USING (auth.uid() = coach_id AND public.has_role(auth.uid(), 'coach'::public.app_role));

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
  invite_token := NEW.raw_user_meta_data->>'invitation_token';

  IF user_count = 1 THEN
    assigned_role := 'coach';
  ELSIF invite_token IS NOT NULL THEN
    SELECT coach_id INTO invite_coach FROM public.invitations
      WHERE token = invite_token AND used_at IS NULL AND expires_at > now();
    IF invite_coach IS NOT NULL THEN
      UPDATE public.invitations SET used_at = now(), token = NULL WHERE token = invite_token;
      assigned_role := 'abonne';
      INSERT INTO public.coach_assignments (coach_id, abonne_id)
        VALUES (invite_coach, NEW.id) ON CONFLICT (abonne_id) DO NOTHING;
      INSERT INTO public.conversations (coach_id, abonne_id)
        VALUES (invite_coach, NEW.id) ON CONFLICT DO NOTHING;
    ELSE
      assigned_role := 'abonne';
    END IF;
  ELSE
    assigned_role := 'abonne';
  END IF;

  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, assigned_role);
  INSERT INTO public.profiles (user_id, prenom, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'prenom', split_part(NEW.email,'@',1)),
    NEW.email
  );
  RETURN NEW;
END;
$function$;

UPDATE public.invitations SET token = NULL WHERE used_at IS NOT NULL AND token IS NOT NULL;
