import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Check, Clock, Sparkles, Zap, ShieldCheck, ChevronDown } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "VitrineFlash — Refonte de site vitrine en 48h (dès 490)" },
      { name: "description", content: "Un site moderne livré en 48h pour commerces, artisans et TPE en Suisse et en France. Brief, design, livraison. Dès 490." },
      { property: "og:title", content: "VitrineFlash — Refonte de site vitrine en 48h" },
      { property: "og:description", content: "Sites modernes livrés en 48h. Brief simple, prix fixe, zéro agence lourde." },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <>
      <Hero />
      <TrustBar />
      <HowItWorks />
      <Packages />
      <Cases />
      <FAQ />
      <FinalCTA />
    </>
  );
}

function Hero() {
  return (
    <section className="grain-bg relative overflow-hidden">
      <div className="mx-auto max-w-6xl px-4 pt-16 pb-20 md:pt-24 md:pb-28">
        <div className="max-w-3xl">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-background/60 px-3 py-1 text-xs font-medium">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-accent" />
            Créneaux ouverts cette semaine — CH / FR
          </div>
          <h1 className="font-brand text-5xl font-black leading-[0.95] tracking-tight md:text-7xl">
            VitrineFlash
          </h1>
          <p className="mt-6 font-brand text-2xl font-medium leading-tight md:text-4xl">
            Votre site vitrine, refait en <span className="bg-accent px-2 py-0.5 text-accent-foreground">48 heures</span>.
          </p>
          <p className="mt-5 max-w-xl text-base text-muted-foreground md:text-lg">
            Un brief simple, un prix fixe, un site moderne livré en deux jours ouvrés. Pensé pour les commerces, artisans et cabinets qui n'ont pas le temps pour une agence.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link to="/brief" className="btn-amber inline-flex items-center gap-2 rounded-md px-6 py-3 text-base">
              Demander ma refonte 48h <ArrowRight className="h-4 w-4" />
            </Link>
            <Link to="/tarifs" className="inline-flex items-center gap-2 rounded-md border border-primary px-6 py-3 text-base font-medium hover:bg-primary hover:text-primary-foreground">
              Voir les tarifs
            </Link>
          </div>
          <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-accent" /> Livraison 48h ouvrées</span>
            <span className="inline-flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-accent" /> Prix fixe, zéro surprise</span>
            <span className="inline-flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-accent" /> Vous gardez tout</span>
          </div>
        </div>

        <BrowserMock />
      </div>
    </section>
  );
}

function BrowserMock() {
  return (
    <div className="mt-14 grid gap-4 md:grid-cols-2">
      <MockFrame label="Avant" tone="dull">
        <div className="space-y-2">
          <div className="h-3 w-2/3 rounded bg-muted-foreground/30" />
          <div className="h-3 w-1/2 rounded bg-muted-foreground/20" />
          <div className="mt-4 h-16 w-full rounded bg-muted-foreground/15" />
          <div className="mt-4 grid grid-cols-3 gap-2">
            <div className="h-10 rounded bg-muted-foreground/15" />
            <div className="h-10 rounded bg-muted-foreground/15" />
            <div className="h-10 rounded bg-muted-foreground/15" />
          </div>
        </div>
      </MockFrame>
      <MockFrame label="Après" tone="fresh">
        <div className="space-y-3">
          <div className="font-brand text-xl font-bold">Boulangerie Marot</div>
          <div className="text-xs text-muted-foreground">Pain au levain · Lausanne</div>
          <div className="mt-3 h-24 rounded-md bg-gradient-to-br from-accent/70 to-accent/30" />
          <div className="grid grid-cols-3 gap-2">
            <div className="h-12 rounded bg-primary/90" />
            <div className="h-12 rounded bg-muted" />
            <div className="h-12 rounded bg-muted" />
          </div>
          <div className="inline-flex items-center gap-1 rounded bg-primary px-2 py-1 text-[10px] font-medium text-primary-foreground">
            Commander →
          </div>
        </div>
      </MockFrame>
    </div>
  );
}

function MockFrame({ label, tone, children }: { label: string; tone: "dull" | "fresh"; children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-[0_20px_60px_-30px_rgba(0,0,0,0.25)]">
      <div className="flex items-center gap-2 border-b border-border bg-muted/60 px-3 py-2">
        <span className="h-2.5 w-2.5 rounded-full bg-red-400/70" />
        <span className="h-2.5 w-2.5 rounded-full bg-yellow-400/70" />
        <span className="h-2.5 w-2.5 rounded-full bg-green-400/70" />
        <span className="ml-3 rounded bg-background px-2 py-0.5 text-[10px] text-muted-foreground">boulangerie-marot.ch</span>
        <span className={`ml-auto rounded px-2 py-0.5 text-[10px] font-semibold ${tone === "fresh" ? "bg-accent text-accent-foreground" : "bg-muted-foreground/20 text-muted-foreground"}`}>
          {label}
        </span>
      </div>
      <div className={`p-5 ${tone === "dull" ? "bg-[#efece5]" : "bg-card"}`}>
        {children}
      </div>
    </div>
  );
}

function TrustBar() {
  return (
    <div className="border-y border-border bg-primary text-primary-foreground">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-6 px-4 py-8 md:grid-cols-4">
        {[
          { n: "48h", t: "Livraison" },
          { n: "490€", t: "À partir de" },
          { n: "100%", t: "Mobile-first" },
          { n: "24h", t: "Réponse au brief" },
        ].map((s) => (
          <div key={s.t}>
            <div className="font-brand text-3xl font-black text-accent md:text-4xl">{s.n}</div>
            <div className="text-xs uppercase tracking-widest text-primary-foreground/70">{s.t}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function HowItWorks() {
  const steps = [
    { icon: Sparkles, title: "1. Vous envoyez le brief", text: "5 minutes en ligne : votre activité, vos couleurs, vos pages. C'est tout." },
    { icon: Zap, title: "2. On design en direct", text: "En 24h, une première version — construite avec l'IA et notre process productisé." },
    { icon: ShieldCheck, title: "3. Livraison en 48h", text: "Site en ligne, mobile, formulaire de contact, prêt à recevoir vos clients." },
  ];
  return (
    <section id="process" className="mx-auto max-w-6xl px-4 py-20 md:py-28">
      <SectionKicker>Comment ça marche</SectionKicker>
      <h2 className="mt-2 font-brand text-4xl font-black tracking-tight md:text-5xl">
        Trois étapes. Deux jours. Un site.
      </h2>
      <div className="mt-12 grid gap-6 md:grid-cols-3">
        {steps.map((s) => (
          <div key={s.title} className="rounded-xl border border-border bg-card p-6">
            <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-lg bg-accent text-accent-foreground">
              <s.icon className="h-5 w-5" />
            </div>
            <div className="font-brand text-xl font-bold">{s.title}</div>
            <p className="mt-2 text-sm text-muted-foreground">{s.text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

const PACKAGES = [
  {
    id: "essentiel",
    name: "Essentiel",
    price: "490",
    tagline: "Pour tester ou lancer vite",
    features: ["1 page (long-form)", "Design mobile-first", "Formulaire de contact", "Livré en 48h"],
    highlight: false,
  },
  {
    id: "pro",
    name: "Pro",
    price: "990",
    tagline: "Le choix des commerces",
    features: ["Jusqu'à 5 pages", "SEO de base + méta", "Fiche Google Business optimisée", "Formulaire + WhatsApp", "Livré en 48h"],
    highlight: true,
  },
  {
    id: "premium",
    name: "Premium",
    price: "1490",
    tagline: "Croissance & contenu",
    features: ["Tout le Pro", "Blog / actualités intégré", "Tracking analytics", "1 révision incluse", "Livré en 48h"],
    highlight: false,
  },
];

function Packages() {
  return (
    <section id="tarifs" className="border-y border-border bg-secondary/40">
      <div className="mx-auto max-w-6xl px-4 py-20 md:py-28">
        <SectionKicker>Packages</SectionKicker>
        <h2 className="mt-2 font-brand text-4xl font-black tracking-tight md:text-5xl">
          Un prix fixe. Aucun devis fumeux.
        </h2>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          Choisissez le format qui vous correspond. Payable en CHF ou EUR.
        </p>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
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
              <ul className="mt-6 space-y-2.5 text-sm">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <Check className={`mt-0.5 h-4 w-4 flex-none ${p.highlight ? "text-accent" : "text-accent"}`} />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <Link
                to="/brief"
                search={{ pkg: p.id }}
                className={`mt-8 inline-flex items-center justify-center rounded-md px-4 py-2.5 text-sm font-semibold ${
                  p.highlight
                    ? "btn-amber"
                    : "border border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                }`}
              >
                Choisir {p.name}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const CASES = [
  {
    name: "Boulangerie Marot",
    city: "Lausanne, VD",
    before: "Site WordPress de 2014, illisible sur mobile, aucun contact clair.",
    after: "Nouvelle vitrine mobile, menu du jour + commande WhatsApp. Livrée en 48h.",
    metric: "+38% d'appels en 2 semaines",
    pack: "Pro",
  },
  {
    name: "Cabinet Dr. Fournier",
    city: "Annecy, 74",
    before: "Aucun site — juste une page Google.",
    after: "Site clair avec prise de rendez-vous, présentation, tarifs, accès.",
    metric: "12 RDV en ligne / semaine",
    pack: "Premium",
  },
  {
    name: "Atelier Menuiserie Vaud",
    city: "Nyon, VD",
    before: "Vieux site Wix confus, photos floues, pas de portfolio.",
    after: "Portfolio propre, formulaire de devis, mieux référencé.",
    metric: "3 devis / semaine (vs. 0)",
    pack: "Essentiel",
  },
];

function Cases() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-20 md:py-28">
      <SectionKicker>Cas clients</SectionKicker>
      <h2 className="mt-2 font-brand text-4xl font-black tracking-tight md:text-5xl">
        Des commerces, pas des startups.
      </h2>
      <div className="mt-12 grid gap-6 md:grid-cols-3">
        {CASES.map((c) => (
          <article key={c.name} className="flex flex-col rounded-xl border border-border bg-card p-6">
            <div className="mb-4 inline-flex w-fit items-center gap-1.5 rounded-full bg-accent/20 px-2.5 py-1 text-[11px] font-semibold text-foreground">
              Package {c.pack}
            </div>
            <div className="font-brand text-xl font-bold">{c.name}</div>
            <div className="text-xs uppercase tracking-wider text-muted-foreground">{c.city}</div>
            <div className="mt-5 space-y-3 text-sm">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Avant</div>
                <p className="text-foreground/80">{c.before}</p>
              </div>
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-wider text-accent">Après</div>
                <p className="text-foreground">{c.after}</p>
              </div>
            </div>
            <div className="mt-6 border-t border-border pt-4 font-brand text-lg font-bold text-primary">
              {c.metric}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

const FAQS = [
  { q: "Vraiment 48h ?", a: "Oui, 48h ouvrées à partir du moment où on reçoit votre brief complet et vos textes/photos. On bloque un créneau pour vous." },
  { q: "Et si je n'ai pas de contenu ?", a: "On vous guide. Pour le Pro et le Premium, on peut rédiger les textes de base à partir de votre activité — c'est inclus." },
  { q: "C'est en Suisse ou en France ?", a: "Les deux. On facture en CHF pour la Suisse et en EUR pour la France, mêmes prix." },
  { q: "Qui héberge le site ?", a: "On le publie sur Lovable Cloud (nom de domaine sur .ch / .fr / .com selon votre choix). Vous restez propriétaire à 100%." },
  { q: "Je peux modifier ensuite ?", a: "Oui. On vous laisse les accès. Pour les évolutions, un forfait maintenance existe." },
  { q: "Et si le résultat ne me plaît pas ?", a: "Le Premium inclut une révision. Sinon, on ajuste jusqu'à validation dans un cadre raisonnable." },
];

function FAQ() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section id="faq" className="border-t border-border bg-secondary/40">
      <div className="mx-auto max-w-3xl px-4 py-20 md:py-28">
        <SectionKicker>FAQ</SectionKicker>
        <h2 className="mt-2 font-brand text-4xl font-black tracking-tight md:text-5xl">Vos questions.</h2>
        <div className="mt-10 divide-y divide-border rounded-xl border border-border bg-card">
          {FAQS.map((f, i) => (
            <button
              key={f.q}
              onClick={() => setOpen(open === i ? null : i)}
              className="flex w-full flex-col items-start gap-2 px-5 py-4 text-left"
            >
              <div className="flex w-full items-center justify-between gap-4">
                <span className="font-brand text-lg font-bold">{f.q}</span>
                <ChevronDown className={`h-4 w-4 flex-none transition-transform ${open === i ? "rotate-180" : ""}`} />
              </div>
              {open === i && <p className="text-sm text-muted-foreground">{f.a}</p>}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

function FinalCTA() {
  return (
    <section className="bg-primary text-primary-foreground">
      <div className="mx-auto max-w-4xl px-4 py-20 text-center md:py-28">
        <Clock className="mx-auto h-8 w-8 text-accent" />
        <h2 className="mt-4 font-brand text-4xl font-black tracking-tight md:text-6xl">
          Votre nouveau site,<br />
          <span className="text-accent">après-demain.</span>
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-primary-foreground/80">
          Remplissez le brief. On revient sous 24h avec un créneau de livraison.
        </p>
        <Link to="/brief" className="btn-amber mt-8 inline-flex items-center gap-2 rounded-md px-8 py-4 text-base">
          Demander ma refonte 48h <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </section>
  );
}

function SectionKicker({ children }: { children: React.ReactNode }) {
  return (
    <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-accent-foreground/80">
      <span className="h-px w-8 bg-accent" />
      {children}
    </div>
  );
}
