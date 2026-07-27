import { createFileRoute, Link } from "@tanstack/react-router";
import { Check, ArrowRight } from "lucide-react";
import { SiteLayout, CHECKLIST_ITEMS } from "@/components/site-layout";

export const Route = createFileRoute("/checklist")({
  head: () => ({
    meta: [
      { title: "Checklist RGPD / nLPD — SiteConforme" },
      {
        name: "description",
        content: "Les 10 points que nous vérifions sur votre site lors d'un audit RGPD / nLPD.",
      },
      { property: "og:title", content: "Checklist RGPD / nLPD — SiteConforme" },
      { property: "og:description", content: "Notre checklist publique de conformité site web." },
    ],
  }),
  component: ChecklistPage,
});

function ChecklistPage() {
  return (
    <SiteLayout>
      <section className="mx-auto max-w-3xl px-6 py-16">
        <span className="text-xs font-medium uppercase tracking-wider text-accent">
          Checklist publique
        </span>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight">
          Les 10 points d'un site conforme RGPD / nLPD
        </h1>
        <p className="mt-4 text-muted-foreground">
          Voici précisément ce que nous vérifions et corrigeons. Aucune ligne cachée : cette liste est
          notre grille d'audit.
        </p>

        <ol className="mt-10 space-y-4">
          {CHECKLIST_ITEMS.map((it, i) => (
            <li
              key={i}
              className="rounded-xl border border-border bg-card p-5 flex gap-4"
            >
              <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-accent/15 text-accent text-sm font-semibold">
                {i + 1}
              </span>
              <div>
                <div className="font-semibold flex items-center gap-2">
                  <Check className="h-4 w-4 text-accent" /> {it.title}
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{it.desc}</p>
              </div>
            </li>
          ))}
        </ol>

        <div className="mt-12 rounded-2xl border border-border bg-secondary/40 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold">Envie qu'on le fasse pour vous ?</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Audit complet + correctifs livrés en 5 à 10 jours.
            </p>
          </div>
          <Link
            to="/demander"
            className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-3 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            Demander un audit <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </SiteLayout>
  );
}