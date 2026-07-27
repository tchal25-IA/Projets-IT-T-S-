
-- 1. Restrict profiles SELECT to self only
DROP POLICY IF EXISTS "profiles readable by authenticated" ON public.profiles;
DROP POLICY IF EXISTS "profiles read all" ON public.profiles;

-- Keep existing owner-update policy; add self-only read
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='profiles' AND policyname='profiles self read'
  ) THEN
    CREATE POLICY "profiles self read" ON public.profiles
      FOR SELECT TO authenticated USING (auth.uid() = id);
  END IF;
END $$;

-- 2. Provide a SECURITY DEFINER function so a referrer can fetch the display
--    names of users they actually referred, without granting broad profile read.
CREATE OR REPLACE FUNCTION public.get_referee_names(_ids uuid[])
RETURNS TABLE (id uuid, display_name text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT p.id, p.display_name
  FROM public.profiles p
  WHERE p.id = ANY(_ids)
    AND EXISTS (
      SELECT 1 FROM public.referrals r
      WHERE r.referrer_id = auth.uid() AND r.referee_id = p.id
    );
$$;
REVOKE EXECUTE ON FUNCTION public.get_referee_names(uuid[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_referee_names(uuid[]) TO authenticated;

-- 3. Leaderboard view currently uses security_invoker — would now return only
--    the caller's row. Recreate as SECURITY DEFINER (only display_name +
--    aggregated count, no PII like email).
DROP VIEW IF EXISTS public.leaderboard;
CREATE VIEW public.leaderboard
WITH (security_invoker=off) AS
SELECT
  p.id AS user_id,
  COALESCE(p.display_name, 'Anonyme') AS display_name,
  COUNT(r.id) FILTER (WHERE r.status = 'verified') AS verified_count
FROM public.profiles p
LEFT JOIN public.referrals r ON r.referrer_id = p.id
GROUP BY p.id, p.display_name;
GRANT SELECT ON public.leaderboard TO authenticated;

-- 4. Stop broadcasting full profile rows over Realtime (still useful: referrals)
ALTER PUBLICATION supabase_realtime DROP TABLE public.profiles;

-- 5. Storage RLS — owner-only access on private buckets.
--    Convention: files stored under "<auth.uid()>/..." path prefix.
DROP POLICY IF EXISTS "documents owner read" ON storage.objects;
DROP POLICY IF EXISTS "documents owner write" ON storage.objects;
DROP POLICY IF EXISTS "documents owner update" ON storage.objects;
DROP POLICY IF EXISTS "documents owner delete" ON storage.objects;
DROP POLICY IF EXISTS "event-attachments owner read" ON storage.objects;
DROP POLICY IF EXISTS "event-attachments owner write" ON storage.objects;
DROP POLICY IF EXISTS "event-attachments owner update" ON storage.objects;
DROP POLICY IF EXISTS "event-attachments owner delete" ON storage.objects;

CREATE POLICY "documents owner read" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'documents' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "documents owner write" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'documents' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "documents owner update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'documents' AND (storage.foldername(name))[1] = auth.uid()::text)
  WITH CHECK (bucket_id = 'documents' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "documents owner delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'documents' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "event-attachments owner read" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'event-attachments' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "event-attachments owner write" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'event-attachments' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "event-attachments owner update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'event-attachments' AND (storage.foldername(name))[1] = auth.uid()::text)
  WITH CHECK (bucket_id = 'event-attachments' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "event-attachments owner delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'event-attachments' AND (storage.foldername(name))[1] = auth.uid()::text);
