-- ============================================================================
-- FIX RLS : profiles lisibles uniquement par leur propriétaire
-- (était "readable by all authenticated" → exposait les emails)
-- ============================================================================
DROP POLICY IF EXISTS "profiles readable by authenticated" ON public.profiles;

CREATE POLICY "profiles readable by owner" ON public.profiles
  FOR SELECT TO authenticated
  USING (auth.uid() = id);

-- La leaderboard ne doit exposer que display_name (jamais l'email).
-- La vue est déjà correcte (ne sélectionne pas email), mais on
-- s'assure que service_role garde son accès complet pour le SSO.

-- ============================================================================
-- FIX RLS : storage buckets (si des buckets privés existent)
-- Ajoute des policies pour les buckets "documents" et "event-attachments"
-- si Supabase les a créés sans policy.
-- ============================================================================
DO $$
BEGIN
  -- Bucket "documents"
  IF EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'documents') THEN
    -- SELECT
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='documents owner select'
    ) THEN
      EXECUTE $p$
        CREATE POLICY "documents owner select" ON storage.objects
          FOR SELECT TO authenticated
          USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);
      $p$;
    END IF;
    -- INSERT
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='documents owner insert'
    ) THEN
      EXECUTE $p$
        CREATE POLICY "documents owner insert" ON storage.objects
          FOR INSERT TO authenticated
          WITH CHECK (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);
      $p$;
    END IF;
    -- DELETE
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='documents owner delete'
    ) THEN
      EXECUTE $p$
        CREATE POLICY "documents owner delete" ON storage.objects
          FOR DELETE TO authenticated
          USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);
      $p$;
    END IF;
  END IF;

  -- Bucket "event-attachments"
  IF EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'event-attachments') THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='event-attachments owner select'
    ) THEN
      EXECUTE $p$
        CREATE POLICY "event-attachments owner select" ON storage.objects
          FOR SELECT TO authenticated
          USING (bucket_id = 'event-attachments' AND auth.uid()::text = (storage.foldername(name))[1]);
      $p$;
    END IF;
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='event-attachments owner insert'
    ) THEN
      EXECUTE $p$
        CREATE POLICY "event-attachments owner insert" ON storage.objects
          FOR INSERT TO authenticated
          WITH CHECK (bucket_id = 'event-attachments' AND auth.uid()::text = (storage.foldername(name))[1]);
      $p$;
    END IF;
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='event-attachments owner delete'
    ) THEN
      EXECUTE $p$
        CREATE POLICY "event-attachments owner delete" ON storage.objects
          FOR DELETE TO authenticated
          USING (bucket_id = 'event-attachments' AND auth.uid()::text = (storage.foldername(name))[1]);
      $p$;
    END IF;
  END IF;
END $$;
