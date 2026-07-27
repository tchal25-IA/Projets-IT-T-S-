
-- ===== COACH ↔ ABONNÉ LINK =====
CREATE TABLE public.coach_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id uuid NOT NULL,
  abonne_id uuid NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.coach_assignments TO authenticated;
GRANT ALL ON public.coach_assignments TO service_role;
ALTER TABLE public.coach_assignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Coach voit ses assignments" ON public.coach_assignments
  FOR SELECT TO authenticated USING (auth.uid() = coach_id OR auth.uid() = abonne_id);
CREATE POLICY "Coach crée assignment" ON public.coach_assignments
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = coach_id AND public.has_role(auth.uid(),'coach'));
CREATE POLICY "Coach supprime assignment" ON public.coach_assignments
  FOR DELETE TO authenticated USING (auth.uid() = coach_id);

-- ===== CONVERSATIONS =====
CREATE TABLE public.conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id uuid NOT NULL,
  abonne_id uuid NOT NULL,
  last_message_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (coach_id, abonne_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.conversations TO authenticated;
GRANT ALL ON public.conversations TO service_role;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Participants voient conversation" ON public.conversations
  FOR SELECT TO authenticated USING (auth.uid() = coach_id OR auth.uid() = abonne_id);
CREATE POLICY "Participants créent conversation" ON public.conversations
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = coach_id OR auth.uid() = abonne_id);
CREATE POLICY "Participants update conversation" ON public.conversations
  FOR UPDATE TO authenticated USING (auth.uid() = coach_id OR auth.uid() = abonne_id);

-- ===== MESSAGES =====
CREATE TABLE public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  from_user_id uuid NOT NULL,
  texte text NOT NULL,
  type text NOT NULL DEFAULT 'normal',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.messages TO authenticated;
GRANT ALL ON public.messages TO service_role;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Participants voient messages" ON public.messages
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.conversations c
            WHERE c.id = conversation_id AND (c.coach_id = auth.uid() OR c.abonne_id = auth.uid()))
  );
CREATE POLICY "Participants envoient messages" ON public.messages
  FOR INSERT TO authenticated WITH CHECK (
    from_user_id = auth.uid() AND
    EXISTS (SELECT 1 FROM public.conversations c
            WHERE c.id = conversation_id AND (c.coach_id = auth.uid() OR c.abonne_id = auth.uid()))
  );
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER TABLE public.messages REPLICA IDENTITY FULL;
CREATE INDEX idx_messages_conv ON public.messages(conversation_id, created_at);

-- ===== PROGRAMMES =====
CREATE TABLE public.programs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  abonne_id uuid NOT NULL,
  coach_id uuid NOT NULL,
  titre text NOT NULL DEFAULT 'Programme hebdo',
  objectif text DEFAULT '',
  blocs jsonb NOT NULL DEFAULT '[]'::jsonb,
  semaine_debut date NOT NULL DEFAULT current_date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.programs TO authenticated;
GRANT ALL ON public.programs TO service_role;
ALTER TABLE public.programs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Abonne lit son programme" ON public.programs
  FOR SELECT TO authenticated USING (auth.uid() = abonne_id OR auth.uid() = coach_id);
CREATE POLICY "Coach gère programmes" ON public.programs
  FOR ALL TO authenticated USING (auth.uid() = coach_id AND public.has_role(auth.uid(),'coach'))
  WITH CHECK (auth.uid() = coach_id AND public.has_role(auth.uid(),'coach'));
CREATE TRIGGER programs_updated BEFORE UPDATE ON public.programs
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ===== CRÉNEAUX D'ENTRAÎNEMENT =====
CREATE TABLE public.training_slots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  abonne_id uuid NOT NULL,
  coach_id uuid NOT NULL,
  date_slot timestamptz NOT NULL,
  duree_min integer NOT NULL DEFAULT 60,
  lieu text DEFAULT '',
  note text DEFAULT '',
  status text NOT NULL DEFAULT 'propose', -- propose, valide, refuse, contre_propose
  proposed_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.training_slots TO authenticated;
GRANT ALL ON public.training_slots TO service_role;
ALTER TABLE public.training_slots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Participants voient créneaux" ON public.training_slots
  FOR SELECT TO authenticated USING (auth.uid() = abonne_id OR auth.uid() = coach_id);
CREATE POLICY "Participants créent créneaux" ON public.training_slots
  FOR INSERT TO authenticated WITH CHECK (
    proposed_by = auth.uid() AND (auth.uid() = abonne_id OR auth.uid() = coach_id)
  );
CREATE POLICY "Participants modifient créneaux" ON public.training_slots
  FOR UPDATE TO authenticated USING (auth.uid() = abonne_id OR auth.uid() = coach_id);
CREATE POLICY "Participants suppr créneaux" ON public.training_slots
  FOR DELETE TO authenticated USING (auth.uid() = abonne_id OR auth.uid() = coach_id);
CREATE TRIGGER slots_updated BEFORE UPDATE ON public.training_slots
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ===== AUTO-ASSIGNMENT au signup via invitation =====
-- Recrée handle_new_user pour créer le lien coach<->abonné depuis le token
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
      UPDATE public.invitations SET used_at = now() WHERE token = invite_token;
      assigned_role := 'abonne';
      INSERT INTO public.coach_assignments (coach_id, abonne_id)
        VALUES (invite_coach, NEW.id) ON CONFLICT (abonne_id) DO NOTHING;
      -- crée la conversation
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

-- S'assurer que le trigger existe
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
