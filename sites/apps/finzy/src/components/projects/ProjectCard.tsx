import { useState, useEffect } from 'react';
import { formatAmount } from '@/lib/formatCurrency';
import { Pencil, Trash2, PiggyBank, Loader2, CalendarDays, History, ArrowUpRight, ArrowDownRight, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Currency } from '@/types';

interface Project {
  id: string; title: string; icon: string; target_amount: number; current_amount: number; deadline: string | null; status: string; currency: string;
}

interface ProjectTransaction {
  id: string; amount: number; type: string; note: string | null; created_at: string;
}

interface Props {
  project: Project;
  currency: Currency;
  userId: string;
  onEdit: (p: Project) => void;
  onDelete: (id: string) => void;
  onUpdated: () => void;
}

function getLinearPlan(remaining: number, deadline: string | null): { monthlyAmount: number; monthsLeft: number } | null {
  if (!deadline || remaining <= 0) return null;
  const now = new Date();
  const end = new Date(deadline);
  const diffMs = end.getTime() - now.getTime();
  const monthsLeft = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24 * 30.44)));
  return { monthlyAmount: remaining / monthsLeft, monthsLeft };
}

function getTimelineProgress(createdAt: string, deadline: string | null): number {
  if (!deadline) return 0;
  const start = new Date(createdAt).getTime();
  const end = new Date(deadline).getTime();
  const now = Date.now();
  if (now >= end) return 100;
  if (now <= start) return 0;
  return Math.round(((now - start) / (end - start)) * 100);
}

export function ProjectCard({ project: p, currency, userId, onEdit, onDelete, onUpdated }: Props) {
  const [showDeposit, setShowDeposit] = useState(false);
  const [depositAmount, setDepositAmount] = useState('');
  const [depositType, setDepositType] = useState<'deposit' | 'withdrawal'>('deposit');
  const [depositNote, setDepositNote] = useState('');
  const [depositing, setDepositing] = useState(false);
  const [history, setHistory] = useState<ProjectTransaction[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  const pct = p.target_amount > 0 ? Math.round((p.current_amount / p.target_amount) * 100) : 0;
  const remaining = Math.max(0, p.target_amount - p.current_amount);
  const plan = getLinearPlan(remaining, p.deadline);
  const timePct = getTimelineProgress(p.currency ? new Date().toISOString() : new Date().toISOString(), p.deadline);

  const fetchHistory = async () => {
    const { data } = await supabase
      .from('project_transactions')
      .select('*')
      .eq('project_id', p.id)
      .order('created_at', { ascending: false })
      .limit(20);
    if (data) setHistory(data as ProjectTransaction[]);
  };

  useEffect(() => { fetchHistory(); }, [p.id]);

  const handleDeposit = async () => {
    const amount = Number(depositAmount);
    if (!amount || amount <= 0) return;
    setDepositing(true);
    const signedAmount = depositType === 'withdrawal' ? -amount : amount;
    const newAmount = Math.max(0, p.current_amount + signedAmount);

    const [{ error: e1 }, { error: e2 }] = await Promise.all([
      supabase.from('projects').update({ current_amount: newAmount }).eq('id', p.id),
      supabase.from('project_transactions').insert({
        project_id: p.id,
        user_id: userId,
        amount: signedAmount,
        type: depositType,
        note: depositNote.trim() || null,
      }),
    ]);

    if (e1 || e2) { toast.error('Erreur'); setDepositing(false); return; }
    toast.success(depositType === 'deposit' ? `+${formatAmount(amount, currency)} ajouté !` : `${formatAmount(amount, currency)} retiré`);
    setDepositing(false);
    setShowDeposit(false);
    setDepositAmount('');
    setDepositNote('');
    onUpdated();
    fetchHistory();
  };

  const daysLeft = p.deadline ? Math.max(0, Math.ceil((new Date(p.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24))) : null;

  return (
    <>
      <div className="rounded-xl border bg-card p-5 space-y-3 group relative">
        <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={() => onEdit(p)} className="text-muted-foreground hover:text-foreground"><Pencil className="h-3.5 w-3.5" /></button>
          <button onClick={() => onDelete(p.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-2xl">{p.icon}</span>
          <div>
            <h3 className="font-semibold">{p.title}</h3>
            {p.deadline && (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <CalendarDays className="h-3 w-3" />
                Échéance : {p.deadline} {daysLeft !== null && <span className="text-primary font-medium">({daysLeft}j restants)</span>}
              </p>
            )}
          </div>
        </div>

        {/* Savings progress bar */}
        <div>
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-muted-foreground">Épargne</span>
            <span className="font-medium">{pct}%</span>
          </div>
          <Progress value={Math.min(pct, 100)} className="h-2.5" />
          <div className="flex items-center justify-between text-xs mt-1">
            <span>{formatAmount(p.current_amount, currency)}</span>
            <span className="text-muted-foreground">{formatAmount(p.target_amount, currency)}</span>
          </div>
        </div>

        {/* Timeline bar (time progress) */}
        {p.deadline && (
          <div>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-muted-foreground">Temps écoulé</span>
              <span className={`font-medium ${timePct > pct + 20 ? 'text-destructive' : ''}`}>{timePct}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${timePct > pct + 20 ? 'bg-destructive' : 'bg-muted-foreground/40'}`}
                style={{ width: `${Math.min(timePct, 100)}%` }}
              />
            </div>
          </div>
        )}

        {/* Linear savings plan */}
        {plan && pct < 100 && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded-lg px-3 py-2">
            <CalendarDays className="h-3.5 w-3.5 shrink-0" />
            <span>
              Plan : <strong className="text-foreground">{formatAmount(plan.monthlyAmount, currency)}/mois</strong> pendant {plan.monthsLeft} mois
            </span>
          </div>
        )}
        {pct >= 100 && (
          <div className="text-xs text-green-600 font-medium bg-green-50 dark:bg-green-950/30 rounded-lg px-3 py-2 text-center">
            🎉 Objectif atteint !
          </div>
        )}

        <div className="flex gap-2">
          <Button onClick={() => { setDepositType('deposit'); setShowDeposit(true); }} size="sm" variant="outline" className="flex-1">
            <PiggyBank className="mr-1.5 h-4 w-4" />Ajouter
          </Button>
          <Button onClick={() => { setDepositType('withdrawal'); setShowDeposit(true); }} size="sm" variant="ghost" className="text-muted-foreground">
            Retirer
          </Button>
        </div>

        {/* History toggle */}
        {history.length > 0 && (
          <div>
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors w-full"
            >
              <History className="h-3 w-3" />
              Historique ({history.length})
              {showHistory ? <ChevronUp className="h-3 w-3 ml-auto" /> : <ChevronDown className="h-3 w-3 ml-auto" />}
            </button>
            {showHistory && (
              <div className="mt-2 space-y-1.5 max-h-40 overflow-y-auto">
                {history.map(tx => (
                  <div key={tx.id} className="flex items-center justify-between text-xs px-2 py-1.5 rounded-md bg-muted/30">
                    <div className="flex items-center gap-1.5">
                      {tx.type === 'deposit' ? (
                        <ArrowUpRight className="h-3 w-3 text-success" />
                      ) : (
                        <ArrowDownRight className="h-3 w-3 text-destructive" />
                      )}
                      <span className="text-muted-foreground">{new Date(tx.created_at).toLocaleDateString('fr-FR')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {tx.note && <span className="text-muted-foreground truncate max-w-[100px]">{tx.note}</span>}
                      <span className={`font-medium ${tx.type === 'deposit' ? 'text-success' : 'text-destructive'}`}>
                        {tx.type === 'deposit' ? '+' : ''}{formatAmount(tx.amount, currency)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <Dialog open={showDeposit} onOpenChange={setShowDeposit}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{depositType === 'deposit' ? "Ajouter de l'épargne" : "Retirer de l'épargne"} – {p.title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">
              Solde actuel : <strong className="text-foreground">{formatAmount(p.current_amount, currency)}</strong>
              {plan && depositType === 'deposit' && <> · Plan : {formatAmount(plan.monthlyAmount, currency)}/mois</>}
            </div>
            <div>
              <Label>Montant ({currency})</Label>
              <Input type="number" min="0" step="0.01" value={depositAmount} onChange={e => setDepositAmount(e.target.value)} placeholder={plan && depositType === 'deposit' ? String(Math.round(plan.monthlyAmount)) : '100'} autoFocus />
            </div>
            <div>
              <Label>Note (optionnel)</Label>
              <Input value={depositNote} onChange={e => setDepositNote(e.target.value)} placeholder="ex: Prime de Noël" maxLength={100} />
            </div>
            <Button onClick={handleDeposit} disabled={depositing || !depositAmount || Number(depositAmount) <= 0} className="w-full">
              {depositing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Valider
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
