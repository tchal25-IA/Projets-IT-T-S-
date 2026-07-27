import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Sparkles,
  Wallet,
  ListChecks,
  CalendarDays,
  FileText,
  ShieldCheck,
  ArrowRight,
  Check,
  Lock,
} from "lucide-react";
import { PRICING_CAP, TRIAL_DAYS } from "@/lib/pricing";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Quotidien IA — L'assistant IA qui simplifie vos finances et votre quotidien" },
      {
        name: "description",
        content:
          "Budget, fiscalité, tâches, événements, documents administratifs — un seul hub avec un agent IA. Accès à Finzy et Paperasse inclus. À partir de 3 €/mois, plafonné à 9,99 €.",
      },
      { property: "og:title", content: "Quotidien IA — Votre hub IA du quotidien" },
      {
        property: "og:description",
        content: "Finances, organisation et vie admin réunis dans une seule app avec un agent IA. Essai 30 jours.",
      },
    ],
  }),
  component: LandingPage,
});

const HIGHLIGHTS = [
  {
    icon: Wallet,
    title: "Finances & fiscalité, sans stress",
    text: "Budget prévisionnel, projections 5 ans, simulateurs immobilier et fiscalité FR/CH. Finzy inclus avec l'option Finance +.",
  },
  {
    icon: ListChecks,
    title: "Une vraie tête reposée",
    text: "Tâches, objectifs, semaine planifiée. Un agent IA qui priorise pour vous et vous rappelle ce qui compte.",
  },
  {
    icon: CalendarDays,
    title: "Événements maîtrisés",
    text: "Réunions, conférences, voyages : préparation guidée, checklist, notes et rappels dans un seul endroit.",
  },
  {
    icon: FileText,
    title: "Paperasse en 9 agents IA",
    text: "Fiscaliste, comptable, notaire, syndic… Un panel d'experts virtuels pour vos courriers et démarches.",
  },
];

const STEPS = [
  { n: "1", title: "Choisissez vos modules", text: "Finance, organisation, événements, vie admin — vous ne payez que ce que vous utilisez." },
  { n: "2", title: "Connectez vos outils", text: "Finzy et Paperasse s'activent automatiquement selon votre abonnement." },
  { n: "3", title: "Laissez l'IA travailler", text: "Un agent unique orchestre tout depuis votre hub." },
];

function LandingPage() {
  return (
    <div className="space-y-10 md:space-y-20">
      {/* Hero */}
      <section className="overflow-hidden rounded-2xl bg-hero p-6 text-primary-foreground shadow-elev sm:rounded-3xl sm:p-8 md:p-14">
        <div className="max-w-2xl space-y-4">
          <span className="inline-flex items-center gap-2 rounded-full bg-primary-foreground/15 px-3 py-1 text-xs font-medium backdrop-blur">
            <Sparkles className="h-3 w-3" />
            Nouveau · Agent IA orchestrateur
          </span>
          <h1 className="font-display text-3xl font-bold leading-tight sm:text-4xl md:text-6xl">
            Reprenez la main sur votre quotidien.
          </h1>
          <p className="text-sm text-primary-foreground/85 sm:text-base md:text-lg">
            Finances, fiscalité, organisation, événements, vie admin — un hub unique avec un agent IA.
            Essai <strong>{TRIAL_DAYS} jours gratuits</strong>, sans engagement. Plafonné à {PRICING_CAP.toFixed(2)} €/mois (soit {(PRICING_CAP * 0.9).toFixed(2).replace(".", ",")} €/mois en annuel avec −10 %).
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 rounded-md bg-primary-foreground px-5 py-2.5 text-sm font-semibold text-primary shadow-elev hover:opacity-90"
            >
              Créer mon compte <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/outils/finzy"
              className="inline-flex items-center gap-2 rounded-md border border-primary-foreground/30 bg-primary-foreground/10 px-5 py-2.5 text-sm font-semibold text-primary-foreground backdrop-blur hover:bg-primary-foreground/20"
            >
              Découvrir Finzy
            </Link>
          </div>
          <p className="pt-2 text-xs text-primary-foreground/70">
            <ShieldCheck className="mr-1 inline h-3 w-3" />
            Données hébergées en Europe · aucune revente · résiliation en 1 clic
          </p>
        </div>
      </section>

      {/* Highlights */}
      <section>
        <div className="mb-8 max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">Ce que vous obtenez</p>
          <h2 className="mt-2 font-display text-2xl font-bold sm:text-3xl md:text-4xl">Tout votre quotidien, orchestré par l'IA.</h2>
        </div>
        <div className="grid gap-3 sm:gap-4 md:grid-cols-2">
          {HIGHLIGHTS.map((h) => {
            const Icon = h.icon;
            return (
              <div key={h.title} className="flex gap-4 rounded-2xl border bg-card p-5 shadow-card">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary">
                  <Icon className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="font-display text-lg font-bold">{h.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{h.text}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* How it works */}
      <section>
        <div className="mb-8 max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">En 3 étapes</p>
          <h2 className="mt-2 font-display text-2xl font-bold sm:text-3xl md:text-4xl">Simple, modulaire, sans surprise.</h2>
        </div>
        <div className="grid gap-3 sm:grid-cols-3 sm:gap-4">
          {STEPS.map((s) => (
            <div key={s.n} className="rounded-2xl border bg-card p-6 shadow-card">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                {s.n}
              </div>
              <h3 className="mt-4 font-display text-lg font-bold">{s.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{s.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Finzy teaser */}
      <section className="grid gap-6 rounded-2xl border bg-card p-5 shadow-card sm:rounded-3xl sm:p-6 md:grid-cols-[1.1fr,1fr] md:p-10">
        <div className="space-y-4">
          <span className="inline-flex items-center gap-2 rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold text-primary">
            <Lock className="h-3 w-3" /> Inclus dans Finance +
          </span>
          <h2 className="font-display text-2xl font-bold sm:text-3xl md:text-4xl">Finzy · vos finances comme jamais.</h2>
          <p className="text-muted-foreground">
            Comptes, crédits, immobilier, épargne, projections. Finzy s'active automatiquement dès que vous
            souscrivez à l'option Finance +. Pas de re-saisie, pas de mot de passe supplémentaire.
          </p>
          <ul className="space-y-2 text-sm">
            {["Connexion en 1 clic depuis votre hub", "Projections 5 ans, simulateurs crédit et impôts", "Vos données restent chiffrées côté Cloud Europe"].map((f) => (
              <li key={f} className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> {f}</li>
            ))}
          </ul>
          <div className="flex flex-wrap gap-3 pt-2">
            <Link to="/outils/finzy" className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
              Voir Finzy en détail <ArrowRight className="h-4 w-4" />
            </Link>
            <Link to="/login" className="inline-flex items-center gap-2 rounded-md border px-4 py-2 text-sm font-semibold hover:bg-muted">
              Essayer gratuitement
            </Link>
          </div>
        </div>
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary-soft to-background p-6">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-primary/20 to-transparent" />
          <div className="relative space-y-3 text-sm">
            <div className="flex items-center justify-between rounded-md bg-card p-3 shadow-card"><span>Épargne mensuelle</span><span className="font-bold text-primary">+ 640 €</span></div>
            <div className="flex items-center justify-between rounded-md bg-card p-3 shadow-card"><span>Crédit immo restant</span><span className="font-bold">142 300 €</span></div>
            <div className="flex items-center justify-between rounded-md bg-card p-3 shadow-card"><span>Projection 5 ans</span><span className="font-bold text-success">+ 38 400 €</span></div>
            <div className="flex items-center justify-between rounded-md bg-card p-3 shadow-card"><span>Impôt estimé 2026</span><span className="font-bold">4 120 €</span></div>
          </div>
        </div>
      </section>

      {/* Pricing summary */}
      <section className="rounded-2xl bg-hero p-6 text-center text-primary-foreground shadow-elev sm:rounded-3xl sm:p-8 md:p-14">
        <p className="text-xs font-semibold uppercase tracking-widest text-primary-foreground/70">Tarif transparent</p>
        <h2 className="mt-2 font-display text-2xl font-bold sm:text-3xl md:text-5xl">
          À partir de 3 €/mois, jamais plus de {PRICING_CAP.toFixed(2)} €.
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-primary-foreground/85">
          Choisissez uniquement les modules dont vous avez besoin. −10 % en annuel. {TRIAL_DAYS} jours d'essai.
          Résiliez quand vous voulez.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link
            to="/login"
            className="inline-flex items-center gap-2 rounded-md bg-primary-foreground px-5 py-2.5 text-sm font-semibold text-primary shadow-elev hover:opacity-90"
          >
            Démarrer mon essai gratuit <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
