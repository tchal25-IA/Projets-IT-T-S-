# Migration Leaderboard

Pour activer le classement XP sur le Dashboard, exécute ce SQL dans ton projet Supabase.

## Étapes

1. Ouvre [app.supabase.com](https://app.supabase.com) et sélectionne ton projet Finzy
2. Va dans **SQL Editor** (menu de gauche)
3. Clique sur **New query**
4. Colle le SQL ci-dessous
5. Clique sur **Run** (ou Ctrl+Entrée)

```sql
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
```

Une fois exécuté, le bloc "Classement XP" apparaîtra sur le Dashboard.
