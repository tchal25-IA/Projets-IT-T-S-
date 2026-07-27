import { createFileRoute, Link } from "@tanstack/react-router";
import { Check, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/packs")({
  head: () => ({
    meta: [
      { title: "Packs — AutoFlux | Starter, Growth, Scale" },
      { name: "description", content: "Trois packs d'automatisation : Starter 790€, Growth 1290€, Scale 1990€. Audit + scénarios Make/Zapier livrés en 10 jours." },
      { property: "og:title", content: "Packs AutoFlux — dès 790 €" },
      { property: "og:description", content: "Starter, Growth, Scale. Choisissez votre volume d'automatisations." },
    ],
  }),
  component: Packs,
});

const packs = [
  {
    name: "Starter",
    price: "790",
    tagline: "Le premier pas",
    ideal: "Solo, indépendants, TPE < 5 personnes",
    features: [
      "Audit de vos outils actuels (48h)",
      "3 automatisations Make ou Zapier",
      "Documentation Notion partagée",
      "Formation 30 min",
      "Support 15 jours",
    ],
  },
  {
    name: "Growth",
    price: "1290",
    tagline: "Le plus choisi",
    ideal: "PME 5 à 20 personnes",
    featured: true,
    features: [
      "Audit approfondi (48h) + call cadrage",
      "5 automatisations Make ou Zapier",
      "1 intégration Notion / Airtable / CRM",
      "Documentation + tableau de bord",
      "Formation 60 min pour votre équipe",
      "Support 30 jours",
    ],
  },
  {
    name: "Scale",
    price: "1990",
    tagline: "Pour les stacks complexes",
    ideal: "PME 20+ personnes, ecom, cabinets",
    features: [
      "Audit stratégique + roadmap 3 mois",
      "5 automatisations + 2 intégrations sur mesure",
      "Webhooks / API custom",
      "Monitoring & alertes Slack",
      "Formation équipe 90 min",
      "Support 60 jours + 1 call mensuel",
    ],
  },
];

function Packs() {
  return (
    <>
      <section className="border-b border-border/60">
        <div className="container-x py-16">
          <div className="font-mono text-xs tracking-widest text-muted-foreground">CATALOGUE / PACKS</div>
          <h1 className="mt-2 text-4xl font-bold md:text-5xl">Trois packs. Tarif fixe. Livré.</h1>
          <p className="mt-4 max-w-2xl text-muted-foreground">
            Pas de forfait horaire flou. Vous savez ce que vous payez, ce que vous recevez, et quand. La TVA suisse (8.1%) ou française (20%) s'applique selon votre siège.
          </p>
        </div>
      </section>

      <section className="border-b border-border/60 bg-card">
        <div className="container-x py-20">
          <div className="grid gap-6 md:grid-cols-3">
            {packs.map((p) => (
              <div key={p.name} className={`relative flex flex-col rounded-xl border p-8 ${p.featured ? "border-accent bg-background" : "border-border bg-background"}`}>
                {p.featured && (
                  <div className="absolute -top-3 left-8 rounded bg-accent px-2 py-0.5 font-mono text-[10px] tracking-widest text-accent-foreground">
                    POPULAIRE
                  </div>
                )}
                <div className="font-mono text-xs tracking-widest text-muted-foreground">PACK / {p.name.toUpperCase()}</div>
                <div className="mt-2 text-lg font-semibold">{p.tagline}</div>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-5xl font-bold">{p.price}</span>
                  <span className="text-muted-foreground">€ HT</span>
                </div>
                <div className="mt-1 text-xs text-muted-foreground">{p.ideal}</div>
                <ul className="mt-6 space-y-3 text-sm">
                  {p.features.map((f) => (
                    <li key={f} className="flex gap-2">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  to="/audit"
                  className={`mt-8 inline-flex items-center justify-center gap-2 rounded-md px-4 py-3 text-sm font-medium ${p.featured ? "bg-primary text-primary-foreground hover:bg-primary/90" : "border border-border hover:border-accent"}`}
                >
                  Choisir {p.name} <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            ))}
          </div>

          <div className="mt-12 rounded-lg border border-dashed border-border p-6 text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">Besoin sur mesure ?</span> Certains cabinets ou ecom ont des flux non standards (ERP legacy, API custom, EDI). On chiffre en jour/homme à partir de 890 €/jour. <Link to="/audit" className="underline">Parlons-en</Link>.
          </div>
        </div>
      </section>
    </>
  );
}
