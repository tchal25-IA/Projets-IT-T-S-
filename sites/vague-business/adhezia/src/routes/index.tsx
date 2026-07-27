import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Logo } from "@/components/adhezia/AppShell";
import { ArrowRight, Check, QrCode, Users, Wallet, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Adhezia — Membres & cotisations pour clubs suisses" },
      { name: "description", content: "Gérez les adhérents et encaissez les cotisations sans usine à gaz. Pensé pour les clubs sportifs, associations et Vereine en Suisse." },
      { property: "og:title", content: "Adhezia — Membres & cotisations pour clubs suisses" },
      { property: "og:description", content: "Membres, cotisations, QR check-in — sans usine à gaz. Free jusqu'à 20 membres." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-background/80 backdrop-blur sticky top-0 z-30">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <Logo />
            <span className="font-display text-xl">Adhezia</span>
          </Link>
          <nav className="hidden md:flex items-center gap-8 text-sm text-foreground/80">
            <a href="#features" className="hover:text-primary transition">Fonctions</a>
            <a href="#pricing" className="hover:text-primary transition">Tarifs</a>
            <a href="#faq" className="hover:text-primary transition">FAQ</a>
          </nav>
          <Button asChild size="sm"><Link to="/app">Gérer mon club</Link></Button>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden bg-grid-sand">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-20 lg:py-28 grid gap-12 lg:grid-cols-2 items-center">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground">
              <span className="inline-block size-1.5 rounded-full bg-[color:var(--teal)]" /> Pensé pour les clubs suisses
            </span>
            <h1 className="mt-5 text-5xl lg:text-6xl leading-[1.05]">
              Membres, cotisations,<br /><span className="text-[color:var(--teal-deep)]">QR check-in.</span>
            </h1>
            <p className="mt-5 text-lg text-muted-foreground max-w-xl">
              L'outil léger pour les petits clubs sportifs, associations et Vereine. Suivez vos adhérents et encaissez les cotisations — sans usine à gaz.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg"><Link to="/app">Gérer mon club <ArrowRight className="ml-2 size-4" /></Link></Button>
              <Button asChild variant="outline" size="lg"><a href="#pricing">Voir les tarifs</a></Button>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">Gratuit jusqu'à 20 membres · Aucune carte requise</p>
          </div>

          <div className="relative">
            <div className="absolute -inset-6 bg-[color:color-mix(in_oklab,var(--teal)_10%,transparent)] rounded-3xl blur-2xl" aria-hidden />
            <Card className="relative p-6 shadow-xl">
              <div className="flex items-center justify-between border-b border-border pb-4 mb-4">
                <div>
                  <p className="text-xs text-muted-foreground">Saison 2026 · FC Aurore</p>
                  <p className="font-display text-2xl">Cotisations</p>
                </div>
                <span className="text-sm rounded-full bg-[color:color-mix(in_oklab,var(--success)_15%,transparent)] text-[color:var(--success)] px-3 py-1">
                  73% encaissé
                </span>
              </div>
              <ul className="space-y-3">
                {[
                  { n: "Camille Rochat", s: "Payé", ok: true },
                  { n: "Noah Bühler", s: "À payer", ok: false },
                  { n: "Léa Fontanet", s: "Payé", ok: true },
                  { n: "Yannick Diallo", s: "À payer", ok: false },
                ].map((r) => (
                  <li key={r.n} className="flex items-center justify-between text-sm">
                    <span>{r.n}</span>
                    <span className={r.ok ? "text-[color:var(--success)]" : "text-[color:var(--warning)]"}>{r.s} · CHF 120</span>
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 lg:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <h2 className="text-3xl lg:text-4xl">Un seul job. Bien fait.</h2>
            <p className="mt-3 text-muted-foreground">Suivre les adhérents. Encaisser les cotisations. Pointer les présences. Rien de plus.</p>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {[
              { icon: Users, title: "Fiche membre claire", desc: "Nom, contact, statut. Ajoutez, éditez, exportez en CSV en un clic." },
              { icon: Wallet, title: "Cotisations sous contrôle", desc: "Marquez payé, exonérez, suivez le total encaissé sur la saison." },
              { icon: QrCode, title: "Check-in par QR / code", desc: "Chaque membre a son code. Vous pointez en 2 secondes à l'entrée." },
            ].map((f) => (
              <Card key={f.title} className="p-6">
                <span className="inline-flex size-10 items-center justify-center rounded-lg bg-[color:color-mix(in_oklab,var(--teal)_15%,transparent)] text-[color:var(--teal-deep)]">
                  <f.icon className="size-5" />
                </span>
                <h3 className="mt-4 text-xl">{f.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{f.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 lg:py-24 bg-secondary/50">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-3xl lg:text-4xl">Tarifs simples, en francs.</h2>
            <p className="mt-3 text-muted-foreground">Commencez gratuitement. Payez seulement si vous grandissez.</p>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {[
              { name: "Free", price: "0", desc: "Jusqu'à 20 membres", features: ["Fiches membres", "Cotisations manuelles", "Export CSV"], cta: "Commencer" },
              { name: "Club", price: "19", desc: "Petits clubs actifs", features: ["Jusqu'à 150 membres", "QR check-in", "Relances email (bientôt)"], cta: "Essayer Club", featured: true },
              { name: "Pro", price: "39", desc: "Associations établies", features: ["Membres illimités", "Multi-événements", "Support prioritaire"], cta: "Essayer Pro" },
            ].map((t) => (
              <Card key={t.name} className={"p-6 relative " + (t.featured ? "ring-2 ring-primary" : "")}>
                {t.featured && <span className="absolute -top-3 left-6 rounded-full bg-primary text-primary-foreground text-xs px-3 py-1">Le plus populaire</span>}
                <p className="text-sm font-medium">{t.name}</p>
                <p className="mt-2"><span className="text-4xl font-display">{t.price}</span> <span className="text-muted-foreground text-sm">CHF/mois</span></p>
                <p className="mt-1 text-sm text-muted-foreground">{t.desc}</p>
                <ul className="mt-5 space-y-2 text-sm">
                  {t.features.map((f) => <li key={f} className="flex items-start gap-2"><Check className="size-4 mt-0.5 text-[color:var(--success)]" /> {f}</li>)}
                </ul>
                <Button asChild variant={t.featured ? "default" : "outline"} className="mt-6 w-full"><Link to="/app">{t.cta}</Link></Button>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-20 lg:py-24">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl lg:text-4xl text-center">Questions fréquentes</h2>
          <Accordion type="single" collapsible className="mt-10">
            <AccordionItem value="q1">
              <AccordionTrigger>En quoi Adhezia diffère d'Assoconnect ou Yapla ?</AccordionTrigger>
              <AccordionContent>Adhezia fait moins de choses, mais mieux et moins cher. Pas de site web, pas de billetterie complexe : uniquement les membres, les cotisations et le check-in. Parfait pour les clubs de 10 à 150 personnes qui n'ont pas besoin d'une usine à gaz.</AccordionContent>
            </AccordionItem>
            <AccordionItem value="q2">
              <AccordionTrigger>Peut-on encaisser par Stripe / TWINT ?</AccordionTrigger>
              <AccordionContent>Bientôt. Pour la version actuelle, le suivi est manuel : vous marquez « payé » quand vous recevez le virement ou l'espèces. L'intégration TWINT et Stripe arrive prochainement.</AccordionContent>
            </AccordionItem>
            <AccordionItem value="q3">
              <AccordionTrigger>Puis-je gérer plusieurs clubs ?</AccordionTrigger>
              <AccordionContent>En version Free, un club par navigateur. Le multi-club et le partage entre trésoriers arrivent avec les plans Club et Pro.</AccordionContent>
            </AccordionItem>
            <AccordionItem value="q4">
              <AccordionTrigger>Où sont stockées mes données ?</AccordionTrigger>
              <AccordionContent>Pour la version MVP, tout est stocké localement dans votre navigateur (aucun serveur, aucun partage). Un backend chiffré hébergé en Suisse arrivera dans les prochains mois pour synchroniser entre appareils.</AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </section>

      {/* CTA */}
      <section className="pb-24">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <Card className="p-10 lg:p-14 text-center bg-primary text-primary-foreground border-0">
            <ShieldCheck className="mx-auto size-8 opacity-80" />
            <h2 className="mt-4 text-3xl lg:text-4xl text-primary-foreground">Prêt à simplifier la gestion de votre club ?</h2>
            <p className="mt-3 text-primary-foreground/80">Aucune carte requise. Vos données restent sur votre appareil.</p>
            <Button asChild size="lg" variant="secondary" className="mt-6"><Link to="/app">Gérer mon club <ArrowRight className="ml-2 size-4" /></Link></Button>
          </Card>
        </div>
      </section>

      <footer className="border-t border-border py-8">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-muted-foreground">
          <div className="flex items-center gap-2"><Logo /> <span className="font-display">Adhezia</span></div>
          <div className="flex gap-6">
            <Link to="/mentions" className="hover:text-primary">Mentions légales</Link>
            <a href="mailto:hello@adhezia.ch" className="hover:text-primary">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
