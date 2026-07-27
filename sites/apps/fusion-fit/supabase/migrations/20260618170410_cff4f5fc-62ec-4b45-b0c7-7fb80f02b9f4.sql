
CREATE TABLE public.check_ins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  temps smallint NOT NULL,
  energie smallint NOT NULL,
  humeur smallint NOT NULL,
  note text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX check_ins_user_created_idx ON public.check_ins (user_id, created_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.check_ins TO authenticated;
GRANT ALL ON public.check_ins TO service_role;
ALTER TABLE public.check_ins ENABLE ROW LEVEL SECURITY;
CREATE POLICY "User gère ses check-ins" ON public.check_ins
  FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Coach lit check-ins de ses abonnés" ON public.check_ins
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.coach_assignments ca
            WHERE ca.abonne_id = check_ins.user_id AND ca.coach_id = auth.uid())
  );
