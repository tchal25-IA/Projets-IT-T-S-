import { createFileRoute, Link } from "@tanstack/react-router";
import { Check } from "lucide-react";

export const Route = createFileRoute("/tarifs")({
  head: () => ({
    meta: [
      { title: "Tarifs — VitrineFlash | 490 / 990 / 1490" },
      { name: "description", content: "Trois packages, prix fixe, livraison en 48h. Essentiel 490, Pro 990, Premium 1490." },
      { property: "og:title", content: "Tarifs VitrineFlash" },
      { property: "og:description", content: "Refonte de site en 48h — 3 packages à prix fixe." },
    ],
  }),
  component: Tarifs,
});

const PACKAGES = [
  {
    id: "essentiel",
    name: "Essentiel",
    price: "490",
    tagline: "Pour tester ou lancer vite",
    for: "Indépendants, artisans, mono-produit.",
    features: [
      "1 page vitrine (long-form)",
      "Design responsive mobile-first",
      "Formulaire de contact",
      "Section horaires & accès (Google Maps)",
      "Nom de domaine assisté",
      "Livraison en 48h ouvrées",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    price: "990",
    tagline: "Le choix des commerces",
    for: "Restaurants, boutiques, cabinets.",
    features: [
      "Jusqu'à 5 pages (accueil, à propos, services, contact, ...)",
      "SEO de base : titres, méta, sitemap",
      "Fiche Google Business Profile optimisée",
      "Formulaire + bouton WhatsApp / téléphone",
      "Intégration réseaux sociaux",
      "Livraison en 48h ouvrées",
    ],
    highlight: true,
  },
  {
    id: "premium",
    name: "Premium",
    price: "1490",
    tagline: "Croissance & contenu",
    for: "PME qui publient, cabinets qui prennent des RDV.",
    features: [
      "Tout le package Pro",
      "Blog / actualités intégré (facile à mettre à jour)",
      "Prise de RDV en ligne (Calendly / Cal.com)",
      "Tracking analytics (Plausible / GA4)",
      "1 révision incluse après livraison",
      "Livraison en 48h ouvrées",
    ],
  },
];

function Tarifs() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-16 md:py-24">
      <div className="mb-12 text-center">
        <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-accent-foreground/80">
          <span className="h-px w-8 bg-accent" /> Tarifs
        </div>
        <h1 className="mt-3 font-brand text-5xl font-black tracking-tight md:text-6xl">
          Prix fixe. Livraison 48h.
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
          Payable en CHF ou EUR — mêmes tarifs de part et d'autre de la frontière. Pas de mensualité obligatoire, vous êtes propriétaire du site.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {PACKAGES.map((p) => (
          <div
            key={p.id}
            className={`relative flex flex-col rounded-2xl border p-7 ${
              p.highlight
                ? "border-accent bg-primary text-primary-foreground shadow-xl"
                : "border-border bg-card"
            }`}
          >
            {p.highlight && (
              <div className="absolute -top-3 left-6 rounded-full bg-accent px-3 py-1 text-xs font-semibold text-accent-foreground">
                Le plus choisi
              </div>
            )}
            <div className="font-brand text-2xl font-bold">{p.name}</div>
            <div className={`text-sm ${p.highlight ? "text-primary-foreground/70" : "text-muted-foreground"}`}>{p.tagline}</div>
            <div className="mt-6 flex items-baseline gap-1">
              <span className="font-brand text-5xl font-black">{p.price}</span>
              <span className="text-sm opacity-70">CHF / €</span>
            </div>
            <div className={`mt-2 text-xs ${p.highlight ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
              Pour : {p.for}
            </div>
            <ul className="mt-6 space-y-2.5 text-sm">
              {p.features.map((f) => (
                <li key={f} className="flex items-start gap-2">
                  <Check className="mt-0.5 h-4 w-4 flex-none text-accent" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <Link
              to="/brief"
              search={{ pkg: p.id }}
              className={`mt-8 inline-flex items-center justify-center rounded-md px-4 py-2.5 text-sm font-semibold ${
                p.highlight ? "btn-amber" : "border border-primary text-primary hover:bg-primary hover:text-primary-foreground"
              }`}
            >
              Choisir {p.name}
            </Link>
          </div>
        ))}
      </div>

      <div className="mt-16 rounded-2xl border border-border bg-card p-8">
        <h2 className="font-brand text-2xl font-bold">Options & compléments</h2>
        <div className="mt-4 grid gap-4 text-sm md:grid-cols-2">
          <div>
            <div className="font-semibold">Page supplémentaire</div>
            <div className="text-muted-foreground">+ 90 CHF / €</div>
          </div>
          <div>
            <div className="font-semibold">Rédaction contenu (par page)</div>
            <div className="text-muted-foreground">+ 120 CHF / €</div>
          </div>
          <div>
            <div className="font-semibold">Nom de domaine (1 an)</div>
            <div className="text-muted-foreground">Refacturé au coût réel (~15 – 30)</div>
          </div>
          <div>
            <div className="font-semibold">Maintenance mensuelle</div>
            <div className="text-muted-foreground">Dès 29 / mois — optionnel</div>
          </div>
        </div>
      </div>
    </div>
  );
}
