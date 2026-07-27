import { PremiumGate } from '@/components/PremiumGate';
import { usePlan } from '@/hooks/usePlan';
import { useState } from 'react';
import { useSimulatorTrack } from '@/hooks/useSimulatorTrack';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { formatAmount } from '@/lib/formatCurrency';
import { useAuth } from '@/contexts/AuthContext';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import type { Currency } from '@/types';

export default function SimulateurAmortissementPage() {
  useSimulatorTrack('amortissement');
  const { isPremium } = usePlan();
  if (!isPremium) return <PremiumGate feature="Tableau d'amortissement" />;
  const { profile } = useAuth();
  const currency = (profile?.currency ?? 'EUR') as Currency;

  const [amount, setAmount] = useState(200000);
  const [rate, setRate] = useState(3.5);
  const [duration, setDuration] = useState(20);

  const monthlyRate = rate / 100 / 12;
  const months = duration * 12;
  const monthly = monthlyRate > 0 ? (amount * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -months)) : amount / months;

  // Full monthly amortization schedule
  const schedule = (() => {
    const rows: { month: number; year: number; principal: number; interest: number; remaining: number; cumInterest: number }[] = [];
    let remaining = amount;
    let cumInterest = 0;
    for (let m = 1; m <= months; m++) {
      const interest = remaining * monthlyRate;
      const principal = monthly - interest;
      cumInterest += interest;
      remaining = Math.max(0, remaining - principal);
      rows.push({ month: m, year: Math.ceil(m / 12), principal: Math.round(principal), interest: Math.round(interest), remaining: Math.round(remaining), cumInterest: Math.round(cumInterest) });
    }
    return rows;
  })();

  // Yearly summary for chart
  const yearlyData = Array.from({ length: duration }, (_, y) => {
    const yearRows = schedule.filter(r => r.year === y + 1);
    return {
      year: y + 1,
      principal: yearRows.reduce((s, r) => s + r.principal, 0),
      interest: yearRows.reduce((s, r) => s + r.interest, 0),
    };
  });

  const totalInterest = schedule[schedule.length - 1]?.cumInterest ?? 0;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <Link to="/simulateurs"><Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button></Link>
        <h1 className="text-2xl font-bold">Tableau d'amortissement</h1>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-5 rounded-xl border bg-card p-6 lg:col-span-1">
          <div><Label>Montant : {formatAmount(amount, currency)}</Label>
            <Slider value={[amount]} onValueChange={v => setAmount(v[0])} min={10000} max={1000000} step={5000} className="mt-2" /></div>
          <div><Label>Taux : {rate}%</Label>
            <Slider value={[rate * 100]} onValueChange={v => setRate(v[0] / 100)} min={50} max={800} step={5} className="mt-2" /></div>
          <div><Label>Durée : {duration} ans</Label>
            <Slider value={[duration]} onValueChange={v => setDuration(v[0])} min={5} max={30} step={1} className="mt-2" /></div>
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="rounded-lg border bg-muted/50 p-3 text-center">
              <p className="text-xs text-muted-foreground">Mensualité</p>
              <p className="text-lg font-bold text-primary">{formatAmount(monthly, currency)}</p>
            </div>
            <div className="rounded-lg border bg-muted/50 p-3 text-center">
              <p className="text-xs text-muted-foreground">Total intérêts</p>
              <p className="text-lg font-bold">{formatAmount(totalInterest, currency)}</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border bg-card p-6 lg:col-span-2">
          <h3 className="mb-4 font-semibold">Capital vs Intérêts par année</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={yearlyData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="year" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip formatter={(v: number) => formatAmount(v, currency)} />
              <Legend />
              <Bar dataKey="principal" stackId="a" fill="hsl(var(--primary))" name="Capital" />
              <Bar dataKey="interest" stackId="a" fill="hsl(var(--destructive))" name="Intérêts" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Monthly table */}
      <div className="rounded-xl border bg-card p-4 overflow-x-auto">
        <h3 className="mb-3 font-semibold">Échéancier mensuel</h3>
        <div className="max-h-96 overflow-y-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mois</TableHead>
                <TableHead>Capital</TableHead>
                <TableHead>Intérêts</TableHead>
                <TableHead>Restant dû</TableHead>
                <TableHead>Intérêts cumulés</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {schedule.map(r => (
                <TableRow key={r.month} className={r.month % 12 === 0 ? 'border-b-2 border-primary/20' : ''}>
                  <TableCell className="text-xs">{r.month}</TableCell>
                  <TableCell className="text-xs">{formatAmount(r.principal, currency)}</TableCell>
                  <TableCell className="text-xs">{formatAmount(r.interest, currency)}</TableCell>
                  <TableCell className="text-xs">{formatAmount(r.remaining, currency)}</TableCell>
                  <TableCell className="text-xs">{formatAmount(r.cumInterest, currency)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
