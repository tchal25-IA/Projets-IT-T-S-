
-- 1) profiles: avatar_url + bio
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS avatar_url text,
  ADD COLUMN IF NOT EXISTS bio text;

-- 2) conversations: lecture par côté
ALTER TABLE public.conversations
  ADD COLUMN IF NOT EXISTS coach_last_read_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS abonne_last_read_at timestamptz NOT NULL DEFAULT now();

-- 3) program_templates (catalogue coach)
CREATE TABLE IF NOT EXISTS public.program_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  titre text NOT NULL,
  objectif text,
  blocs jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.program_templates TO authenticated;
GRANT ALL ON public.program_templates TO service_role;

ALTER TABLE public.program_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "coach reads own templates" ON public.program_templates
  FOR SELECT TO authenticated USING (auth.uid() = coach_id);
CREATE POLICY "coach inserts own templates" ON public.program_templates
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = coach_id AND public.has_role(auth.uid(),'coach'));
CREATE POLICY "coach updates own templates" ON public.program_templates
  FOR UPDATE TO authenticated USING (auth.uid() = coach_id);
CREATE POLICY "coach deletes own templates" ON public.program_templates
  FOR DELETE TO authenticated USING (auth.uid() = coach_id);

CREATE TRIGGER program_templates_updated_at
  BEFORE UPDATE ON public.program_templates
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- 4) storage policies pour le bucket "avatars" (créé via tool)
-- lecture publique
CREATE POLICY "avatars public read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

-- chaque user écrit/met à jour/supprime SES fichiers (préfixe = user_id/)
CREATE POLICY "avatars user insert"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "avatars user update"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "avatars user delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
