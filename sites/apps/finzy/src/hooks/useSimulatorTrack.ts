import { useEffect, useRef } from 'react';
import { useBadges } from '@/hooks/useBadges';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export function useSimulatorTrack(slug: string) {
  const { awardBadge } = useBadges();
  const { user } = useAuth();
  const tracked = useRef(false);

  useEffect(() => {
    if (tracked.current || !user) return;
    tracked.current = true;
    const key = 'finzy_sim_visited';
    const visited: string[] = JSON.parse(sessionStorage.getItem(key) ?? '[]');
    const isNew = !visited.includes(slug);
    if (isNew) {
      visited.push(slug);
      // +10 XP for each new simulator discovered
      supabase.rpc('grant_xp', { p_user_id: user.id, p_xp: 10 });
    }
    sessionStorage.setItem(key, JSON.stringify(visited));
    if (visited.length >= 5) {
      awardBadge('strategist');
    }
  }, [slug, awardBadge, user]);
}
