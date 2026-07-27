import { createFileRoute, Link } from "@tanstack/react-router";
import { Hammer, FileText, BellRing, Users, ShieldCheck, Zap, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ArtisanPipe — CRM en 3 écrans pour artisans" },
      {
        name: "description",
        content:
          "Prospects, devis PDF et relances automatiques. Le CRM ultra-léger pour plombiers, électriciens, peintres et menuisiers en Suisse et en France.",
      },
      { property: "og:title", content: "ArtisanPipe — CRM en 3 écrans pour artisans" },
      {
        property: "og:description",
        content: "Ne plus perdre un devis. Ne plus oublier une relance. 10 minutes pour démarrer.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700;800&family=Inter:wght@400;500;600;700&display=swap",
      },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Hammer className="h-5 w-5" />
            </div>
            <span className="font-display text-xl font-bold uppercase tracking-wide">
              ArtisanPipe
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <a
              href="#pricing"
              className="hidden text-sm font-medium text-muted-foreground hover:text-foreground md:inline"
            >
              Tarifs
            </a>
            <a
              href="#faq"
              className="hidden text-sm font-medium text-muted-foreground hover:text-foreground md:inline"
            >
              FAQ
            </a>
            <Button asChild size="sm">
              <Link to="/app">Ouvrir mon pipeline</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="grid-blueprint border-b border-border">
        <div className="mx-auto max-w-6xl px-4 py-16 md:py-24">
          <div className="max-w-3xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium uppercase tracking-wider text-concrete">
              <span className="h-2 w-2 rounded-full bg-primary" />
              CRM pour artisans — Suisse & France
            </div>
            <h1 className="font-display text-5xl font-bold uppercase leading-[0.95] md:text-7xl">
              Ne perdez plus <br />
              un <span className="text-primary">devis</span>. <br />
              Ni une <span className="text-primary">relance</span>.
            </h1>
            <p className="mt-6 max-w-xl text-lg text-muted-foreground">
              ArtisanPipe, c'est un CRM en 3 écrans : <strong>prospects, devis PDF, relances auto</strong>. 
              Fait pour les plombiers, électriciens, peintres et menuisiers qui n'ont pas le temps
              de jouer aux commerciaux.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" className="text-base">
                <Link to="/app">Ouvrir mon pipeline</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="text-base">
                <a href="#pricing">Voir les tarifs</a>
              </Button>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              10 devis / mois gratuits · sans carte bancaire · installé en 10 minutes
            </p>
          </div>
        </div>
      </section>

      {/* 3 écrans */}
      <section className="border-b border-border bg-card">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <div className="mb-10 text-center">
            <div className="text-sm font-semibold uppercase tracking-widest text-primary">
              3 écrans. Point.
            </div>
            <h2 className="mt-2 font-display text-4xl font-bold uppercase">
              Un outil, pas une usine à gaz
            </h2>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {[
              {
                icon: Users,
                title: "Prospects",
                desc: "Ajoutez un contact en 15 secondes. Statut, notes, ville, source. Point.",
              },
              {
                icon: FileText,
                title: "Devis PDF",
                desc: "Numérotation auto AP-2026-0001. HT / TVA / TTC. Imprimable A4 direct.",
              },
              {
                icon: BellRing,
                title: "Relances",
                desc: "Chaque devis envoyé génère un rappel. Vous voyez en un coup d'œil qui rappeler.",
              },
            ].map((f) => (
              <Card
                key={f.title}
                className="border-2 border-border bg-background p-6 shadow-none"
              >
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-md bg-primary text-primary-foreground">
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="font-display text-2xl font-bold uppercase">{f.title}</h3>
                <p className="mt-2 text-muted-foreground">{f.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Argu */}
      <section className="border-b border-border">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <div className="grid gap-8 md:grid-cols-2">
            <div>
              <h2 className="font-display text-4xl font-bold uppercase leading-tight">
                Axonaut, Sellsy, Pipedrive ? <br />
                <span className="text-primary">Trop lourd pour un chantier.</span>
              </h2>
              <p className="mt-4 text-muted-foreground">
                Vous êtes sur un toit, pas devant un tableau de bord. ArtisanPipe est pensé
                mobile-first. Vous ajoutez un lead entre deux interventions, vous générez le
                devis le soir, et le système vous rappelle qui relancer.
              </p>
            </div>
            <div className="space-y-3">
              {[
                "Mobile-first — utilisable sur chantier",
                "PDF imprimable A4 en 1 clic",
                "TVA CH 8.1% / FR 20% pré-réglées",
                "Vos données restent sur votre appareil",
                "Interface française, sans jargon commercial",
              ].map((p) => (
                <div key={p} className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-primary/15 text-primary">
                    <Check className="h-4 w-4" />
                  </div>
                  <p className="font-medium">{p}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="border-b border-border bg-card">
        <div className="mx-auto max-w-5xl px-4 py-16">
          <div className="mb-10 text-center">
            <div className="text-sm font-semibold uppercase tracking-widest text-primary">
              Tarifs
            </div>
            <h2 className="mt-2 font-display text-4xl font-bold uppercase">
              Simple. Comme le reste.
            </h2>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="border-2 border-border bg-background p-8 shadow-none">
              <div className="font-display text-2xl font-bold uppercase">Gratuit</div>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-5xl font-bold">0€</span>
                <span className="text-muted-foreground">/mois</span>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">Pour démarrer sereinement.</p>
              <ul className="mt-6 space-y-2 text-sm">
                <li className="flex gap-2"><Check className="h-4 w-4 text-primary" /> Jusqu'à 10 devis / mois</li>
                <li className="flex gap-2"><Check className="h-4 w-4 text-primary" /> Prospects illimités</li>
                <li className="flex gap-2"><Check className="h-4 w-4 text-primary" /> Relances manuelles</li>
                <li className="flex gap-2"><Check className="h-4 w-4 text-primary" /> PDF A4</li>
              </ul>
              <Button asChild variant="outline" className="mt-6 w-full">
                <Link to="/app">Commencer</Link>
              </Button>
            </Card>
            <Card className="relative border-2 border-primary bg-background p-8 shadow-none">
              <div className="absolute -top-3 left-8 rounded bg-primary px-3 py-1 text-xs font-bold uppercase tracking-wider text-primary-foreground">
                Recommandé
              </div>
              <div className="font-display text-2xl font-bold uppercase">Pro</div>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-5xl font-bold">19€</span>
                <span className="text-muted-foreground">/mois</span>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">Pour ne rien laisser filer.</p>
              <ul className="mt-6 space-y-2 text-sm">
                <li className="flex gap-2"><Check className="h-4 w-4 text-primary" /> Devis illimités</li>
                <li className="flex gap-2"><Check className="h-4 w-4 text-primary" /> Relances automatiques</li>
                <li className="flex gap-2"><Check className="h-4 w-4 text-primary" /> WhatsApp (bientôt)</li>
                <li className="flex gap-2"><Check className="h-4 w-4 text-primary" /> Logo sur les devis</li>
              </ul>
              <Button asChild className="mt-6 w-full">
                <Link to="/app">Essayer Pro</Link>
              </Button>
            </Card>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="border-b border-border">
        <div className="mx-auto max-w-3xl px-4 py-16">
          <h2 className="mb-8 text-center font-display text-4xl font-bold uppercase">
            Questions
          </h2>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="1">
              <AccordionTrigger>Faut-il installer une application ?</AccordionTrigger>
              <AccordionContent>
                Non. ArtisanPipe fonctionne dans votre navigateur, sur mobile comme sur ordinateur.
                Vous pouvez l'ajouter à votre écran d'accueil pour un accès en 1 tap.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="2">
              <AccordionTrigger>Mes données sont-elles en sécurité ?</AccordionTrigger>
              <AccordionContent>
                Dans cette version MVP, toutes vos données restent stockées localement sur votre
                appareil. Aucune donnée n'est envoyée sur un serveur.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="3">
              <AccordionTrigger>Est-ce que ça gère la TVA suisse ?</AccordionTrigger>
              <AccordionContent>
                Oui. TVA CH (8.1%, 2.6%, 0%) et FR (20%, 10%, 5.5%) sont pré-réglées. Vous choisissez
                le taux par ligne de devis.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="4">
              <AccordionTrigger>Puis-je annuler à tout moment ?</AccordionTrigger>
              <AccordionContent>
                Oui, sans engagement. Le plan gratuit reste disponible en permanence.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </section>

      {/* CTA */}
      <section className="border-b border-border bg-primary text-primary-foreground">
        <div className="mx-auto max-w-4xl px-4 py-16 text-center">
          <ShieldCheck className="mx-auto mb-4 h-10 w-10" />
          <h2 className="font-display text-4xl font-bold uppercase md:text-5xl">
            Prêt en 10 minutes.
          </h2>
          <p className="mx-auto mt-3 max-w-xl">
            Ouvrez votre pipeline, ajoutez un premier lead, générez un devis. C'est tout.
          </p>
          <Button asChild size="lg" variant="secondary" className="mt-6 text-base">
            <Link to="/app">
              <Zap className="mr-2 h-4 w-4" />
              Ouvrir mon pipeline
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 text-sm text-muted-foreground md:flex-row">
          <div className="flex items-center gap-2">
            <Hammer className="h-4 w-4" />
            <span className="font-display font-bold uppercase">ArtisanPipe</span>
            <span>© {new Date().getFullYear()}</span>
          </div>
          <div className="flex gap-4">
            <Link to="/mentions" className="hover:text-foreground">Mentions légales</Link>
            <Link to="/app" className="hover:text-foreground">Application</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
