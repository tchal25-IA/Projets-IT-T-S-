import { createFileRoute, Link } from "@tanstack/react-router";
import { Wallet, CalendarDays, ListChecks, Briefcase, Wrench, ArrowRight, Sparkles } from "lucide-react";
import { AgentPanel } from "@/components/agent-panel";
import { RequireAuth } from "@/components/require-auth";

export const Route = createFileRoute("/app")({
  head: () => ({
    meta: [
      { title: "Mon hub — Quotidien IA" },
      { name: "description", content: "Votre hub personnel : intentions rapides, agent IA et accès à vos modules." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: () => (
    <RequireAuth>
      <HubPage />
    </RequireAuth>
  ),
});

const INTENTS = [
  { to: "/finance", label: "Finances", icon: Wallet, hint: "Budget, fiscalité, simulations" },
  { to: "/evenements", label: "Préparer un événement", icon: CalendarDays, hint: "Réunion, conférence" },
  { to: "/productivite", label: "Ma semaine", icon: ListChecks, hint: "Tâches & priorités" },
  { to: "/business", label: "Business & création", icon: Briefcase, hint: "Offre, pitch, tendances" },
  { to: "/mes-outils", label: "Mes outils", icon: Wrench, hint: "Apps connectées" },
] as const;

function HubPage() {
  return (
    <div className="space-y-10">
      <section className="overflow-hidden rounded-3xl bg-hero p-8 text-primary-foreground shadow-elev md:p-12">
        <div className="max-w-2xl space-y-4">
          <span className="inline-flex items-center gap-2 rounded-full bg-primary-foreground/15 px-3 py-1 text-xs font-medium backdrop-blur">
            <Sparkles className="h-3 w-3" /> Bon retour parmi nous
          </span>
          <h1 className="font-display text-3xl font-bold leading-tight md:text-5xl">
            Que voulez-vous faire aujourd'hui&nbsp;?
          </h1>
          <p className="text-base text-primary-foreground/80 md:text-lg">
            Vos modules, vos outils et votre agent IA — tout est prêt.
          </p>
        </div>
      </section>

      <section>
        <h2 className="mb-4 font-display text-xl font-bold">Intentions rapides</h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
          {INTENTS.map((i) => {
            const Icon = i.icon;
            return (
              <Link
                key={i.to}
                to={i.to}
                className="group flex flex-col gap-2 rounded-xl border bg-card p-4 shadow-card transition-all hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-elev"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-soft text-primary">
                  <Icon className="h-4 w-4" />
                </span>
                <span className="text-sm font-semibold">{i.label}</span>
                <span className="text-xs text-muted-foreground">{i.hint}</span>
                <ArrowRight className="mt-auto h-4 w-4 text-muted-foreground transition-colors group-hover:text-primary" />
              </Link>
            );
          })}
        </div>
      </section>

      <AgentPanel />

      <section className="rounded-2xl border bg-card p-6 shadow-card">
        <h2 className="font-display text-lg font-bold">En un coup d'œil</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Vos prochains rappels et liens récents s'afficheront ici lorsque vous créerez des événements ou des tâches.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link to="/evenements" className="rounded-md border px-3 py-1.5 text-xs font-medium hover:bg-muted">+ Ajouter un événement</Link>
          <Link to="/productivite" className="rounded-md border px-3 py-1.5 text-xs font-medium hover:bg-muted">+ Créer une tâche</Link>
          <Link to="/mes-outils" className="rounded-md border px-3 py-1.5 text-xs font-medium hover:bg-muted">Voir mes outils</Link>
        </div>
      </section>
    </div>
  );
}
