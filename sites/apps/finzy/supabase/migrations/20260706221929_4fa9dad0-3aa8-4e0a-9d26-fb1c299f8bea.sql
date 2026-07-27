CREATE TABLE IF NOT EXISTS public.ai_usage (
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  date date NOT NULL DEFAULT CURRENT_DATE,
  count integer NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, date)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_usage TO authenticated;
GRANT ALL ON public.ai_usage TO service_role;

ALTER TABLE public.ai_usage ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own ai_usage" ON public.ai_usage;
CREATE POLICY "Users can read own ai_usage" ON public.ai_usage
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own ai_usage" ON public.ai_usage;
CREATE POLICY "Users can insert own ai_usage" ON public.ai_usage
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own ai_usage" ON public.ai_usage;
CREATE POLICY "Users can update own ai_usage" ON public.ai_usage
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);