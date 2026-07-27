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
  IF auth.uid() IS NULL OR auth.uid() <> p_user_id THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  IF p_xp IS NULL OR p_xp <= 0 OR p_xp > 200 THEN
    RAISE EXCEPTION 'invalid xp amount';
  END IF;
  UPDATE public.profiles
    SET xp_total = xp_total + p_xp
  WHERE id = p_user_id
  RETURNING xp_total INTO new_xp;
  new_level := GREATEST(1, FLOOR(new_xp::numeric / 100)::int + 1);
  UPDATE public.profiles SET level = new_level WHERE id = p_user_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_streak(p_user_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_streak integer;
  v_last date;
  v_today date := CURRENT_DATE;
BEGIN
  IF auth.uid() IS NULL OR auth.uid() <> p_user_id THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  SELECT current_streak, last_activity_date INTO v_streak, v_last
  FROM public.user_streaks WHERE user_id = p_user_id;

  IF NOT FOUND THEN
    INSERT INTO public.user_streaks (user_id, current_streak, longest_streak, last_activity_date)
    VALUES (p_user_id, 1, 1, v_today);
    RETURN 1;
  END IF;

  IF v_last = v_today THEN
    RETURN v_streak;
  ELSIF v_last = v_today - 1 THEN
    v_streak := v_streak + 1;
  ELSE
    v_streak := 1;
  END IF;

  UPDATE public.user_streaks
    SET current_streak = v_streak,
        longest_streak = GREATEST(longest_streak, v_streak),
        last_activity_date = v_today
  WHERE user_id = p_user_id;
  RETURN v_streak;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.grant_xp(uuid, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.grant_xp(uuid, integer) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.update_streak(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.update_streak(uuid) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.get_leaderboard(int) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_leaderboard(int) TO authenticated;

DROP POLICY IF EXISTS "Quizzes are public" ON public.academy_quizzes;
REVOKE SELECT ON public.academy_quizzes FROM anon, authenticated;

CREATE OR REPLACE VIEW public.academy_quizzes_public
WITH (security_invoker = true)
AS
  SELECT id, article_id, question, options, xp_reward FROM public.academy_quizzes;
GRANT SELECT ON public.academy_quizzes_public TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.check_quiz_answer(p_quiz_id uuid, p_answer_index integer)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT correct_index = p_answer_index FROM public.academy_quizzes WHERE id = p_quiz_id;
$$;
REVOKE EXECUTE ON FUNCTION public.check_quiz_answer(uuid, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.check_quiz_answer(uuid, integer) TO authenticated;

CREATE POLICY "Users update own watchlist"
  ON public.watchlist FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);