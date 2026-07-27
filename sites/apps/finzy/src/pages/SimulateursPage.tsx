import { Calculator, Building, Coins, PiggyBank, TrendingUp, ArrowRightLeft, Home, CreditCard, Table, Landmark, Wallet } from 'lucide-react';
import { Link } from 'react-router-dom';
import { SEO } from '@/components/SEO';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useBadges } from '@/hooks/useBadges';
import { useEffect, useRef } from 'react';

const simulateurs = {
  common: [
    { slug: 'epargne', title: 'Épargne composée', icon: PiggyBank, desc: 'Calcule la croissance de ton épargne' },
    { slug: 'fire', title: 'Rente FIRE', icon: TrendingUp, desc: 'Combien pour vivre de ton capital ?' },
    { slug: 'credit', title: 'Crédit', icon: Coins, desc: 'Mensualités et coût total' },
    { slug: 'comparateur', title: 'Comparateur', icon: ArrowRightLeft, desc: 'Compare deux scénarios d\'épargne' },
    { slug: 'salaire', title: 'Salaire Brut / Net', icon: Wallet, desc: 'Convertis ton brut en net après impôt' },
  ],
  fr: [
    { slug: 'impot-revenu', title: 'Impôt sur le revenu', icon: Calculator, desc: 'Barème IR 2026' },
    { slug: 'flat-tax', title: 'Flat Tax / PFU', icon: Coins, desc: 'PFU 30% vs barème progressif' },
    { slug: 'frais-notaire', title: 'Frais de notaire', icon: Building, desc: 'Estimation frais immobilier' },
    { slug: 'amortissement', title: 'Tableau d\'amortissement', icon: Table, desc: 'Échéancier mois par mois' },
    { slug: 'cashflow', title: 'Cashflow locatif', icon: Landmark, desc: 'Rentabilité d\'un investissement locatif' },
  ],
  ch: [
    { slug: 'impot-suisse', title: 'Impôt suisse', icon: Calculator, desc: 'Guide fiscal cantonal + lien ESTV' },
    { slug: 'troisieme-pilier', title: '3ème pilier A', icon: PiggyBank, desc: 'Gain fiscal par canton', beta: true },
    { slug: 'hypotheque-suisse', title: 'Hypothèque CH', icon: Building, desc: 'Éligibilité, rangs, EPL, nantissement', beta: true },
  ],
};

export default function SimulateursPage() {
  const { profile } = useAuth();
  const { awardBadge } = useBadges();
  const market = profile?.market ?? 'FR';

  // Track simulator visits in sessionStorage for strategist badge
  const tracked = useRef(false);
  useEffect(() => {
    if (tracked.current) return;
    tracked.current = true;
    const key = 'finzy_sim_visited';
    const visited: string[] = JSON.parse(sessionStorage.getItem(key) ?? '[]');
    if (!visited.includes('list')) visited.push('list');
    sessionStorage.setItem(key, JSON.stringify(visited));
  }, []);

  const sections = [
    { title: 'Communs FR & CH', items: simulateurs.common },
    ...(market === 'FR' ? [{ title: '🇫🇷 France', items: simulateurs.fr }] : [{ title: '🇨🇭 Suisse', items: simulateurs.ch }]),
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      <SEO title="Simulateurs" description="Simulateurs financiers : crédit, épargne, impôts, FIRE et plus encore." path="/simulateurs" />
      <h1 className="text-2xl font-bold">Simulateurs</h1>
      {sections.map(s => (
        <section key={s.title}>
          <h2 className="mb-4 text-lg font-semibold">{s.title}</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {s.items.map(sim => (
              <Link key={sim.slug} to={`/simulateurs/${sim.slug}`}
                className="rounded-xl border bg-card p-5 transition-shadow hover:shadow-md">
                <div className="flex items-start justify-between">
                  <sim.icon className="h-6 w-6 text-primary" />
                  {'beta' in sim && sim.beta && <Badge variant="secondary" className="text-[10px]">Beta</Badge>}
                </div>
                <h3 className="mt-3 font-semibold">{sim.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{sim.desc}</p>
              </Link>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
