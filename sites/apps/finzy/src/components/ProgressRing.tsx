import { cn } from '@/lib/utils';

interface ProgressRingProps {
  value: number;
  max?: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
  children?: React.ReactNode;
}

function getColor(pct: number): string {
  if (pct < 40) return 'stroke-destructive';
  if (pct < 65) return 'stroke-warning';
  return 'stroke-success';
}

export function ProgressRing({ value, max = 100, size = 120, strokeWidth = 8, className, children }: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.min(100, (value / max) * 100);
  const offset = circumference - (pct / 100) * circumference;

  return (
    <div className={cn('relative inline-flex items-center justify-center', className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" className="stroke-muted" strokeWidth={strokeWidth} />
        <circle
          cx={size / 2} cy={size / 2} r={radius} fill="none"
          className={cn(getColor(pct), 'transition-all duration-1000')}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {children ?? <span className="text-2xl font-bold">{Math.round(value)}</span>}
      </div>
    </div>
  );
}
