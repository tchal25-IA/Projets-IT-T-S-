import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Loader2, Plus, Calendar, AlertTriangle, Trash2, Pencil, ArrowDownRight, ArrowUpRight, Target, Import, Database, X } from 'lucide-react';
import { toast } from 'sonner';
import { 
  type FinancialEvent, 
  EVENT_TYPES,
  calculateProjectionWithEvents,
  type ProjectionInputs
} from '@/lib/projectionCalculations';
import type { Currency } from '@/types';

interface Project {
  id: string;
  title: string;
  icon: string;
  target_amount: number;
  current_amount: number;
  deadline: string | null;
}

interface TimelinePlannerProps {
  projectionInputs?: ProjectionInputs | null;
  years: number;
  onYearsChange: (years: number) => void;
}

export function TimelinePlanner({ projectionInputs, years, onYearsChange }: TimelinePlannerProps) {
  const { user, profile } = useAuth();
  const currency = (profile?.currency ?? 'EUR') as Currency;

  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<FinancialEvent[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [editing, setEditing] = useState<FinancialEvent | null>(null);
  const [saving, setSaving] = useState(false);
  const [tableExists, setTableExists] = useState(true);

  // Form state
  const [formType, setFormType] = useState<FinancialEvent['type']>('house');
  const [formLabel, setFormLabel] = useState('');
  const [formAmount, setFormAmount] = useState('');
  const [formDate, setFormDate] = useState('');
  const [formIsExpense, setFormIsExpense] = useState(true);
  const [formPriority, setFormPriority] = useState<FinancialEvent['priority']>('medium');
  const [formNotes, setFormNotes] = useState('');
  const [addToProjects, setAddToProjects] = useState(false);

  const currentYear = new Date().getFullYear();

  const fetchData = async () => {
    if (!user) return;

    try {
      // Fetch projects first (always works)
      const { data: projectsData } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', user.id)
        .order('deadline', { ascending: true });

      if (projectsData) {
        setProjects(projectsData);
      }

      // Try to fetch financial_events
      const { data: eventsData, error: eventsError } = await supabase
        .from('financial_events')
        .select('*')
        .eq('user_id', user.id)
        .order('target_date', { ascending: true });

      if (eventsError) {
        console.log('Table financial_events not found:', eventsError.message);
        setTableExists(false);
        setEvents([]);
      } else {
        setTableExists(true);
        setEvents((eventsData ?? []) as FinancialEvent[]);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      setTableExists(false);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const openAdd = () => {
    setEditing(null);
    setFormType('house');
    setFormLabel('');
    setFormAmount('');
    setFormDate(new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
    setFormIsExpense(true);
    setFormPriority('medium');
    setFormNotes('');
    setAddToProjects(true);
    setShowForm(true);
  };

  const openEdit = (event: FinancialEvent) => {
    setEditing(event);
    setFormType(event.type);
    setFormLabel(event.label);
    setFormAmount(String(event.amount));
    setFormDate(event.target_date);
    setFormIsExpense(event.is_expense);
    setFormPriority(event.priority);
    setFormNotes(event.notes ?? '');
    setAddToProjects(false);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!user || !formLabel.trim() || !formAmount || !formDate) return;
    setSaving(true);

    try {
      // Always try to add to projects if requested or if table doesn't exist
      if ((addToProjects || !tableExists) && formIsExpense) {
        const projectPayload = {
          user_id: user.id,
          title: formLabel.trim(),
          icon: EVENT_TYPES[formType]?.emoji ?? '🎯',
          target_amount: Number(formAmount),
          current_amount: 0,
          deadline: formDate,
          currency,
        };
        
        const { error: projectError } = await supabase.from('projects').insert(projectPayload);
        if (projectError) {
          console.error('Error adding to projects:', projectError);
          toast.error('Erreur lors de l\'ajout au projet');
        } else {
          toast.success('Projet créé avec succès');
        }
      }

      // Try to save to financial_events if table exists
      if (tableExists) {
        const payload = {
          user_id: user.id,
          type: formType,
          label: formLabel.trim(),
          amount: Number(formAmount),
          target_date: formDate,
          is_expense: formIsExpense,
          priority: formPriority,
          notes: formNotes || null,
          linked_project_id: null,
          currency,
        };

        if (editing) {
          const { error } = await supabase
            .from('financial_events')
            .update(payload)
            .eq('id', editing.id);
          if (error) throw error;
          toast.success('Événement modifié');
        } else {
          const { error } = await supabase
            .from('financial_events')
            .insert(payload);
          if (error) throw error;
          if (!addToProjects) {
            toast.success('Événement ajouté à la timeline');
          }
        }
      }

      setShowForm(false);
      fetchData();
    } catch (error: any) {
      console.error('Save error:', error);
      if (error?.message?.includes('relation') || error?.code === '42P01') {
        setTableExists(false);
        toast.error('La table financial_events n\'existe pas encore. L\'événement a été ajouté aux projets.');
      } else {
        toast.error('Erreur lors de la sauvegarde');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteEvent = async (id: string) => {
    if (!tableExists) return;
    
    const { error } = await supabase.from('financial_events').delete().eq('id', id);
    if (error) {
      toast.error('Erreur lors de la suppression');
    } else {
      toast.success('Événement supprimé');
      fetchData();
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    const { error } = await supabase.from('projects').delete().eq('id', projectId);
    if (error) {
      toast.error('Erreur lors de la suppression du projet');
    } else {
      toast.success('Projet supprimé de la timeline');
      fetchData();
    }
  };

  const handleRemoveFromTimeline = async (item: { id: string; source: 'event' | 'project' }) => {
    if (item.source === 'event') {
      await handleDeleteEvent(item.id);
    } else {
      // Extract project ID from "project-{id}" format
      const projectId = item.id.replace('project-', '');
      await handleDeleteProject(projectId);
    }
  };

  const handleImportProject = async (project: Project) => {
    if (!user || !project.deadline) return;

    if (!tableExists) {
      toast.error('La table financial_events n\'existe pas. Exécute la migration SQL d\'abord.');
      return;
    }

    const payload = {
      user_id: user.id,
      type: 'other' as const,
      label: project.title,
      amount: project.target_amount - project.current_amount,
      target_date: project.deadline,
      is_expense: true,
      priority: 'medium' as const,
      linked_project_id: project.id,
      currency,
    };

    const { error } = await supabase.from('financial_events').insert(payload);
    if (error) {
      toast.error('Erreur lors de l\'import');
    } else {
      toast.success(`Projet "${project.title}" importé dans la timeline`);
      fetchData();
    }
    setShowImportDialog(false);
  };

  // Combine events and projects for timeline display
  const allTimelineItems = useMemo(() => {
    const items: Array<{
      id: string;
      label: string;
      amount: number;
      date: string;
      isExpense: boolean;
      type: string;
      source: 'event' | 'project';
      priority?: string;
    }> = [];

    // Add events
    events.forEach(event => {
      items.push({
        id: event.id,
        label: event.label,
        amount: event.amount,
        date: event.target_date,
        isExpense: event.is_expense,
        type: event.type,
        source: 'event',
        priority: event.priority,
      });
    });

    // Add projects not already in events
    projects.forEach(project => {
      if (project.deadline && !events.some(e => e.linked_project_id === project.id)) {
        items.push({
          id: `project-${project.id}`,
          label: project.title,
          amount: project.target_amount - project.current_amount,
          date: project.deadline,
          isExpense: true,
          type: 'other',
          source: 'project',
        });
      }
    });

    return items.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [events, projects]);

  // Projection with events
  const enhancedProjection = useMemo(() => {
    if (!projectionInputs) return null;
    
    const eventsForCalc: FinancialEvent[] = allTimelineItems.map(item => ({
      id: item.id,
      type: item.type as FinancialEvent['type'],
      label: item.label,
      amount: item.amount,
      target_date: item.date,
      is_expense: item.isExpense,
      priority: (item.priority ?? 'medium') as FinancialEvent['priority'],
    }));
    
    return calculateProjectionWithEvents(projectionInputs, eventsForCalc, years);
  }, [projectionInputs, allTimelineItems, years]);

  // Timeline data
  const timelineData = useMemo(() => {
    const data: { year: number; modere: number; withEvents: number }[] = [];
    
    if (enhancedProjection) {
      enhancedProjection.scenarios.forEach((scenario, i) => {
        data.push({
          year: scenario.year,
          modere: scenario.modere,
          withEvents: enhancedProjection.scenariosWithEvents[i]?.modere ?? scenario.modere,
        });
      });
    }

    return data;
  }, [enhancedProjection]);

  const totalExpenses = useMemo(() => 
    allTimelineItems.filter(e => e.isExpense).reduce((sum, e) => sum + e.amount, 0),
    [allTimelineItems]
  );

  const totalIncome = useMemo(() => 
    allTimelineItems.filter(e => !e.isExpense).reduce((sum, e) => sum + e.amount, 0),
    [allTimelineItems]
  );

  // Projects that can be imported
  const importableProjects = useMemo(() => 
    projects.filter(p => 
      p.deadline && 
      !events.some(e => e.linked_project_id === p.id)
    ),
    [projects, events]
  );

  const fmt = (n: number) => Math.round(n).toLocaleString('fr-FR');

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Warning if table doesn't exist */}
      {!tableExists && (
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardContent className="pt-5">
            <div className="flex items-start gap-3">
              <Database className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-amber-700 dark:text-amber-400">Migration requise</p>
                <p className="text-sm text-muted-foreground mt-1">
                  La table des événements financiers n'est pas encore créée. Tu peux quand même créer des événements, 
                  ils seront ajoutés à tes Projets. Pour activer toutes les fonctionnalités, exécute la migration SQL 
                  disponible dans le fichier <code className="bg-muted px-1 rounded">MIGRATION_FINANCIAL_EVENTS.md</code>.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-semibold">Ma timeline financière</h2>
          <p className="text-sm text-muted-foreground">
            Planifie tes événements futurs et visualise leur impact
          </p>
        </div>
        <div className="flex gap-2">
          {tableExists && importableProjects.length > 0 && (
            <Button variant="outline" onClick={() => setShowImportDialog(true)}>
              <Import className="h-4 w-4 mr-2" />
              Importer un projet
            </Button>
          )}
          <Button onClick={openAdd}>
            <Plus className="h-4 w-4 mr-2" />
            Événement
          </Button>
        </div>
      </div>

      {/* Years selector */}
      <div className="flex items-center gap-3">
        <span className="text-sm text-muted-foreground">Horizon :</span>
        <div className="inline-flex rounded-lg border p-1 bg-muted/30">
          {[5, 10, 15].map((y) => (
            <button
              key={y}
              type="button"
              onClick={() => onYearsChange(y)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                years === y
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'hover:bg-muted text-muted-foreground'
              }`}
            >
              {y} ans
            </button>
          ))}
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-red-500/20 p-2.5">
                <ArrowDownRight className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Dépenses prévues</p>
                <p className="text-lg font-bold text-red-600">{fmt(totalExpenses)} {currency === 'EUR' ? '€' : 'CHF'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-green-500/20 p-2.5">
                <ArrowUpRight className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Entrées prévues</p>
                <p className="text-lg font-bold text-green-600">{fmt(totalIncome)} {currency === 'EUR' ? '€' : 'CHF'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-blue-500/20 p-2.5">
                <Calendar className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Événements planifiés</p>
                <p className="text-lg font-bold">{allTimelineItems.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Timeline horizontale */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Timeline</CardTitle>
          <CardDescription>Tes événements sur les {years} prochaines années</CardDescription>
        </CardHeader>
        <CardContent>
          {allTimelineItems.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Aucun événement planifié</p>
              <p className="text-xs text-muted-foreground mt-1">Ajoute un événement ou importe tes projets existants</p>
              <Button variant="outline" className="mt-4" onClick={openAdd}>
                <Plus className="h-4 w-4 mr-2" /> Ajouter un événement
              </Button>
            </div>
          ) : (
            <div className="relative">
              <div className="overflow-x-auto pb-4">
                <div className="relative min-w-[800px]" style={{ minHeight: `${Math.max(180, allTimelineItems.length * 45 + 80)}px` }}>
                  {/* Years axis */}
                  <div className="flex justify-between mb-4 px-4">
                    {Array.from({ length: years + 1 }, (_, i) => currentYear + i).map(year => (
                      <span key={year} className="text-xs font-medium text-muted-foreground">{year}</span>
                    ))}
                  </div>
                  
                  {/* Timeline line */}
                  <div className="h-2 bg-gradient-to-r from-muted via-muted to-muted rounded-full mx-4 relative mt-8">
                    {/* Event markers and labels */}
                    {allTimelineItems.map((item, index) => {
                      const itemYear = new Date(item.date).getFullYear();
                      const position = ((itemYear - currentYear) / years) * 100;
                      if (position < 0 || position > 100) return null;
                      
                      const typeInfo = EVENT_TYPES[item.type as keyof typeof EVENT_TYPES];
                      const isEven = index % 2 === 0;
                      
                      return (
                        <div
                          key={item.id}
                          className="absolute transform -translate-x-1/2 cursor-pointer group"
                          style={{ left: `${position}%`, top: '-16px' }}
                          onClick={() => item.source === 'event' && tableExists && openEdit(events.find(e => e.id === item.id)!)}
                        >
                          {/* Marker */}
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center text-base shadow-lg transition-transform group-hover:scale-110 border-2 border-white ${
                            item.isExpense ? 'bg-red-500' : 'bg-green-500'
                          } ${item.source === 'project' ? 'ring-2 ring-blue-400 ring-offset-1' : ''}`}>
                            {typeInfo?.emoji ?? '📌'}
                          </div>
                          
                          {/* Label always visible */}
                          <div 
                            className={`absolute left-1/2 transform -translate-x-1/2 w-max max-w-[140px] text-center ${
                              isEven ? 'top-12' : 'bottom-12'
                            }`}
                          >
                            <div className="bg-card/95 backdrop-blur border rounded-lg px-2 py-1.5 shadow-sm">
                              <p className="font-medium text-xs truncate">{item.label}</p>
                              <p className={`text-xs font-semibold ${item.isExpense ? 'text-red-600' : 'text-green-600'}`}>
                                {item.isExpense ? '-' : '+'}{fmt(item.amount)} {currency === 'EUR' ? '€' : 'CHF'}
                              </p>
                              <p className="text-[10px] text-muted-foreground">
                                {new Date(item.date).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })}
                              </p>
                              {item.source === 'project' && (
                                <span className="text-[9px] bg-blue-500/10 text-blue-600 px-1 rounded">Projet</span>
                              )}
                            </div>
                            {/* Connector line */}
                            <div className={`absolute left-1/2 w-px bg-muted-foreground/30 ${
                              isEven ? 'bottom-full h-3' : 'top-full h-3'
                            }`} style={{ transform: 'translateX(-50%)' }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Chart with projections */}
      {projectionInputs && allTimelineItems.length > 0 && enhancedProjection && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Impact sur ton patrimoine</CardTitle>
            <CardDescription>Projection sur {years} ans avec et sans événements</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={timelineData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                <YAxis tickFormatter={v => `${Math.round(v / 1000)}k`} tick={{ fontSize: 11 }} />
                <Tooltip 
                  formatter={(v: number) => `${fmt(v)} ${currency === 'EUR' ? '€' : 'CHF'}`}
                  labelFormatter={l => `Année ${l}`}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="modere" 
                  stroke="hsl(160 84% 39%)" 
                  strokeWidth={2} 
                  name="Sans événements"
                  strokeDasharray="5 5"
                  dot={false}
                />
                <Line 
                  type="monotone" 
                  dataKey="withEvents" 
                  stroke="hsl(217 91% 60%)" 
                  strokeWidth={2.5} 
                  name="Avec événements"
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Warnings */}
      {enhancedProjection && enhancedProjection.warnings.length > 0 && (
        <Card className="border-amber-500/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              Points d'attention
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {enhancedProjection.warnings.map((warning, i) => (
                <li key={i} className="text-sm text-muted-foreground">{warning}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Events list */}
      {allTimelineItems.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Détail des événements</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {allTimelineItems.map(item => {
                const typeInfo = EVENT_TYPES[item.type as keyof typeof EVENT_TYPES];
                return (
                  <div
                    key={item.id}
                    className="flex items-center justify-between rounded-lg border p-4 group"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${
                        item.isExpense ? 'bg-red-500/10' : 'bg-green-500/10'
                      }`}>
                        {typeInfo?.emoji ?? '📌'}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{item.label}</p>
                          {item.source === 'project' && (
                            <span className="text-[10px] bg-blue-500/10 text-blue-600 px-1.5 py-0.5 rounded">Projet</span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {new Date(item.date).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
                          {item.priority === 'high' && (
                            <span className="ml-2 text-amber-500">● Prioritaire</span>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <p className={`font-bold ${item.isExpense ? 'text-red-600' : 'text-green-600'}`}>
                        {item.isExpense ? '-' : '+'}{fmt(item.amount)} {currency === 'EUR' ? '€' : 'CHF'}
                      </p>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {item.source === 'event' && tableExists && (
                          <button 
                            onClick={() => openEdit(events.find(e => e.id === item.id)!)}
                            className="p-1.5 rounded hover:bg-muted"
                            title="Modifier"
                          >
                            <Pencil className="h-4 w-4 text-muted-foreground" />
                          </button>
                        )}
                        <button 
                          onClick={() => handleRemoveFromTimeline(item)}
                          className="p-1.5 rounded hover:bg-muted"
                          title={item.source === 'project' ? 'Supprimer le projet' : 'Supprimer'}
                        >
                          <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Event Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? 'Modifier l\'événement' : 'Nouvel événement'}</DialogTitle>
            <DialogDescription>
              Planifie un événement financier futur
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label>Type d'événement</Label>
              <Select value={formType} onValueChange={(v) => {
                setFormType(v as FinancialEvent['type']);
                const info = EVENT_TYPES[v as FinancialEvent['type']];
                if (info) setFormIsExpense(info.isExpense);
              }}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(EVENT_TYPES).map(([key, info]) => (
                    <SelectItem key={key} value={key}>
                      {info.emoji} {info.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Description</Label>
              <Input
                value={formLabel}
                onChange={e => setFormLabel(e.target.value)}
                placeholder="ex: Achat appartement Paris"
                className="mt-1"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Montant ({currency === 'EUR' ? '€' : 'CHF'})</Label>
                <Input
                  type="number"
                  value={formAmount}
                  onChange={e => setFormAmount(e.target.value)}
                  placeholder="50000"
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Date prévue</Label>
                <Input
                  type="date"
                  value={formDate}
                  onChange={e => setFormDate(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <Label>Type de flux</Label>
              <div className="flex items-center gap-2">
                <span className={`text-sm ${formIsExpense ? 'text-muted-foreground' : 'font-medium text-green-600'}`}>
                  Entrée
                </span>
                <Switch
                  checked={formIsExpense}
                  onCheckedChange={setFormIsExpense}
                />
                <span className={`text-sm ${formIsExpense ? 'font-medium text-red-600' : 'text-muted-foreground'}`}>
                  Sortie
                </span>
              </div>
            </div>

            <div>
              <Label>Priorité</Label>
              <Select value={formPriority} onValueChange={(v) => setFormPriority(v as FinancialEvent['priority'])}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">🔴 Haute</SelectItem>
                  <SelectItem value="medium">🟡 Moyenne</SelectItem>
                  <SelectItem value="low">🟢 Basse</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Notes (optionnel)</Label>
              <Textarea
                value={formNotes}
                onChange={e => setFormNotes(e.target.value)}
                placeholder="Détails supplémentaires..."
                className="mt-1"
                rows={2}
              />
            </div>

            {!editing && formIsExpense && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                <Switch
                  id="add-to-projects"
                  checked={addToProjects}
                  onCheckedChange={setAddToProjects}
                />
                <Label htmlFor="add-to-projects" className="text-sm cursor-pointer">
                  Ajouter également dans mes Projets d'épargne
                </Label>
              </div>
            )}

            <Button onClick={handleSave} disabled={saving || !formLabel.trim() || !formAmount || !formDate} className="w-full">
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editing ? 'Modifier' : 'Créer'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Import Project Dialog */}
      <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Importer un projet</DialogTitle>
            <DialogDescription>
              Sélectionne un projet existant à ajouter dans ta timeline
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {importableProjects.map(project => {
              const remaining = project.target_amount - project.current_amount;
              return (
                <div
                  key={project.id}
                  className="flex items-center justify-between rounded-lg border p-4 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{project.icon}</span>
                    <div>
                      <p className="font-medium">{project.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {fmt(remaining)} {currency === 'EUR' ? '€' : 'CHF'} restant
                        {project.deadline && ` • ${new Date(project.deadline).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}`}
                      </p>
                    </div>
                  </div>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleImportProject(project)}
                  >
                    <Import className="h-4 w-4 mr-1" /> Importer
                  </Button>
                </div>
              );
            })}

            {importableProjects.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Target className="h-10 w-10 mx-auto mb-2 opacity-50" />
                <p>Tous tes projets sont déjà importés ou n'ont pas d'échéance</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
