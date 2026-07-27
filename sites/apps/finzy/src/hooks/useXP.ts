import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function useXP() {
  const { user, refreshProfile } = useAuth();

  const grantXP = async (xp: number, reason?: string) => {
    if (!user) return;
    const { error } = await supabase.rpc('grant_xp', { p_user_id: user.id, p_xp: xp });
    if (error) { console.error('XP error', error); return; }
    await refreshProfile();
    toast.success(`✨ +${xp} XP${reason ? ` — ${reason}` : ''}`, { duration: 2500 });
  };

  const updateStreak = async () => {
    if (!user) return 0;
    const { data, error } = await supabase.rpc('update_streak', { p_user_id: user.id });
    if (error) { console.error('Streak error', error); return 0; }
    return data as number;
  };

  return { grantXP, updateStreak };
}
