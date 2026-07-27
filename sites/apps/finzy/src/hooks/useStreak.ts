import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export function useStreak() {
  const { user } = useAuth();
  const [streak, setStreak] = useState(0);
  const [longestStreak, setLongestStreak] = useState(0);

  useEffect(() => {
    if (!user) return;
    supabase.from('user_streaks').select('*').eq('user_id', user.id).maybeSingle().then(({ data }) => {
      if (data) {
        setStreak(data.current_streak);
        setLongestStreak(data.longest_streak);
      }
    });
  }, [user]);

  return { streak, longestStreak };
}
