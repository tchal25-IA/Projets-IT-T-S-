import { Link } from 'react-router-dom';
import { SEO } from '@/components/SEO';
import { Card, CardContent } from '@/components/ui/card';
import { Calculator, FileText, ExternalLink } from 'lucide-react';

export default function InvestissementsLocatifPage() {
  return (
    <div className="space-y-8 pb-12">
      <SEO title="Immobilier locatif" description="Simulateur cashflow et gestion des quittances." path="/investissements/immobilier" />
      <div>
        <h1 className="text-2xl font-bold">Immobilier locatif</h1>
        <p className="text-muted-foreground text-sm mt-1">Cashflow et quittances pour tes biens locatifs</p>
      </div>

      <section>
        <Link to="/investissements/immobilier/cashflow">
          <Card className="h-full transition-all hover:border-primary/50 hover:shadow-lg group">
            <CardContent className="flex flex-col p-6">
              <div className="rounded-xl bg-primary/10 p-3 w-fit mb-4">
                <Calculator className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-lg font-semibold">Simulateur cashflow locatif</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Calcule la rentabilité réelle d&apos;un bien locatif : loyers, charges, crédit, fiscalité et cashflow net.
              </p>
              <span className="inline-flex items-center gap-1.5 mt-4 text-sm font-medium text-primary group-hover:gap-2 transition-all">
                Ouvrir le simulateur <ExternalLink className="h-3.5 w-3.5" />
              </span>
            </CardContent>
          </Card>
        </Link>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-3">Gestion des quittances</h2>
        <Link to="/investissements/immobilier/quittances">
          <Card className="h-full transition-all hover:border-primary/50 hover:shadow-lg group">
            <CardContent className="flex flex-col p-6">
              <div className="rounded-xl bg-amber-500/10 p-3 w-fit mb-4">
                <FileText className="h-8 w-8 text-amber-600" />
              </div>
              <h3 className="text-base font-semibold">Gestion des quittances</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Génère et gère les quittances de loyer pour tes biens locatifs.
              </p>
              <span className="inline-flex items-center gap-1.5 mt-4 text-sm font-medium text-primary group-hover:gap-2 transition-all">
                Ouvrir le module <ExternalLink className="h-3.5 w-3.5" />
              </span>
            </CardContent>
          </Card>
        </Link>
      </section>
    </div>
  );
}
