import { useState } from 'react';
import { useSimulatorTrack } from '@/hooks/useSimulatorTrack';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { formatAmount } from '@/lib/formatCurrency';
import { useAuth } from '@/contexts/AuthContext';
import { SaveSimulationButton } from '@/components/SaveSimulationButton';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import type { Currency } from '@/types';

export default function SimulateurEpargnePage() {
  useSimulatorTrack('epargne');
  const { profile } = useAuth();
  const currency = (profile?.currency ?? 'EUR') as Currency;

  const [initial, setInitial] = useState(5000);
  const [monthly, setMonthly] = useState(200);
  const [rate, setRate] = useState(5);
  const [duration, setDuration] = useState(20);

  const data = (() => {
    const points: { year: number; versements: number; interets: number; total: number }[] = [];
    let total = initial;
    let totalVersements = initial;
    const monthlyRate = rate / 100 / 12;
    for (let y = 1; y <= duration; y++) {
      for (let m = 0; m < 12; m++) {
        total = total * (1 + monthlyRate) + monthly;
        totalVersements += monthly;
      }
      points.push({ year: y, versements: Math.round(totalVersements), interets: Math.round(total - totalVersements), total: Math.round(total) });
    }
    return points;
  })();

  const finalData = data[data.length - 1] || { versements: initial, interets: 0, total: initial };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <Link to="/simulateurs"><Button variant="ghost" size="icon" aria-label="Retour simulateurs"><ArrowLeft className="h-4 w-4" /></Button></Link>
          <h1 className="text-2xl font-bold">Épargne composée</h1>
        </div>
        <SaveSimulationButton
          simulator_type="epargne"
          label={`Épargne ${initial}/${monthly}€ • ${rate}% • ${duration}ans`}
          params_json={{ initial, monthly, rate, duration }}
          result_json={{
            capital_final: finalData.total,
            versements: finalData.versements,
            interets: finalData.interets,
          }}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-5 rounded-xl border bg-card p-4 md:p-6">
          <div>
            <Label>Capital initial : {formatAmount(initial, currency)}</Label>
            <Slider value={[initial]} onValueChange={v => setInitial(v[0])} min={0} max={100000} step={500} className="mt-2" />
          </div>
          <div>
            <Label>Versement mensuel : {formatAmount(monthly, currency)}</Label>
            <Slider value={[monthly]} onValueChange={v => setMonthly(v[0])} min={0} max={5000} step={50} className="mt-2" />
          </div>
          <div>
            <Label>Rendement annuel : {rate}%</Label>
            <Slider value={[rate * 10]} onValueChange={v => setRate(v[0] / 10)} min={0} max={150} step={1} className="mt-2" />
          </div>
          <div>
            <Label>Durée : {duration} ans</Label>
            <Slider value={[duration]} onValueChange={v => setDuration(v[0])} min={1} max={40} step={1} className="mt-2" />
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="rounded-xl border bg-card p-4 text-center">
              <p className="text-xs text-muted-foreground">Capital final</p>
              <p className="text-xl font-bold text-primary">{formatAmount(finalData.total, currency)}</p>
            </div>
            <div className="rounded-xl border bg-card p-4 text-center">
              <p className="text-xs text-muted-foreground">Versements</p>
              <p className="text-lg font-semibold">{formatAmount(finalData.versements, currency)}</p>
            </div>
            <div className="rounded-xl border bg-card p-4 text-center">
              <p className="text-xs text-muted-foreground">Intérêts gagnés</p>
              <p className="text-lg font-semibold text-emerald-600">{formatAmount(finalData.interets, currency)}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border bg-card p-4 md:p-6 overflow-x-auto">
        <h3 className="mb-4 font-semibold">Évolution du capital</h3>
        <div className="w-full min-w-[280px]" style={{ minHeight: 250 }}>
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={data}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey="year" tick={{ fontSize: 12 }} label={{ value: 'Année', position: 'insideBottom', offset: -5 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip formatter={(v: number) => formatAmount(v, currency)} />
            <Area type="monotone" dataKey="versements" stackId="1" fill="hsl(var(--primary))" fillOpacity={0.3} stroke="hsl(var(--primary))" name="Versements" />
            <Area type="monotone" dataKey="interets" stackId="1" fill="hsl(var(--chart-2, 142 71% 45%))" fillOpacity={0.3} stroke="hsl(var(--chart-2, 142 71% 45%))" name="Intérêts" />
          </AreaChart>
        </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
