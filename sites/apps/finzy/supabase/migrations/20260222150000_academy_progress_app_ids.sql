-- Table pour la progression Academy avec identifiants d'articles de l'app (fr-1-01, ch-1-01, etc.)
-- L'app utilise des articles statiques en JS, pas academy_articles Supabase
CREATE TABLE IF NOT EXISTS public.user_academy_progress (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  article_id text NOT NULL,
  read_at timestamptz NOT NULL DEFAULT now(),
  quiz_passed boolean NOT NULL DEFAULT false,
  UNIQUE(user_id, article_id)
);
ALTER TABLE public.user_academy_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own academy progress" ON public.user_academy_progress 
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
