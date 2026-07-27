import { type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Lock, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePlan } from '@/hooks/usePlan';

interface PremiumGateProps {
  children?: ReactNode;
  feature?: string;
  /** Si true, affiche un bandeau discret en overlay plutôt qu'un remplacement complet */
  overlay?: boolean;
}

export function PremiumGate({ children, feature, overlay = false }: PremiumGateProps) {
  const { isPremium } = usePlan();

  if (isPremium) return <>{children}</>;

  if (overlay) {
    return (
      <div className="relative">
        <div className="pointer-events-none select-none blur-sm opacity-50">{children}</div>
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-xl bg-background/80 backdrop-blur-sm">
          <Lock className="h-8 w-8 text-premium" />
          <p className="text-sm font-medium text-center px-4">
            {feature ? `${feature} est réservé aux membres Premium.` : 'Fonctionnalité Premium.'}
          </p>
          <Button asChild size="sm" className="bg-premium text-premium-foreground hover:bg-premium/90">
            <Link to="/premium">
              <Sparkles className="mr-2 h-4 w-4" />
              Passer Premium
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center gap-6 py-20 px-4 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-premium/10">
        <Lock className="h-10 w-10 text-premium" />
      </div>
      <div className="space-y-2">
        <h2 className="text-xl font-bold">Fonctionnalité Premium</h2>
        <p className="text-muted-foreground text-sm max-w-xs">
          {feature
            ? `${feature} est disponible avec l'abonnement Finzy Premium.`
            : "Cette fonctionnalité est disponible avec l'abonnement Finzy Premium."}
        </p>
      </div>
      <div className="flex flex-col items-center gap-3">
        <Button asChild size="lg" className="bg-premium text-premium-foreground hover:bg-premium/90 gap-2">
          <Link to="/premium">
            <Sparkles className="h-4 w-4" />
            Découvrir Finzy Premium
          </Link>
        </Button>
        <p className="text-xs text-muted-foreground">À partir de 6,99€/mois — Annulable à tout moment</p>
      </div>
    </div>
  );
}
