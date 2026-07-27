import { useNavigate } from 'react-router-dom';
import { SEO } from '@/components/SEO';
import { BookOpen, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';

interface BonusPack {
  slug: string;
  emoji: string;
  name: string;
  desc: string;
  topics: string[];
  available: boolean;
  market: 'FR' | 'CH' | 'all';
}

const bonusPacks: BonusPack[] = [
  // ─── FR packs ───
  {
    slug: 'info-plus', emoji: '📚', name: 'Pack Info+',
    desc: 'Tout savoir sur les produits d\'épargne proposés par ta banque',
    topics: ['Livret A & LDDS', 'LEP', 'Assurance Vie fonds euros', 'Comptes à terme', 'PEL / CEL'],
    available: true, market: 'FR',
  },
  {
    slug: 'immo', emoji: '🏠', name: 'Pack Immo',
    desc: 'Capacité d\'emprunt, investissement locatif et SCPI',
    topics: ['Capacité d\'emprunt', 'Rendement locatif brut/net', 'SCPI & Pierre-papier', 'Loi Pinel & Denormandie', 'Plus-value immobilière'],
    available: true, market: 'FR',
  },
  {
    slug: 'defiscalisation', emoji: '🧾', name: 'Pack Défiscalisation',
    desc: 'PER, immobilier défiscalisant et réduction d\'impôts',
    topics: ['PER individuel', 'Girardin industriel', 'FCPI / FIP', 'Dons & mécénat', 'Stratégies combinées'],
    available: true, market: 'FR',
  },
  // ─── CH packs ───
  {
    slug: 'epargne-ch', emoji: '🏦', name: 'Pack Épargne Suisse',
    desc: 'Comptes épargne, prévoyance et placements bancaires en Suisse',
    topics: ['Compte épargne & privé', '3e pilier A', '3e pilier B', 'Comptes à terme', 'Épargne enfant'],
    available: true, market: 'CH',
  },
  {
    slug: 'immo-ch', emoji: '🏠', name: 'Pack Immo Suisse',
    desc: 'Hypothèques, amortissement et propriété en Suisse',
    topics: ['Hypothèque & taux', 'Amortissement direct/indirect', 'Retrait EPL (2e pilier)', 'Nantissement 3a', 'Valeur locative & impôts'],
    available: true, market: 'CH',
  },
  {
    slug: 'prevoyance-ch', emoji: '🛡️', name: 'Pack Prévoyance',
    desc: 'Les 3 piliers suisses, LPP et optimisation fiscale',
    topics: ['AVS (1er pilier)', 'LPP / Caisse de pension', '3e pilier A – déduction fiscale', 'Rachat LPP', 'Coordination des piliers'],
    available: true, market: 'CH',
  },
  // ─── Common packs ───
  {
    slug: 'bourse', emoji: '📈', name: 'Pack Bourse',
    desc: 'Investissement programmé (DCA), ETF et marchés',
    topics: ['PEA vs CTO vs Dépôt titres', 'ETF & trackers', 'DCA : investir sans timer', 'Dividendes & fiscalité', 'Construire un portefeuille'],
    available: true, market: 'all',
  },
  {
    slug: 'non-cote', emoji: '🔒', name: 'Pack Non côté',
    desc: 'Private equity, dette privée et rendements alternatifs',
    topics: ['Private equity', 'Dette privée', 'Crowdfunding immobilier', 'Crowdlending', 'Risques & liquidité'],
    available: true, market: 'all',
  },
  {
    slug: 'premium', emoji: '💎', name: 'Pack Premium',
    desc: 'Tous les sujets réunis pour une vision 360°',
    topics: ['Allocation patrimoniale', 'Optimisation fiscale globale', 'Stratégie retraite', 'Transmission', 'Plan d\'action personnalisé'],
    available: true, market: 'all',
  },
];

export { bonusPacks };

export default function BonusPage() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const market = profile?.market ?? 'FR';

  const filtered = bonusPacks.filter(p => p.market === 'all' || p.market === market);

  return (
    <div className="space-y-6 animate-fade-in">
      <SEO title="Guides & Bonus" description="Guides financiers thématiques : immobilier, bourse, défiscalisation et plus." path="/bonus" />
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <BookOpen className="h-6 w-6 text-primary" />
          Guides & Bonus
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Des contenus spécialisés pour le marché {market === 'CH' ? '🇨🇭 suisse' : '🇫🇷 français'} — approfondi ta stratégie financière.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map(pack => (
          <button
            key={pack.slug}
            onClick={() => navigate(`/bonus/${pack.slug}`)}
            className="group rounded-xl border bg-card p-5 text-left transition-all hover:shadow-md hover:border-primary/30"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{pack.emoji}</span>
                <h3 className="font-semibold">{pack.name}</h3>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <p className="mt-2 text-sm text-muted-foreground">{pack.desc}</p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {pack.topics.slice(0, 3).map(t => (
                <Badge key={t} variant="secondary" className="text-xs">{t}</Badge>
              ))}
              {pack.topics.length > 3 && (
                <Badge variant="outline" className="text-xs">+{pack.topics.length - 3}</Badge>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
