
CREATE TABLE public.squads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id uuid NOT NULL,
  nom text NOT NULL,
  objectif text DEFAULT '',
  couleur text DEFAULT 'cyan',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.squad_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  squad_id uuid NOT NULL REFERENCES public.squads(id) ON DELETE CASCADE,
  abonne_id uuid NOT NULL,
  joined_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (squad_id, abonne_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.squads TO authenticated;
GRANT ALL ON public.squads TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.squad_members TO authenticated;
GRANT ALL ON public.squad_members TO service_role;

ALTER TABLE public.squads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.squad_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Coach gère ses squads" ON public.squads
  FOR ALL TO authenticated
  USING (auth.uid() = coach_id AND public.has_role(auth.uid(),'coach'))
  WITH CHECK (auth.uid() = coach_id AND public.has_role(auth.uid(),'coach'));
CREATE POLICY "Membres voient leur squad" ON public.squads
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.squad_members sm
            WHERE sm.squad_id = squads.id AND sm.abonne_id = auth.uid())
  );

CREATE POLICY "Coach gère membres" ON public.squad_members
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.squads s WHERE s.id = squad_members.squad_id AND s.coach_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.squads s WHERE s.id = squad_members.squad_id AND s.coach_id = auth.uid()));
CREATE POLICY "Abonne voit ses memberships" ON public.squad_members
  FOR SELECT TO authenticated USING (
    abonne_id = auth.uid() OR
    EXISTS (SELECT 1 FROM public.squads s WHERE s.id = squad_members.squad_id AND s.coach_id = auth.uid())
  );

CREATE TRIGGER squads_updated BEFORE UPDATE ON public.squads
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
