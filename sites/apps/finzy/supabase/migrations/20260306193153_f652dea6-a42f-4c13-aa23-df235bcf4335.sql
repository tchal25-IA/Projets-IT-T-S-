
-- Rename table to match what the code expects
ALTER TABLE public.user_article_progress RENAME TO user_academy_progress;

-- Add unique constraint on (user_id, article_id) to prevent duplicate entries / unlimited quiz exploit
ALTER TABLE public.user_academy_progress ADD CONSTRAINT user_academy_progress_user_article_unique UNIQUE (user_id, article_id);
