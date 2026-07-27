import { useState, useEffect, useMemo } from 'react';
import { SEO } from '@/components/SEO';
import { ProgressRing } from '@/components/ProgressRing';
import { EmptyState } from '@/components/EmptyState';
import { PatrimoineSankey } from '@/components/SankeyChart';
import { formatAmount } from '@/lib/formatCurrency';
import { TrendingUp, Plus, Trash2, Pencil, Wallet, Loader2, Minus, Building, Landmark, Coins, ArrowUpRight, ArrowDownRight, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useBadges } from '@/hooks/useBadges';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { calculateScore } from '@/lib/patrimonialScore';
import type { Currency } from '@/types';

const envelopeTypesFR = ['Épargne réglementée', 'Assurance Vie', 'PEA', 'PER', 'CTO', 'Crypto', 'Immobilier', 'Liquidités', 'Autres'];
const envelopeTypesCH = ['3ème Pilier A', '3ème Pilier B', 'CTO', 'Crypto', 'Immobilier', 'Liquidités', 'Autres'];
const liabilityTypes = ['Crédit immobilier', 'Crédit conso', 'Prêt étudiant', 'Leasing', 'Autre dette'];

const categoryColors: Record<string, string> = {
  'Épargne réglementée': '#10B981',
  'Assurance Vie': '#3B82F6',
  'PEA': '#8B5CF6',
  'PER': '#F59E0B',
  'CTO': '#06B6D4',
  'Crypto': '#F97316',
  'Immobilier': '#EC4899',
  'Liquidités': '#64748B',
  'Autres': '#6366F1',
  '3ème Pilier A': '#10B981',
  '3ème Pilier B': '#3B82F6',
};

interface PatrimoineEntry {
  id: string; label: string; envelope_type: string; amount: number; currency: string; date: string;
}
interface Liability {
  id: string; label: string; liability_type: string; amount: number; currency: string;
}

export default function PatrimoinePage() {
  const { user, profile } = useAuth();
  const { awardBadge } = useBadges();
  const currency = (profile?.currency ?? 'EUR') as Currency;
  const market = profile?.market ?? 'FR';
  const envelopeTypes = market === 'CH' ? envelopeTypesCH : envelopeTypesFR;

  const [entries, setEntries] = useState<PatrimoineEntry[]>([]);
  const [liabilities, setLiabilities] = useState<Liability[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showLiabilityForm, setShowLiabilityForm] = useState(false);
  const [editing, setEditing] = useState<PatrimoineEntry | null>(null);
  const [editingLiability, setEditingLiability] = useState<Liability | null>(null);
  const [saving, setSaving] = useState(false);

  const [formLabel, setFormLabel] = useState('');
  const [formType, setFormType] = useState(envelopeTypes[0]);
  const [formAmount, setFormAmount] = useState('');

  const [liabLabel, setLiabLabel] = useState('');
  const [liabType, setLiabType] = useState(liabilityTypes[0]);
  const [liabAmount, setLiabAmount] = useState('');

  const fetchAll = async () => {
    if (!user) return;
    const [{ data: assets }, { data: debts }] = await Promise.all([
      supabase.from('patrimoine_entries').select('*').eq('user_id', user.id).order('amount', { ascending: false }),
      supabase.from('patrimoine_liabilities').select('*').eq('user_id', user.id).order('amount', { ascending: false }),
    ]);
    if (assets) setEntries(assets);
    if (debts) setLiabilities(debts as Liability[]);
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, [user]);

  // Asset handlers
  const openAdd = () => { setEditing(null); setFormLabel(''); setFormType(envelopeTypes[0]); setFormAmount(''); setShowForm(true); };
  const openEdit = (e: PatrimoineEntry) => { setEditing(e); setFormLabel(e.label); setFormType(e.envelope_type); setFormAmount(String(e.amount)); setShowForm(true); };

  const handleSave = async () => {
    if (!user || !formLabel.trim() || !formAmount) return;
    setSaving(true);
    const payload = { user_id: user.id, label: formLabel.trim(), envelope_type: formType, amount: Number(formAmount), currency, market: profile?.market ?? 'FR' };
    if (editing) {
      const { error } = await supabase.from('patrimoine_entries').update(payload).eq('id', editing.id);
      if (error) { toast.error('Erreur'); setSaving(false); return; }
      toast.success('Enveloppe modifiée');
    } else {
      const { error } = await supabase.from('patrimoine_entries').insert(payload);
      if (error) { toast.error('Erreur'); setSaving(false); return; }
      toast.success('Enveloppe ajoutée');
      await awardBadge('investor');
      const { count } = await supabase.from('patrimoine_entries').select('*', { count: 'exact', head: true }).eq('user_id', user.id);
      if ((count ?? 0) >= 5) await awardBadge('patrimoine_master');
    }
    setSaving(false); setShowForm(false); fetchAll();
    if (!editing) {
      const { data: allEntries } = await supabase.from('patrimoine_entries').select('amount').eq('user_id', user.id);
      const totalAmount = (allEntries ?? []).reduce((s, e) => s + Number(e.amount), 0);
      if (totalAmount >= 10000) await awardBadge('patrimoine');
    }
  };

  const handleDelete = async (id: string) => {
    await supabase.from('patrimoine_entries').delete().eq('id', id);
    toast.success('Enveloppe supprimée'); fetchAll();
  };

  // Liability handlers
  const openAddLiability = () => { setEditingLiability(null); setLiabLabel(''); setLiabType(liabilityTypes[0]); setLiabAmount(''); setShowLiabilityForm(true); };
  const openEditLiability = (l: Liability) => { setEditingLiability(l); setLiabLabel(l.label); setLiabType(l.liability_type); setLiabAmount(String(l.amount)); setShowLiabilityForm(true); };

  const handleSaveLiability = async () => {
    if (!user || !liabLabel.trim() || !liabAmount) return;
    setSaving(true);
    const payload = { user_id: user.id, label: liabLabel.trim(), liability_type: liabType, amount: Number(liabAmount), currency, market: profile?.market ?? 'FR' };
    if (editingLiability) {
      const { error } = await supabase.from('patrimoine_liabilities').update(payload).eq('id', editingLiability.id);
      if (error) { toast.error('Erreur'); setSaving(false); return; }
      toast.success('Dette modifiée');
    } else {
      const { error } = await supabase.from('patrimoine_liabilities').insert(payload);
      if (error) { toast.error('Erreur'); setSaving(false); return; }
      toast.success('Dette ajoutée');
    }
    setSaving(false); setShowLiabilityForm(false); fetchAll();
  };

  const handleDeleteLiability = async (id: string) => {
    await supabase.from('patrimoine_liabilities').delete().eq('id', id);
    toast.success('Dette supprimée'); fetchAll();
  };

  const totalAssets = entries.reduce((s, e) => s + e.amount, 0);
  const totalLiabilities = liabilities.reduce((s, l) => s + l.amount, 0);
  const netWorth = totalAssets - totalLiabilities;
  const diversification = new Set(entries.map(e => e.envelope_type)).size;
  const debtRatio = totalAssets > 0 ? Math.round((totalLiabilities / totalAssets) * 100) : 0;
  const { total: score } = calculateScore({ savingsRate: 20, emergencyFund: 3, diversification, academyProgress: 0, budgetControl: 50, debtRatio });

  // Data for Sankey chart
  const sankeyCategories = useMemo(() => {
    const map = new Map<string, number>();
    entries.forEach(e => map.set(e.envelope_type, (map.get(e.envelope_type) ?? 0) + e.amount));
    return Array.from(map.entries()).map(([name, value]) => ({
      name,
      value,
      color: categoryColors[name] ?? '#64748B',
    })).sort((a, b) => b.value - a.value);
  }, [entries]);

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <SEO title="Patrimoine" description="Vue consolidée de vos actifs et passifs : épargne, investissements et dettes." path="/patrimoine" />
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Patrimoine</h1>
        <div className="flex gap-2">
          <Button onClick={openAdd} size="sm" className="bg-emerald-500 hover:bg-emerald-600">
            <Plus className="h-4 w-4 mr-1" />
            Actif
          </Button>
          <Button onClick={openAddLiability} size="sm" variant="outline" className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white">
            <Plus className="h-4 w-4 mr-1" />
            Passif
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border-emerald-500/20">
          <CardContent className="pt-5">
            <div className="flex items-center justify-between">
              <div className="rounded-xl bg-emerald-500/20 p-2.5">
                <ArrowUpRight className="h-5 w-5 text-emerald-600" />
              </div>
              <span className="text-xs text-emerald-600 font-medium">{entries.length} enveloppes</span>
            </div>
            <p className="mt-3 text-2xl font-bold text-emerald-600">{formatAmount(totalAssets, currency)}</p>
            <p className="text-xs text-muted-foreground">Actifs</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-500/10 to-red-500/5 border-red-500/20">
          <CardContent className="pt-5">
            <div className="flex items-center justify-between">
              <div className="rounded-xl bg-red-500/20 p-2.5">
                <ArrowDownRight className="h-5 w-5 text-red-600" />
              </div>
              <span className="text-xs text-red-600 font-medium">{liabilities.length} dettes</span>
            </div>
            <p className="mt-3 text-2xl font-bold text-red-600">{formatAmount(totalLiabilities, currency)}</p>
            <p className="text-xs text-muted-foreground">Passifs</p>
            {totalAssets > 0 && (
              <div className="mt-2">
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-red-500 rounded-full" style={{ width: `${Math.min(debtRatio, 100)}%` }} />
                  </div>
                  <span className="text-[10px] text-muted-foreground">{debtRatio}%</span>
                </div>
                <p className="text-[9px] text-muted-foreground mt-1">Ratio dette/actifs</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500/10 via-violet-500/5 to-blue-500/5 border-blue-500/20">
          <CardContent className="pt-5">
            <div className="flex items-center justify-between">
              <div className="rounded-xl bg-blue-500/20 p-2.5">
                <Landmark className="h-5 w-5 text-blue-600" />
              </div>
              <ProgressRing value={score} size={48} strokeWidth={4}>
                <span className="text-xs font-bold">{score}</span>
              </ProgressRing>
            </div>
            <p className={`mt-3 text-2xl font-bold ${netWorth >= 0 ? 'text-blue-600' : 'text-red-600'}`}>{formatAmount(netWorth, currency)}</p>
            <p className="text-xs text-muted-foreground">Patrimoine net</p>
            <p className="text-[9px] text-muted-foreground mt-1">Score patrimonial : {score}/100</p>
          </CardContent>
        </Card>
      </div>

      {/* Sankey Chart */}
      {sankeyCategories.length > 0 && totalAssets > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <ArrowRight className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Répartition du patrimoine</CardTitle>
            </div>
            <CardDescription>Visualisation de la distribution de vos actifs par type d'enveloppe</CardDescription>
          </CardHeader>
          <CardContent>
            <PatrimoineSankey
              totalAssets={totalAssets}
              categories={sankeyCategories}
              currency={currency}
            />
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="assets">
        <TabsList>
          <TabsTrigger value="assets">Actifs ({entries.length})</TabsTrigger>
          <TabsTrigger value="liabilities">Passifs ({liabilities.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="assets" className="space-y-4">
          {entries.length === 0 ? (
            <EmptyState emoji="🏦" title="Aucune enveloppe" description="Ajoute ta première enveloppe (Livret A, PEA, 3ème pilier…) pour suivre ton patrimoine."
              action={<Button onClick={openAdd} size="sm"><Plus className="mr-1 h-4 w-4" />Ajouter</Button>} />
          ) : (
            <div className="space-y-3">
              {entries.map(e => (
                <div key={e.id} className="flex items-center justify-between rounded-xl border bg-card px-4 py-3 group">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-3 h-3 rounded-full shrink-0" 
                      style={{ backgroundColor: categoryColors[e.envelope_type] ?? '#64748B' }}
                    />
                    <div>
                      <p className="text-sm font-medium">{e.label}</p>
                      <p className="text-xs text-muted-foreground">{e.envelope_type}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <p className="font-semibold">{formatAmount(e.amount, currency)}</p>
                      {totalAssets > 0 && <p className="text-xs text-muted-foreground">{Math.round((e.amount / totalAssets) * 100)}%</p>}
                    </div>
                    <button onClick={() => openEdit(e)} className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground"><Pencil className="h-3.5 w-3.5" /></button>
                    <button onClick={() => handleDelete(e.id)} className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="liabilities" className="space-y-4">
          {liabilities.length === 0 ? (
            <EmptyState emoji="📉" title="Aucun passif" description="Ajoute tes dettes et crédits pour calculer ta valeur nette."
              action={<Button onClick={openAddLiability} size="sm"><Plus className="mr-1 h-4 w-4" />Ajouter</Button>} />
          ) : (
            <div className="space-y-3">
              {liabilities.map(l => (
                <div key={l.id} className="flex items-center justify-between rounded-xl border bg-card px-4 py-3 group">
                  <div>
                    <p className="text-sm font-medium">{l.label}</p>
                    <p className="text-xs text-muted-foreground">{l.liability_type}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-destructive">-{formatAmount(l.amount, currency)}</p>
                    <button onClick={() => openEditLiability(l)} className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground"><Pencil className="h-3.5 w-3.5" /></button>
                    <button onClick={() => handleDeleteLiability(l.id)} className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Asset form */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? 'Modifier l\'enveloppe' : 'Nouvelle enveloppe'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Nom</Label><Input value={formLabel} onChange={e => setFormLabel(e.target.value)} placeholder="ex: Livret A" maxLength={100} /></div>
            <div>
              <Label>Type d'enveloppe</Label>
              <Select value={formType} onValueChange={setFormType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{envelopeTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Montant ({currency})</Label><Input type="number" min="0" step="0.01" value={formAmount} onChange={e => setFormAmount(e.target.value)} /></div>
            <Button onClick={handleSave} disabled={saving || !formLabel.trim() || !formAmount} className="w-full">
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editing ? 'Modifier' : 'Ajouter'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Liability form */}
      <Dialog open={showLiabilityForm} onOpenChange={setShowLiabilityForm}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingLiability ? 'Modifier la dette' : 'Nouvelle dette'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Nom</Label><Input value={liabLabel} onChange={e => setLiabLabel(e.target.value)} placeholder="ex: Crédit maison" maxLength={100} /></div>
            <div>
              <Label>Type</Label>
              <Select value={liabType} onValueChange={setLiabType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{liabilityTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Montant restant ({currency})</Label><Input type="number" min="0" step="0.01" value={liabAmount} onChange={e => setLiabAmount(e.target.value)} /></div>
            <Button onClick={handleSaveLiability} disabled={saving || !liabLabel.trim() || !liabAmount} className="w-full">
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingLiability ? 'Modifier' : 'Ajouter'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
