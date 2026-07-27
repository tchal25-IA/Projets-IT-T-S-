
DROP POLICY IF EXISTS "Coachs see all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Coachs update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Coachs see all roles" ON public.user_roles;

CREATE POLICY "Coachs see assigned profiles" ON public.profiles
FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(), 'coach')
  AND EXISTS (
    SELECT 1 FROM public.coach_assignments ca
    WHERE ca.coach_id = auth.uid() AND ca.abonne_id = profiles.user_id
  )
);

CREATE POLICY "Coachs update assigned profiles" ON public.profiles
FOR UPDATE TO authenticated
USING (
  public.has_role(auth.uid(), 'coach')
  AND EXISTS (
    SELECT 1 FROM public.coach_assignments ca
    WHERE ca.coach_id = auth.uid() AND ca.abonne_id = profiles.user_id
  )
)
WITH CHECK (
  public.has_role(auth.uid(), 'coach')
  AND EXISTS (
    SELECT 1 FROM public.coach_assignments ca
    WHERE ca.coach_id = auth.uid() AND ca.abonne_id = profiles.user_id
  )
);

CREATE POLICY "Coachs see assigned roles" ON public.user_roles
FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(), 'coach')
  AND EXISTS (
    SELECT 1 FROM public.coach_assignments ca
    WHERE ca.coach_id = auth.uid() AND ca.abonne_id = user_roles.user_id
  )
);
