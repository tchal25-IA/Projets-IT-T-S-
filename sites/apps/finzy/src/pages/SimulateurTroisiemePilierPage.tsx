import { useState } from 'react';
import { useSimulatorTrack } from '@/hooks/useSimulatorTrack';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatAmount } from '@/lib/formatCurrency';
import { chThirdPillarTaxSaving, CANTONAL_RATES } from '@/lib/taxCalculations';
import { FinancialDisclaimer } from '@/components/FinancialDisclaimer';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LineChart, Line } from 'recharts';

const cantonNames: Record<string, string> = {
  ZG: 'Zoug', SZ: 'Schwyz', NW: 'Nidwald', UR: 'Uri', OW: 'Obwald', GL: 'Glaris', AI: 'Appenzell RI',
  TG: 'Thurgovie', LU: 'Lucerne', SO: 'Soleure', AG: 'Argovie', SG: 'St-Gall', AR: 'Appenzell RE',
  SH: 'Schaffhouse', GR: 'Grisons', BL: 'Bâle-Campagne', FR: 'Fribourg', BE: 'Berne', NE: 'Neuchâtel',
  VS: 'Valais', TI: 'Tessin', JU: 'Jura', BS: 'Bâle-Ville', VD: 'Vaud', ZH: 'Zurich', GE: 'Genève',
};

export default function SimulateurTroisiemePilierPage() {
  useSimulatorTrack('troisieme-pilier');
  const [versement, setVersement] = useState(7258);
  const [canton, setCanton] = useState('ZH');
  const [revenu, setRevenu] = useState(80000);
  const [horizon, setHorizon] = useState(20);

  const economie = chThirdPillarTaxSaving(versement, canton, revenu);
  const rate = CANTONAL_RATES[canton] ?? 0.35;

  // Projection chart: with vs without 3a
  const projData: { year: number; avec3a: number; sans3a: number }[] = [];
  let cumul3a = 0;
  let cumulSans = 0;
  const rendement3a = 0.015;
  for (let y = 0; y <= horizon; y++) {
    projData.push({ year: y, avec3a: Math.round(cumul3a + economie * y), sans3a: Math.round(cumulSans) });
    cumul3a = (cumul3a + versement) * (1 + rendement3a);
    cumulSans += versement;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <Link to="/simulateurs"><Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button></Link>
        <h1 className="text-2xl font-bold">3ème Pilier A 🇨🇭</h1>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-5 rounded-xl border bg-card p-6">
          <div>
            <Label>Versement annuel : {formatAmount(versement, 'CHF')}</Label>
            <Slider value={[versement]} onValueChange={v => setVersement(v[0])} min={0} max={7258} step={100} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">Max 2025 : 7 258 CHF (salarié) / 36 288 CHF (indépendant)</p>
          </div>
          <div>
            <Label>Canton de domicile</Label>
            <Select value={canton} onValueChange={setCanton}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(cantonNames).sort((a, b) => a[1].localeCompare(b[1])).map(([code, name]) => (
                  <SelectItem key={code} value={code}>{name} (~{Math.round((CANTONAL_RATES[code] ?? 0.35) * 100)}%)</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Revenu brut : {formatAmount(revenu, 'CHF')}</Label>
            <Slider value={[revenu]} onValueChange={v => setRevenu(v[0])} min={30000} max={300000} step={5000} className="mt-2" />
          </div>
          <div>
            <Label>Horizon : {horizon} ans</Label>
            <Slider value={[horizon]} onValueChange={v => setHorizon(v[0])} min={1} max={40} step={1} className="mt-2" />
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border bg-card p-5 text-center">
            <p className="text-xs text-muted-foreground">Économie fiscale annuelle</p>
            <p className="text-3xl font-bold text-primary">{formatAmount(economie, 'CHF')}</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border bg-card p-4 text-center">
              <p className="text-xs text-muted-foreground">Taux marginal {cantonNames[canton]}</p>
              <p className="text-lg font-semibold">~{Math.round(rate * 100)}%</p>
            </div>
            <div className="rounded-xl border bg-card p-4 text-center">
              <p className="text-xs text-muted-foreground">Économie sur {horizon} ans</p>
              <p className="text-lg font-semibold">{formatAmount(economie * horizon, 'CHF')}</p>
            </div>
          </div>
          <a href="https://www.ubs.com/ch/fr/services/pension/calculators/pillar-3a-save-taxes.html" target="_blank" rel="noopener noreferrer">
            <Button variant="outline" className="w-full gap-2">
              Calculer sur UBS.com <ExternalLink className="h-4 w-4" />
            </Button>
          </a>
        </div>
      </div>

      <div className="rounded-xl border bg-card p-6">
        <h3 className="mb-4 font-semibold">Capital accumulé : avec 3a vs sans</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={projData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey="year" tick={{ fontSize: 12 }} label={{ value: 'Années', position: 'insideBottom', offset: -5 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip formatter={(v: number) => formatAmount(v, 'CHF')} />
            <Line type="monotone" dataKey="avec3a" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} name="Avec 3a + économie" />
            <Line type="monotone" dataKey="sans3a" stroke="hsl(var(--muted-foreground))" strokeWidth={2} dot={false} strokeDasharray="5 5" name="Sans 3a" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <FinancialDisclaimer />
    </div>
  );
}
