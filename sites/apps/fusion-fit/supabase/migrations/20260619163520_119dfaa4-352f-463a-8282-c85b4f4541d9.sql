
-- 1) Allow token to be NULL after invitation is consumed
ALTER TABLE public.invitations ALTER COLUMN token DROP NOT NULL;

-- 2) Fix infinite recursion between squads and squad_members policies
CREATE OR REPLACE FUNCTION public.is_squad_coach(_squad_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.squads WHERE id = _squad_id AND coach_id = _user_id)
$$;

CREATE OR REPLACE FUNCTION public.is_squad_member(_squad_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.squad_members WHERE squad_id = _squad_id AND abonne_id = _user_id)
$$;

DROP POLICY IF EXISTS "Membres voient leur squad" ON public.squads;
CREATE POLICY "Membres voient leur squad" ON public.squads
  FOR SELECT USING (public.is_squad_member(id, auth.uid()));

DROP POLICY IF EXISTS "Abonne voit ses memberships" ON public.squad_members;
CREATE POLICY "Abonne voit ses memberships" ON public.squad_members
  FOR SELECT USING (abonne_id = auth.uid() OR public.is_squad_coach(squad_id, auth.uid()));

DROP POLICY IF EXISTS "Coach gère membres" ON public.squad_members;
CREATE POLICY "Coach gère membres" ON public.squad_members
  FOR ALL USING (public.is_squad_coach(squad_id, auth.uid()))
  WITH CHECK (public.is_squad_coach(squad_id, auth.uid()));
