import { useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';
import { Button } from '@/components/ui/button';
import { Download, TrendingUp, Shield, Zap, Target, BookOpen, ChevronRight } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import type { ProjectionResult, ProjectionInputs } from '@/lib/projectionCalculations';
import { FinancialDisclaimer } from '@/components/FinancialDisclaimer';

interface Props {
  result: ProjectionResult;
  inputs: ProjectionInputs;
  years: number;
  onYearsChange: (years: number) => void;
}

const profileLabels: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  prudent: { label: 'Prudent', icon: Shield, color: 'text-blue-500' },
  equilibre: { label: 'Équilibré', icon: Target, color: 'text-green-500' },
  dynamique: { label: 'Dynamique', icon: TrendingUp, color: 'text-orange-500' },
  offensif: { label: 'Offensif', icon: Zap, color: 'text-red-500' },
};

export function ProjectionResults({ result, inputs, years, onYearsChange }: Props) {
  const { profile: userProfile } = useAuth();
  const navigate = useNavigate();
  const reportRef = useRef<HTMLDivElement>(null);
  const profileInfo = profileLabels[result.riskProfile];
  const ProfileIcon = profileInfo.icon;

  const market = result.market ?? 'FR';
  const currencyCode = market === 'CH' ? 'CHF' : 'EUR';
  const currencySymbol = market === 'CH' ? 'CHF' : '€';
  const fmt = (n: number) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: currencyCode, maximumFractionDigits: 0 }).format(n);
  const fmtShort = (n: number) => Math.round(n).toLocaleString('fr-FR');

  const last = result.scenarios[result.scenarios.length - 1];

  // Calculate allocation amounts based on final patrimoine (scenario modéré)
  const allocationWithAmounts = useMemo(() => {
    return result.allocation.map(a => ({
      ...a,
      amount: Math.round((a.pct / 100) * last.modere),
    }));
  }, [result.allocation, last.modere]);

  // Calculate evolution of each envelope over time
  const envelopeEvolution = useMemo(() => {
    return result.scenarios.map(scenario => {
      const data: Record<string, number | string> = { year: scenario.year };
      result.allocation.forEach(a => {
        data[a.label] = Math.round((a.pct / 100) * scenario.modere);
      });
      return data;
    });
  }, [result.scenarios, result.allocation]);

  const handleExportPDF = async () => {
    if (!reportRef.current) return;
    const html2canvas = (await import('html2canvas')).default;
    const { jsPDF } = await import('jspdf');

    const canvas = await html2canvas(reportRef.current, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, Math.min(pdfHeight, pdf.internal.pageSize.getHeight()));

    if (pdfHeight > pdf.internal.pageSize.getHeight()) {
      let position = -pdf.internal.pageSize.getHeight();
      while (Math.abs(position) < pdfHeight) {
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
        position -= pdf.internal.pageSize.getHeight();
      }
    }

    pdf.save(`Finzy_Projection_${userProfile?.username ?? 'rapport'}.pdf`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-xl font-bold">Tes projections sur {years} ans</h2>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border bg-muted p-0.5 gap-0.5">
            {[5, 10, 15].map(y => (
              <button
                key={y}
                onClick={() => onYearsChange(y)}
                className={`px-3 py-1 text-sm rounded-md font-medium transition-colors ${years === y ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
              >
                {y} ans
              </button>
            ))}
          </div>
          <Button onClick={handleExportPDF} variant="outline" className="gap-2">
            <Download className="h-4 w-4" /> PDF
          </Button>
        </div>
      </div>

      <div ref={reportRef} className="space-y-6 bg-background p-4">
        <div className="text-center space-y-1 pb-4 border-b">
          <h2 className="text-2xl font-bold">📊 Rapport de Projections Finzy</h2>
          <p className="text-sm text-muted-foreground">
            {userProfile?.username ?? 'Utilisateur'} • {result.age} ans • {market === 'CH' ? '🇨🇭 Suisse' : '🇫🇷 France'} • Généré le {new Date().toLocaleDateString('fr-FR')}
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-4">
          <div className="rounded-xl border bg-card p-4 text-center">
            <ProfileIcon className={`mx-auto h-6 w-6 ${profileInfo.color}`} />
            <p className="mt-1 text-sm font-semibold">Profil</p>
            <p className={`text-lg font-bold ${profileInfo.color}`}>{profileInfo.label}</p>
          </div>
          <div className="rounded-xl border bg-card p-4 text-center">
            <p className="text-sm text-muted-foreground">Patrimoine actuel</p>
            <p className="text-lg font-bold">{fmt(result.totalPatrimoine)}</p>
          </div>
          <div className="rounded-xl border bg-card p-4 text-center">
            <p className="text-sm text-muted-foreground">Épargne mensuelle</p>
            <p className="text-lg font-bold text-primary">{fmt(result.monthlySavings)}</p>
          </div>
          <div className="rounded-xl border bg-card p-4 text-center">
            <p className="text-sm text-muted-foreground">Horizon</p>
            <p className="text-lg font-bold">{years} ans</p>
          </div>
        </div>

        <div className="rounded-xl border bg-card p-4">
          <h3 className="font-semibold mb-4">Évolution de ton patrimoine</h3>
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={result.scenarios}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="year" tick={{ fontSize: 12 }} />
              <YAxis tickFormatter={v => `${Math.round(v / 1000)}k`} tick={{ fontSize: 12 }} />
              <Tooltip formatter={(v: number) => fmt(v)} labelFormatter={l => `Année ${l}`} />
              <Legend />
              <Line type="monotone" dataKey="pessimiste" stroke="hsl(0 84% 60%)" strokeWidth={2} name="Pessimiste" dot={false} />
              <Line type="monotone" dataKey="modere" stroke="hsl(160 84% 39%)" strokeWidth={2.5} name="Modéré" dot={false} />
              <Line type="monotone" dataKey="optimiste" stroke="hsl(217 91% 60%)" strokeWidth={2} name="Optimiste" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { label: 'Pessimiste', value: last.pessimiste, color: 'border-l-red-400' },
            { label: 'Modéré', value: last.modere, color: 'border-l-green-500' },
            { label: 'Optimiste', value: last.optimiste, color: 'border-l-blue-500' },
          ].map(s => (
            <div key={s.label} className={`rounded-xl border bg-card p-4 border-l-4 ${s.color}`}>
              <p className="text-sm text-muted-foreground">{s.label}</p>
              <p className="text-xl font-bold">{fmt(s.value)}</p>
              <p className="text-xs text-muted-foreground">dans {years} ans</p>
            </div>
          ))}
        </div>

        <div className="rounded-xl border bg-muted/40 p-4 space-y-2">
          <h3 className="font-semibold text-sm">ℹ️ Comment lire ces scénarios ?</h3>
          <div className="grid gap-2 sm:grid-cols-3 text-xs text-muted-foreground">
            <div className="flex gap-2">
              <span className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-red-400" />
              <p><strong className="text-foreground">Pessimiste</strong> — Marchés défavorables, faible croissance. Rendement annuel ~{result.riskProfile === 'prudent' ? '1' : result.riskProfile === 'equilibre' ? '2' : result.riskProfile === 'dynamique' ? '3' : '2'}%.</p>
            </div>
            <div className="flex gap-2">
              <span className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-green-500" />
              <p><strong className="text-foreground">Modéré</strong> — Hypothèse centrale, tendance historique moyenne. Rendement annuel ~{result.riskProfile === 'prudent' ? '2,5' : result.riskProfile === 'equilibre' ? '5' : result.riskProfile === 'dynamique' ? '7' : '8'}%.</p>
            </div>
            <div className="flex gap-2">
              <span className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-blue-500" />
              <p><strong className="text-foreground">Optimiste</strong> — Conditions favorables, marchés haussiers. Rendement annuel ~{result.riskProfile === 'prudent' ? '4' : result.riskProfile === 'equilibre' ? '8' : result.riskProfile === 'dynamique' ? '10' : '12'}%.</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border bg-card p-4">
          <h3 className="font-semibold mb-4">Allocation recommandée — Profil {profileInfo.label}</h3>
          <p className="text-xs text-muted-foreground mb-4">Montants projetés dans {years} ans (scénario modéré)</p>
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="w-56 h-56 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={allocationWithAmounts} dataKey="pct" nameKey="label" cx="50%" cy="50%" outerRadius={75} innerRadius={30} label={false} labelLine={false}>
                    {allocationWithAmounts.map((a, i) => (
                      <Cell key={i} fill={a.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number, name: string, props: any) => [`${v}% (${fmtShort(props.payload.amount)} ${currencySymbol})`, name]} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 space-y-2 w-full">
              {allocationWithAmounts.map(a => (
                <div key={a.label} className="flex items-center gap-3">
                  <div className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: a.color }} />
                  <span className="text-sm text-muted-foreground min-w-[100px]">{fmtShort(a.amount)} {currencySymbol}</span>
                  <span className="text-sm flex-1">{a.label}</span>
                  <span className="text-sm font-semibold">{a.pct}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Graphique d'évolution des enveloppes */}
        <div className="rounded-xl border bg-card p-4">
          <h3 className="font-semibold mb-4">Évolution des enveloppes sur {years} ans</h3>
          <p className="text-xs text-muted-foreground mb-4">Répartition projetée de ton patrimoine (scénario modéré)</p>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={envelopeEvolution}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="year" tick={{ fontSize: 11 }} />
              <YAxis tickFormatter={v => `${Math.round(v / 1000)}k`} tick={{ fontSize: 11 }} />
              <Tooltip 
                formatter={(v: number) => `${fmtShort(v)} ${currencySymbol}`}
                labelFormatter={l => `Année ${l}`}
              />
              <Legend wrapperStyle={{ fontSize: '11px' }} />
              {result.allocation.map((a, i) => (
                <Bar key={a.label} dataKey={a.label} stackId="a" fill={a.color} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-xl border bg-card p-4 space-y-3">
          <h3 className="font-semibold">📝 Résumé de ta situation</h3>
          <div className="text-sm space-y-1 text-muted-foreground">
            <p>• <strong className="text-foreground">Âge :</strong> {result.age} ans</p>
            <p>• <strong className="text-foreground">Revenus :</strong> {fmt(inputs.monthlyIncome)}/mois</p>
            <p>• <strong className="text-foreground">Capacité d'épargne :</strong> {fmt(result.monthlySavings)}/mois ({inputs.monthlyIncome > 0 ? Math.round(result.monthlySavings / inputs.monthlyIncome * 100) : 0}% du revenu)</p>
            <p>• <strong className="text-foreground">Objectifs :</strong> {inputs.objectives.join(', ') || 'Non précisé'}</p>
            <p>• <strong className="text-foreground">Horizon :</strong> {inputs.investmentHorizon === 'court' ? '< 3 ans' : inputs.investmentHorizon === 'moyen' ? '3-5 ans' : inputs.investmentHorizon === 'long' ? '5-10 ans' : '> 10 ans'}</p>
          </div>
        </div>

        <FinancialDisclaimer />
      </div>

      <div className="rounded-xl border-2 border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BookOpen className="h-6 w-6 text-primary" />
            <div>
              <h3 className="font-semibold">Pour aller plus loin</h3>
              <p className="text-sm text-muted-foreground">Explore nos guides thématiques pour approfondir ta stratégie.</p>
            </div>
          </div>
          <Button variant="outline" onClick={() => navigate('/bonus')} className="gap-2 shrink-0">
            Voir les bonus <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
