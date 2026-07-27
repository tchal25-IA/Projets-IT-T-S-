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
import { frFlatTax, frIncomeTax } from '@/lib/taxCalculations';
import { FinancialDisclaimer } from '@/components/FinancialDisclaimer';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export default function SimulateurFlatTaxPage() {
  useSimulatorTrack('flat-tax');
  const { isPremium } = usePlan();
  if (!isPremium) return <PremiumGate feature="Simulateur Flat Tax (PFU 30%)" />;
  const [capitalGains, setCapitalGains] = useState(5000);
  const [dividends, setDividends] = useState(3000);
  const [interests, setInterests] = useState(1000);
  const [otherIncome, setOtherIncome] = useState(35000);
  const [parts, setParts] = useState(1);

  const pfu = frFlatTax(capitalGains, dividends, interests);

  // Option barème progressif comparison
  const totalCapital = capitalGains + dividends + interests;
  const socialCharges = Math.round(totalCapital * 0.172);
  const irWithCapital = frIncomeTax(otherIncome + totalCapital, parts, Math.round((otherIncome + totalCapital) * 0.10));
  const irWithout = frIncomeTax(otherIncome, parts, Math.round(otherIncome * 0.10));
  const irOnCapital = irWithCapital.tax - irWithout.tax;
  const baremeTotal = socialCharges + irOnCapital;
  const pfuBetter = pfu.pfuTax <= baremeTotal;

  const chartData = [
    { name: 'Flat Tax (PFU)', montant: pfu.pfuTax },
    { name: 'Barème progressif', montant: baremeTotal },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <Link to="/simulateurs"><Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button></Link>
        <h1 className="text-2xl font-bold">Flat Tax / PFU 🇫🇷</h1>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-5 rounded-xl border bg-card p-6">
          <div>
            <Label>Plus-values mobilières : {formatAmount(capitalGains, 'EUR')}</Label>
            <Slider value={[capitalGains]} onValueChange={v => setCapitalGains(v[0])} min={0} max={100000} step={500} className="mt-2" />
          </div>
          <div>
            <Label>Dividendes : {formatAmount(dividends, 'EUR')}</Label>
            <Slider value={[dividends]} onValueChange={v => setDividends(v[0])} min={0} max={50000} step={500} className="mt-2" />
          </div>
          <div>
            <Label>Intérêts imposables : {formatAmount(interests, 'EUR')}</Label>
            <Slider value={[interests]} onValueChange={v => setInterests(v[0])} min={0} max={20000} step={100} className="mt-2" />
          </div>
          <hr className="border-border" />
          <p className="text-xs text-muted-foreground font-medium">Pour comparer avec le barème progressif :</p>
          <div>
            <Label>Autres revenus imposables : {formatAmount(otherIncome, 'EUR')}</Label>
            <Slider value={[otherIncome]} onValueChange={v => setOtherIncome(v[0])} min={0} max={200000} step={1000} className="mt-2" />
          </div>
          <div>
            <Label>Parts fiscales : {parts}</Label>
            <Slider value={[parts * 2]} onValueChange={v => setParts(v[0] / 2)} min={1} max={8} step={1} className="mt-2" />
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border bg-card p-5 text-center">
            <p className="text-xs text-muted-foreground">PFU total (30%)</p>
            <p className="text-3xl font-bold text-primary">{formatAmount(pfu.pfuTax, 'EUR')}</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border bg-card p-4 text-center">
              <p className="text-xs text-muted-foreground">Prélèvements sociaux (17.2%)</p>
              <p className="text-lg font-semibold">{formatAmount(pfu.socialCharges, 'EUR')}</p>
            </div>
            <div className="rounded-xl border bg-card p-4 text-center">
              <p className="text-xs text-muted-foreground">IR forfaitaire (12.8%)</p>
              <p className="text-lg font-semibold">{formatAmount(pfu.incomeTax, 'EUR')}</p>
            </div>
          </div>
          <div className={`rounded-xl border p-4 text-center ${pfuBetter ? 'bg-success/10 border-success/30' : 'bg-warning/10 border-warning/30'}`}>
            <p className="text-sm font-medium">
              {pfuBetter
                ? `✅ La flat tax est plus avantageuse (${formatAmount(baremeTotal - pfu.pfuTax, 'EUR')} d'économie)`
                : `⚠️ Le barème progressif serait plus avantageux (${formatAmount(pfu.pfuTax - baremeTotal, 'EUR')} d'économie)`}
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-xl border bg-card p-6">
        <h3 className="mb-4 font-semibold">Comparaison PFU vs Barème</h3>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip formatter={(v: number) => formatAmount(v, 'EUR')} />
            <Bar dataKey="montant" name="Impôt total" radius={[4, 4, 0, 0]} fill="hsl(var(--primary))" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <FinancialDisclaimer />
    </div>
  );
}
