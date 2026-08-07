import { FF } from "@/lib/ff-colors";

export function Skeleton({ className = "", style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <div
      className={`animate-pulse rounded-lg ${className}`}
      style={{ background: FF.surface2, ...style }}
      aria-hidden
    />
  );
}

export function PageSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-3 py-2" role="status" aria-label="Chargement">
      <Skeleton className="h-3 w-24" />
      <Skeleton className="h-7 w-48" />
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-20 w-full rounded-2xl" />
      ))}
    </div>
  );
}

export function CardSkeleton() {
  return <Skeleton className="h-24 w-full rounded-2xl" />;
}

export function ListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="h-14 w-full rounded-xl" />
      ))}
    </div>
  );
}
