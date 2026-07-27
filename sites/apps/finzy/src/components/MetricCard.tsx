import { cn } from '@/lib/utils';

interface MetricCardProps {
  icon: React.ReactNode;
  title: string;
  value: string;
  variation?: number;
  trend?: string;
  className?: string;
}

export function MetricCard({ icon, title, value, variation, className }: MetricCardProps) {
  return (
    <div className={cn('rounded-xl border bg-card p-4 flex flex-col gap-2', className)}>
      <div className="flex items-center justify-between">
        <span className="text-muted-foreground">{icon}</span>
        {variation !== undefined && (
          <span className={cn('text-xs font-semibold', variation >= 0 ? 'text-success' : 'text-destructive')}>
            {variation >= 0 ? '+' : ''}{variation.toFixed(1)}%
          </span>
        )}
      </div>
      <p className="text-xs text-muted-foreground">{title}</p>
      <p className="text-xl font-bold tracking-tight">{value}</p>
    </div>
  );
}
