import { useState } from 'react';
import { useSimulatorTrack } from '@/hooks/useSimulatorTrack';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatAmount } from '@/lib/formatCurrency';
import { FinancialDisclaimer } from '@/components/FinancialDisclaimer';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

export default function SimulateurFraisNotairePage() {
  useSimulatorTrack('frais-notaire');
  const [prix, setPrix] = useState(250000);
  const [type, setType] = useState<'ancien' | 'neuf'>('ancien');

  const droitsMutation = type === 'ancien' ? Math.round(prix * 0.0580) : Math.round(prix * 0.007);
  const emoluments = Math.round(prix * 0.008);
  const formalites = 1200;
  const total = droitsMutation + emoluments + formalites;
  const pctPrix = prix > 0 ? Math.round((total / prix) * 1000) / 10 : 0;

  const chartData = [
    { name: 'Droits de mutation', value: droitsMutation },
    { name: 'Émoluments notaire', value: emoluments },
    { name: 'Frais de formalités', value: formalites },
  ];
  const colors = ['#1D4ED8', '#059669', '#D97706'];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <Link to="/simulateurs"><Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button></Link>
        <h1 className="text-2xl font-bold">Frais de Notaire 🇫🇷</h1>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-5 rounded-xl border bg-card p-6">
          <div>
            <Label>Prix du bien : {formatAmount(prix, 'EUR')}</Label>
            <Slider value={[prix]} onValueChange={v => setPrix(v[0])} min={50000} max={1000000} step={5000} className="mt-2" />
          </div>
          <div>
            <Label>Type de bien</Label>
            <Select value={type} onValueChange={v => setType(v as 'ancien' | 'neuf')}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ancien">Ancien</SelectItem>
                <SelectItem value="neuf">Neuf (VEFA)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="text-xs text-muted-foreground space-y-1">
            <p>Droits de mutation : {type === 'ancien' ? '~5.80%' : '~0.70%'} du prix</p>
            <p>Émoluments : ~0.80% du prix</p>
            <p>Formalités : ~1 200 € forfaitaire</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border bg-card p-5 text-center">
            <p className="text-xs text-muted-foreground">Frais de notaire estimés</p>
            <p className="text-3xl font-bold text-primary">{formatAmount(total, 'EUR')}</p>
            <p className="text-xs text-muted-foreground mt-1">{pctPrix}% du prix</p>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {chartData.map((d, i) => (
              <div key={d.name} className="rounded-xl border bg-card p-3 text-center">
                <p className="text-[10px] text-muted-foreground">{d.name}</p>
                <p className="text-sm font-semibold" style={{ color: colors[i] }}>{formatAmount(d.value, 'EUR')}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-xl border bg-card p-6">
        <h3 className="mb-4 font-semibold">Répartition des frais</h3>
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <ResponsiveContainer width={200} height={200}>
            <PieChart>
              <Pie data={chartData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2}>
                {chartData.map((_, i) => <Cell key={i} fill={colors[i]} />)}
              </Pie>
              <Tooltip formatter={(v: number) => formatAmount(v, 'EUR')} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2">
            {chartData.map((d, i) => (
              <div key={d.name} className="flex items-center gap-2 text-sm">
                <span className="h-3 w-3 rounded-full" style={{ backgroundColor: colors[i] }} />
                {d.name}: {formatAmount(d.value, 'EUR')}
              </div>
            ))}
          </div>
        </div>
      </div>

      <FinancialDisclaimer />
    </div>
  );
}
