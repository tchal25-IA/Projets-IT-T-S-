-- Le durcissement RLS (20260706213940) restreint la lecture des profils au
-- propriétaire et au coach pour ses abonnés. Il manque le sens inverse :
-- l'abonné doit pouvoir lire le profil PUBLIC de SON coach (nom, description,
-- avatar) — pour la carte « Mon coach » et la fiche coach côté abonné.
DROP POLICY IF EXISTS "Abonné voit le profil de son coach" ON public.profiles;
CREATE POLICY "Abonné voit le profil de son coach" ON public.profiles
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.coach_assignments ca
    WHERE ca.abonne_id = auth.uid() AND ca.coach_id = profiles.user_id
  )
);
