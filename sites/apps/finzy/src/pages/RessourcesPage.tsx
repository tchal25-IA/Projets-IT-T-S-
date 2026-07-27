import { ExternalLink, Home, PiggyBank, Calculator, Newspaper, Sparkles } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface Resource {
  name: string;
  url: string;
  desc: string;
  market: 'FR' | 'CH' | 'all';
}

interface Category {
  title: string;
  icon: React.ElementType;
  items: Resource[];
}

const categories: Category[] = [
  {
    title: 'Immobilier',
    icon: Home,
    items: [
      { name: 'MeillerTaux', url: 'https://www.meilleurtaux.com', desc: 'Comparateur de crédits immobiliers', market: 'FR' },
      { name: 'DVF – Etalab', url: 'https://app.dvf.etalab.gouv.fr', desc: 'Prix de vente réels (données publiques)', market: 'FR' },
      { name: 'Castorus', url: 'https://www.castorus.com', desc: 'Historique & évolution des annonces immo', market: 'FR' },
      { name: 'SeLoger', url: 'https://www.seloger.com', desc: 'Annonces immobilières', market: 'FR' },
      { name: 'PAP', url: 'https://www.pap.fr', desc: 'Particulier à particulier', market: 'FR' },
      { name: 'Comparis', url: 'https://www.comparis.ch/hypotheken', desc: 'Comparateur hypothèques suisses', market: 'CH' },
      { name: 'Homegate', url: 'https://www.homegate.ch', desc: 'Annonces immobilières en Suisse', market: 'CH' },
    ],
  },
  {
    title: 'Épargne & Investissement',
    icon: PiggyBank,
    items: [
      { name: 'JustETF', url: 'https://www.justetf.com/en/', desc: 'Analyse & comparateur ETF Europe', market: 'all' },
      { name: 'Quantalys', url: 'https://www.quantalys.com', desc: 'Comparateur de fonds & ETF', market: 'FR' },
      { name: 'Boursorama', url: 'https://www.boursorama.com', desc: 'Banque en ligne & bourse', market: 'FR' },
      { name: 'Finary', url: 'https://finary.com', desc: 'Agrégateur de patrimoine', market: 'all' },
      { name: 'Moneyland', url: 'https://www.moneyland.ch', desc: 'Comparateur bancaire & placements', market: 'CH' },
    ],
  },
  {
    title: 'Fiscalité & Simulateurs officiels',
    icon: Calculator,
    items: [
      { name: 'impots.gouv.fr', url: 'https://www.impots.gouv.fr/simulateurs', desc: 'Simulateur IR officiel', market: 'FR' },
      { name: 'Service-Public.fr', url: 'https://www.service-public.fr', desc: 'Droits & démarches administratives', market: 'FR' },
      { name: 'ESTV / AFC', url: 'https://swisstaxcalculator.estv.admin.ch', desc: 'Calculateur d\'impôts fédéral', market: 'CH' },
      { name: 'ch.ch', url: 'https://www.ch.ch/fr/impots', desc: 'Portail officiel suisse – fiscalité', market: 'CH' },
    ],
  },
  {
    title: 'Actualités & Éducation',
    icon: Newspaper,
    items: [
      { name: 'Avenue des Investisseurs', url: 'https://avenuedesinvestisseurs.fr', desc: 'Guides patrimoine & investissement', market: 'FR' },
      { name: 'Les Échos Bourse', url: 'https://investir.lesechos.fr', desc: 'Actualités marchés financiers', market: 'FR' },
      { name: 'Aktionnaire', url: 'https://www.aktionnaire.com', desc: 'Newsletter bourse & investissement', market: 'all' },
      { name: 'Forex Factory', url: 'https://www.forexfactory.com', desc: 'Calendrier économique & news macro avancées', market: 'all' },
      { name: 'INSEE', url: 'https://www.insee.fr', desc: 'Statistiques & chiffres économiques officiels', market: 'FR' },
      { name: 'Unusual Whales', url: 'https://unusualwhales.com/institutions', desc: 'Suivi des portefeuilles des grands fonds mondiaux', market: 'all' },
      { name: 'Cash (Le Temps)', url: 'https://www.letemps.ch/economie', desc: 'Actu économique suisse', market: 'CH' },
    ],
  },
];


export default function RessourcesPage() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const market = profile?.market ?? 'FR';

  const filtered = categories
    .map((cat) => ({
      ...cat,
      items: cat.items.filter((r) => r.market === 'all' || r.market === market),
    }))
    .filter((cat) => cat.items.length > 0);

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Ressources utiles</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Sites et outils recommandés pour le marché {market === 'FR' ? '🇫🇷 français' : '🇨🇭 suisse'}
        </p>
      </div>

      {filtered.map((cat) => (
        <section key={cat.title}>
          <div className="flex items-center gap-2 mb-4">
            <cat.icon className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">{cat.title}</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {cat.items.map((res) => (
              <a
                key={res.url}
                href={res.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group rounded-xl border bg-card p-5 transition-all hover:shadow-md hover:border-primary/30"
              >
                <div className="flex items-start justify-between">
                  <h3 className="font-semibold group-hover:text-primary transition-colors">{res.name}</h3>
                  <ExternalLink className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{res.desc}</p>
              </a>
            ))}
          </div>
        </section>
      ))}

      {/* Projections CTA */}
      <section className="rounded-xl border-2 border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10 p-6">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 shrink-0">
            <Sparkles className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1 space-y-2">
            <h2 className="text-lg font-bold">📊 Projections personnalisées</h2>
            <p className="text-sm text-muted-foreground">
              Obtiens un rapport complet avec des scénarios sur 15 ans basés sur ta situation financière, ton profil de risque et ton patrimoine.
            </p>
            <Button onClick={() => navigate('/projections')} className="gap-2 mt-2">
              <Sparkles className="h-4 w-4" /> Créer ma projection
            </Button>
          </div>
        </div>
      </section>

    </div>
  );
}
