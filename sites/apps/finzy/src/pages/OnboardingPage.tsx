import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { useBadges } from '@/hooks/useBadges';
import type { Market, ProfileType } from '@/types';

const steps = ['Marché', 'Profil', 'Objectifs', 'Chiffres', 'Bienvenue'];

const profileCards: { key: ProfileType; emoji: string; title: string; desc: string; color: string }[] = [
  { key: 'curieux', emoji: '🟢', title: 'Curieux', desc: 'Je découvre la finance', color: 'border-success/50' },
  { key: 'organise', emoji: '🔵', title: 'Organisé', desc: 'Je veux suivre mon budget', color: 'border-primary/50' },
  { key: 'investisseur', emoji: '🟣', title: 'Investisseur', desc: 'Je place et j\'optimise', color: 'border-premium/50' },
  { key: 'stratege', emoji: '⭐', title: 'Stratège', desc: 'Je veux des outils avancés', color: 'border-warning/50' },
];

const objectives = ['Gérer mon budget', 'Épargner plus', 'Investir', 'Comprendre la finance', 'Préparer un projet', 'Suivre mon patrimoine'];

export default function OnboardingPage() {
  const navigate = useNavigate();
  const { user, refreshProfile } = useAuth();
  const { awardBadge } = useBadges();
  const [step, setStep] = useState(0);
  const [market, setMarket] = useState<Market | null>(null);
  const [profile, setProfile] = useState<ProfileType | null>(null);
  const [goals, setGoals] = useState<string[]>([]);
  const [income, setIncome] = useState('');
  const [savingsRate, setSavingsRate] = useState(20);
  const [saving, setSaving] = useState(false);

  const next = () => { if (step < 4) setStep(step + 1); };
  const prev = () => { if (step > 0) setStep(step - 1); };

  const finishOnboarding = async () => {
    if (!user || !market || !profile) return;
    setSaving(true);
    const currency = market === 'CH' ? 'CHF' : 'EUR';
    const { error } = await supabase.from('profiles').update({
      market,
      currency,
      profile_type: profile,
      onboarding_completed: true,
      xp_total: 50,
    }).eq('id', user.id);

    if (error) {
      toast.error('Erreur lors de la sauvegarde');
      setSaving(false);
      return;
    }
    await refreshProfile();
    await awardBadge('first_step');
    setSaving(false);
    navigate('/dashboard');
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-lg">
        {/* Stepper */}
        <div className="mb-8 flex items-center gap-1 justify-center">
          {steps.map((s, i) => (
            <div key={s} className="flex items-center gap-1">
              <div className={cn('flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold',
                i <= step ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground')}>
                {i + 1}
              </div>
              {i < steps.length - 1 && <div className={cn('h-0.5 w-6', i < step ? 'bg-primary' : 'bg-muted')} />}
            </div>
          ))}
        </div>

        {/* Step 0: Market */}
        {step === 0 && (
          <div className="space-y-6 text-center">
            <h2 className="text-xl font-bold">Quel est ton marché ?</h2>
            <div className="grid grid-cols-2 gap-4">
              {[{ key: 'FR' as Market, flag: '🇫🇷', label: 'France (€)' }, { key: 'CH' as Market, flag: '🇨🇭', label: 'Suisse (CHF)' }].map(m => (
                <button key={m.key} onClick={() => setMarket(m.key)}
                  className={cn('rounded-xl border-2 p-6 text-center transition-colors', market === m.key ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/30')}>
                  <span className="text-4xl">{m.flag}</span>
                  <p className="mt-2 font-semibold">{m.label}</p>
                </button>
              ))}
            </div>
            <Button onClick={next} disabled={!market} className="w-full">Continuer</Button>
          </div>
        )}

        {/* Step 1: Profile */}
        {step === 1 && (
          <div className="space-y-6 text-center">
            <h2 className="text-xl font-bold">Quel profil te correspond ?</h2>
            <div className="grid grid-cols-2 gap-3">
              {profileCards.map(p => (
                <button key={p.key} onClick={() => setProfile(p.key)}
                  className={cn('rounded-xl border-2 p-4 text-left transition-colors', p.color,
                    profile === p.key ? 'border-primary bg-primary/5' : 'border-border')}>
                  <span className="text-2xl">{p.emoji}</span>
                  <p className="mt-1 font-semibold text-sm">{p.title}</p>
                  <p className="text-xs text-muted-foreground">{p.desc}</p>
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={prev} className="flex-1">Retour</Button>
              <Button onClick={next} disabled={!profile} className="flex-1">Continuer</Button>
            </div>
          </div>
        )}

        {/* Step 2: Goals */}
        {step === 2 && (
          <div className="space-y-6 text-center">
            <h2 className="text-xl font-bold">Quels sont tes objectifs ?</h2>
            <div className="grid grid-cols-2 gap-2">
              {objectives.map(o => (
                <button key={o} onClick={() => setGoals(g => g.includes(o) ? g.filter(x => x !== o) : [...g, o])}
                  className={cn('rounded-lg border p-3 text-sm transition-colors',
                    goals.includes(o) ? 'border-primary bg-primary/10 font-medium' : 'hover:bg-muted')}>
                  {o}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={prev} className="flex-1">Retour</Button>
              <Button onClick={next} disabled={goals.length === 0} className="flex-1">Continuer</Button>
            </div>
          </div>
        )}

        {/* Step 3: Numbers */}
        {step === 3 && (
          <div className="space-y-6 text-center">
            <h2 className="text-xl font-bold">Quelques chiffres <span className="text-sm text-muted-foreground">(optionnel)</span></h2>
            <div className="space-y-4 text-left">
              <div>
                <label className="text-sm font-medium">Revenu net mensuel</label>
                <input value={income} onChange={e => setIncome(e.target.value)} type="number" placeholder="ex: 3200"
                  className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary" />
              </div>
              <div>
                <label className="text-sm font-medium">Taux d'épargne : {savingsRate}%</label>
                <input type="range" min={0} max={80} value={savingsRate} onChange={e => setSavingsRate(Number(e.target.value))}
                  className="mt-2 w-full accent-primary" />
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={prev} className="flex-1">Retour</Button>
              <Button onClick={next} className="flex-1">Continuer</Button>
            </div>
            <button onClick={next} className="text-sm text-muted-foreground hover:underline">Passer cette étape →</button>
          </div>
        )}

        {/* Step 4: Welcome */}
        {step === 4 && (
          <div className="space-y-6 text-center">
            <div className="text-5xl">🎉</div>
            <h2 className="text-2xl font-bold">Bienvenue sur Finzy !</h2>
            <div className="rounded-xl border bg-card p-4 space-y-3">
              <p className="text-sm text-muted-foreground">Tu es maintenant</p>
              <p className="text-3xl font-bold">Niveau 1</p>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div className="h-full w-[10%] rounded-full bg-primary" />
              </div>
              <p className="text-xs text-muted-foreground">50 / 500 XP</p>
            </div>
            <Button onClick={finishOnboarding} className="w-full" disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Découvrir mon dashboard →
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
