import { createFileRoute, Link } from "@tanstack/react-router";
import { TrendingUp, Clock, Euro } from "lucide-react";

export const Route = createFileRoute("/cas")({
  head: () => ({
    meta: [
      { title: "Cas clients — AutoFlux" },
      { name: "description", content: "Trois PME, trois packs, des résultats concrets : fiduciaire, ecom artisanal, cabinet de conseil." },
      { property: "og:title", content: "Cas clients AutoFlux" },
      { property: "og:description", content: "Résultats mesurés en heures gagnées et CHF/€ économisés." },
    ],
  }),
  component: Cas,
});

const cases = [
  {
    tag: "FIDUCIAIRE · GENÈVE",
    title: "Fiduciaire Meunier — 6h/semaine récupérées sur les relances",
    context: "Cabinet comptable de 12 personnes, 240 clients récurrents. Relances impayés faites manuellement dans un tableur.",
    solution: "Pack Growth. Détection Stripe + Bexio, séquence J+7 / J+14 / J+30, escalade Slack au comptable référent.",
    results: [
      { icon: Clock, k: "6h/sem", v: "temps équipe" },
      { icon: Euro, k: "12k CHF", v: "impayés recouvrés/mois" },
      { icon: TrendingUp, k: "×3", v: "vitesse de relance" },
    ],
    quote: "« On a arrêté de courir après les factures. Le système le fait mieux que nous. »",
    author: "— Sophie M., associée",
  },
  {
    tag: "ECOM ARTISANAT · LYON",
    title: "Atelier Petit-Bois — commandes traitées 4× plus vite",
    context: "Ecom bois artisanal, 400 commandes/mois. Chaque commande = 15 min de saisie manuelle (stock, facture, tracking).",
    solution: "Pack Scale. Shopify → Airtable stock → facture PDF → email tracking → alerte préparateur WhatsApp.",
    results: [
      { icon: Clock, k: "80h/mois", v: "économisées" },
      { icon: TrendingUp, k: "0", v: "erreur de stock" },
      { icon: Euro, k: "2 200 €", v: "salaire/mois évité" },
    ],
    quote: "« J'ai réinvesti le temps gagné dans le développement produit. Vital. »",
    author: "— Thomas B., fondateur",
  },
  {
    tag: "CONSEIL · LAUSANNE",
    title: "Cabinet Ardent — onboarding client sans friction",
    context: "Cabinet de conseil RH, 4 associés. Chaque nouveau client = 2h de setup (contrat, Notion, planning, doc).",
    solution: "Pack Growth. Devis accepté (Pipedrive) → template Notion + checklist + calendrier kickoff + doc onboarding.",
    results: [
      { icon: Clock, k: "1h50", v: "gagnées par client" },
      { icon: TrendingUp, k: "100%", v: "conformité process" },
      { icon: Euro, k: "790 €", v: "ROI en 3 semaines" },
    ],
    quote: "« Chaque nouveau client démarre de manière identique. Notre qualité est enfin scalable. »",
    author: "— Léa D., associée fondatrice",
  },
];

function Cas() {
  return (
    <>
      <section className="border-b border-border/60">
        <div className="container-x py-16">
          <div className="font-mono text-xs tracking-widest text-muted-foreground">§ CAS CLIENTS</div>
          <h1 className="mt-2 text-4xl font-bold md:text-5xl">Trois PME, trois packs, des heures rendues.</h1>
          <p className="mt-4 max-w-2xl text-muted-foreground">
            Chiffres mesurés 90 jours après livraison. Prénoms modifiés à la demande des clients, résultats vérifiables sur demande.
          </p>
        </div>
      </section>

      <section className="bg-card">
        <div className="container-x space-y-8 py-16">
          {cases.map((c, i) => (
            <article key={i} className="rounded-2xl border border-border bg-background p-8 md:p-10">
              <div className="grid gap-8 md:grid-cols-[2fr_1fr]">
                <div>
                  <div className="font-mono text-xs tracking-widest text-accent">/{c.tag}</div>
                  <h2 className="mt-2 text-2xl font-bold md:text-3xl">{c.title}</h2>
                  <div className="mt-6 grid gap-4">
                    <div>
                      <div className="font-mono text-[10px] tracking-widest text-muted-foreground">CONTEXTE</div>
                      <p className="mt-1 text-sm">{c.context}</p>
                    </div>
                    <div>
                      <div className="font-mono text-[10px] tracking-widest text-muted-foreground">SOLUTION</div>
                      <p className="mt-1 text-sm">{c.solution}</p>
                    </div>
                  </div>
                  <blockquote className="mt-6 border-l-2 border-accent pl-4 text-sm italic">
                    {c.quote}
                    <footer className="mt-1 not-italic text-xs text-muted-foreground">{c.author}</footer>
                  </blockquote>
                </div>
                <div className="rounded-xl bg-ink p-6 text-bone">
                  <div className="font-mono text-[10px] tracking-widest text-bone/50">RÉSULTATS · 90j</div>
                  <div className="mt-4 space-y-4">
                    {c.results.map(({ icon: Icon, k, v }) => (
                      <div key={k} className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-md bg-bone/10">
                          <Icon className="h-4 w-4 text-accent" />
                        </div>
                        <div>
                          <div className="text-xl font-bold">{k}</div>
                          <div className="text-xs text-bone/60">{v}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </article>
          ))}

          <div className="text-center">
            <Link to="/audit" className="inline-flex items-center rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90">
              Je veux le même résultat
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
