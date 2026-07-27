import { SEO } from '@/components/SEO';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PremiumGate } from '@/components/PremiumGate';
import { usePlan } from '@/hooks/usePlan';

const QUITTANCES_APP_URL = import.meta.env.VITE_QUITTANCES_APP_URL || 'https://investlocatif.lovable.app/';

export default function QuittancesModulePage() {
  const { isPremium } = usePlan();
  if (!isPremium) return <PremiumGate feature="FinzyImmo — Gestion des quittances de loyer" />;
  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] -m-4 md:-m-6">
      <SEO
        title="Gestion des quittances"
        description="Génère et gère les quittances de loyer pour tes biens locatifs."
        path="/investissements/immobilier/quittances"
      />
      <div className="flex items-center justify-between px-4 py-3 border-b bg-background shrink-0 gap-2">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/investissements/immobilier">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-lg font-semibold">Gestion des quittances</h1>
        </div>
        <a href={QUITTANCES_APP_URL} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline flex items-center gap-1">
          <ExternalLink className="h-3.5 w-3.5" /> Ouvrir en plein écran (export PDF)
        </a>
      </div>
      <div className="flex-1 min-h-0">
        <iframe
          src={QUITTANCES_APP_URL}
          title="Gestion des quittances"
          className="w-full h-full border-0 rounded-none"
          sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox"
          allow="clipboard-write"
        />
      </div>
    </div>
  );
}
