import { useState, useEffect, useMemo } from 'react';
import { SEO } from '@/components/SEO';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EmptyState } from '@/components/EmptyState';
import { SankeyChart } from '@/components/SankeyChart';
import { formatAmount } from '@/lib/formatCurrency';
import { 
  Plus, TrendingUp, TrendingDown, PiggyBank, Percent, Trash2, Pencil, 
  Loader2, RefreshCw, Target, Sparkles, ArrowRight, BarChart3, 
  ChevronDown, ChevronUp, Wallet, Calculator
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useAuth } from '@/contexts/AuthContext';
import { useXP } from '@/hooks/useXP';
import { useBadges } from '@/hooks/useBadges';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line, Legend } from 'recharts';
import type { Currency } from '@/types';

const categoriesFR = ['Logement', 'Alimentation', 'Transport', 'Loisirs', 'Santé', 'Épargne', 'Abonnements', 'Salaire', 'Freelance', 'Autres'];
const categoriesCH = ['Loyer', 'Nourriture', 'Transports', 'Loisirs', 'LAMal', 'Prévoyance', 'Impôts', 'Salaire', 'Freelance', 'Autres'];
const expenseCategoriesFR = ['Logement', 'Alimentation', 'Transport', 'Loisirs', 'Santé', 'Épargne', 'Abonnements', 'Autres'];
const expenseCategoriesCH = ['Loyer', 'Nourriture', 'Transports', 'Loisirs', 'LAMal', 'Prévoyance', 'Impôts', 'Autres'];
const colors: Record<string, string> = {
  'Logement': '#1D4ED8', 'Loyer': '#1D4ED8',
  'Alimentation': '#059669', 'Nourriture': '#059669',
  'Transport': '#D97706', 'Transports': '#D97706',
  'Loisirs': '#DC2626',
  'Santé': '#7C3AED', 'LAMal': '#7C3AED',
  'Épargne': '#0891B2', 'Prévoyance': '#0891B2',
  'Abonnements': '#DB2777', 'Impôts': '#DB2777',
  'Autres': '#64748B',
  'Salaire': '#16A34A', 'Freelance': '#EA580C',
};

interface Transaction {
  id: string; amount: number; category: string; type: string; date: string; note: string | null; currency: string;
}
interface RecurringTx {
  id: string; amount: number; category: string; type: string; note: string | null; currency: string; frequency: string; next_date: string; active: boolean;
}
interface BudgetCeiling {
  id: string; category: string; ceiling_amount: number;
}

export default function BudgetPage() {
  const { user, profile } = useAuth();
  const currency = (profile?.currency ?? 'EUR') as Currency;
  const market = profile?.market ?? 'FR';
  const { grantXP, updateStreak } = useXP();
  const { awardBadge } = useBadges();
  const categories = market === 'CH' ? categoriesCH : categoriesFR;
  const expenseCategories = market === 'CH' ? expenseCategoriesCH : expenseCategoriesFR;

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [recurringTx, setRecurringTx] = useState<RecurringTx[]>([]);
  const [ceilings, setCeilings] = useState<BudgetCeiling[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showRecurringForm, setShowRecurringForm] = useState(false);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [editingRecurring, setEditingRecurring] = useState<RecurringTx | null>(null);
  const [saving, setSaving] = useState(false);
  const [projMonths, setProjMonths] = useState(6);
  const [showTransactions, setShowTransactions] = useState(false);
  const [editingBudget, setEditingBudget] = useState<string | null>(null);
  const [budgetInputValue, setBudgetInputValue] = useState('');

  const [formNote, setFormNote] = useState('');
  const [formAmount, setFormAmount] = useState('');
  const [formCategory, setFormCategory] = useState('Autres');
  const [formType, setFormType] = useState<'income' | 'expense'>('expense');
  const [formDate, setFormDate] = useState(new Date().toISOString().slice(0, 10));
  const [formFrequency, setFormFrequency] = useState('monthly');

  const fetchAll = async () => {
    if (!user) return;
    const [{ data: txData }, { data: recData }, { data: ceilData }] = await Promise.all([
      supabase.from('transactions').select('*').eq('user_id', user.id).order('date', { ascending: false }),
      supabase.from('recurring_transactions').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      supabase.from('budget_ceilings').select('*').eq('user_id', user.id),
    ]);
    if (txData) setTransactions(txData);
    if (recData) setRecurringTx(recData as RecurringTx[]);
    if (ceilData) setCeilings(ceilData as BudgetCeiling[]);
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, [user]);

  // Transaction form handlers
  const openAdd = () => { setEditing(null); setFormNote(''); setFormAmount(''); setFormCategory(categories[categories.length - 1]); setFormType('expense'); setFormDate(new Date().toISOString().slice(0, 10)); setShowForm(true); };
  const openEdit = (tx: Transaction) => { setEditing(tx); setFormNote(tx.note ?? ''); setFormAmount(String(Math.abs(tx.amount))); setFormCategory(tx.category); setFormType(tx.type as 'income' | 'expense'); setFormDate(tx.date); setShowForm(true); };

  const handleSave = async () => {
    if (!user || !formAmount || !formNote.trim()) return;
    setSaving(true);
    const amount = formType === 'expense' ? -Math.abs(Number(formAmount)) : Math.abs(Number(formAmount));
    const payload = { user_id: user.id, amount, category: formCategory, type: formType, date: formDate, note: formNote.trim(), currency };
    if (editing) {
      const { error } = await supabase.from('transactions').update(payload).eq('id', editing.id);
      if (error) { toast.error('Erreur'); setSaving(false); return; }
      toast.success('Transaction modifiée');
    } else {
      const { error } = await supabase.from('transactions').insert(payload);
      if (error) { toast.error('Erreur'); setSaving(false); return; }
      toast.success('Transaction ajoutée');
      await grantXP(10, 'Transaction ajoutée');
      await updateStreak();
      if (formType === 'income' || formCategory === 'Épargne' || formCategory === 'Prévoyance') {
        await awardBadge('saver');
      }
    }
    setSaving(false); setShowForm(false); fetchAll();
  };

  const handleDelete = async (id: string) => {
    await supabase.from('transactions').delete().eq('id', id);
    toast.success('Supprimé'); fetchAll();
  };

  // Recurring transaction handlers
  const openAddRecurring = () => { setEditingRecurring(null); setFormNote(''); setFormAmount(''); setFormCategory(categories[categories.length - 1]); setFormType('expense'); setFormFrequency('monthly'); setShowRecurringForm(true); };
  const openEditRecurring = (r: RecurringTx) => { setEditingRecurring(r); setFormNote(r.note ?? ''); setFormAmount(String(Math.abs(r.amount))); setFormCategory(r.category); setFormType(r.type as 'income' | 'expense'); setFormFrequency(r.frequency); setShowRecurringForm(true); };

  const handleSaveRecurring = async () => {
    if (!user || !formAmount || !formNote.trim()) return;
    setSaving(true);
    const amount = formType === 'expense' ? -Math.abs(Number(formAmount)) : Math.abs(Number(formAmount));
    const payload = { user_id: user.id, amount, category: formCategory, type: formType, note: formNote.trim(), currency, frequency: formFrequency, next_date: new Date().toISOString().slice(0, 10), active: true };
    if (editingRecurring) {
      const { error } = await supabase.from('recurring_transactions').update(payload).eq('id', editingRecurring.id);
      if (error) { toast.error('Erreur'); setSaving(false); return; }
      toast.success('Récurrence modifiée');
    } else {
      const { error } = await supabase.from('recurring_transactions').insert(payload);
      if (error) { toast.error('Erreur'); setSaving(false); return; }
      toast.success('Récurrence ajoutée');
    }
    setSaving(false); setShowRecurringForm(false); fetchAll();
  };

  const handleDeleteRecurring = async (id: string) => {
    await supabase.from('recurring_transactions').delete().eq('id', id);
    toast.success('Récurrence supprimée'); fetchAll();
  };

  const handleToggleRecurring = async (r: RecurringTx) => {
    await supabase.from('recurring_transactions').update({ active: !r.active }).eq('id', r.id);
    fetchAll();
  };

  // Budget handlers
  const handleSaveBudget = async (category: string, amount: number) => {
    if (!user) return;
    const { error } = await supabase.from('budget_ceilings').upsert(
      { user_id: user.id, category, ceiling_amount: amount, currency },
      { onConflict: 'user_id,category' }
    );
    if (error) { toast.error('Erreur'); return; }
    toast.success('Budget enregistré');
    setEditingBudget(null);
    fetchAll();
  };

  const handleDeleteBudget = async (id: string) => {
    await supabase.from('budget_ceilings').delete().eq('id', id);
    toast.success('Budget supprimé'); fetchAll();
  };

  const handleAutoFillBudgets = async () => {
    if (!user) return;
    setSaving(true);
    const budgetsToCreate = categorySpending
      .filter(c => c.spent > 0 && !ceilings.find(ceil => ceil.category === c.category))
      .map(c => ({
        user_id: user.id,
        category: c.category,
        ceiling_amount: Math.ceil(c.spent / 10) * 10, // Round up to nearest 10
        currency
      }));
    
    if (budgetsToCreate.length === 0) {
      toast.info('Tous les budgets sont déjà définis');
      setSaving(false);
      return;
    }

    const { error } = await supabase.from('budget_ceilings').upsert(budgetsToCreate, { onConflict: 'user_id,category' });
    if (error) { toast.error('Erreur'); setSaving(false); return; }
    toast.success(`${budgetsToCreate.length} budget(s) créé(s) automatiquement`);
    setSaving(false);
    fetchAll();
  };

  // Convert recurring to monthly amounts
  const recurringMonthly = useMemo(() => {
    return recurringTx.filter(r => r.active).map(r => {
      let monthlyAmount = r.amount;
      if (r.frequency === 'weekly') monthlyAmount = r.amount * (52 / 12);
      if (r.frequency === 'yearly') monthlyAmount = r.amount / 12;
      return { ...r, monthlyAmount };
    });
  }, [recurringTx]);

  const recurringMonthlyIncome = recurringMonthly.filter(r => r.type === 'income').reduce((s, r) => s + Math.abs(r.monthlyAmount), 0);
  const recurringMonthlyExpense = recurringMonthly.filter(r => r.type === 'expense').reduce((s, r) => s + Math.abs(r.monthlyAmount), 0);

  // Current month transactions
  const now = new Date();
  const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const currentMonthTx = transactions.filter(t => t.date?.startsWith(currentMonthKey));

  const txIncomes = currentMonthTx.filter(t => t.type === 'income').reduce((s, t) => s + Math.abs(t.amount), 0);
  const txExpenses = currentMonthTx.filter(t => t.type === 'expense').reduce((s, t) => s + Math.abs(t.amount), 0);

  const incomes = txIncomes + recurringMonthlyIncome;
  const expenses = txExpenses + recurringMonthlyExpense;
  const savings = incomes - expenses;
  const savingsRate = incomes > 0 ? Math.round((savings / incomes) * 100) : 0;

  // Category spending with budget comparison
  const categorySpending = useMemo(() => {
    const spendingMap = new Map<string, number>();
    
    // Add current month transactions
    currentMonthTx.filter(t => t.type === 'expense').forEach(t => {
      spendingMap.set(t.category, (spendingMap.get(t.category) ?? 0) + Math.abs(t.amount));
    });
    
    // Add recurring expenses
    recurringMonthly.filter(r => r.type === 'expense').forEach(r => {
      spendingMap.set(r.category, (spendingMap.get(r.category) ?? 0) + Math.abs(r.monthlyAmount));
    });

    // Map all expense categories with their spending and budget
    return expenseCategories.map(category => {
      const spent = spendingMap.get(category) ?? 0;
      const budget = ceilings.find(c => c.category === category);
      const budgetAmount = budget?.ceiling_amount ?? 0;
      const pct = budgetAmount > 0 ? Math.round((spent / budgetAmount) * 100) : 0;
      
      return {
        category,
        spent,
        budget: budget ?? null,
        budgetAmount,
        pct,
        color: colors[category] ?? '#64748B',
      };
    }).sort((a, b) => b.spent - a.spent);
  }, [currentMonthTx, recurringMonthly, ceilings, expenseCategories]);

  // For Sankey chart
  const sankeyExpenses = categorySpending.filter(c => c.spent > 0).map(c => ({ category: c.category, amount: c.spent }));

  // Annual chart
  const annualData = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const name = d.toLocaleDateString('fr-FR', { month: 'short' });
      const monthTx = transactions.filter(t => t.date?.startsWith(key));
      const txRev = monthTx.filter(t => t.type === 'income').reduce((s, t) => s + Math.abs(t.amount), 0);
      const txDep = monthTx.filter(t => t.type === 'expense').reduce((s, t) => s + Math.abs(t.amount), 0);
      return { name, revenus: txRev + recurringMonthlyIncome, depenses: txDep + recurringMonthlyExpense };
    });
  }, [transactions, recurringMonthlyIncome, recurringMonthlyExpense]);

  // Projection
  const projectionData = useMemo(() => {
    const monthlyNet = incomes - expenses;
    let solde = savings;
    return Array.from({ length: projMonths + 1 }, (_, m) => {
      const val = { mois: `M+${m}`, solde: Math.round(solde) };
      solde += monthlyNet;
      return val;
    });
  }, [incomes, expenses, projMonths, savings]);

  const freqLabel = (f: string) => f === 'monthly' ? 'Mensuel' : f === 'weekly' ? 'Hebdo' : 'Annuel';
  const totalBudget = ceilings.reduce((s, c) => s + c.ceiling_amount, 0);
  const budgetUsedPct = totalBudget > 0 ? Math.round((expenses / totalBudget) * 100) : 0;

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <SEO title="Budget" description="Suivez vos revenus et dépenses, gérez vos catégories et récurrences." path="/budget" />
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Budget</h1>
        <Button onClick={openAdd} size="sm" className="bg-emerald-500 hover:bg-emerald-600">
          <Plus className="h-4 w-4 mr-1" />
          Transaction
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border-emerald-500/20">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="rounded-lg bg-emerald-500/20 p-2">
                <TrendingUp className="h-4 w-4 text-emerald-600" />
              </div>
              <span className="text-xs text-muted-foreground">Revenus</span>
            </div>
            <p className="text-xl font-bold text-emerald-600">{formatAmount(incomes, currency)}</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-500/10 to-red-500/5 border-red-500/20">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="rounded-lg bg-red-500/20 p-2">
                <TrendingDown className="h-4 w-4 text-red-600" />
              </div>
              <span className="text-xs text-muted-foreground">Dépenses</span>
            </div>
            <p className="text-xl font-bold text-red-600">{formatAmount(expenses, currency)}</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="rounded-lg bg-blue-500/20 p-2">
                <PiggyBank className="h-4 w-4 text-blue-600" />
              </div>
              <span className="text-xs text-muted-foreground">Épargne</span>
            </div>
            <p className={`text-xl font-bold ${savings >= 0 ? 'text-blue-600' : 'text-red-600'}`}>{formatAmount(savings, currency)}</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-violet-500/10 to-violet-500/5 border-violet-500/20">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="rounded-lg bg-violet-500/20 p-2">
                <Percent className="h-4 w-4 text-violet-600" />
              </div>
              <span className="text-xs text-muted-foreground">Taux d'épargne</span>
            </div>
            <p className={`text-xl font-bold ${savingsRate >= 0 ? 'text-violet-600' : 'text-red-600'}`}>{savingsRate}%</p>
          </CardContent>
        </Card>
      </div>

      {/* SECTION 1: Dépenses réelles par catégorie */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Mes dépenses ce mois</CardTitle>
            </div>
            <span className="text-sm text-muted-foreground">
              {now.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
            </span>
          </div>
          <CardDescription>Répartition de tes dépenses par catégorie</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {categorySpending.filter(c => c.spent > 0).length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              <Wallet className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Aucune dépense ce mois-ci</p>
              <Button onClick={openAdd} variant="outline" size="sm" className="mt-2">
                <Plus className="h-4 w-4 mr-1" />
                Ajouter une transaction
              </Button>
            </div>
          ) : (
            <>
              {categorySpending.filter(c => c.spent > 0).map(cat => (
                <div key={cat.category} className="flex items-center gap-3">
                  <div 
                    className="w-3 h-3 rounded-full shrink-0" 
                    style={{ backgroundColor: cat.color }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium truncate">{cat.category}</span>
                      <span className="text-sm font-semibold">{formatAmount(cat.spent, currency)}</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full mt-1 overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all"
                        style={{ 
                          width: `${Math.min((cat.spent / expenses) * 100, 100)}%`,
                          backgroundColor: cat.color
                        }}
                      />
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground w-10 text-right">
                    {Math.round((cat.spent / expenses) * 100)}%
                  </span>
                </div>
              ))}
              <div className="pt-2 border-t flex items-center justify-between text-sm">
                <span className="font-medium">Total dépenses</span>
                <span className="font-bold">{formatAmount(expenses, currency)}</span>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* SECTION 2: Mon budget prévisionnel */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Mon budget</CardTitle>
            </div>
            {categorySpending.filter(c => c.spent > 0).length > 0 && (
              <Button 
                onClick={handleAutoFillBudgets} 
                variant="outline" 
                size="sm"
                disabled={saving}
              >
                <Sparkles className="h-4 w-4 mr-1" />
                Auto-remplir
              </Button>
            )}
          </div>
          <CardDescription>
            Définis un budget par catégorie basé sur tes dépenses réelles
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Global budget progress */}
          {totalBudget > 0 && (
            <div className="rounded-lg bg-muted/50 p-3 mb-4">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="font-medium">Budget global</span>
                <span className={budgetUsedPct > 100 ? 'text-destructive font-semibold' : ''}>
                  {formatAmount(expenses, currency)} / {formatAmount(totalBudget, currency)}
                </span>
              </div>
              <Progress 
                value={Math.min(budgetUsedPct, 100)} 
                className={`h-2 ${budgetUsedPct > 100 ? '[&>div]:bg-destructive' : budgetUsedPct > 80 ? '[&>div]:bg-warning' : ''}`} 
              />
              <p className="text-xs text-muted-foreground mt-1">
                {budgetUsedPct > 100 
                  ? `Dépassement de ${formatAmount(expenses - totalBudget, currency)}`
                  : `Reste ${formatAmount(totalBudget - expenses, currency)} disponible`
                }
              </p>
            </div>
          )}

          {/* Budget by category */}
          {expenseCategories.map(category => {
            const catData = categorySpending.find(c => c.category === category);
            const spent = catData?.spent ?? 0;
            const budget = catData?.budget;
            const budgetAmount = budget?.ceiling_amount ?? 0;
            const pct = budgetAmount > 0 ? Math.round((spent / budgetAmount) * 100) : 0;
            const isEditing = editingBudget === category;
            const color = colors[category] ?? '#64748B';

            return (
              <div key={category} className="rounded-lg border p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                    <span className="text-sm font-medium">{category}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {budget ? (
                      <>
                        <span className={`text-xs ${pct > 100 ? 'text-destructive font-semibold' : 'text-muted-foreground'}`}>
                          {formatAmount(spent, currency)} / {formatAmount(budgetAmount, currency)}
                        </span>
                        <button 
                          onClick={() => handleDeleteBudget(budget.id)}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </>
                    ) : isEditing ? (
                      <div className="flex items-center gap-1">
                        <Input
                          type="number"
                          value={budgetInputValue}
                          onChange={e => setBudgetInputValue(e.target.value)}
                          className="h-7 w-24 text-xs"
                          placeholder="Montant"
                          autoFocus
                        />
                        <Button 
                          size="sm" 
                          className="h-7 px-2"
                          onClick={() => {
                            if (budgetInputValue) {
                              handleSaveBudget(category, Number(budgetInputValue));
                            }
                          }}
                        >
                          OK
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost"
                          className="h-7 px-2"
                          onClick={() => setEditingBudget(null)}
                        >
                          ✕
                        </Button>
                      </div>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => {
                          setEditingBudget(category);
                          setBudgetInputValue(spent > 0 ? String(Math.ceil(spent / 10) * 10) : '');
                        }}
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Définir
                      </Button>
                    )}
                  </div>
                </div>
                {budget && (
                  <Progress 
                    value={Math.min(pct, 100)} 
                    className={`h-1.5 ${pct > 100 ? '[&>div]:bg-destructive' : pct > 80 ? '[&>div]:bg-warning' : ''}`}
                  />
                )}
                {!budget && spent > 0 && (
                  <p className="text-xs text-muted-foreground">
                    Dépensé : {formatAmount(spent, currency)} — Pas de budget défini
                  </p>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* SECTION 3: Flux financiers */}
      {incomes > 0 && sankeyExpenses.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <ArrowRight className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Flux financiers</CardTitle>
            </div>
            <CardDescription>Visualisation de tes revenus vers tes dépenses et ton épargne</CardDescription>
          </CardHeader>
          <CardContent>
            <SankeyChart
              income={incomes}
              expenses={sankeyExpenses}
              savings={savings > 0 ? savings : 0}
              currency={currency}
            />
          </CardContent>
        </Card>
      )}

      {/* Transactions collapsible */}
      <Collapsible open={showTransactions} onOpenChange={setShowTransactions}>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Wallet className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">Transactions du mois</CardTitle>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    {currentMonthTx.length + recurringMonthly.length} opérations
                  </span>
                  {showTransactions ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </div>
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="pt-0 space-y-2">
              {currentMonthTx.length === 0 && recurringMonthly.length === 0 ? (
                <EmptyState 
                  emoji="🧾" 
                  title="Aucune transaction" 
                  description="Ajoute ta première transaction pour suivre ton budget."
                  action={<Button onClick={openAdd} size="sm"><Plus className="mr-1 h-4 w-4" />Ajouter</Button>} 
                />
              ) : (
                <>
                  {recurringMonthly.map(r => (
                    <div key={`rec-${r.id}`} className="flex items-center justify-between rounded-lg border border-dashed px-4 py-3">
                      <div className="flex items-center gap-2">
                        <RefreshCw className="h-3.5 w-3.5 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">{r.note || r.category}</p>
                          <p className="text-xs text-muted-foreground">{r.category} · {freqLabel(r.frequency)}</p>
                        </div>
                      </div>
                      <span className={`text-sm font-semibold ${r.type === 'income' ? 'text-emerald-600' : ''}`}>
                        {r.type === 'income' ? '+' : ''}{formatAmount(r.monthlyAmount, currency)}/mois
                      </span>
                    </div>
                  ))}
                  {currentMonthTx.map(tx => (
                    <div key={tx.id} className="flex items-center justify-between rounded-lg border px-4 py-3 group">
                      <div>
                        <p className="text-sm font-medium">{tx.note || tx.category}</p>
                        <p className="text-xs text-muted-foreground">{tx.category} · {tx.date}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-semibold ${tx.type === 'income' ? 'text-emerald-600' : ''}`}>
                          {tx.type === 'income' ? '+' : ''}{formatAmount(tx.amount, currency)}
                        </span>
                        <button onClick={() => openEdit(tx)} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground">
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button onClick={() => handleDelete(tx.id)} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Tabs for advanced views */}
      <Tabs defaultValue="recurring" className="mt-6">
        <TabsList>
          <TabsTrigger value="recurring">
            <RefreshCw className="h-4 w-4 mr-1" />
            Récurrent
          </TabsTrigger>
          <TabsTrigger value="annual">
            <BarChart3 className="h-4 w-4 mr-1" />
            Annuel
          </TabsTrigger>
          <TabsTrigger value="projection">
            <Calculator className="h-4 w-4 mr-1" />
            Projection
          </TabsTrigger>
        </TabsList>

        <TabsContent value="recurring" className="space-y-4 mt-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Gère tes revenus et dépenses récurrentes</p>
            <Button onClick={openAddRecurring} size="sm">
              <Plus className="mr-1 h-4 w-4" />
              Ajouter
            </Button>
          </div>
          {recurringTx.length === 0 ? (
            <EmptyState 
              emoji="🔄" 
              title="Aucune récurrence" 
              description="Ajoute un revenu ou une dépense récurrente (salaire, loyer…)"
              action={<Button onClick={openAddRecurring} size="sm"><Plus className="mr-1 h-4 w-4" />Ajouter</Button>} 
            />
          ) : (
            <div className="space-y-2">
              {recurringTx.map(r => (
                <div key={r.id} className={`flex items-center justify-between rounded-lg border bg-card px-4 py-3 group ${!r.active ? 'opacity-50' : ''}`}>
                  <div className="flex items-center gap-3">
                    <RefreshCw className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div>
                      <p className="text-sm font-medium">{r.note || r.category}</p>
                      <p className="text-xs text-muted-foreground">{r.category} · {freqLabel(r.frequency)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-sm font-semibold ${r.type === 'income' ? 'text-emerald-600' : ''}`}>
                      {r.type === 'income' ? '+' : ''}{formatAmount(r.amount, currency)}
                    </span>
                    <Switch checked={r.active} onCheckedChange={() => handleToggleRecurring(r)} />
                    <button onClick={() => openEditRecurring(r)} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground">
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => handleDeleteRecurring(r.id)} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="annual" className="space-y-4 mt-4">
          {transactions.length === 0 && recurringMonthly.length === 0 ? (
            <Card className="p-6 text-center text-muted-foreground">
              Ajoute des transactions pour voir ton graphique annuel.
            </Card>
          ) : (
            <Card className="p-6">
              <h3 className="mb-4 font-semibold">Revenus vs Dépenses — 12 derniers mois</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={annualData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(v: number) => formatAmount(v, currency)} />
                  <Legend />
                  <Bar dataKey="revenus" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Revenus" />
                  <Bar dataKey="depenses" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} name="Dépenses" />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="projection" className="space-y-4 mt-4">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Projection d'épargne</h3>
              <div className="flex items-center gap-2">
                <Label className="text-xs">{projMonths} mois</Label>
                <Slider value={[projMonths]} onValueChange={v => setProjMonths(v[0])} min={1} max={24} step={1} className="w-32" />
              </div>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={projectionData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="mois" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(v: number) => formatAmount(v, currency)} />
                <Line type="monotone" dataKey="solde" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} name="Solde prévisionnel" />
              </LineChart>
            </ResponsiveContainer>
            <p className="text-xs text-muted-foreground text-center mt-2">
              Avec un taux d'épargne de {savingsRate}%, tu épargneras {formatAmount(savings * projMonths, currency)} sur {projMonths} mois
            </p>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Transaction form */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? 'Modifier' : 'Nouvelle transaction'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="flex gap-2">
              <Button variant={formType === 'expense' ? 'default' : 'outline'} className="flex-1" onClick={() => setFormType('expense')}>Dépense</Button>
              <Button variant={formType === 'income' ? 'default' : 'outline'} className="flex-1" onClick={() => setFormType('income')}>Revenu</Button>
            </div>
            <div><Label>Libellé</Label><Input value={formNote} onChange={e => setFormNote(e.target.value)} placeholder="ex: Loyer, Salaire..." /></div>
            <div><Label>Montant ({currency})</Label><Input type="number" min="0" value={formAmount} onChange={e => setFormAmount(e.target.value)} /></div>
            <div><Label>Catégorie</Label>
              <Select value={formCategory} onValueChange={setFormCategory}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Date</Label><Input type="date" value={formDate} onChange={e => setFormDate(e.target.value)} /></div>
            <Button onClick={handleSave} disabled={saving || !formNote.trim() || !formAmount} className="w-full">
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{editing ? 'Modifier' : 'Ajouter'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Recurring transaction form */}
      <Dialog open={showRecurringForm} onOpenChange={setShowRecurringForm}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingRecurring ? 'Modifier la récurrence' : 'Nouvelle récurrence'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="flex gap-2">
              <Button variant={formType === 'expense' ? 'default' : 'outline'} className="flex-1" onClick={() => setFormType('expense')}>Dépense</Button>
              <Button variant={formType === 'income' ? 'default' : 'outline'} className="flex-1" onClick={() => setFormType('income')}>Revenu</Button>
            </div>
            <div><Label>Libellé</Label><Input value={formNote} onChange={e => setFormNote(e.target.value)} placeholder="ex: Loyer, Netflix..." /></div>
            <div><Label>Montant ({currency})</Label><Input type="number" min="0" value={formAmount} onChange={e => setFormAmount(e.target.value)} /></div>
            <div><Label>Catégorie</Label>
              <Select value={formCategory} onValueChange={setFormCategory}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Fréquence</Label>
              <Select value={formFrequency} onValueChange={setFormFrequency}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly">Hebdomadaire</SelectItem>
                  <SelectItem value="monthly">Mensuel</SelectItem>
                  <SelectItem value="yearly">Annuel</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleSaveRecurring} disabled={saving || !formNote.trim() || !formAmount} className="w-full">
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{editingRecurring ? 'Modifier' : 'Ajouter'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
