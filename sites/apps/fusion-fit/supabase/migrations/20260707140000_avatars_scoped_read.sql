-- Sécurité (warning scanner) : la lecture des avatars était ouverte à tout
-- utilisateur authentifié. On restreint au propriétaire et aux utilisateurs
-- liés par coach_assignments (coach <-> abonné), seuls contextes où l'avatar
-- est affiché dans l'app.
DROP POLICY IF EXISTS "avatars authenticated read" ON storage.objects;
DROP POLICY IF EXISTS "avatars scoped read" ON storage.objects;
CREATE POLICY "avatars scoped read" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'avatars' AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR EXISTS (
        SELECT 1 FROM public.coach_assignments ca
        WHERE (ca.coach_id = auth.uid() AND ca.abonne_id::text = (storage.foldername(name))[1])
           OR (ca.abonne_id = auth.uid() AND ca.coach_id::text = (storage.foldername(name))[1])
      )
    )
  );
