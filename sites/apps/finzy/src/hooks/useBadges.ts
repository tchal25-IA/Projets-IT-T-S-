import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Badge {
  id: string;
  key: string;
  label: string;
  icon: string;
  description: string;
  xp_reward: number;
  earned: boolean;
}

export function useBadges() {
  const { user } = useAuth();
  const [badges, setBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBadges = useCallback(async () => {
    if (!user) return;
    const [{ data: allBadges }, { data: userBadges }] = await Promise.all([
      supabase.from('badges').select('*'),
      supabase.from('user_badges').select('badge_id').eq('user_id', user.id),
    ]);
    const earnedIds = new Set((userBadges ?? []).map(ub => ub.badge_id));
    setBadges((allBadges ?? []).map(b => ({ ...b, earned: earnedIds.has(b.id) })));
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchBadges(); }, [fetchBadges]);

  const awardBadge = useCallback(async (badgeKey: string) => {
    if (!user) return false;
    const badge = badges.find(b => b.key === badgeKey);
    if (!badge || badge.earned) return false;
    const { error } = await supabase.from('user_badges').insert({ user_id: user.id, badge_id: badge.id });
    if (error) return false;
    // Grant XP reward
    if (badge.xp_reward > 0) {
      await supabase.rpc('grant_xp', { p_user_id: user.id, p_xp: badge.xp_reward });
    }
    toast.success(`🏆 Badge débloqué : ${badge.icon} ${badge.label} (+${badge.xp_reward} XP)`, { duration: 4000 });
    await fetchBadges();
    return true;
  }, [user, badges, fetchBadges]);

  // Helper to check conditions and award
  const checkAndAward = useCallback(async (badgeKey: string, condition: boolean) => {
    if (condition) await awardBadge(badgeKey);
  }, [awardBadge]);

  return { badges, loading, awardBadge, checkAndAward, refetch: fetchBadges };
}
