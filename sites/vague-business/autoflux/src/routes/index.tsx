import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Zap, Clock, CheckCircle2, Workflow, Bell, FileText, MessageSquare, Star, ShoppingCart } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "AutoFlux — Automatisations Make & Zapier pour PME" },
      { name: "description", content: "Pack d'automatisation clé en main : audit + 5 scénarios livrés. Faites gagner 5h/semaine à votre équipe. Dès 790 €." },
      { property: "og:title", content: "AutoFlux — 5 automatisations, 5h/semaine gagnées" },
      { property: "og:description", content: "Packs Make/Zapier livrés clé en main pour PME suisses et françaises." },
    ],
  }),
  component: Home,
});

const automations = [
  { icon: Workflow, tag: "LEAD", title: "Lead formulaire → CRM + email + Slack", desc: "Chaque prospect est routé instantanément dans le CRM, reçoit un email de bienvenue et notifie l'équipe sur Slack." },
  { icon: FileText, tag: "FINANCE", title: "Facture payée → relance J+7 / J+14", desc: "Détection du paiement Stripe, séquence de relance automatique, escalade à l'équipe si impayé." },
  { icon: MessageSquare, tag: "RDV", title: "RDV Calendly → fiche client + rappel WhatsApp", desc: "Création d'une fiche Notion, envoi d'un rappel WhatsApp 24h avant, suivi post-RDV." },
  { icon: Star, tag: "AVIS", title: "Avis Google → alerte + réponse draft", desc: "Alerte Slack sur chaque avis, brouillon de réponse pré-rédigé selon la note. Modération humaine finale." },
  { icon: CheckCircle2, tag: "SALES", title: "Devis accepté → checklist onboarding", desc: "Génération de la checklist d'onboarding, planning kickoff, envoi doc client. Zero saisie manuelle." },
  { icon: ShoppingCart, tag: "ECOM", title: "Nouvelle commande → stock + facture", desc: "Décrément stock, création facture, notification préparateur, tracking client. Le combo ecom." },
];

const packs = [
  { name: "Starter", price: "790", flows: "3 automatisations", ideal: "Solo & TPE" },
  { name: "Growth", price: "1290", flows: "5 automatisations", ideal: "PME 5–20 pers.", featured: true },
  { name: "Scale", price: "1990", flows: "5 + intégrations sur mesure", ideal: "PME 20+ pers." },
];

const faqs = [
  { q: "En combien de temps le pack est-il livré ?", a: "10 jours ouvrés en moyenne. Audit sous 48h après signature, puis livraison itérative des scénarios." },
  { q: "Sur quels outils travaillez-vous ?", a: "Make, Zapier, n8n, Google Workspace, Notion, Airtable, HubSpot, Pipedrive, Stripe, WhatsApp Business API, Slack, Calendly." },
  { q: "Est-ce que je dépends de vous après ?", a: "Non. Tout est livré sur vos comptes, documenté. Vous restez propriétaire des scénarios. Support 30 jours inclus." },
  { q: "TVA et facturation ?", a: "Facturation en CHF ou EUR selon le siège. TVA suisse (8.1%) ou française (20%) applicable." },
  { q: "Et si mes outils ne sont pas standards ?", a: "Le pack Scale inclut jusqu'à 2 intégrations sur mesure (API, webhook). Au-delà, on chiffre en jour/homme." },
];

function Home() {
  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden border-b border-border/60">
        <div className="absolute inset-0 grid-bg opacity-40" />
        <div className="container-x relative py-20 md:py-28">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 font-mono text-xs tracking-wider">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" />
              PACKS N°01 → N°03 · DISPONIBLES
            </div>
            <h1 className="mt-6 text-5xl font-bold leading-[1.05] md:text-7xl">
              5 automatisations.<br />
              <span className="cyan-underline">5 heures</span> gagnées par semaine.
            </h1>
            <p className="mt-6 max-w-xl text-lg text-muted-foreground">
              AutoFlux livre des packs Make & Zapier clé en main pour PME suisses et françaises. Audit, build, doc — vous récupérez du temps, pas un tutoriel de plus.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/audit" className="inline-flex items-center gap-2 rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90">
                Demander l'audit gratuit <ArrowRight className="h-4 w-4" />
              </Link>
              <Link to="/packs" className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-6 py-3 text-sm font-medium hover:border-accent">
                Voir les packs
              </Link>
            </div>
            <div className="mt-10 flex flex-wrap items-center gap-6 font-mono text-xs text-muted-foreground">
              <span className="flex items-center gap-2"><Clock className="h-4 w-4 text-accent" /> Livré en 10 jours</span>
              <span className="flex items-center gap-2"><Zap className="h-4 w-4 text-accent" /> Make · Zapier · n8n</span>
              <span className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-accent" /> Support 30 jours</span>
            </div>
          </div>
        </div>
      </section>

      {/* PACKS PREVIEW */}
      <section className="border-b border-border/60 bg-card">
        <div className="container-x py-20">
          <div className="flex items-end justify-between gap-6">
            <div>
              <div className="font-mono text-xs tracking-widest text-muted-foreground">§ 01 · PACKS</div>
              <h2 className="mt-2 text-3xl font-bold md:text-4xl">Trois formats. Un seul objectif : livrer.</h2>
            </div>
            <Link to="/packs" className="hidden text-sm underline-offset-4 hover:underline md:inline">Détails →</Link>
          </div>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {packs.map((p) => (
              <div key={p.name} className={`relative rounded-lg border p-6 ${p.featured ? "border-accent bg-background shadow-[0_0_0_4px_var(--cyan)]/10" : "border-border bg-background"}`}>
                {p.featured && <div className="absolute -top-3 left-6 rounded bg-accent px-2 py-0.5 font-mono text-[10px] tracking-widest text-accent-foreground">POPULAIRE</div>}
                <div className="font-mono text-xs tracking-widest text-muted-foreground">PACK / {p.name.toUpperCase()}</div>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-4xl font-bold">{p.price}</span>
                  <span className="text-sm text-muted-foreground">€ HT</span>
                </div>
                <div className="mt-3 text-sm">{p.flows}</div>
                <div className="text-xs text-muted-foreground">Idéal : {p.ideal}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AUTOMATIONS GRID */}
      <section className="border-b border-border/60">
        <div className="container-x py-20">
          <div className="max-w-2xl">
            <div className="font-mono text-xs tracking-widest text-muted-foreground">§ 02 · CATALOGUE</div>
            <h2 className="mt-2 text-3xl font-bold md:text-4xl">6 automatisations qui marchent, testées sur le terrain.</h2>
            <p className="mt-3 text-muted-foreground">Choisissez celles qui matchent votre stack. On les livre, documentées, sur vos comptes.</p>
          </div>
          <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {automations.map(({ icon: Icon, tag, title, desc }) => (
              <div key={title} className="group relative rounded-lg border border-border bg-card p-6 transition hover:border-accent">
                <div className="flex items-center justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-md bg-ink text-bone">
                    <Icon className="h-5 w-5 text-accent" />
                  </div>
                  <span className="font-mono text-[10px] tracking-widest text-muted-foreground">/{tag}</span>
                </div>
                <h3 className="mt-4 font-semibold leading-tight">{title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PROCESS */}
      <section className="border-b border-border/60 bg-ink text-bone">
        <div className="container-x py-20">
          <div className="font-mono text-xs tracking-widest text-bone/60">§ 03 · PROCESSUS</div>
          <h2 className="mt-2 text-3xl font-bold md:text-4xl">Quatre étapes. Dix jours. Zéro flou.</h2>
          <div className="mt-12 grid gap-8 md:grid-cols-4">
            {[
              { n: "01", t: "Audit", d: "Vous remplissez le brief. On revient sous 48h avec un diagnostic écrit et 5 scénarios recommandés." },
              { n: "02", t: "Cadrage", d: "Call de 45 min pour valider les flux, les outils, les cas limites. Devis signé." },
              { n: "03", t: "Build", d: "On construit sur vos comptes. Tests en conditions réelles. Documentation Notion partagée." },
              { n: "04", t: "Passation", d: "Formation de 60 min. Support 30 jours. Vous êtes autonomes." },
            ].map((s) => (
              <div key={s.n} className="border-l border-bone/20 pl-4">
                <div className="font-mono text-xs text-accent">{s.n}</div>
                <div className="mt-2 text-lg font-semibold">{s.t}</div>
                <p className="mt-2 text-sm text-bone/70">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-b border-border/60">
        <div className="container-x py-20">
          <div className="grid gap-10 md:grid-cols-[1fr_2fr]">
            <div>
              <div className="font-mono text-xs tracking-widest text-muted-foreground">§ 04 · FAQ</div>
              <h2 className="mt-2 text-3xl font-bold md:text-4xl">Questions fréquentes</h2>
              <p className="mt-3 text-sm text-muted-foreground">
                Une autre question ? <Link to="/audit" className="underline">Écrivez-nous</Link>.
              </p>
            </div>
            <Accordion type="single" collapsible className="w-full">
              {faqs.map((f, i) => (
                <AccordionItem key={i} value={`i${i}`}>
                  <AccordionTrigger className="text-left">{f.q}</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">{f.a}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section>
        <div className="container-x py-20">
          <div className="rounded-2xl border border-border bg-card p-10 md:p-16">
            <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
              <div className="max-w-xl">
                <div className="font-mono text-xs tracking-widest text-accent">→ PROCHAINE ÉTAPE</div>
                <h2 className="mt-2 text-3xl font-bold md:text-4xl">Prêt à gagner 5h/semaine ?</h2>
                <p className="mt-3 text-muted-foreground">Décrivez-nous vos outils et vos frictions. Audit sous 48h, gratuit.</p>
              </div>
              <Link to="/audit" className="inline-flex items-center gap-2 rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90">
                Démarrer l'audit <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
