import { Target } from 'lucide-react';

const CURRENT_CHALLENGE = {
  title: 'Challenge du mois',
  emoji: '🎯',
  goal: 'Épargner 200€ ce mois',
  xp: 50,
};

export function ChallengeDuMois() {
  return (
    <div className="rounded-xl border border-primary/30 bg-primary/5 p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20 text-xl">
          {CURRENT_CHALLENGE.emoji}
        </div>
        <div>
          <h3 className="font-semibold text-sm flex items-center gap-1">
            <Target className="h-4 w-4" />
            {CURRENT_CHALLENGE.title}
          </h3>
          <p className="text-sm text-muted-foreground mt-0.5">{CURRENT_CHALLENGE.goal}</p>
          <p className="text-xs text-primary font-medium mt-1">+{CURRENT_CHALLENGE.xp} XP à gagner</p>
        </div>
      </div>
    </div>
  );
}
