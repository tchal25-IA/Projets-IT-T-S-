-- Messages vocaux + métadonnées média
ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS media_url text,
  ADD COLUMN IF NOT EXISTS media_duration_sec integer;

-- Bucket privé pour notes vocales (accès réservé coach ↔ athlète liés)
INSERT INTO storage.buckets (id, name, public)
VALUES ('chat-audio', 'chat-audio', false)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "chat_audio_select" ON storage.objects;
CREATE POLICY "chat_audio_select" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'chat-audio' AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR EXISTS (
        SELECT 1 FROM public.coach_assignments ca
        WHERE (ca.coach_id = auth.uid() AND ca.abonne_id::text = (storage.foldername(name))[1])
           OR (ca.abonne_id = auth.uid() AND ca.coach_id::text = (storage.foldername(name))[1])
      )
    )
  );

DROP POLICY IF EXISTS "chat_audio_insert" ON storage.objects;
CREATE POLICY "chat_audio_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'chat-audio'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "chat_audio_delete" ON storage.objects;
CREATE POLICY "chat_audio_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'chat-audio'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
