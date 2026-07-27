import { useState, useMemo } from 'react';
import { useSimulatorTrack } from '@/hooks/useSimulatorTrack';
import { ArrowLeft, Calculator, Wallet, TrendingUp, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatAmount } from '@/lib/formatCurrency';
import { useAuth } from '@/contexts/AuthContext';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LineChart, Line } from 'recharts';
import type { Currency } from '@/types';

export default function SimulateurCreditPage() {
  useSimulatorTrack('credit');
  const { profile } = useAuth();
  const currency = (profile?.currency ?? 'EUR') as Currency;

  // Capacité d'endettement
  const [revenus, setRevenus] = useState(3500);
  const [chargesFixes, setChargesFixes] = useState(0);
  const [tauxEndettementMax, setTauxEndettementMax] = useState(35);
  const [tauxCapacite, setTauxCapacite] = useState(3.5);
  const [dureeCapacite, setDureeCapacite] = useState(25);

  // Simulation crédit
  const [amount, setAmount] = useState(200000);
  const [rate, setRate] = useState(3.5);
  const [duration, setDuration] = useState(20);
  const [insurance, setInsurance] = useState(0.34);

  // Calcul capacité d'endettement
  const capaciteCalcul = useMemo(() => {
    const mensualiteMaxPossible = (revenus * tauxEndettementMax / 100) - chargesFixes;
    const monthlyRate = tauxCapacite / 100 / 12;
    const months = dureeCapacite * 12;
    
    // Calcul inverse : montant empruntable à partir de la mensualité max
    const montantEmpruntable = monthlyRate > 0
      ? mensualiteMaxPossible * (1 - Math.pow(1 + monthlyRate, -months)) / monthlyRate
      : mensualiteMaxPossible * months;
    
    const endettementActuel = chargesFixes > 0 ? (chargesFixes / revenus) * 100 : 0;
    const margeEndettement = tauxEndettementMax - endettementActuel;
    
    return {
      mensualiteMax: Math.max(0, mensualiteMaxPossible),
      montantEmpruntable: Math.max(0, Math.round(montantEmpruntable)),
      endettementActuel,
      margeEndettement,
      isOk: margeEndettement >= 10,
    };
  }, [revenus, chargesFixes, tauxEndettementMax, tauxCapacite, dureeCapacite]);

  const monthlyRate = rate / 100 / 12;
  const months = duration * 12;
  const insuranceMonthly = (amount * (insurance / 100)) / 12;

  const monthlyPayment = monthlyRate > 0
    ? (amount * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -months))
    : amount / months;

  const totalPayment = monthlyPayment * months;
  const totalInterest = totalPayment - amount;
  const totalInsurance = insuranceMonthly * months;
  const totalCost = totalInterest + totalInsurance;
  const totalAll = totalPayment + totalInsurance;
  const monthlyAll = monthlyPayment + insuranceMonthly;

  // Amortization schedule (yearly summary)
  const yearlyData = (() => {
    const data: { year: number; principal: number; interest: number; remaining: number }[] = [];
    let remaining = amount;
    for (let y = 1; y <= duration; y++) {
      let yearPrincipal = 0;
      let yearInterest = 0;
      for (let m = 0; m < 12; m++) {
        const interestPart = remaining * monthlyRate;
        const principalPart = monthlyPayment - interestPart;
        yearInterest += interestPart;
        yearPrincipal += principalPart;
        remaining -= principalPart;
      }
      data.push({ year: y, principal: Math.round(yearPrincipal), interest: Math.round(yearInterest), remaining: Math.max(0, Math.round(remaining)) });
    }
    return data;
  })();

  return (
    <div className="space-y-6 animate-fade-in pb-20">
      <div className="flex items-center gap-3">
        <Link to="/simulateurs"><Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button></Link>
        <div>
          <h1 className="text-2xl font-bold">Simulateur de crédit</h1>
          <p className="text-sm text-muted-foreground">Capacité d'emprunt & simulation</p>
        </div>
      </div>

      <Tabs defaultValue="capacite" className="space-y-6">
        <TabsList className="grid grid-cols-2 w-full max-w-md">
          <TabsTrigger value="capacite" className="gap-1"><Calculator className="h-3.5 w-3.5" /> Capacité d'emprunt</TabsTrigger>
          <TabsTrigger value="simulation" className="gap-1"><Wallet className="h-3.5 w-3.5" /> Simulation crédit</TabsTrigger>
        </TabsList>

        {/* ONGLET CAPACITÉ D'EMPRUNT */}
        <TabsContent value="capacite" className="space-y-6">
          {/* Résultat principal */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border bg-gradient-to-br from-blue-500/10 to-blue-500/5 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="rounded-xl bg-blue-500/20 p-3">
                  <TrendingUp className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Capacité d'emprunt estimée</p>
                  <p className="text-3xl font-bold text-blue-600">{formatAmount(capaciteCalcul.montantEmpruntable, currency)}</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Sur {dureeCapacite} ans à {tauxCapacite}% avec une mensualité max de {formatAmount(capaciteCalcul.mensualiteMax, currency)}
              </p>
            </div>

            <div className={`rounded-2xl border p-6 ${capaciteCalcul.isOk ? 'bg-gradient-to-br from-emerald-500/10 to-emerald-500/5' : 'bg-gradient-to-br from-amber-500/10 to-amber-500/5'}`}>
              <div className="flex items-center gap-3 mb-4">
                <div className={`rounded-xl p-3 ${capaciteCalcul.isOk ? 'bg-emerald-500/20' : 'bg-amber-500/20'}`}>
                  {capaciteCalcul.isOk ? (
                    <CheckCircle2 className="h-6 w-6 text-emerald-600" />
                  ) : (
                    <AlertCircle className="h-6 w-6 text-amber-600" />
                  )}
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Taux d'endettement actuel</p>
                  <p className={`text-3xl font-bold ${capaciteCalcul.isOk ? 'text-emerald-600' : 'text-amber-600'}`}>
                    {capaciteCalcul.endettementActuel.toFixed(1)}%
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Marge disponible</span>
                  <span className="font-medium">{capaciteCalcul.margeEndettement.toFixed(1)}%</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${capaciteCalcul.endettementActuel > 35 ? 'bg-red-500' : capaciteCalcul.endettementActuel > 25 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                    style={{ width: `${Math.min(capaciteCalcul.endettementActuel, 100)}%` }}
                  />
                </div>
                <p className="text-[10px] text-muted-foreground">
                  Seuil recommandé : {tauxEndettementMax}% max (HCSF)
                </p>
              </div>
            </div>
          </div>

          {/* Formulaire capacité */}
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="space-y-5 rounded-2xl border bg-card p-6">
              <h3 className="font-semibold">Vos revenus et charges</h3>
              <div>
                <Label>Revenus nets mensuels : {formatAmount(revenus, currency)}</Label>
                <Slider value={[revenus]} onValueChange={v => setRevenus(v[0])} min={1000} max={15000} step={100} className="mt-2" />
                <p className="text-[10px] text-muted-foreground mt-1">Salaires, revenus fonciers, pensions...</p>
              </div>
              <div>
                <Label>Charges fixes mensuelles : {formatAmount(chargesFixes, currency)}</Label>
                <Slider value={[chargesFixes]} onValueChange={v => setChargesFixes(v[0])} min={0} max={5000} step={50} className="mt-2" />
                <p className="text-[10px] text-muted-foreground mt-1">Crédits en cours, pensions alimentaires...</p>
              </div>
              <div>
                <Label>Taux d'endettement max : {tauxEndettementMax}%</Label>
                <Slider value={[tauxEndettementMax]} onValueChange={v => setTauxEndettementMax(v[0])} min={20} max={40} step={1} className="mt-2" />
                <p className="text-[10px] text-muted-foreground mt-1">35% = norme HCSF depuis 2022</p>
              </div>
            </div>

            <div className="space-y-5 rounded-2xl border bg-card p-6">
              <h3 className="font-semibold">Paramètres du crédit</h3>
              <div>
                <Label>Taux d'intérêt estimé : {tauxCapacite}%</Label>
                <Slider value={[tauxCapacite * 100]} onValueChange={v => setTauxCapacite(v[0] / 100)} min={100} max={700} step={5} className="mt-2" />
              </div>
              <div>
                <Label>Durée souhaitée : {dureeCapacite} ans</Label>
                <Slider value={[dureeCapacite]} onValueChange={v => setDureeCapacite(v[0])} min={5} max={30} step={1} className="mt-2" />
              </div>

              <div className="rounded-lg bg-muted/50 p-4 space-y-2">
                <h4 className="text-sm font-medium">Récapitulatif</h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <p className="text-muted-foreground">Revenus</p>
                    <p className="font-medium">{formatAmount(revenus, currency)}/mois</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Charges actuelles</p>
                    <p className="font-medium">{formatAmount(chargesFixes, currency)}/mois</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Mensualité max possible</p>
                    <p className="font-medium text-primary">{formatAmount(capaciteCalcul.mensualiteMax, currency)}/mois</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Montant empruntable</p>
                    <p className="font-medium text-primary">{formatAmount(capaciteCalcul.montantEmpruntable, currency)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Conseil */}
          <div className="rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 p-4">
            <p className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-1">💡 Bon à savoir</p>
            <p className="text-xs text-blue-700 dark:text-blue-300">
              Le HCSF (Haut Conseil de Stabilité Financière) limite le taux d'endettement à 35% et la durée des crédits immobiliers à 25 ans (27 ans pour le neuf avec différé).
              Ces calculs sont indicatifs — consultez votre banque pour une étude personnalisée.
            </p>
          </div>
        </TabsContent>

        {/* ONGLET SIMULATION CRÉDIT */}
        <TabsContent value="simulation" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Inputs */}
            <div className="space-y-5 rounded-2xl border bg-card p-6">
              <div>
                <Label>Montant emprunté : {formatAmount(amount, currency)}</Label>
                <Slider value={[amount]} onValueChange={v => setAmount(v[0])} min={10000} max={1000000} step={5000} className="mt-2" />
              </div>
              <div>
                <Label>Taux annuel : {rate}%</Label>
                <Slider value={[rate * 100]} onValueChange={v => setRate(v[0] / 100)} min={50} max={800} step={5} className="mt-2" />
              </div>
              <div>
                <Label>Durée : {duration} ans</Label>
                <Slider value={[duration]} onValueChange={v => setDuration(v[0])} min={5} max={30} step={1} className="mt-2" />
              </div>
              <div>
                <Label>Assurance : {insurance}%</Label>
                <Slider value={[insurance * 100]} onValueChange={v => setInsurance(v[0] / 100)} min={0} max={100} step={1} className="mt-2" />
              </div>
            </div>

            {/* Results */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl border bg-gradient-to-br from-primary/10 to-primary/5 p-4 text-center">
                  <p className="text-xs text-muted-foreground">Mensualité</p>
                  <p className="text-xl font-bold text-primary">{formatAmount(monthlyAll, currency)}</p>
                </div>
                <div className="rounded-2xl border bg-card p-4 text-center">
                  <p className="text-xs text-muted-foreground">Coût total</p>
                  <p className="text-xl font-bold">{formatAmount(totalCost, currency)}</p>
                </div>
                <div className="rounded-2xl border bg-card p-4 text-center">
                  <p className="text-xs text-muted-foreground">Total intérêts</p>
                  <p className="text-lg font-semibold">{formatAmount(totalInterest, currency)}</p>
                </div>
                <div className="rounded-2xl border bg-card p-4 text-center">
                  <p className="text-xs text-muted-foreground">Total assurance</p>
                  <p className="text-lg font-semibold">{formatAmount(totalInsurance, currency)}</p>
                </div>
              </div>

              <div className="rounded-2xl border bg-card p-4 text-center">
                <p className="text-xs text-muted-foreground">Montant total remboursé</p>
                <p className="text-2xl font-bold">{formatAmount(totalAll, currency)}</p>
              </div>
            </div>
          </div>

          {/* Chart */}
          <div className="rounded-2xl border bg-card p-6">
            <h3 className="mb-4 font-semibold">Capital vs Intérêts par année</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={yearlyData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="year" tick={{ fontSize: 12 }} label={{ value: 'Année', position: 'insideBottom', offset: -5 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(v: number) => formatAmount(v, currency)} />
                <Bar dataKey="principal" stackId="a" fill="hsl(var(--primary))" name="Capital" radius={[0, 0, 0, 0]} />
                <Bar dataKey="interest" stackId="a" fill="hsl(var(--destructive))" name="Intérêts" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Remaining capital curve */}
          <div className="rounded-2xl border bg-card p-6">
            <h3 className="mb-4 font-semibold">Capital restant dû</h3>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={[{ year: 0, remaining: amount }, ...yearlyData]}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="year" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(v: number) => formatAmount(v, currency)} />
                <Line type="monotone" dataKey="remaining" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} name="Restant dû" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
