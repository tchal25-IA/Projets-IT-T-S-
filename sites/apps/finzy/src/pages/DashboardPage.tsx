import { useEffect, useState, useMemo } from 'react';
import { SEO } from '@/components/SEO';
import { ProgressRing } from '@/components/ProgressRing';
import { XPBar } from '@/components/XPBar';
import { MetricCard } from '@/components/MetricCard';
import { LevelBadge } from '@/components/LevelBadge';
import { DailyQuiz } from '@/components/DailyQuiz';
import { formatAmount } from '@/lib/formatCurrency';
import { TrendingUp, TrendingDown, PiggyBank, Percent, Lightbulb, Wallet, Target, BarChart3, Calculator, GraduationCap, Loader2, Flame } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useStreak } from '@/hooks/useStreak';
import { supabase } from '@/integrations/supabase/client';
import { calculateScore } from '@/lib/patrimonialScore';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, AreaChart, Area } from 'recharts';
import { Leaderboard } from '@/components/Leaderboard';
import { ChallengeDuMois } from '@/components/ChallengeDuMois';
import type { Currency } from '@/types';

const modules = [
  { title: 'Budget', icon: Wallet, to: '/budget', color: 'text-primary' },
  { title: 'Projets', icon: Target, to: '/projets', color: 'text-success' },
  { title: 'Patrimoine', icon: BarChart3, to: '/patrimoine', color: 'text-premium' },
  { title: 'Simulateurs', icon: Calculator, to: '/simulateurs', color: 'text-warning' },
  { title: 'Academy', icon: GraduationCap, to: '/academy', color: 'text-primary' },
];

const tips = [
  'Le Livret A est plafonné à 22 950€ et son taux est de 1,5% en 2026.',
  'Diversifier ses placements réduit le risque global de votre portefeuille.',
  'L\'épargne de précaution idéale couvre 3 à 6 mois de dépenses.',
  'Le PEA offre un avantage fiscal après 5 ans de détention.',
  'Automatiser son épargne chaque mois aide à maintenir la discipline.',
];

export default function DashboardPage() {
  const { user, profile } = useAuth();
  const { streak } = useStreak();
  const username = profile?.username ?? 'Utilisateur';
  const level = profile?.level ?? 1;
  const xpTotal = profile?.xp_total ?? 0;
  const market = (profile?.market ?? 'FR') as string;
  const currency = (profile?.currency ?? 'EUR') as Currency;

  const [transactions, setTransactions] = useState<any[]>([]);
  const [recurringTx, setRecurringTx] = useState<any[]>([]);
  const [patrimoineEntries, setPatrimoineEntries] = useState<any[]>([]);
  const [liabilities, setLiabilities] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      supabase.from('transactions').select('*').eq('user_id', user.id).order('date', { ascending: false }),
      supabase.from('recurring_transactions').select('*').eq('user_id', user.id).eq('active', true),
      supabase.from('patrimoine_entries').select('*').eq('user_id', user.id),
      supabase.from('patrimoine_liabilities').select('*').eq('user_id', user.id),
      supabase.from('projects').select('*').eq('user_id', user.id).eq('status', 'active'),
    ]).then(([txRes, recRes, patRes, liabRes, projRes]) => {
      if (txRes.data) setTransactions(txRes.data);
      if (recRes.data) setRecurringTx(recRes.data);
      if (patRes.data) setPatrimoineEntries(patRes.data);
      if (liabRes.data) setLiabilities(liabRes.data);
      if (projRes.data) setProjects(projRes.data);
      setLoading(false);
    });
  }, [user]);

  // Normalize recurring to monthly amounts
  const recMonthlyIncome = recurringTx.filter(r => r.type === 'income').reduce((s, r) => {
    const amt = Math.abs(r.amount);
    return s + (r.frequency === 'weekly' ? amt * 4.33 : r.frequency === 'yearly' ? amt / 12 : amt);
  }, 0);
  const recMonthlyExpense = recurringTx.filter(r => r.type === 'expense').reduce((s, r) => {
    const amt = Math.abs(r.amount);
    return s + (r.frequency === 'weekly' ? amt * 4.33 : r.frequency === 'yearly' ? amt / 12 : amt);
  }, 0);

  const txIncomes = transactions.filter(t => t.type === 'income').reduce((s, t) => s + Math.abs(t.amount), 0);
  const txExpenses = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + Math.abs(t.amount), 0);
  const incomes = txIncomes + recMonthlyIncome;
  const expenses = txExpenses + recMonthlyExpense;
  const savings = incomes - expenses;
  const savingsRate = incomes > 0 ? Math.round((savings / incomes) * 100) : 0;

  const totalAssets = patrimoineEntries.reduce((s, e) => s + Number(e.amount), 0);
  const totalLiabilities = liabilities.reduce((s, l) => s + Number(l.amount), 0);
  const netWorth = totalAssets - totalLiabilities;
  const diversification = new Set(patrimoineEntries.map(e => e.envelope_type)).size;
  const { total: score } = calculateScore({
    savingsRate, emergencyFund: 3, diversification, academyProgress: 0, budgetControl: 50, debtRatio: totalAssets > 0 ? Math.round((totalLiabilities / totalAssets) * 100) : 0,
  });

  const recentTx = transactions.slice(0, 5);
  const tip = useMemo(() => tips[Math.floor(Math.random() * tips.length)], []);

  // Monthly chart data (last 6 months)
  const monthlyData = (() => {
    const now = new Date();
    const months: { name: string; revenus: number; depenses: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const name = d.toLocaleDateString('fr-FR', { month: 'short' });
      const monthTx = transactions.filter(t => t.date?.startsWith(key));
      const revenus = monthTx.filter(t => t.type === 'income').reduce((s: number, t: any) => s + Math.abs(t.amount), 0);
      const depenses = monthTx.filter(t => t.type === 'expense').reduce((s: number, t: any) => s + Math.abs(t.amount), 0);
      months.push({ name, revenus, depenses });
    }
    return months;
  })();

  // Recurring transactions to confirm (next_date in the past)
  const today = new Date().toISOString().slice(0, 10);
  const recurringToConfirm = recurringTx.filter(r => r.next_date && r.next_date <= today);

  // Active projects with progress alerts
  const projectAlerts = projects.filter(p => {
    if (!p.deadline) return false;
    const deadline = new Date(p.deadline);
    const daysLeft = Math.ceil((deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    const progress = p.target_amount > 0 ? p.current_amount / p.target_amount : 0;
    return daysLeft <= 30 && progress < 0.8;
  });

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <SEO title="Dashboard" description="Vue d'ensemble de vos finances personnelles : budget, patrimoine et objectifs." path="/dashboard" />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Bonjour {username} 👋</h1>
          <div className="mt-1 flex items-center gap-2">
            <span className="text-sm">{market === 'CH' ? '🇨🇭' : '🇫🇷'}</span>
            <LevelBadge level={level} />
            {streak > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-warning/10 px-2 py-0.5 text-xs font-medium text-warning">
                <Flame className="h-3 w-3" />{streak}j
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex items-center gap-6 rounded-xl border bg-card p-5">
          <ProgressRing value={score} size={100} strokeWidth={8}>
            <span className="text-2xl font-bold">{score}</span>
            <span className="text-[10px] text-muted-foreground">/100</span>
          </ProgressRing>
          <div>
            <h3 className="font-semibold">Score Patrimonial</h3>
            <p className="text-sm text-muted-foreground">
              {score >= 70 ? 'Excellent !' : score >= 40 ? 'Bonne dynamique !' : 'Continue à progresser.'}
            </p>
            {netWorth > 0 && <p className="text-xs text-muted-foreground mt-1">Valeur nette : {formatAmount(netWorth, currency)}</p>}
          </div>
        </div>
        <div className="rounded-xl border bg-card p-5 flex flex-col justify-center">
          <XPBar currentXP={xpTotal} level={level} />
          <p className="mt-2 text-xs text-muted-foreground">+{xpTotal} XP total</p>
        </div>
      </div>

      {/* Recurring to confirm */}
      {recurringToConfirm.length > 0 && (
        <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 space-y-2">
          <h3 className="text-sm font-semibold text-primary">🔄 Récurrences à confirmer</h3>
          <p className="text-xs text-muted-foreground">Ces revenus/dépenses récurrents sont dus. Confirme-les dans Budget pour garder ton suivi à jour.</p>
          {recurringToConfirm.slice(0, 5).map(r => (
            <Link key={r.id} to="/budget" className="flex items-center justify-between text-sm hover:underline">
              <span>{r.type === 'income' ? '↑' : '↓'} {r.note || r.category} — {formatAmount(Math.abs(r.amount), currency)}</span>
              <span className="text-xs text-muted-foreground">Échéance : {r.next_date}</span>
            </Link>
          ))}
        </div>
      )}

      {/* Project alerts */}
      {projectAlerts.length > 0 && (
        <div className="rounded-xl border border-warning/30 bg-warning/5 p-4 space-y-2">
          <h3 className="text-sm font-semibold text-warning">⚠️ Alertes projets</h3>
          {projectAlerts.map(p => {
            const daysLeft = Math.ceil((new Date(p.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
            const pct = p.target_amount > 0 ? Math.round((p.current_amount / p.target_amount) * 100) : 0;
            return (
              <Link key={p.id} to="/projets" className="flex items-center justify-between text-sm hover:underline">
                <span>{p.icon} {p.title} — {pct}% atteint</span>
                <span className="text-xs text-muted-foreground">{daysLeft}j restants</span>
              </Link>
            );
          })}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MetricCard icon={<TrendingUp className="h-4 w-4" />} title="Revenus" value={formatAmount(incomes, currency)} />
        <MetricCard icon={<TrendingDown className="h-4 w-4" />} title="Dépenses" value={formatAmount(expenses, currency)} />
        <MetricCard icon={<PiggyBank className="h-4 w-4" />} title="Épargne" value={formatAmount(savings, currency)} trend={savings < 0 ? 'down' : undefined} />
        <MetricCard icon={<Percent className="h-4 w-4" />} title="Taux d'épargne" value={`${savingsRate}%`} trend={savingsRate < 0 ? 'down' : undefined} />
      </div>
      {savingsRate < 0 && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 flex items-start gap-3">
          <TrendingDown className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-destructive">⚠️ Tes dépenses dépassent tes revenus ce mois-ci</p>
            <p className="text-xs text-muted-foreground mt-1">Déficit de {formatAmount(Math.abs(savings), currency)}. Consulte ton budget pour identifier les postes à réduire.</p>
          </div>
        </div>
      )}

      {/* Monthly chart */}
      {transactions.length > 0 && (
        <div className="rounded-xl border bg-card p-5">
          <h3 className="mb-4 font-semibold">Revenus vs Dépenses (6 mois)</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="name" className="text-xs" tick={{ fontSize: 12 }} />
              <YAxis className="text-xs" tick={{ fontSize: 12 }} />
              <Tooltip formatter={(v: number) => formatAmount(v, currency)} />
              <Bar dataKey="revenus" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Revenus" />
              <Bar dataKey="depenses" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} name="Dépenses" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <ChallengeDuMois />
      <DailyQuiz />

      <div className="rounded-xl border bg-card p-4 flex items-start gap-3">
        <Lightbulb className="h-5 w-5 text-warning shrink-0 mt-0.5" />
        <div>
          <h4 className="text-sm font-semibold">Le saviez-vous ?</h4>
          <p className="text-sm text-muted-foreground">{tip}</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div>
          <h3 className="mb-3 font-semibold">Modules</h3>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {modules.map(m => (
              <Link key={m.to} to={m.to} className="flex flex-col items-center gap-2 rounded-xl border bg-card p-4 transition-shadow hover:shadow-md">
                <m.icon className={`h-6 w-6 ${m.color}`} />
                <span className="text-sm font-medium">{m.title}</span>
              </Link>
            ))}
          </div>
          <div className="mt-4">
            <Leaderboard limit={5} />
          </div>
        </div>
        <div>
          <h3 className="mb-3 font-semibold">Dernières transactions</h3>
          {recentTx.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">Aucune transaction pour le moment.</p>
          ) : (
            <div className="space-y-2">
              {recentTx.map(tx => (
                <div key={tx.id} className="flex items-center justify-between rounded-lg border bg-card px-3 py-2">
                  <div>
                    <p className="text-sm font-medium">{tx.note || tx.category}</p>
                    <p className="text-xs text-muted-foreground">{tx.date}</p>
                  </div>
                  <span className={`text-sm font-semibold ${tx.type === 'income' ? 'text-emerald-600' : 'text-foreground'}`}>
                    {tx.type === 'income' ? '+' : ''}{formatAmount(tx.amount, currency)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
