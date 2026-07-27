import { useState } from 'react';
import { SEO } from '@/components/SEO';
import { Sparkles, Check, Lock, Loader2, ExternalLink, Zap, BookOpen, Brain, TrendingUp, Home, BarChart3, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { usePlan } from '@/hooks/usePlan';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

const FREE_FEATURES = [
  'Budget (jusqu\'à 20 transactions/mois)',
  'Projets d\'épargne',
  'Patrimoine de base',
  'Simulateurs crédit & épargne',
  'Academy Niveau 1',
  'FinzyBot (3 messages/jour)',
  'Leaderboard & Gamification',
];

const PREMIUM_FEATURES = [
  { icon: Zap, text: 'Transactions illimitées' },
  { icon: Brain, text: 'FinzyBot illimité + contexte enrichi' },
  { icon: TrendingUp, text: 'Simulateurs avancés : FIRE, IR, PFU, Cashflow…' },
  { icon: BookOpen, text: 'Academy Niveaux 2 & 3 + Guides thématiques' },
  { icon: BarChart3, text: 'Watchlist, Portefeuille & Projections long terme' },
  { icon: Home, text: 'FinzyImmo — Gestion locative & quittances' },
  { icon: Check, text: 'Export complet de tes données (RGPD)' },
  { icon: Check, text: 'Score patrimonial détaillé' },
];

const IMMO_FEATURES = [
  'Génération de quittances de loyer en PDF',
  'Suivi des paiements locataires',
  'Calcul du rendement locatif net',
  'Gestion multi-biens',
  'Historique des loyers',
];

interface Plan {
  id: 'monthly' | 'yearly';
  label: string;
  priceEUR: string;
  priceCHF: string;
  period: string;
  priceIdEUR: string;
  priceIdCHF: string;
  badge: string | null;
}

const PLANS: Plan[] = [
  {
    id: 'monthly',
    label: 'Mensuel',
    priceEUR: '6,99€',
    priceCHF: 'CHF 7.90',
    period: '/mois',
    priceIdEUR: import.meta.env.VITE_STRIPE_PRICE_MONTHLY ?? '',
    priceIdCHF: import.meta.env.VITE_STRIPE_PRICE_MONTHLY_CHF ?? '',
    badge: null,
  },
  {
    id: 'yearly',
    label: 'Annuel',
    priceEUR: '59€',
    priceCHF: 'CHF 69',
    period: '/an',
    priceIdEUR: import.meta.env.VITE_STRIPE_PRICE_YEARLY ?? '',
    priceIdCHF: import.meta.env.VITE_STRIPE_PRICE_YEARLY_CHF ?? '',
    badge: '🎉 2 mois offerts',
  },
];

export default function PremiumPage() {
  const { user, profile } = useAuth();
  const { isPremium, isLifetime, plan, premiumType, trialEndsAt } = usePlan();
  const [loading, setLoading] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('yearly');

  const isCH = profile?.market === 'CH';

  const handleUpgrade = async (planId: 'monthly' | 'yearly') => {
    if (!user) { toast.error('Connecte-toi d\'abord'); return; }
    const selected = PLANS.find(p => p.id === planId)!;
    const priceId = isCH ? selected.priceIdCHF : selected.priceIdEUR;
    if (!priceId) {
      toast.error('Configuration Stripe manquante — contacte le support.');
      return;
    }
    setLoading(planId);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stripe-checkout`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({ priceId, userId: user.id }),
        },
      );
      if (!resp.ok) throw new Error(await resp.text());
      const { url } = await resp.json();
      if (url) window.location.href = url;
    } catch (e) {
      toast.error('Erreur lors de la création de la session de paiement.');
      console.error(e);
    }
    setLoading(null);
  };

  const handleManageSubscription = async () => {
    if (!user) return;
    setLoading('manage');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stripe-portal`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session?.access_token}`,
          },
        },
      );
      if (!resp.ok) throw new Error(await resp.text());
      const { url } = await resp.json();
      if (url) window.location.href = url;
    } catch {
      toast.error('Portail indisponible. Contacte le support.');
    }
    setLoading(null);
  };

  if (isPremium) {
    return (
      <div className="space-y-6 animate-fade-in max-w-2xl mx-auto">
        <SEO title="Mon abonnement Premium" path="/premium" />
        <div className="text-center py-10 space-y-4">
          <div className="flex h-20 w-20 mx-auto items-center justify-center rounded-full bg-premium/10">
            {isLifetime ? <Crown className="h-10 w-10 text-premium" /> : <Sparkles className="h-10 w-10 text-premium" />}
          </div>
          <h1 className="text-2xl font-bold">
            Tu es membre {plan === 'beta' ? 'Beta 🧪' : isLifetime ? 'Premium à vie 👑' : 'Premium 💎'}
          </h1>
          <p className="text-muted-foreground">Tous les modules sont débloqués. Profite de Finzy sans limite !</p>
          {plan === 'beta' && (
            <p className="text-xs text-muted-foreground">Accès beta — toutes les fonctionnalités Premium sont disponibles gratuitement pendant la période de test.</p>
          )}
          {premiumType === 'trial' && trialEndsAt && (
            <p className="text-xs text-muted-foreground">
              Accès offert jusqu'au {new Date(trialEndsAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}.
            </p>
          )}
        </div>

        <div className="rounded-xl border bg-card p-6">
          <h2 className="font-semibold mb-4 flex items-center gap-2"><Home className="h-5 w-5 text-premium" /> FinzyImmo inclus</h2>
          <p className="text-sm text-muted-foreground mb-4">Ton app de gestion locative — quittances PDF, suivi des loyers, rendement net.</p>
          <Button asChild variant="outline" className="gap-2">
            <Link to="/investissements/immobilier/quittances">
              <ExternalLink className="h-4 w-4" /> Accéder à FinzyImmo
            </Link>
          </Button>
        </div>

        {!isLifetime && plan !== 'beta' && (
          <div className="rounded-xl border bg-card p-6">
            <h2 className="font-semibold mb-2">Gérer mon abonnement</h2>
            <p className="text-sm text-muted-foreground mb-4">Modifie ta carte, change de formule ou résilie depuis le portail Stripe sécurisé.</p>
            <Button variant="outline" onClick={handleManageSubscription} disabled={loading === 'manage'}>
              {loading === 'manage' && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Portail de gestion
            </Button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in max-w-2xl mx-auto">
      <SEO title="Finzy Premium" description="Débloquez tous les simulateurs, Academy niveau 2 & 3, FinzyBot illimité et FinzyImmo." path="/premium" />

      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 rounded-full bg-premium/10 px-4 py-1.5 text-sm font-medium text-premium">
          <Sparkles className="h-4 w-4" /> Finzy Premium
        </div>
        <h1 className="text-3xl font-bold">Prends le contrôle de tes finances</h1>
        <p className="text-muted-foreground">Simulateurs avancés, academy complète, FinzyBot illimité + FinzyImmo inclus.</p>
        {isCH && <p className="text-xs text-muted-foreground">Prix affichés en CHF pour le marché suisse.</p>}
      </div>

      {/* Plan selector */}
      <div className="grid grid-cols-2 gap-3">
        {PLANS.map(p => (
          <button
            key={p.id}
            onClick={() => setSelectedPlan(p.id)}
            className={`relative rounded-xl border p-4 text-left transition-all ${selectedPlan === p.id ? 'border-premium bg-premium/5 ring-1 ring-premium' : 'hover:border-muted-foreground/40'}`}
          >
            {p.badge && (
              <span className="absolute -top-2.5 right-3 rounded-full bg-premium px-2 py-0.5 text-[10px] font-semibold text-white">{p.badge}</span>
            )}
            <p className="font-semibold">{p.label}</p>
            <p className="text-2xl font-bold mt-1">
              {isCH ? p.priceCHF : p.priceEUR}
              <span className="text-sm font-normal text-muted-foreground">{p.period}</span>
            </p>
          </button>
        ))}
      </div>

      <Button
        size="lg"
        className="w-full bg-premium text-premium-foreground hover:bg-premium/90 gap-2 text-base h-12"
        onClick={() => handleUpgrade(selectedPlan)}
        disabled={!!loading}
      >
        {loading === selectedPlan ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
        {loading === selectedPlan ? 'Redirection...' : 'Passer Premium'}
      </Button>
      <p className="text-center text-xs text-muted-foreground">Paiement sécurisé par Stripe · Résiliation à tout moment</p>

      {/* What's included */}
      <div className="rounded-xl border bg-card p-6 space-y-4">
        <h2 className="font-semibold">Tout ce qui est inclus</h2>
        <div className="space-y-3">
          {PREMIUM_FEATURES.map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-start gap-3">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-premium/10">
                <Icon className="h-3.5 w-3.5 text-premium" />
              </div>
              <span className="text-sm">{text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* FinzyImmo bundle highlight */}
      <div className="rounded-xl border border-premium/30 bg-gradient-to-br from-premium/5 to-transparent p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-premium/10">
            <Home className="h-6 w-6 text-premium" />
          </div>
          <div>
            <h2 className="font-semibold">FinzyImmo inclus</h2>
            <p className="text-xs text-muted-foreground">Application de gestion locative — valeur 4,99€/mois offerte</p>
          </div>
        </div>
        <div className="space-y-2">
          {IMMO_FEATURES.map(f => (
            <div key={f} className="flex items-center gap-2 text-sm">
              <Check className="h-4 w-4 text-premium shrink-0" />
              <span>{f}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Free vs Premium comparison */}
      <div className="rounded-xl border bg-card p-6 space-y-4">
        <h2 className="font-semibold">Plan gratuit actuel</h2>
        <div className="space-y-2">
          {FREE_FEATURES.map(f => (
            <div key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
              <Lock className="h-3.5 w-3.5 shrink-0" />
              <span>{f}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
