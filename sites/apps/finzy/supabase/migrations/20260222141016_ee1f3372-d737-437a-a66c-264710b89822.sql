
-- Academy articles table
CREATE TABLE public.academy_articles (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  summary text NOT NULL DEFAULT '',
  content_md text NOT NULL DEFAULT '',
  level integer NOT NULL DEFAULT 1,
  xp_reward integer NOT NULL DEFAULT 25,
  reading_time integer NOT NULL DEFAULT 5,
  market text NOT NULL DEFAULT 'BOTH',
  category text NOT NULL DEFAULT 'general',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.academy_articles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Articles are public" ON public.academy_articles FOR SELECT USING (true);

-- Academy quizzes (one quiz per article)
CREATE TABLE public.academy_quizzes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  article_id uuid NOT NULL REFERENCES public.academy_articles(id) ON DELETE CASCADE,
  question text NOT NULL,
  options jsonb NOT NULL DEFAULT '[]',
  correct_index integer NOT NULL DEFAULT 0,
  xp_reward integer NOT NULL DEFAULT 15
);
ALTER TABLE public.academy_quizzes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Quizzes are public" ON public.academy_quizzes FOR SELECT USING (true);

-- User article progress
CREATE TABLE public.user_article_progress (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  article_id uuid NOT NULL REFERENCES public.academy_articles(id) ON DELETE CASCADE,
  read_at timestamptz NOT NULL DEFAULT now(),
  quiz_passed boolean NOT NULL DEFAULT false,
  UNIQUE(user_id, article_id)
);
ALTER TABLE public.user_article_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own article progress" ON public.user_article_progress FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- User streaks
CREATE TABLE public.user_streaks (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
  current_streak integer NOT NULL DEFAULT 0,
  longest_streak integer NOT NULL DEFAULT 0,
  last_active_date date NOT NULL DEFAULT CURRENT_DATE
);
ALTER TABLE public.user_streaks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own streaks" ON public.user_streaks FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Daily quiz answers
CREATE TABLE public.daily_quiz_answers (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  quiz_date date NOT NULL DEFAULT CURRENT_DATE,
  correct boolean NOT NULL DEFAULT false,
  xp_earned integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, quiz_date)
);
ALTER TABLE public.daily_quiz_answers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own daily quiz" ON public.daily_quiz_answers FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Function to grant XP and level up
CREATE OR REPLACE FUNCTION public.grant_xp(p_user_id uuid, p_xp integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  new_xp integer;
  new_level integer;
BEGIN
  UPDATE profiles SET xp_total = xp_total + p_xp WHERE id = p_user_id RETURNING xp_total INTO new_xp;
  -- Level thresholds: L1=0, L2=100, L3=300, L4=600, L5=1000
  new_level := CASE
    WHEN new_xp >= 1000 THEN 5
    WHEN new_xp >= 600 THEN 4
    WHEN new_xp >= 300 THEN 3
    WHEN new_xp >= 100 THEN 2
    ELSE 1
  END;
  UPDATE profiles SET level = new_level WHERE id = p_user_id AND level <> new_level;
END;
$$;

-- Function to update streak
CREATE OR REPLACE FUNCTION public.update_streak(p_user_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_streak integer;
  v_last date;
BEGIN
  SELECT current_streak, last_active_date INTO v_streak, v_last FROM user_streaks WHERE user_id = p_user_id;
  IF NOT FOUND THEN
    INSERT INTO user_streaks (user_id, current_streak, longest_streak, last_active_date) VALUES (p_user_id, 1, 1, CURRENT_DATE);
    RETURN 1;
  END IF;
  IF v_last = CURRENT_DATE THEN RETURN v_streak; END IF;
  IF v_last = CURRENT_DATE - 1 THEN
    v_streak := v_streak + 1;
  ELSE
    v_streak := 1;
  END IF;
  UPDATE user_streaks SET current_streak = v_streak, longest_streak = GREATEST(longest_streak, v_streak), last_active_date = CURRENT_DATE WHERE user_id = p_user_id;
  RETURN v_streak;
END;
$$;
