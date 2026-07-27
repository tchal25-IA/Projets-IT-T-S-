
DROP POLICY IF EXISTS "messages_direct_insert" ON public.messages;
DROP POLICY IF EXISTS "messages_direct_select" ON public.messages;

DROP POLICY IF EXISTS "avatars public read" ON storage.objects;
CREATE POLICY "avatars authenticated read" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'avatars');

REVOKE EXECUTE ON FUNCTION public.validate_invitation(text) FROM anon, PUBLIC;
