import { cn } from '@/lib/utils';

interface LevelBadgeProps {
  level: number;
  title?: string;
  className?: string;
}

function getBadgeColor(level: number): string {
  if (level >= 20) return 'bg-premium text-premium-foreground';
  if (level >= 15) return 'bg-warning text-warning-foreground';
  if (level >= 10) return 'bg-primary text-primary-foreground';
  if (level >= 5) return 'bg-success text-success-foreground';
  return 'bg-muted text-muted-foreground';
}

export function LevelBadge({ level, title, className }: LevelBadgeProps) {
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold', getBadgeColor(level), className)}>
      Niv. {level}{title && ` · ${title}`}
    </span>
  );
}
