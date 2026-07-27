import { ArrowLeft, ExternalLink, Info } from 'lucide-react';
import { useSimulatorTrack } from '@/hooks/useSimulatorTrack';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { FinancialDisclaimer } from '@/components/FinancialDisclaimer';
import { CANTONAL_RATES } from '@/lib/taxCalculations';

const cantonNames: Record<string, string> = {
  ZG: 'Zoug', SZ: 'Schwyz', NW: 'Nidwald', UR: 'Uri', OW: 'Obwald', GL: 'Glaris', AI: 'Appenzell RI',
  TG: 'Thurgovie', LU: 'Lucerne', SO: 'Soleure', AG: 'Argovie', SG: 'St-Gall', AR: 'Appenzell RE',
  SH: 'Schaffhouse', GR: 'Grisons', BL: 'Bâle-Campagne', FR: 'Fribourg', BE: 'Berne', NE: 'Neuchâtel',
  VS: 'Valais', TI: 'Tessin', JU: 'Jura', BS: 'Bâle-Ville', VD: 'Vaud', ZH: 'Zurich', GE: 'Genève',
};

export default function SimulateurImpotCHPage() {
  useSimulatorTrack('impot-suisse');
  const sortedCantons = Object.entries(CANTONAL_RATES).sort((a, b) => a[1] - b[1]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <Link to="/simulateurs"><Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button></Link>
        <h1 className="text-2xl font-bold">Impôt Suisse 🇨🇭</h1>
      </div>

      <div className="rounded-xl border bg-card p-6 space-y-4">
        <div className="flex items-start gap-3">
          <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold">Le système fiscal suisse en bref</h3>
            <p className="text-sm text-muted-foreground mt-1">En Suisse, l'imposition s'effectue sur <strong>3 niveaux</strong> : fédéral, cantonal et communal. Le taux total varie considérablement d'un canton à l'autre.</p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg border p-4">
            <p className="text-xs text-muted-foreground">🏛️ Impôt fédéral (IFD)</p>
            <p className="font-semibold mt-1">Barème progressif</p>
            <p className="text-xs text-muted-foreground">Jusqu'à 11.5% max</p>
          </div>
          <div className="rounded-lg border p-4">
            <p className="text-xs text-muted-foreground">🏔️ Impôt cantonal (ICC)</p>
            <p className="font-semibold mt-1">Très variable</p>
            <p className="text-xs text-muted-foreground">22% (Zoug) → 45% (Genève)</p>
          </div>
          <div className="rounded-lg border p-4">
            <p className="text-xs text-muted-foreground">🏘️ Impôt communal</p>
            <p className="font-semibold mt-1">Multiplicateur</p>
            <p className="text-xs text-muted-foreground">% de l'impôt cantonal</p>
          </div>
        </div>

        <div className="rounded-lg border p-4 bg-muted/30">
          <p className="text-xs font-medium mb-1">💎 Spécificité suisse : Impôt sur la fortune</p>
          <p className="text-xs text-muted-foreground">Contrairement à la France, la Suisse impose la fortune nette (mobilière + immobilière). Les taux varient par canton.</p>
        </div>
      </div>

      <div className="rounded-xl border bg-card p-6">
        <h3 className="font-semibold mb-4">Taux marginaux indicatifs par canton</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
          {sortedCantons.map(([code, rate]) => (
            <div key={code} className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm">
              <span>{cantonNames[code] ?? code}</span>
              <span className="font-semibold text-primary">~{Math.round(rate * 100)}%</span>
            </div>
          ))}
        </div>
      </div>

      <a href="https://swisstaxcalculator.estv.admin.ch/#/calculator/income-wealth-tax" target="_blank" rel="noopener noreferrer">
        <Button className="w-full gap-2 text-base py-6">
          Calculer mon impôt sur swisstaxcalculator.estv.admin.ch <ExternalLink className="h-5 w-5" />
        </Button>
      </a>

      <FinancialDisclaimer />
    </div>
  );
}
