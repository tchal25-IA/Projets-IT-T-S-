-- Leaderboard function (anonymized usernames)
CREATE OR REPLACE FUNCTION public.get_leaderboard(p_limit int DEFAULT 10)
RETURNS TABLE(rank bigint, username_anon text, level int, xp_total int)
LANGUAGE sql SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    row_number() OVER (ORDER BY p.xp_total DESC),
    left(p.username, 2) || '***' as username_anon,
    p.level,
    p.xp_total
  FROM profiles p
  ORDER BY p.xp_total DESC
  LIMIT p_limit;
$$;