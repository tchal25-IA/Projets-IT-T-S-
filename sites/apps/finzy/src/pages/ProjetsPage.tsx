import { useState, useEffect } from 'react';
import { SEO } from '@/components/SEO';
import { ProgressRing } from '@/components/ProgressRing';
import { EmptyState } from '@/components/EmptyState';
import { formatAmount } from '@/lib/formatCurrency';
import { Plus, Target, Loader2, TrendingUp, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ProjectCard } from '@/components/projects/ProjectCard';
import type { Currency } from '@/types';

interface Project {
  id: string; title: string; icon: string; target_amount: number; current_amount: number; deadline: string | null; status: string; currency: string;
}

interface Goal {
  id: string; label: string; type: string; target_value: number; current_value: number; currency: string; deadline: string | null;
}

const goalTypes = [
  { value: 'income', label: 'Revenus' },
  { value: 'expense', label: 'Dépenses' },
  { value: 'wealth', label: 'Patrimoine' },
  { value: 'savings_rate', label: "Taux d'épargne" },
  { value: 'custom', label: 'Personnalisé' },
];

export default function ProjetsPage() {
  const { user, profile } = useAuth();
  const currency = (profile?.currency ?? 'EUR') as Currency;
  const [projects, setProjects] = useState<Project[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [editing, setEditing] = useState<Project | null>(null);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [saving, setSaving] = useState(false);

  // Project form
  const [formTitle, setFormTitle] = useState('');
  const [formIcon, setFormIcon] = useState('🎯');
  const [formTarget, setFormTarget] = useState('');
  const [formCurrent, setFormCurrent] = useState('0');
  const [formDeadline, setFormDeadline] = useState('');

  // Goal form
  const [gLabel, setGLabel] = useState('');
  const [gType, setGType] = useState('wealth');
  const [gTarget, setGTarget] = useState('');
  const [gCurrent, setGCurrent] = useState('0');
  const [gDeadline, setGDeadline] = useState('');

  const fetchAll = async () => {
    if (!user) return;
    const [pRes, gRes, { data: patrimoineData }] = await Promise.all([
      supabase.from('projects').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      supabase.from('goals').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      supabase.from('patrimoine_entries').select('amount').eq('user_id', user.id),
    ]);
    if (pRes.data) setProjects(pRes.data);
    // Auto-sync wealth goals with patrimoine total
    const totalPatrimoine = (patrimoineData ?? []).reduce((s, e) => s + Number(e.amount), 0);
    const goalsData = gRes.data ?? [];
    const updatedGoals = goalsData.map(g => {
      if (g.type === 'wealth') return { ...g, current_value: totalPatrimoine };
      return g;
    });
    setGoals(updatedGoals);
    // Persist synced values
    for (const g of updatedGoals) {
      if (g.type === 'wealth' && g.current_value !== goalsData.find(og => og.id === g.id)?.current_value) {
        supabase.from('goals').update({ current_value: totalPatrimoine }).eq('id', g.id).then(() => {});
      }
    }
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, [user]);

  // Project CRUD
  const openAdd = () => { setEditing(null); setFormTitle(''); setFormIcon('🎯'); setFormTarget(''); setFormCurrent('0'); setFormDeadline(''); setShowForm(true); };
  const openEdit = (p: Project) => { setEditing(p); setFormTitle(p.title); setFormIcon(p.icon); setFormTarget(String(p.target_amount)); setFormCurrent(String(p.current_amount)); setFormDeadline(p.deadline ?? ''); setShowForm(true); };

  const handleSave = async () => {
    if (!user || !formTitle.trim() || !formTarget) return;
    setSaving(true);
    const payload = { user_id: user.id, title: formTitle.trim(), icon: formIcon, target_amount: Number(formTarget), current_amount: Number(formCurrent), deadline: formDeadline || null, currency };
    if (editing) {
      const { error } = await supabase.from('projects').update(payload).eq('id', editing.id);
      if (error) { toast.error('Erreur'); setSaving(false); return; }
      toast.success('Projet modifié');
    } else {
      const { error } = await supabase.from('projects').insert(payload);
      if (error) { toast.error('Erreur'); setSaving(false); return; }
      toast.success('Projet créé');
    }
    setSaving(false); setShowForm(false); fetchAll();
  };

  const handleDeleteProject = async (id: string) => {
    await supabase.from('projects').delete().eq('id', id);
    toast.success('Projet supprimé'); fetchAll();
  };

  // Goal CRUD
  const openAddGoal = () => { setEditingGoal(null); setGLabel(''); setGType('wealth'); setGTarget(''); setGCurrent('0'); setGDeadline(''); setShowGoalForm(true); };
  const openEditGoal = (g: Goal) => { setEditingGoal(g); setGLabel(g.label); setGType(g.type); setGTarget(String(g.target_value)); setGCurrent(String(g.current_value)); setGDeadline(g.deadline ?? ''); setShowGoalForm(true); };

  const handleSaveGoal = async () => {
    if (!user || !gLabel.trim() || !gTarget) return;
    setSaving(true);
    const payload = { user_id: user.id, label: gLabel.trim(), type: gType, target_value: Number(gTarget), current_value: Number(gCurrent), deadline: gDeadline || null, currency };
    if (editingGoal) {
      const { error } = await supabase.from('goals').update(payload).eq('id', editingGoal.id);
      if (error) { toast.error('Erreur'); setSaving(false); return; }
      toast.success('Objectif modifié');
    } else {
      const { error } = await supabase.from('goals').insert(payload);
      if (error) { toast.error('Erreur'); setSaving(false); return; }
      toast.success('Objectif créé');
    }
    setSaving(false); setShowGoalForm(false); fetchAll();
  };

  const handleDeleteGoal = async (id: string) => {
    await supabase.from('goals').delete().eq('id', id);
    toast.success('Objectif supprimé'); fetchAll();
  };

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-8 animate-fade-in">
      <SEO title="Projets" description="Définissez vos objectifs d'épargne et suivez votre progression." path="/projets" />
      <h1 className="text-2xl font-bold">Projets & Objectifs</h1>

      {/* Section 1: Projects */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Mes projets d'épargne</h2>
          <Button onClick={openAdd} size="sm" variant="outline"><Plus className="mr-1 h-4 w-4" />Projet</Button>
        </div>
        {projects.length === 0 ? (
          <EmptyState emoji="🎯" title="Aucun projet" description="Crée ton premier projet d'épargne pour commencer à économiser vers un objectif."
            action={<Button onClick={openAdd} size="sm"><Plus className="mr-1 h-4 w-4" />Créer un projet</Button>} />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {projects.map(p => (
              <ProjectCard key={p.id} project={p} currency={currency} userId={user!.id} onEdit={openEdit} onDelete={handleDeleteProject} onUpdated={fetchAll} />
            ))}
          </div>
        )}
      </section>

      {/* Section 2: Goals */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Mes objectifs financiers</h2>
          <Button onClick={openAddGoal} size="sm" variant="outline"><Plus className="mr-1 h-4 w-4" />Objectif</Button>
        </div>
        {goals.length === 0 ? (
          <EmptyState emoji="📈" title="Aucun objectif" description="Définis tes objectifs financiers (revenus, dépenses max, patrimoine) pour suivre ta progression."
            action={<Button onClick={openAddGoal} size="sm"><Plus className="mr-1 h-4 w-4" />Ajouter un objectif</Button>} />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {goals.map(g => {
              const pct = g.target_value > 0 ? Math.round((g.current_value / g.target_value) * 100) : 0;
              return (
                <div key={g.id} className="rounded-xl border bg-card p-5 space-y-3 group relative">
                  <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openEditGoal(g)} className="text-muted-foreground hover:text-foreground"><Pencil className="h-3.5 w-3.5" /></button>
                    <button onClick={() => handleDeleteGoal(g.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                  <div className="flex items-center gap-3">
                    <ProgressRing value={pct} size={48} strokeWidth={5} />
                    <div>
                      <h3 className="font-semibold">{g.label}</h3>
                      <p className="text-xs text-muted-foreground">{goalTypes.find(t => t.value === g.type)?.label ?? g.type}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>{g.type === 'savings_rate' ? `${g.current_value}%` : formatAmount(g.current_value, currency)} / {g.type === 'savings_rate' ? `${g.target_value}%` : formatAmount(g.target_value, currency)}</span>
                    <span className="text-muted-foreground">{pct}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Project Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? 'Modifier le projet' : 'Nouveau projet'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="flex gap-3">
              <div className="w-20"><Label>Icône</Label><Input value={formIcon} onChange={e => setFormIcon(e.target.value)} maxLength={2} className="text-center text-xl" /></div>
              <div className="flex-1"><Label>Nom</Label><Input value={formTitle} onChange={e => setFormTitle(e.target.value)} placeholder="ex: Voyage Japon" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Objectif ({currency})</Label><Input type="number" min="0" value={formTarget} onChange={e => setFormTarget(e.target.value)} /></div>
              <div><Label>Déjà épargné</Label><Input type="number" min="0" value={formCurrent} onChange={e => setFormCurrent(e.target.value)} /></div>
            </div>
            <div><Label>Échéance</Label><Input type="date" value={formDeadline} onChange={e => setFormDeadline(e.target.value)} /></div>
            <Button onClick={handleSave} disabled={saving || !formTitle.trim() || !formTarget} className="w-full">
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{editing ? 'Modifier' : 'Créer'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Goal Dialog */}
      <Dialog open={showGoalForm} onOpenChange={setShowGoalForm}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingGoal ? 'Modifier l\'objectif' : 'Nouvel objectif'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Intitulé</Label><Input value={gLabel} onChange={e => setGLabel(e.target.value)} placeholder="ex: Patrimoine > 30 000€" /></div>
            <div>
              <Label>Type</Label>
              <Select value={gType} onValueChange={setGType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{goalTypes.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Cible</Label><Input type="number" min="0" value={gTarget} onChange={e => setGTarget(e.target.value)} /></div>
              <div><Label>Actuel</Label><Input type="number" min="0" value={gCurrent} onChange={e => setGCurrent(e.target.value)} /></div>
            </div>
            <div><Label>Échéance</Label><Input type="date" value={gDeadline} onChange={e => setGDeadline(e.target.value)} /></div>
            <Button onClick={handleSaveGoal} disabled={saving || !gLabel.trim() || !gTarget} className="w-full">
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{editingGoal ? 'Modifier' : 'Créer'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
