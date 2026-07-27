DROP POLICY IF EXISTS "Leaderboard aggregate read" ON public.profiles;

CREATE OR REPLACE FUNCTION public.get_leaderboard(_limit int DEFAULT 15)
RETURNS TABLE(user_id uuid, display_name text, verified_count bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.id AS user_id,
         COALESCE(p.display_name, 'Anonyme') AS display_name,
         count(r.id) FILTER (WHERE r.status = 'verified'::referral_status) AS verified_count
  FROM public.profiles p
  LEFT JOIN public.referrals r ON r.referrer_id = p.id
  GROUP BY p.id, p.display_name
  ORDER BY verified_count DESC, display_name ASC
  LIMIT COALESCE(_limit, 15);
$$;

REVOKE ALL ON FUNCTION public.get_leaderboard(int) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_leaderboard(int) TO authenticated;
