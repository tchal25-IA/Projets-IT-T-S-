import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ShieldCheck,
  AlertTriangle,
  Cookie,
  FileText,
  ArrowRight,
  Check,
  Sparkles,
  Clock,
  Users,
  Search,
  Wrench,
  Rocket,
} from "lucide-react";
import { SiteLayout, PACKAGES } from "@/components/site-layout";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SiteConforme — Audit et mise en conformité RGPD / nLPD (390–990 €)" },
      {
        name: "description",
        content:
          "Mentions, cookies, formulaires : on met votre site PME en conformité RGPD / nLPD. Audit + correctifs à partir de 390 €.",
      },
      { property: "og:title", content: "SiteConforme — Conformité RGPD / nLPD pour PME" },
      {
        property: "og:description",
        content:
          "Audit + correctifs pour sites vitrines et e-commerce. Packages Flash, Fix, Full de 390 à 990 €.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const RISKS = [
  {
    icon: AlertTriangle,
    title: "Amendes RGPD / nLPD",
    text: "Jusqu'à 20 M€ ou 4 % du CA (RGPD) et 250 000 CHF pour les responsables (nLPD).",
  },
  {
    icon: Cookie,
    title: "Bandeau cookies non conforme",
    text: "1er motif de mise en demeure CNIL. Refus doit être aussi simple qu'accepter.",
  },
  {
    icon: FileText,
    title: "Réputation & confiance",
    text: "Un site non conforme fait fuir clients pros, appels d'offres et partenaires.",
  },
];

const STEPS = [
  { icon: Search, title: "1. Audit", text: "On scanne votre site sur 10 points clés RGPD / nLPD." },
  { icon: Wrench, title: "2. Correctifs", text: "On implémente : cookies, mentions, formulaires, politique." },
  { icon: Rocket, title: "3. Suivi", text: "Rapport de conformité + revue à 30 jours (pack Full)." },
];

const FAQ = [
  {
    q: "Vous êtes un cabinet d'avocats ?",
    a: "Non. SiteConforme est un service technique de mise en conformité. Nos livrables ne constituent pas un conseil juridique. Pour un avis, consultez un avocat spécialisé.",
  },
  {
    q: "RGPD ou nLPD, vous couvrez quoi ?",
    a: "Les deux. Nos clients sont en France (RGPD) et en Suisse (nLPD depuis sept. 2023). Les checklists sont adaptées selon votre pays.",
  },
  {
    q: "Quels CMS supportez-vous ?",
    a: "WordPress, Webflow, Shopify, Wix, Framer et sites custom. On s'adapte à votre stack.",
  },
  {
    q: "Combien de temps prend un pack Fix ?",
    a: "Entre 5 et 10 jours ouvrés selon la taille du site et le délai de retour de vos textes.",
  },
  {
    q: "Puis-je juste faire un audit moi-même ?",
    a: "Oui — utilisez notre outil self-serve Conformia pour un premier diagnostic gratuit avant d'engager un pack.",
  },
];

function Index() {
  return (
    <SiteLayout>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-95"
          style={{ background: "var(--gradient-hero)" }}
          aria-hidden
        />
        <div className="relative mx-auto max-w-6xl px-6 py-24 md:py-32 text-primary-foreground">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/20 px-3 py-1 text-xs font-medium backdrop-blur">
            <Sparkles className="h-3.5 w-3.5" /> Service productisé — livraison 5 à 10 jours
          </span>
          <h1 className="mt-6 text-4xl md:text-6xl font-semibold tracking-tight max-w-3xl">
            Votre site en conformité RGPD / nLPD, sans y passer vos week-ends.
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-white/85">
            Mentions, cookies, formulaires : on audite votre site et on applique les correctifs.
            Forfaits clairs de 390 à 990 €, pour TPE et PME en France et en Suisse.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to="/demander"
              className="inline-flex items-center gap-2 rounded-md bg-accent px-5 py-3 text-sm font-semibold text-accent-foreground hover:opacity-90 transition"
            >
              Demander un audit <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href="https://conformia-audit.lovable.app"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-md border border-white/30 bg-white/5 px-5 py-3 text-sm font-medium hover:bg-white/10 transition"
            >
              Essayer l'audit self-serve gratuit
            </a>
          </div>
          <div className="mt-10 flex flex-wrap items-center gap-6 text-sm text-white/80">
            <div className="flex items-center gap-2"><Clock className="h-4 w-4" /> Livraison 5–10 jours</div>
            <div className="flex items-center gap-2"><Users className="h-4 w-4" /> +120 sites accompagnés</div>
            <div className="flex items-center gap-2"><ShieldCheck className="h-4 w-4" /> FR & CH</div>
          </div>
        </div>
      </section>

      {/* Risks */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="max-w-2xl">
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight">
            Un site non conforme, c'est un risque concret.
          </h2>
          <p className="mt-3 text-muted-foreground">
            La CNIL et le PFPDT contrôlent activement. En 2024, la CNIL a prononcé plus de 80 M€ d'amendes
            liées à des sites web.
          </p>
        </div>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {RISKS.map((r) => (
            <div key={r.title} className="rounded-xl border border-border bg-card p-6">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-destructive/10 text-destructive">
                <r.icon className="h-5 w-5" />
              </span>
              <h3 className="mt-4 font-semibold">{r.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{r.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Packages */}
      <section id="packages" className="bg-secondary/40 border-y border-border">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <div className="max-w-2xl">
            <h2 className="text-3xl md:text-4xl font-semibold tracking-tight">Trois packages, prix fixes.</h2>
            <p className="mt-3 text-muted-foreground">
              Pas de devis à rallonge. Vous choisissez, on livre.
            </p>
          </div>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {PACKAGES.map((p) => (
              <div
                key={p.name}
                className={
                  "relative rounded-2xl border p-6 flex flex-col " +
                  (p.highlight
                    ? "border-accent bg-card shadow-[var(--shadow-elegant)]"
                    : "border-border bg-card")
                }
              >
                {p.highlight && (
                  <span className="absolute -top-3 left-6 rounded-full bg-accent px-3 py-1 text-xs font-medium text-accent-foreground">
                    Le plus choisi
                  </span>
                )}
                <div className="text-sm font-medium text-muted-foreground">{p.name}</div>
                <div className="mt-2 text-3xl font-semibold tracking-tight">{p.price}</div>
                <div className="text-sm text-muted-foreground mt-1">{p.tagline}</div>
                <ul className="mt-6 space-y-3 text-sm">
                  {p.features.map((f) => (
                    <li key={f} className="flex gap-2">
                      <Check className="h-4 w-4 text-accent mt-0.5 shrink-0" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  to="/demander"
                  search={{ pkg: p.name.toLowerCase() }}
                  className={
                    "mt-8 inline-flex items-center justify-center rounded-md px-4 py-2.5 text-sm font-medium transition " +
                    (p.highlight
                      ? "bg-primary text-primary-foreground hover:opacity-90"
                      : "border border-border hover:bg-secondary")
                  }
                >
                  {p.cta}
                </Link>
              </div>
            ))}
          </div>
          <p className="mt-6 text-xs text-muted-foreground">
            Prix HT. Paiement à la commande. Facture FR ou CH selon votre entité.
          </p>
        </div>
      </section>

      {/* Process */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <h2 className="text-3xl md:text-4xl font-semibold tracking-tight">Comment ça marche</h2>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {STEPS.map((s) => (
            <div key={s.title} className="rounded-xl border border-border bg-card p-6">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
                <s.icon className="h-5 w-5" />
              </span>
              <h3 className="mt-4 font-semibold">{s.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{s.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Conformia upsell */}
      <section className="mx-auto max-w-6xl px-6 pb-20">
        <div className="rounded-2xl border border-border bg-card p-8 md:p-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <div className="text-xs font-medium uppercase tracking-wider text-accent">Outil partenaire</div>
            <h3 className="mt-2 text-2xl font-semibold tracking-tight">
              Un doute ? Lancez d'abord un audit self-serve gratuit
            </h3>
            <p className="mt-2 text-muted-foreground max-w-xl">
              Conformia scanne votre site en 2 minutes et vous donne un premier diagnostic RGPD / nLPD.
            </p>
          </div>
          <a
            href="https://conformia-audit.lovable.app"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-3 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            Ouvrir Conformia <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="bg-secondary/40 border-t border-border">
        <div className="mx-auto max-w-3xl px-6 py-20">
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight">Questions fréquentes</h2>
          <Accordion type="single" collapsible className="mt-8">
            {FAQ.map((f, i) => (
              <AccordionItem key={i} value={"q" + i}>
                <AccordionTrigger className="text-left">{f.q}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">{f.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* Final CTA */}
      <section className="mx-auto max-w-6xl px-6 py-20 text-center">
        <h2 className="text-3xl md:text-4xl font-semibold tracking-tight">
          Prêt à passer votre site en conformité ?
        </h2>
        <p className="mt-3 text-muted-foreground max-w-xl mx-auto">
          Envoyez-nous l'URL, on vous rappelle sous 24 h avec un premier diagnostic.
        </p>
        <Link
          to="/demander"
          className="mt-8 inline-flex items-center gap-2 rounded-md bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:opacity-90"
        >
          Demander un audit <ArrowRight className="h-4 w-4" />
        </Link>
      </section>
    </SiteLayout>
  );
}
