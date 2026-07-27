import { PremiumGate } from '@/components/PremiumGate';
import { usePlan } from '@/hooks/usePlan';
import { useState } from 'react';
import { useSimulatorTrack } from '@/hooks/useSimulatorTrack';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { SaveSimulationButton } from '@/components/SaveSimulationButton';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { formatAmount } from '@/lib/formatCurrency';
import { frIncomeTax } from '@/lib/taxCalculations';
import { FinancialDisclaimer } from '@/components/FinancialDisclaimer';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';

const brackets = [
  { label: '0%', limit: 11497, rate: 0 },
  { label: '11%', limit: 29315, rate: 0.11 },
  { label: '30%', limit: 83823, rate: 0.30 },
  { label: '41%', limit: 180294, rate: 0.41 },
  { label: '45%', limit: Infinity, rate: 0.45 },
];
const barColors = ['#059669', '#1D4ED8', '#D97706', '#DC2626', '#7C3AED'];

export default function SimulateurIRPage() {
  useSimulatorTrack('impot-revenu');
  const { isPremium } = usePlan();
  if (!isPremium) return <PremiumGate feature="Simulateur Impôt sur le Revenu" />;
  const { user } = useAuth();
  const [income, setIncome] = useState(35000);
  const [parts, setParts] = useState(1);
  const [deductions, setDeductions] = useState(0);
  const [useFraisReels, setUseFraisReels] = useState(false);

  const actualDeductions = useFraisReels ? deductions : Math.round(income * 0.10);
  const { tmi, tax, effectiveRate } = frIncomeTax(income, parts, actualDeductions);

  // Bar chart: tax per bracket
  const taxableIncome = Math.max(0, income - actualDeductions);
  const perPart = taxableIncome / parts;
  const chartData: { name: string; montant: number }[] = [];
  let prev = 0;
  for (const b of brackets) {
    if (perPart <= prev) { chartData.push({ name: b.label, montant: 0 }); }
    else {
      const taxable = Math.min(perPart, b.limit) - prev;
      chartData.push({ name: b.label, montant: Math.round(taxable * b.rate * parts) });
    }
    prev = b.limit;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <Link to="/simulateurs"><Button variant="ghost" size="icon" aria-label="Retour simulateurs"><ArrowLeft className="h-4 w-4" /></Button></Link>
          <h1 className="text-2xl font-bold">Impôt sur le Revenu 🇫🇷</h1>
        </div>
        {user && (
          <SaveSimulationButton
            simulator_type="impot-revenu"
            label={`IR ${formatAmount(income, 'EUR')} • ${parts} part(s)`}
            params_json={{ income, parts, actualDeductions }}
            result_json={{ tax, tmi, effectiveRate }}
          />
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-5 rounded-xl border bg-card p-6">
          <div>
            <Label>Revenu net imposable : {formatAmount(income, 'EUR')}</Label>
            <Slider value={[income]} onValueChange={v => setIncome(v[0])} min={0} max={200000} step={500} className="mt-2" />
          </div>
          <div>
            <Label>Nombre de parts : {parts}</Label>
            <Slider value={[parts * 2]} onValueChange={v => setParts(v[0] / 2)} min={1} max={8} step={1} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">Célibataire = 1, Couple = 2, +0.5 par enfant</p>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" checked={useFraisReels} onChange={e => setUseFraisReels(e.target.checked)} className="accent-primary" />
            <Label className="cursor-pointer" onClick={() => setUseFraisReels(!useFraisReels)}>Frais réels (sinon abattement 10%)</Label>
          </div>
          {useFraisReels && (
            <div>
              <Label>Frais réels (€)</Label>
              <Input type="number" value={deductions} onChange={e => setDeductions(Number(e.target.value))} min={0} className="mt-1" />
            </div>
          )}
          <div className="text-xs text-muted-foreground">
            Déduction appliquée : {formatAmount(actualDeductions, 'EUR')}
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border bg-card p-5 text-center">
            <p className="text-xs text-muted-foreground">Impôt estimé</p>
            <p className="text-3xl font-bold text-primary">{formatAmount(tax, 'EUR')}</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border bg-card p-4 text-center">
              <p className="text-xs text-muted-foreground">TMI</p>
              <p className="text-lg font-semibold">{tmi}%</p>
            </div>
            <div className="rounded-xl border bg-card p-4 text-center">
              <p className="text-xs text-muted-foreground">Taux effectif</p>
              <p className="text-lg font-semibold">{effectiveRate}%</p>
            </div>
          </div>
          <a href="https://simulateur-ir-ifi.impots.gouv.fr/calcul_impot/2026/" target="_blank" rel="noopener noreferrer">
            <Button variant="outline" className="w-full gap-2">
              Calculer sur impots.gouv.fr <ExternalLink className="h-4 w-4" />
            </Button>
          </a>
        </div>
      </div>

      <div className="rounded-xl border bg-card p-6">
        <h3 className="mb-4 font-semibold">Décomposition par tranche (barème 2026)</h3>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip formatter={(v: number) => formatAmount(v, 'EUR')} />
            <Bar dataKey="montant" name="Impôt" radius={[4, 4, 0, 0]}>
              {chartData.map((_, i) => <Cell key={i} fill={barColors[i]} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div className="mt-4 text-xs text-muted-foreground space-y-1">
          <p>0% : jusqu'à 11 497 € | 11% : 11 497–29 315 € | 30% : 29 315–83 823 €</p>
          <p>41% : 83 823–180 294 € | 45% : au-delà de 180 294 €</p>
        </div>
      </div>

      <FinancialDisclaimer />
    </div>
  );
}
