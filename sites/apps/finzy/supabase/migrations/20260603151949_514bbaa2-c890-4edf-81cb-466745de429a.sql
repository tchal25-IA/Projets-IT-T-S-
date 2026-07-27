ALTER TABLE public.user_academy_progress DROP CONSTRAINT IF EXISTS user_article_progress_article_id_fkey;
ALTER TABLE public.user_academy_progress DROP CONSTRAINT IF EXISTS user_academy_progress_article_id_fkey;
ALTER TABLE public.user_academy_progress DROP CONSTRAINT IF EXISTS user_academy_progress_user_article_unique;
ALTER TABLE public.user_academy_progress ALTER COLUMN article_id TYPE text USING article_id::text;
ALTER TABLE public.user_academy_progress ADD CONSTRAINT user_academy_progress_user_article_unique UNIQUE (user_id, article_id);