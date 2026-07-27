import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Check, Lock, Wallet, TrendingUp, Building2, ShieldCheck, Sparkles } from "lucide-react";

export const Route = createFileRoute("/outils/finzy")({
  head: () => ({
    meta: [
      { title: "Finzy — Finances personnelles connectées | Quotidien IA" },
      {
        name: "description",
        content:
          "Finzy centralise vos comptes, crédits, immobilier et projections. Inclus avec l'option Finance + de Quotidien IA, connexion automatique en 1 clic.",
      },
      { property: "og:title", content: "Finzy — Vos finances comme jamais" },
      {
        property: "og:description",
        content: "Comptes, crédits, immo, projections 5 ans. Inclus avec Finance +, sans compte séparé.",
      },
    ],
  }),
  component: FinzyTeaser,
});

const FEATURES = [
  { icon: Wallet, title: "Vue 360° de vos finances", text: "Comptes courants, épargne, dettes, patrimoine immobilier — tout au même endroit." },
  { icon: TrendingUp, title: "Projections 5 ans", text: "Simulez vos revenus, dépenses et investissements sur le long terme, en un coup d'œil." },
  { icon: Building2, title: "Crédits immobiliers", text: "Suivi de vos prêts, TAEG effectif, restant dû, comparaisons de renégociation." },
  { icon: ShieldCheck, title: "Sécurisé & privé", text: "Vos données restent chez vous, chiffrées, hébergées en Europe. Aucune revente." },
];

function FinzyTeaser() {
  return (
    <div className="space-y-16">
      {/* Hero */}
      <section className="overflow-hidden rounded-3xl bg-hero p-8 text-primary-foreground shadow-elev md:p-14">
        <div className="max-w-2xl space-y-5">
          <span className="inline-flex items-center gap-2 rounded-full bg-primary-foreground/15 px-3 py-1 text-xs font-medium backdrop-blur">
            <Sparkles className="h-3 w-3" /> Outil connecté · Quotidien IA
          </span>
          <h1 className="font-display text-4xl font-bold leading-tight md:text-6xl">Finzy</h1>
          <p className="text-lg text-primary-foreground/85 md:text-xl">
            Vos finances personnelles, enfin claires. Comptes, crédits, immobilier, épargne — orchestrés
            depuis votre hub Quotidien IA.
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 rounded-md bg-primary-foreground px-5 py-2.5 text-sm font-semibold text-primary shadow-elev hover:opacity-90"
            >
              Débloquer avec Finance + <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/"
              className="inline-flex items-center gap-2 rounded-md border border-primary-foreground/30 bg-primary-foreground/10 px-5 py-2.5 text-sm font-semibold text-primary-foreground backdrop-blur hover:bg-primary-foreground/20"
            >
              Retour à l'accueil
            </Link>
          </div>
        </div>
      </section>

      {/* Locked preview */}
      <section className="relative overflow-hidden rounded-3xl border bg-card p-6 shadow-card md:p-10">
        <div className="grid gap-6 md:grid-cols-[1fr,1.2fr]">
          <div className="space-y-3">
            <h2 className="font-display text-2xl font-bold md:text-3xl">Un aperçu de votre futur tableau de bord</h2>
            <p className="text-muted-foreground">
              L'accès complet est débloqué dès la souscription à l'option <strong>Finance +</strong>.
            </p>
            <ul className="space-y-2 text-sm">
              {["Connexion SSO en 1 clic", "Aucun compte Finzy à créer", "Résiliation immédiate"].map((f) => (
                <li key={f} className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> {f}</li>
              ))}
            </ul>
          </div>
          <div className="relative">
            <div className="space-y-3 rounded-2xl bg-gradient-to-br from-primary-soft to-background p-5 blur-[2px]">
              {[
                ["Solde total", "12 480 €"],
                ["Épargne du mois", "+ 640 €"],
                ["Crédit immo restant", "142 300 €"],
                ["Projection 5 ans", "+ 38 400 €"],
                ["Impôt estimé 2026", "4 120 €"],
              ].map(([k, v]) => (
                <div key={k} className="flex items-center justify-between rounded-md bg-card p-3 shadow-card">
                  <span className="text-sm">{k}</span><span className="font-bold text-primary">{v}</span>
                </div>
              ))}
            </div>
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="flex flex-col items-center gap-3 rounded-2xl bg-background/85 px-6 py-5 shadow-elev backdrop-blur">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <Lock className="h-5 w-5" />
                </span>
                <p className="text-sm font-semibold">Réservé aux abonnés Finance +</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section>
        <div className="mb-8 max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">Fonctionnalités</p>
          <h2 className="mt-2 font-display text-3xl font-bold md:text-4xl">Tout ce que Finzy fait pour vous.</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {FEATURES.map((f) => {
            const Icon = f.icon;
            return (
              <div key={f.title} className="flex gap-4 rounded-2xl border bg-card p-5 shadow-card">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary">
                  <Icon className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="font-display text-lg font-bold">{f.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{f.text}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* CTA */}
      <section className="rounded-3xl bg-hero p-8 text-center text-primary-foreground shadow-elev md:p-12">
        <h2 className="font-display text-3xl font-bold md:text-4xl">Prêt à débloquer Finzy&nbsp;?</h2>
        <p className="mx-auto mt-3 max-w-xl text-primary-foreground/85">
          Créez votre compte Quotidien IA et activez l'option Finance + — Finzy s'ouvre automatiquement.
        </p>
        <Link
          to="/login"
          className="mt-6 inline-flex items-center gap-2 rounded-md bg-primary-foreground px-5 py-2.5 text-sm font-semibold text-primary shadow-elev hover:opacity-90"
        >
          Créer mon compte <ArrowRight className="h-4 w-4" />
        </Link>
      </section>
    </div>
  );
}
