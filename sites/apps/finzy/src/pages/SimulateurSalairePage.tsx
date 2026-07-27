import { useState, useMemo } from 'react';
import { MetricCard } from '@/components/MetricCard';
import { formatAmount } from '@/lib/formatCurrency';
import { useSimulatorTrack } from '@/hooks/useSimulatorTrack';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { ArrowDown, Wallet, TrendingDown, Percent, Building } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import type { Currency } from '@/types';

// FR: Cotisations salariales approximatives
function calcFR(brutAnnuel: number, cadre: boolean) {
  const tauxSalariales = cadre ? 0.25 : 0.23;
  const cotisations = brutAnnuel * tauxSalariales;
  const netAvantIR = brutAnnuel - cotisations;
  // IR simplifié barème 2026
  const tranches = [
    { max: 11294, taux: 0 },
    { max: 28797, taux: 0.11 },
    { max: 82341, taux: 0.30 },
    { max: 177106, taux: 0.41 },
    { max: Infinity, taux: 0.45 },
  ];
  let ir = 0;
  let prev = 0;
  for (const t of tranches) {
    const slice = Math.min(netAvantIR, t.max) - prev;
    if (slice > 0) ir += slice * t.taux;
    prev = t.max;
    if (prev >= netAvantIR) break;
  }
  const netApresIR = netAvantIR - ir;
  const chargesPatronales = brutAnnuel * (cadre ? 0.45 : 0.42);
  const coutTotal = brutAnnuel + chargesPatronales;
  return { cotisations, netAvantIR, ir, netApresIR, chargesPatronales, coutTotal };
}

// CH: Cotisations AVS/AI/APG/AC + LPP approximatif
function calcCH(brutAnnuel: number, canton: string) {
  const avs = brutAnnuel * 0.053; // AVS/AI/APG 5.3%
  const ac = Math.min(brutAnnuel, 148200) * 0.011; // AC 1.1%
  const lpp = brutAnnuel > 22050 ? Math.min(brutAnnuel - 22050, 62475) * 0.07 : 0; // ~7% LPP
  const cotisations = avs + ac + lpp;
  const netAvantImpot = brutAnnuel - cotisations;
  // Taux effectif simplifié par canton
  const tauxCanton: Record<string, number> = {
    ZH: 0.10, BE: 0.12, VD: 0.13, GE: 0.14, LU: 0.08, AG: 0.10, SG: 0.10, ZG: 0.06, VS: 0.11, TI: 0.12, FR: 0.11, NE: 0.13, BS: 0.12,
  };
  const taux = tauxCanton[canton] ?? 0.11;
  const impot = netAvantImpot * taux;
  const netApresImpot = netAvantImpot - impot;
  const chargesPatronales = avs + ac + lpp; // Roughly same
  const coutTotal = brutAnnuel + chargesPatronales;
  return { cotisations, netAvantIR: netAvantImpot, ir: impot, netApresIR: netApresImpot, chargesPatronales, coutTotal };
}

const cantons = ['ZH', 'BE', 'VD', 'GE', 'LU', 'AG', 'SG', 'ZG', 'VS', 'TI', 'FR', 'NE', 'BS'];

export default function SimulateurSalairePage() {
  useSimulatorTrack('salaire');
  const { profile } = useAuth();
  const market = profile?.market ?? 'FR';
  const currency = (profile?.currency ?? 'EUR') as Currency;

  const [brutMensuel, setBrutMensuel] = useState(market === 'CH' ? 6500 : 3500);
  const [cadre, setCadre] = useState(false);
  const [canton, setCanton] = useState('VD');

  const brutAnnuel = brutMensuel * (market === 'CH' ? 13 : 12);
  const result = useMemo(() => market === 'CH' ? calcCH(brutAnnuel, canton) : calcFR(brutAnnuel, cadre), [brutAnnuel, market, cadre, canton]);

  const chartData = [
    { name: 'Brut', value: Math.round(brutAnnuel) },
    { name: 'Cotisations', value: Math.round(result.cotisations) },
    { name: 'Net avant impôt', value: Math.round(result.netAvantIR) },
    { name: 'Impôt', value: Math.round(result.ir) },
    { name: 'Net après impôt', value: Math.round(result.netApresIR) },
  ];

  const monthlyChart = [
    { name: 'Brut', montant: Math.round(brutMensuel) },
    { name: 'Net', montant: Math.round(result.netApresIR / (market === 'CH' ? 13 : 12)) },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold">Simulateur Salaire Brut / Net</h1>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4 rounded-xl border bg-card p-6">
          <h2 className="font-semibold">Paramètres</h2>
          <div>
            <Label>Salaire brut mensuel ({currency})</Label>
            <Input type="number" value={brutMensuel} onChange={e => setBrutMensuel(Number(e.target.value))} className="mt-1" />
          </div>
          {market === 'FR' ? (
            <div>
              <Label>Statut</Label>
              <Select value={cadre ? 'cadre' : 'non-cadre'} onValueChange={v => setCadre(v === 'cadre')}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="non-cadre">Non-cadre</SelectItem>
                  <SelectItem value="cadre">Cadre</SelectItem>
                </SelectContent>
              </Select>
            </div>
          ) : (
            <div>
              <Label>Canton</Label>
              <Select value={canton} onValueChange={setCanton}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>{cantons.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          )}

          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between rounded-lg bg-muted p-3">
              <span className="text-sm">Brut annuel</span>
              <span className="font-semibold">{formatAmount(brutAnnuel, currency)}</span>
            </div>
            <div className="flex items-center justify-center"><ArrowDown className="h-4 w-4 text-muted-foreground" /></div>
            <div className="flex items-center justify-between rounded-lg bg-muted p-3">
              <span className="text-sm">Cotisations salariales</span>
              <span className="font-semibold text-destructive">-{formatAmount(result.cotisations, currency)}</span>
            </div>
            <div className="flex items-center justify-center"><ArrowDown className="h-4 w-4 text-muted-foreground" /></div>
            <div className="flex items-center justify-between rounded-lg bg-muted p-3">
              <span className="text-sm">Net avant impôt</span>
              <span className="font-semibold">{formatAmount(result.netAvantIR, currency)}</span>
            </div>
            <div className="flex items-center justify-center"><ArrowDown className="h-4 w-4 text-muted-foreground" /></div>
            <div className="flex items-center justify-between rounded-lg bg-muted p-3">
              <span className="text-sm">Impôt sur le revenu</span>
              <span className="font-semibold text-destructive">-{formatAmount(result.ir, currency)}</span>
            </div>
            <div className="flex items-center justify-center"><ArrowDown className="h-4 w-4 text-muted-foreground" /></div>
            <div className="flex items-center justify-between rounded-lg bg-primary/10 border-primary/30 border p-3">
              <span className="text-sm font-semibold">Net après impôt</span>
              <span className="font-bold text-primary">{formatAmount(result.netApresIR, currency)}</span>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <MetricCard icon={<Wallet className="h-4 w-4" />} title="Net mensuel" value={formatAmount(result.netApresIR / (market === 'CH' ? 13 : 12), currency)} />
            <MetricCard icon={<TrendingDown className="h-4 w-4" />} title="Cotisations/an" value={formatAmount(result.cotisations, currency)} />
            <MetricCard icon={<Percent className="h-4 w-4" />} title="Taux prélèvement" value={`${Math.round(((brutAnnuel - result.netApresIR) / brutAnnuel) * 100)}%`} />
            <MetricCard icon={<Building className="h-4 w-4" />} title="Coût employeur" value={formatAmount(result.coutTotal, currency)} />
          </div>

          <div className="rounded-xl border bg-card p-5">
            <h3 className="mb-4 font-semibold">Décomposition annuelle</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v: number) => formatAmount(v, currency)} />
                <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Montant" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <p className="text-xs text-muted-foreground">⚠️ Estimation indicative. Les montants réels dépendent de votre situation personnelle, convention collective et réglementations en vigueur.</p>
        </div>
      </div>
    </div>
  );
}
