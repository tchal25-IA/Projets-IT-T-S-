import { useEffect, useState } from 'react';
import { SEO } from '@/components/SEO';
import { supabase } from '@/integrations/supabase/client';
import { Trophy, Medal, Loader2 } from 'lucide-react';
import { LevelBadge } from '@/components/LevelBadge';

interface LeaderboardEntry {
  rank: number;
  username_anon: string;
  level: number;
  xp_total: number;
}

export default function LeaderboardPage() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.rpc('get_leaderboard', { p_limit: 20 }).then(({ data, error }) => {
      if (error) console.warn('Leaderboard:', error.message);
      if (data) setEntries(data);
      setLoading(false);
    });
  }, []);

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="h-5 w-5 text-warning" />;
    if (rank === 2) return <Medal className="h-5 w-5 text-muted-foreground" />;
    if (rank === 3) return <Medal className="h-5 w-5 text-accent-foreground" />;
    return <span className="w-5 text-center text-sm font-bold text-muted-foreground">{rank}</span>;
  };

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <SEO title="Classement" description="Classement des joueurs Finzy par XP." path="/leaderboard" />
      <div>
        <h1 className="text-2xl font-bold">🏆 Classement</h1>
        <p className="text-sm text-muted-foreground">Top joueurs par XP</p>
      </div>

      {entries.length === 0 ? (
        <p className="text-center text-muted-foreground py-10">Aucun joueur pour le moment.</p>
      ) : (
        <div className="rounded-xl border bg-card overflow-hidden">
          <div className="grid grid-cols-[3rem_1fr_auto_auto] gap-2 px-4 py-2 text-xs font-semibold text-muted-foreground border-b">
            <span>#</span><span>Joueur</span><span>Niveau</span><span className="text-right">XP</span>
          </div>
          {entries.map((e) => (
            <div
              key={e.rank}
              className={`grid grid-cols-[3rem_1fr_auto_auto] gap-2 items-center px-4 py-3 border-b last:border-b-0 ${e.rank <= 3 ? 'bg-primary/5' : ''}`}
            >
              <div className="flex justify-center">{getRankIcon(e.rank)}</div>
              <span className="font-medium text-sm">{e.username_anon}</span>
              <LevelBadge level={e.level} />
              <span className="text-sm font-semibold text-right tabular-nums">{e.xp_total.toLocaleString()} XP</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
