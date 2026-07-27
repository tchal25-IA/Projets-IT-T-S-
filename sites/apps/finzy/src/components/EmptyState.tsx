import { cn } from '@/lib/utils';

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  emoji?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ title, description, icon, emoji, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-4 py-12 px-4 text-center rounded-xl border border-dashed bg-muted/30',
        className
      )}
    >
      <div
        className={cn(
          'flex items-center justify-center w-20 h-20 rounded-2xl bg-muted',
          !icon && !emoji && 'opacity-60'
        )}
      >
        {emoji ? (
          <span className="text-4xl" role="img" aria-hidden>
            {emoji}
          </span>
        ) : (
          icon
        )}
      </div>
      <div className="max-w-sm">
        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
      {action}
    </div>
  );
}
