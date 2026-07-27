import { useState, useMemo } from 'react';
import { useSimulatorTrack } from '@/hooks/useSimulatorTrack';
import { PremiumGate } from '@/components/PremiumGate';
import { usePlan } from '@/hooks/usePlan';
import { ArrowLeft, Flame, TrendingUp, TrendingDown, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { formatAmount } from '@/lib/formatCurrency';
import { useAuth } from '@/contexts/AuthContext';
import { SaveSimulationButton } from '@/components/SaveSimulationButton';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine, Legend } from 'recharts';
import type { Currency } from '@/types';

export default function SimulateurFirePage() {
  useSimulatorTrack('fire');
  const { isPremium } = usePlan();
  const { user, profile } = useAuth();
  if (!isPremium) return <PremiumGate feature="Simulateur FIRE (Indépendance Financière)" />;
  const currency = (profile?.currency ?? 'EUR') as Currency;

  const [expenses, setExpenses] = useState(2000);
  const [patrimoine, setPatrimoine] = useState(50000);
  const [monthly, setMonthly] = useState(500);
  const [returnRate, setReturnRate] = useState(5);
  const [withdrawalRate, setWithdrawalRate] = useState(4);

  const targetFire = (expenses * 12) / (withdrawalRate / 100);
  const annualReturn = returnRate / 100;
  const annualWithdrawal = withdrawalRate / 100;
  const annualExpenses = expenses * 12;

  const { accumulationData, decumulationData, yearsToFire, yearsInRetirement, finalCapital } = useMemo(() => {
    const accumulation: { year: number; capital: number; phase: string }[] = [];
    const decumulation: { year: number; capital: number; phase: string }[] = [];
    
    let capital = patrimoine;
    let fireYear = -1;
    
    // Phase 1: Accumulation - jusqu'au FIRE
    for (let y = 0; y <= 50; y++) {
      accumulation.push({ year: y, capital: Math.round(capital), phase: 'Accumulation' });
      
      if (capital >= targetFire && fireYear === -1) {
        fireYear = y;
        break;
      }
      
      // Growth: monthly compounding with contributions
      for (let m = 0; m < 12; m++) {
        capital = capital * (1 + annualReturn / 12) + monthly;
      }
    }
    
    if (fireYear === -1) {
      return { accumulationData: accumulation, decumulationData: [], yearsToFire: -1, yearsInRetirement: 0, finalCapital: 0 };
    }
    
    // Phase 2: Decumulation - après le FIRE
    let retirementCapital = accumulation[accumulation.length - 1].capital;
    let retirementYears = 0;
    const maxRetirementYears = 60;
    
    for (let y = 0; y <= maxRetirementYears; y++) {
      decumulation.push({ 
        year: fireYear + y, 
        capital: Math.round(retirementCapital), 
        phase: 'Décumulation' 
      });
      
      if (retirementCapital <= 0) break;
      
      // Annual withdrawal then growth on remaining
      const withdrawal = retirementCapital * annualWithdrawal;
      retirementCapital = (retirementCapital - withdrawal) * (1 + annualReturn);
      retirementYears = y;
      
      // Stop if capital is stable or growing (sustainable)
      if (y > 5 && retirementCapital >= decumulation[0].capital * 0.95) {
        // Capital is sustainable, project a few more years then stop
        for (let extra = 1; extra <= 10; extra++) {
          const extraWithdrawal = retirementCapital * annualWithdrawal;
          retirementCapital = (retirementCapital - extraWithdrawal) * (1 + annualReturn);
          decumulation.push({ 
            year: fireYear + y + extra, 
            capital: Math.round(retirementCapital), 
            phase: 'Décumulation' 
          });
        }
        retirementYears = y + 10;
        break;
      }
    }
    
    return { 
      accumulationData: accumulation, 
      decumulationData: decumulation, 
      yearsToFire: fireYear, 
      yearsInRetirement: retirementYears,
      finalCapital: Math.round(retirementCapital)
    };
  }, [patrimoine, monthly, annualReturn, targetFire, annualWithdrawal]);

  // Combined data for the chart
  const chartData = useMemo(() => {
    if (yearsToFire === -1) return accumulationData;
    
    // Remove duplicate year at transition
    const combined = [...accumulationData];
    decumulationData.slice(1).forEach(d => combined.push(d));
    return combined;
  }, [accumulationData, decumulationData, yearsToFire]);

  const renteMonthly = targetFire * annualWithdrawal / 12;
  const isSustainable = yearsToFire !== -1 && (finalCapital > 0 || yearsInRetirement >= 30);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <Link to="/simulateurs"><Button variant="ghost" size="icon" aria-label="Retour simulateurs"><ArrowLeft className="h-4 w-4" /></Button></Link>
          <h1 className="text-2xl font-bold">Simulateur FIRE</h1>
        </div>
        {user && (
          <SaveSimulationButton
            simulator_type="fire"
            label={`FIRE ${formatAmount(targetFire, currency)} • ${yearsToFire >= 0 ? yearsToFire + ' ans' : '50+ ans'}`}
            params_json={{ expenses, patrimoine, monthly, returnRate, withdrawalRate }}
            result_json={{ targetFire, yearsToFire, renteMonthly, yearsInRetirement, finalCapital }}
          />
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-5 rounded-2xl border bg-card p-6">
          <div>
            <Label>Dépenses mensuelles : {formatAmount(expenses, currency)}</Label>
            <Slider value={[expenses]} onValueChange={v => setExpenses(v[0])} min={500} max={10000} step={100} className="mt-2" />
          </div>
          <div>
            <Label>Patrimoine actuel : {formatAmount(patrimoine, currency)}</Label>
            <Slider value={[patrimoine]} onValueChange={v => setPatrimoine(v[0])} min={0} max={500000} step={5000} className="mt-2" />
          </div>
          <div>
            <Label>Épargne mensuelle : {formatAmount(monthly, currency)}</Label>
            <Slider value={[monthly]} onValueChange={v => setMonthly(v[0])} min={0} max={5000} step={50} className="mt-2" />
          </div>
          <div>
            <Label>Rendement annuel : {returnRate}%</Label>
            <Slider value={[returnRate * 10]} onValueChange={v => setReturnRate(v[0] / 10)} min={0} max={120} step={1} className="mt-2" />
          </div>
          <div>
            <Label>Taux de retrait (SWR) : {withdrawalRate}%</Label>
            <Slider value={[withdrawalRate * 10]} onValueChange={v => setWithdrawalRate(v[0] / 10)} min={20} max={60} step={1} className="mt-2" />
          </div>
        </div>

        <div className="space-y-4">
          {/* Target FIRE Card */}
          <div className="rounded-2xl border bg-gradient-to-br from-orange-500/10 to-amber-500/5 p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="rounded-xl bg-orange-500/20 p-2.5">
                <Flame className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Capital cible FIRE</p>
                <p className="text-2xl font-bold text-orange-600">{formatAmount(targetFire, currency)}</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Basé sur {formatAmount(expenses * 12, currency)}/an de dépenses et un taux de retrait de {withdrawalRate}%
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Phase 1: Accumulation */}
            <div className="rounded-2xl border bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4 text-emerald-600" />
                <p className="text-[10px] uppercase tracking-wider text-emerald-600 font-medium">Accumulation</p>
              </div>
              <p className="text-lg font-bold">{yearsToFire >= 0 ? `${yearsToFire} ans` : '50+ ans'}</p>
              <p className="text-xs text-muted-foreground">pour atteindre le FIRE</p>
            </div>

            {/* Phase 2: Decumulation */}
            <div className="rounded-2xl border bg-gradient-to-br from-blue-500/10 to-blue-500/5 p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingDown className="h-4 w-4 text-blue-600" />
                <p className="text-[10px] uppercase tracking-wider text-blue-600 font-medium">Décumulation</p>
              </div>
              {yearsToFire >= 0 ? (
                <>
                  <p className="text-lg font-bold">{formatAmount(renteMonthly, currency)}/mois</p>
                  <p className="text-xs text-muted-foreground">rente de {formatAmount(expenses * 12, currency)}/an</p>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">Non disponible</p>
              )}
            </div>
          </div>

          {/* Sustainability indicator */}
          {yearsToFire >= 0 && (
            <div className={`rounded-2xl border p-4 ${isSustainable ? 'bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border-emerald-200' : 'bg-gradient-to-br from-amber-500/10 to-amber-500/5 border-amber-200'}`}>
              <div className="flex items-center gap-2">
                <Calendar className={`h-4 w-4 ${isSustainable ? 'text-emerald-600' : 'text-amber-600'}`} />
                <p className={`text-sm font-medium ${isSustainable ? 'text-emerald-600' : 'text-amber-600'}`}>
                  {isSustainable ? '✓ Stratégie soutenable' : '⚠ Capital épuisé'}
                </p>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {isSustainable 
                  ? `Votre capital reste positif après ${yearsInRetirement}+ années de retraite`
                  : `Capital épuisé après ~${yearsInRetirement} années de retraite`
                }
              </p>
              {!isSustainable && (
                <p className="text-[10px] text-muted-foreground mt-1">
                  💡 Astuce : réduisez le taux de retrait ou augmentez le rendement pour une stratégie plus durable
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Two-phase Chart */}
      <div className="rounded-2xl border bg-card p-6">
        <h3 className="mb-2 font-semibold">Trajectoire complète : Accumulation → Décumulation</h3>
        <p className="text-xs text-muted-foreground mb-4">
          Phase 1 (vert) : épargne jusqu'au FIRE • Phase 2 (bleu) : vie sur le capital
        </p>
        <ResponsiveContainer width="100%" height={350}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="accGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10B981" stopOpacity={0.4} />
                <stop offset="100%" stopColor="#10B981" stopOpacity={0.05} />
              </linearGradient>
              <linearGradient id="decGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.4} />
                <stop offset="100%" stopColor="#3B82F6" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis 
              dataKey="year" 
              tick={{ fontSize: 11 }} 
              label={{ value: 'Année', position: 'insideBottom', offset: -5, fontSize: 11 }} 
            />
            <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => v >= 1000000 ? `${(v/1000000).toFixed(1)}M` : v >= 1000 ? `${(v/1000).toFixed(0)}k` : v} />
            <Tooltip 
              formatter={(v: number, name: string) => [formatAmount(v, currency), 'Capital']}
              labelFormatter={(year) => `Année ${year}`}
            />
            <ReferenceLine 
              y={targetFire} 
              stroke="#F97316" 
              strokeDasharray="5 5" 
              label={{ value: `FIRE: ${formatAmount(targetFire, currency)}`, position: 'insideTopRight', fontSize: 10, fill: '#F97316' }} 
            />
            {yearsToFire >= 0 && (
              <ReferenceLine 
                x={yearsToFire} 
                stroke="#F97316" 
                strokeDasharray="3 3"
                label={{ value: `Année ${yearsToFire}`, position: 'top', fontSize: 10, fill: '#F97316' }}
              />
            )}
            <Area
              type="monotone"
              dataKey="capital"
              stroke="#10B981"
              strokeWidth={2.5}
              fill="url(#accGrad)"
              dot={false}
              name="Capital"
            />
          </AreaChart>
        </ResponsiveContainer>
        
        {/* Legend */}
        <div className="flex flex-wrap justify-center gap-4 mt-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-emerald-500" />
            <span className="text-xs text-muted-foreground">Phase accumulation</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-blue-500" />
            <span className="text-xs text-muted-foreground">Phase décumulation</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-0.5 bg-orange-500 border-dashed" style={{ borderStyle: 'dashed' }} />
            <span className="text-xs text-muted-foreground">Objectif FIRE</span>
          </div>
        </div>
      </div>
    </div>
  );
}
