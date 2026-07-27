import { useState, useEffect } from 'react';
import { Trophy, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface LeaderboardEntry {
  rank: number;
  username_anon: string;
  level: number;
  xp_total: number;
}

export function Leaderboard({ limit = 5 }: { limit?: number }) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.rpc('get_leaderboard', { p_limit: limit } as { p_limit: number })
      .then(({ data, error }) => {
        if (error) {
          console.warn('Leaderboard:', error.message);
          setLoading(false);
          return;
        }
        setEntries((data ?? []).map((r: { rank: number; username_anon: string; level: number; xp_total: number }) => ({
          rank: Number(r.rank),
          username_anon: r.username_anon,
          level: r.level,
          xp_total: r.xp_total,
        })));
        setLoading(false);
      });
  }, [limit]);

  if (loading) return <div className="flex items-center gap-2 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Chargement...</div>;
  if (entries.length === 0) return null;

  return (
    <div className="rounded-xl border bg-card p-4">
      <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
        <Trophy className="h-4 w-4 text-warning" />
        Classement XP
      </h3>
      <div className="space-y-2">
        {entries.map((e) => (
          <div key={e.rank} className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground w-6">#{e.rank}</span>
            <span className="font-medium">{e.username_anon}</span>
            <span className="text-muted-foreground">Niv.{e.level}</span>
            <span className="font-semibold text-primary">{e.xp_total} XP</span>
          </div>
        ))}
      </div>
    </div>
  );
}
