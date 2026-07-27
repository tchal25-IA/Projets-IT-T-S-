import { cn } from '@/lib/utils';

interface XPBarProps {
  currentXP: number;
  level: number;
  className?: string;
}

const XP_PER_LEVEL = 500;

export function getXPForLevel(level: number) {
  return level * XP_PER_LEVEL;
}

export function getLevelTitle(level: number): string {
  if (level >= 20) return 'Maître';
  if (level >= 15) return 'Expert';
  if (level >= 10) return 'Avancé';
  if (level >= 5) return 'Intermédiaire';
  return 'Débutant';
}

export function XPBar({ currentXP, level, className }: XPBarProps) {
  const xpForCurrentLevel = getXPForLevel(level - 1);
  const xpForNextLevel = getXPForLevel(level);
  const xpInLevel = Math.max(0, currentXP - xpForCurrentLevel);
  const xpNeeded = xpForNextLevel - xpForCurrentLevel;
  const progress = Math.min(100, Math.max(0, (xpInLevel / xpNeeded) * 100));

  return (
    <div className={cn('flex items-center gap-3', className)}>
      <span className="text-xs font-bold text-primary">Niv. {level}</span>
      <div className="relative h-2 flex-1 rounded-full bg-muted overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-primary transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>
      <span className="text-xs text-muted-foreground">{xpInLevel}/{xpNeeded} XP</span>
    </div>
  );
}
