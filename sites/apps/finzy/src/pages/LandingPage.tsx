import { Link } from 'react-router-dom';
import { BetaBanner } from '@/components/BetaBanner';
import { FinancialDisclaimer } from '@/components/FinancialDisclaimer';
import { SEO } from '@/components/SEO';
import { Button } from '@/components/ui/button';
import {
  ArrowRight, PiggyBank, TrendingUp, GraduationCap, Calculator, BarChart3, Bot,
  Sparkles, Shield, Zap, Target, BookOpen
} from 'lucide-react';

const profiles = [
  { emoji: '🟢', title: 'Curieux', desc: 'Tu découvres la finance et veux apprendre les bases.', color: 'border-success/40 bg-success/5' },
  { emoji: '🔵', title: 'Organisé', desc: 'Tu veux suivre ton budget et tes dépenses au quotidien.', color: 'border-primary/40 bg-primary/5' },
  { emoji: '🟣', title: 'Investisseur', desc: 'Tu places déjà et veux optimiser ton patrimoine.', color: 'border-premium/40 bg-premium/5' },
  { emoji: '⭐', title: 'Stratège', desc: 'Tu maîtrises et veux des outils avancés.', color: 'border-warning/40 bg-warning/5' },
];

const features = [
  { icon: PiggyBank, title: 'Budget intelligent', desc: 'Suivi automatisé revenus & dépenses avec catégories adaptées à ton marché.' },
  { icon: Target, title: 'Projets & objectifs', desc: 'Fixe des objectifs d\'épargne et suis ta progression en temps réel.' },
  { icon: BarChart3, title: 'Patrimoine complet', desc: 'Vue consolidée de tous tes actifs : Livret A, PEA, 3ème pilier, crypto…' },
  { icon: Calculator, title: '15+ simulateurs', desc: 'IR France, hypothèque suisse, FIRE, crédit — tout est calculé pour toi.' },
  { icon: GraduationCap, title: 'Academy gamifiée', desc: 'Articles, quizz, parcours guidés — gagne des XP et monte en niveau.' },
  { icon: Bot, title: 'FinzyBot IA', desc: 'Un assistant financier intelligent adapté à ton profil et ton marché.' },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <SEO title="Finances personnelles simplifiées" description="Gérez votre budget, patrimoine et investissements. Simulateurs, suivi de projets et éducation financière." path="/" />
      <BetaBanner />

      {/* Nav */}
      <nav className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur-md">
        <div className="container flex h-14 items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-xl font-bold">
            <span className="gradient-text">Finzy</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/register?mode=login">
              <Button variant="ghost" size="sm">Connexion</Button>
            </Link>
            <Link to="/register">
              <Button size="sm" className="gap-1">
                Commencer <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="gradient-hero relative overflow-hidden py-20 md:py-32">
        <div className="container relative z-10 text-center">
          <div className="mx-auto inline-flex items-center gap-2 rounded-full border bg-card/50 px-4 py-1.5 text-sm backdrop-blur">
            🇫🇷 France & 🇨🇭 Suisse
          </div>
          <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-extrabold tracking-tight md:text-6xl">
            La finance, enfin <span className="gradient-text">simple.</span>
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
            Budget, épargne, patrimoine, simulateurs et formation — tout en une seule app gamifiée.
          </p>
          <div className="mt-8 flex items-center justify-center gap-4">
            <Link to="/register">
              <Button size="lg" className="gap-2 text-base">
                <Sparkles className="h-4 w-4" /> Créer mon compte gratuit
              </Button>
            </Link>
          </div>
          <div className="mx-auto mt-6 flex items-center justify-center gap-6 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><Shield className="h-3.5 w-3.5" /> Données privées</span>
            <span className="flex items-center gap-1"><Zap className="h-3.5 w-3.5" /> 100% gratuit en beta</span>
          </div>
        </div>
      </section>

      {/* Profils */}
      <section className="py-16 md:py-24">
        <div className="container">
          <h2 className="text-center text-2xl font-bold md:text-3xl">Quel profil es-tu ?</h2>
          <p className="mx-auto mt-2 max-w-lg text-center text-muted-foreground">
            Finzy s'adapte à ton niveau et te propose un parcours personnalisé.
          </p>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {profiles.map((p) => (
              <div key={p.title} className={`rounded-xl border p-5 transition-colors hover:shadow-md ${p.color}`}>
                <span className="text-3xl">{p.emoji}</span>
                <h3 className="mt-3 text-lg font-semibold">{p.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-t bg-muted/30 py-16 md:py-24">
        <div className="container">
          <h2 className="text-center text-2xl font-bold md:text-3xl">Tout ce dont tu as besoin</h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <div key={f.title} className="rounded-xl border bg-card p-6 transition-shadow hover:shadow-md">
                <f.icon className="h-8 w-8 text-primary" />
                <h3 className="mt-4 text-lg font-semibold">{f.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-16 md:py-24">
        <div className="container">
          <h2 className="text-center text-2xl font-bold md:text-3xl">Tarifs</h2>
          <div className="mx-auto mt-10 grid max-w-3xl gap-6 md:grid-cols-2">
            <div className="rounded-xl border p-6">
              <h3 className="text-lg font-bold">Free</h3>
              <p className="mt-1 text-3xl font-extrabold">0€<span className="text-base font-normal text-muted-foreground">/mois</span></p>
              <ul className="mt-6 space-y-2 text-sm">
                {['Budget & transactions', 'Score patrimonial', 'Academy (articles gratuits)', 'Simulateurs de base', 'FinzyBot (limité)'].map(f => (
                  <li key={f} className="flex items-center gap-2"><span className="text-success">✓</span>{f}</li>
                ))}
              </ul>
            </div>
            <div className="relative rounded-xl border-2 border-premium p-6">
              <span className="absolute -top-3 right-4 rounded-full bg-premium px-3 py-0.5 text-xs font-bold text-premium-foreground">
                Bientôt
              </span>
              <h3 className="text-lg font-bold">Premium</h3>
              <p className="mt-1 text-3xl font-extrabold">4.99€<span className="text-base font-normal text-muted-foreground">/mois</span></p>
              <ul className="mt-6 space-y-2 text-sm">
                {['Tout Free +', 'Simulateurs avancés', 'FinzyBot illimité', 'Projets illimités', 'Export PDF', 'Badge Premium exclusif'].map(f => (
                  <li key={f} className="flex items-center gap-2"><span className="text-premium">✓</span>{f}</li>
                ))}
              </ul>
              <Button disabled className="mt-6 w-full" variant="outline">Bientôt disponible</Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-muted/30 py-8">
        <div className="container">
          <div className="flex flex-col items-center gap-4 text-center">
            <span className="text-lg font-bold gradient-text">Finzy</span>
            <FinancialDisclaimer className="max-w-lg" />
            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs">
              <Link to="/legal" className="text-muted-foreground hover:text-foreground underline">Mentions légales</Link>
              <Link to="/legal" className="text-muted-foreground hover:text-foreground underline">CGU/CGV</Link>
              <Link to="/legal" className="text-muted-foreground hover:text-foreground underline">Confidentialité</Link>
              <Link to="/legal" className="text-muted-foreground hover:text-foreground underline">Cookies</Link>
            </div>
            <p className="text-xs text-muted-foreground">© 2026 Finzy. Tous droits réservés.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
