import { PremiumGate } from '@/components/PremiumGate';
import { usePlan } from '@/hooks/usePlan';
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { useSimulatorTrack } from '@/hooks/useSimulatorTrack';
import { ArrowLeft, AlertTriangle, Info } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatAmount } from '@/lib/formatCurrency';
import { useAuth } from '@/contexts/AuthContext';
import { compoundInterest } from '@/lib/savingsCalculations';
import { FinancialDisclaimer } from '@/components/FinancialDisclaimer';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import type { Currency } from '@/types';

interface InvestmentPreset {
  key: string;
  label: string;
  defaultRate: number;
  riskLevel: 'low' | 'medium' | 'high';
  description: string;
  perf: { '1a': number; '3a': number; '5a': number; '10a': number; '20a': number } | null;
}

const CUSTOM_KEY = 'custom';

const PRESETS: InvestmentPreset[] = [
  {
    key: 'livret-a',
    label: 'Livret A',
    defaultRate: 1.5,
    riskLevel: 'low',
    description: 'Placement réglementé garanti par l\'État français, exonéré d\'impôts. Capital 100 % garanti, liquidité totale.',
    perf: null,
  },
  {
    key: 'fond-euros',
    label: 'Fonds euros',
    defaultRate: 2.5,
    riskLevel: 'low',
    description: 'Support en assurance-vie à capital garanti. Composé principalement d\'obligations, il offre un rendement stable mais modéré.',
    perf: { '1a': 2.5, '3a': 2.0, '5a': 1.8, '10a': 2.0, '20a': 2.8 },
  },
  {
    key: 'etf-monde',
    label: 'ETF Monde (MSCI World)',
    defaultRate: 6.5,
    riskLevel: 'high',
    description: 'Réplique l\'indice MSCI World (~1 500 entreprises de 23 pays développés). Très diversifié géographiquement et sectoriellement.',
    perf: { '1a': 19.5, '3a': 9.2, '5a': 12.1, '10a': 10.8, '20a': 8.5 },
  },
  {
    key: 'etf-sp500',
    label: 'ETF S&P 500',
    defaultRate: 9,
    riskLevel: 'high',
    description: 'Réplique les 500 plus grandes capitalisations américaines. Très populaire, forte exposition au marché US et à la tech.',
    perf: { '1a': 23.3, '3a': 10.5, '5a': 14.5, '10a': 12.7, '20a': 9.8 },
  },
  {
    key: 'etf-nasdaq',
    label: 'ETF Nasdaq 100',
    defaultRate: 11,
    riskLevel: 'high',
    description: 'Réplique les 100 plus grandes valeurs technologiques du Nasdaq. Fort potentiel de croissance mais volatilité élevée.',
    perf: { '1a': 28.5, '3a': 12.1, '5a': 18.2, '10a': 16.5, '20a': 12.3 },
  },
  {
    key: 'etf-europe',
    label: 'ETF Europe (STOXX 600)',
    defaultRate: 6,
    riskLevel: 'high',
    description: 'Réplique les 600 plus grandes capitalisations européennes. Diversification sectorielle au sein de la zone euro et UK.',
    perf: { '1a': 12.1, '3a': 7.8, '5a': 7.2, '10a': 6.1, '20a': 5.5 },
  },
  {
    key: 'etf-emergents',
    label: 'ETF Marchés émergents',
    defaultRate: 8,
    riskLevel: 'high',
    description: 'Exposition aux marchés émergents (Chine, Inde, Brésil…). Fort potentiel mais risque géopolitique et volatilité accrue.',
    perf: { '1a': 6.2, '3a': -1.5, '5a': 2.8, '10a': 3.2, '20a': 5.8 },
  },
  {
    key: 'etf-or',
    label: 'ETF Or (Gold)',
    defaultRate: 5,
    riskLevel: 'medium',
    description: 'Réplique le cours de l\'or physique. Valeur refuge historique, décorrélé des marchés actions. Ne produit pas de revenus.',
    perf: { '1a': 13.1, '3a': 8.5, '5a': 9.2, '10a': 5.8, '20a': 7.2 },
  },
  {
    key: 'etf-obligataire',
    label: 'ETF Obligataire',
    defaultRate: 3,
    riskLevel: 'medium',
    description: 'Panier d\'obligations souveraines et corporate. Moins volatil que les actions, mais sensible aux variations de taux d\'intérêt.',
    perf: { '1a': 4.5, '3a': -0.8, '5a': 1.2, '10a': 2.1, '20a': 3.1 },
  },
  {
    key: CUSTOM_KEY,
    label: 'Rendement personnalisé',
    defaultRate: 5,
    riskLevel: 'medium',
    description: 'Saisissez votre propre taux de rendement annuel pour simuler un scénario sur mesure.',
    perf: null,
  },
];

const riskColors: Record<string, string> = {
  low: 'text-green-600 dark:text-green-400',
  medium: 'text-yellow-600 dark:text-yellow-400',
  high: 'text-red-500 dark:text-red-400',
};
const riskLabels: Record<string, string> = { low: 'Faible', medium: 'Modéré', high: 'Élevé' };

function PresetInfoCard({ preset }: { preset: InvestmentPreset }) {
  return (
    <div className="rounded-lg border bg-muted/40 p-4 space-y-3 text-sm">
      <div className="flex items-start gap-2">
        <Info className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
        <p className="text-muted-foreground">{preset.description}</p>
      </div>
      {preset.perf && (
        <div>
          <p className="font-medium mb-1">Performance annualisée historique :</p>
          <div className="grid grid-cols-5 gap-1 text-center text-xs">
            {(['1a', '3a', '5a', '10a', '20a'] as const).map(k => (
              <div key={k} className="rounded bg-background p-1.5">
                <span className="block text-muted-foreground">{k.replace('a', ' an' + (k === '1a' ? '' : 's'))}</span>
                <span className={`font-semibold ${preset.perf![k] >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}>
                  {preset.perf![k] > 0 ? '+' : ''}{preset.perf![k]}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
      <p className="text-xs flex items-start gap-1.5">
        <span>Risque :</span>
        <span className={`font-semibold ${riskColors[preset.riskLevel]}`}>{riskLabels[preset.riskLevel]}</span>
      </p>
    </div>
  );
}

export default function SimulateurComparateurPage() {
  useSimulatorTrack('comparateur');
  const { isPremium } = usePlan();
  if (!isPremium) return <PremiumGate feature="Comparateur de crédits" />;
  const { profile } = useAuth();
  const currency = (profile?.currency ?? 'EUR') as Currency;

  const [initial, setInitial] = useState(10000);
  const [monthly, setMonthly] = useState(200);
  const [years, setYears] = useState(15);
  const [keyA, setKeyA] = useState('livret-a');
  const [keyB, setKeyB] = useState('etf-monde');

  const [customRateA, setCustomRateA] = useState(5);
  const [customRateB, setCustomRateB] = useState(5);

  const presetA = PRESETS.find(p => p.key === keyA)!;
  const presetB = PRESETS.find(p => p.key === keyB)!;
  const rateA = keyA === CUSTOM_KEY ? customRateA : presetA.defaultRate;
  const rateB = keyB === CUSTOM_KEY ? customRateB : presetB.defaultRate;

  const labelA = keyA === CUSTOM_KEY ? `Personnalisé (${rateA}%)` : presetA.label;
  const labelB = keyB === CUSTOM_KEY ? `Personnalisé (${rateB}%)` : presetB.label;

  const data = Array.from({ length: years + 1 }, (_, y) => ({
    year: y,
    [labelA]: Math.round(compoundInterest(initial, monthly, rateA, y)),
    [labelB]: Math.round(compoundInterest(initial, monthly, rateB, y)),
  }));

  const finalA = Math.round(compoundInterest(initial, monthly, rateA, years));
  const finalB = Math.round(compoundInterest(initial, monthly, rateB, years));
  const totalDeposits = initial + monthly * 12 * years;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <Link to="/simulateurs"><Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button></Link>
        <h1 className="text-2xl font-bold">Comparateur</h1>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-5 rounded-xl border bg-card p-6">
          <div>
            <Label>Capital initial : {formatAmount(initial, currency)}</Label>
            <Slider value={[initial]} onValueChange={v => setInitial(v[0])} min={0} max={100000} step={1000} className="mt-2" />
          </div>
          <div>
            <Label>Versement mensuel : {formatAmount(monthly, currency)}</Label>
            <Slider value={[monthly]} onValueChange={v => setMonthly(v[0])} min={0} max={3000} step={50} className="mt-2" />
          </div>
          <div>
            <Label>Durée : {years} ans</Label>
            <Slider value={[years]} onValueChange={v => setYears(v[0])} min={1} max={40} step={1} className="mt-2" />
          </div>
          <hr className="border-border" />

          {/* Scénario A */}
          <div className="space-y-2">
            <Label>Scénario A</Label>
            <Select value={keyA} onValueChange={setKeyA}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {PRESETS.map(p => (
                  <SelectItem key={p.key} value={p.key}>{p.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {keyA === CUSTOM_KEY && (
              <div className="flex items-center gap-2">
                <Label className="shrink-0 text-xs">Taux (%)</Label>
                <Input type="number" min={0} max={30} step={0.1} value={customRateA} onChange={e => setCustomRateA(Number(e.target.value))} className="h-8" />
              </div>
            )}
            <PresetInfoCard preset={presetA} />
          </div>

          {/* Scénario B */}
          <div className="space-y-2">
            <Label>Scénario B</Label>
            <Select value={keyB} onValueChange={setKeyB}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {PRESETS.map(p => (
                  <SelectItem key={p.key} value={p.key}>{p.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {keyB === CUSTOM_KEY && (
              <div className="flex items-center gap-2">
                <Label className="shrink-0 text-xs">Taux (%)</Label>
                <Input type="number" min={0} max={30} step={0.1} value={customRateB} onChange={e => setCustomRateB(Number(e.target.value))} className="h-8" />
              </div>
            )}
            <PresetInfoCard preset={presetB} />
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border bg-card p-5 text-center">
              <p className="text-xs text-muted-foreground">{labelA} ({rateA}%)</p>
              <p className="text-2xl font-bold text-primary">{formatAmount(finalA, currency)}</p>
              <p className="text-xs text-muted-foreground">+{formatAmount(finalA - totalDeposits, currency)} d'intérêts</p>
            </div>
            <div className="rounded-xl border bg-card p-5 text-center">
              <p className="text-xs text-muted-foreground">{labelB} ({rateB}%)</p>
              <p className="text-2xl font-bold text-premium">{formatAmount(finalB, currency)}</p>
              <p className="text-xs text-muted-foreground">+{formatAmount(finalB - totalDeposits, currency)} d'intérêts</p>
            </div>
          </div>
          <div className="rounded-xl border bg-card p-4 text-center">
            <p className="text-xs text-muted-foreground">Écart après {years} ans</p>
            <p className="text-xl font-bold">{formatAmount(Math.abs(finalB - finalA), currency)}</p>
            <p className="text-xs text-muted-foreground">en faveur de {finalB > finalA ? labelB : labelA}</p>
          </div>

          {/* Risk warning */}
          <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/5 p-4 space-y-2">
            <div className="flex items-center gap-2 text-yellow-600 dark:text-yellow-400">
              <AlertTriangle className="h-4 w-4" />
              <span className="font-semibold text-sm">Avertissement</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Les performances passées ne préjugent pas des performances futures. Les marchés financiers comportent un risque de perte en capital. 
              Les rendements utilisés sont des moyennes historiques indicatives et ne garantissent aucun résultat futur. 
              La volatilité peut entraîner des variations importantes à court terme.
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-xl border bg-card p-6">
        <h3 className="mb-4 font-semibold">Évolution comparative</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey="year" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip formatter={(v: number) => formatAmount(v, currency)} />
            <Legend />
            <Line type="monotone" dataKey={labelA} stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey={labelB} stroke="hsl(var(--premium))" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <FinancialDisclaimer />
    </div>
  );
}
