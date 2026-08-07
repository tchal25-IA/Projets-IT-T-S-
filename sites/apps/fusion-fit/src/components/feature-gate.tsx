import { Link } from "@tanstack/react-router";
import { Lock, Sparkles } from "lucide-react";
import { FF } from "@/lib/ff-colors";
import { canAccessFeature, upgradeHint, type FeatureKey } from "@/lib/plan-gates";
import { useMyAbonnement } from "@/hooks/use-creneaux";
import { Skeleton } from "@/components/ui-skeleton";

export function FeatureGate({
  feature,
  children,
  fallback,
}: {
  feature: FeatureKey;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  const { data: abo, isLoading } = useMyAbonnement();
  if (isLoading) return <Skeleton className="h-24 w-full rounded-2xl" />;

  const allowed = canAccessFeature(feature, abo?.plan, abo?.statut);
  if (allowed) return <>{children}</>;

  if (fallback) return <>{fallback}</>;

  return (
    <div
      className="rounded-2xl border p-4 space-y-2"
      style={{ background: FF.surface, borderColor: FF.border }}
    >
      <div className="flex items-center gap-2">
        <Lock className="h-4 w-4" style={{ color: FF.amber }} />
        <p className="text-xs font-mono uppercase tracking-wider" style={{ color: FF.amber }}>
          Feature premium
        </p>
      </div>
      <p className="text-sm" style={{ color: FF.text }}>
        {upgradeHint(feature)}
      </p>
      <Link
        to="/fusionfit/abonnement"
        className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest"
        style={{ color: FF.cyan }}
      >
        <Sparkles className="h-3.5 w-3.5" />
        Voir les plans
      </Link>
    </div>
  );
}
