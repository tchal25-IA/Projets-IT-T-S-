
REVOKE EXECUTE ON FUNCTION public.is_owner(uuid) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, PUBLIC;

-- Make intent explicit on academy_quizzes: only service_role can access the raw table.
-- Public consumers must use the academy_quizzes_public view or check_quiz_answer() RPC.
CREATE POLICY "academy_quizzes_service_only_select"
  ON public.academy_quizzes
  FOR SELECT
  TO service_role
  USING (true);
