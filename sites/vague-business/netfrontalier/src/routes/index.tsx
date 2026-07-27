import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { SiteShell } from "@/components/site-shell";
import { ArrowRight, Check, ShieldCheck, Calculator, FileText } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "NetFrontalier — Calculateur salaire net frontalier Suisse → France" },
      {
        name: "description",
        content:
          "Combien vous touchez vraiment net en tant que frontalier en Suisse (Genève, Vaud, Valais). Estimation transparente, en CHF et EUR, en moins d'une minute.",
      },
      { property: "og:title", content: "NetFrontalier — Salaire net frontalier CH → FR" },
      {
        property: "og:description",
        content: "Estimation transparente du net frontalier. GE, VD, VS. Gratuit.",
      },
      { property: "og:url", content: "/" },
    ],
    links: [{ rel: "canonical", href: "/" }],
  }),
  component: Landing,
});

function Landing() {
  return (
    <SiteShell>
      <Hero />
      <HowItWorks />
      <Pricing />
      <FAQ />
    </SiteShell>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div
        className="absolute inset-0 -z-10 opacity-[0.06]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 10%, var(--forest) 0, transparent 40%), radial-gradient(circle at 80% 60%, var(--alpine) 0, transparent 45%)",
        }}
      />
      <div className="mx-auto max-w-6xl px-4 md:px-6 pt-16 pb-20 md:pt-24 md:pb-28">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5 text-primary" />
            Estimation indépendante — cantons GE, VD, VS
          </div>
          <h1 className="mt-6 text-4xl md:text-6xl font-serif text-primary leading-[1.05]">
            Combien vous touchez vraiment,
            <br />
            <span className="text-charcoal">en net.</span>
          </h1>
          <p className="mt-5 text-lg text-muted-foreground max-w-2xl">
            Un calculateur clair du salaire net pour frontalier·e·s employé·e·s en Suisse.
            Cotisations, impôt à la source, conversion CHF → EUR — en moins d'une minute.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Button asChild size="lg" className="text-base h-12 px-6">
              <Link to="/calcul">
                Calculer mon net <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
            <span className="text-xs text-muted-foreground max-w-sm">
              Estimation indicative — ne remplace pas un fiduciaire, une caisse de compensation
              ou l'administration fiscale.
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  const items = [
    {
      icon: Calculator,
      title: "1. Vos paramètres",
      body: "Brut mensuel, canton, commune, situation familiale. Rien de plus.",
    },
    {
      icon: FileText,
      title: "2. Décomposition claire",
      body: "Brut → cotisations sociales → impôt à la source → net CHF → net EUR.",
    },
    {
      icon: ShieldCheck,
      title: "3. Transparence totale",
      body: "Barèmes documentés dans le code. Vous voyez ce que vous calculez.",
    },
  ];
  return (
    <section className="mx-auto max-w-6xl px-4 md:px-6 py-16 border-t border-border/60">
      <h2 className="text-3xl font-serif text-primary">Comment ça marche</h2>
      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {items.map((it) => (
          <Card key={it.title} className="border-border/60 shadow-none">
            <CardContent className="pt-6">
              <it.icon className="h-6 w-6 text-primary" />
              <div className="mt-3 font-serif text-xl">{it.title}</div>
              <p className="mt-2 text-sm text-muted-foreground">{it.body}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}

function Pricing() {
  return (
    <section className="mx-auto max-w-6xl px-4 md:px-6 py-16 border-t border-border/60">
      <h2 className="text-3xl font-serif text-primary">Tarifs</h2>
      <p className="mt-2 text-muted-foreground">Commencez gratuitement. Passez Pro si besoin.</p>
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <Card className="border-border/60">
          <CardContent className="pt-6">
            <div className="text-sm uppercase tracking-wide text-muted-foreground">Gratuit</div>
            <div className="mt-1 font-serif text-3xl">0 €</div>
            <ul className="mt-4 space-y-2 text-sm">
              <li className="flex gap-2"><Check className="h-4 w-4 text-primary mt-0.5" /> 1 calcul complet</li>
              <li className="flex gap-2"><Check className="h-4 w-4 text-primary mt-0.5" /> Décomposition CHF & EUR</li>
              <li className="flex gap-2"><Check className="h-4 w-4 text-primary mt-0.5" /> Comparaison célib. / marié·e</li>
            </ul>
            <Button asChild variant="outline" className="mt-6 w-full">
              <Link to="/calcul">Commencer</Link>
            </Button>
          </CardContent>
        </Card>
        <Card className="border-primary/40 relative">
          <CardContent className="pt-6">
            <div className="absolute right-4 top-4 rounded-full bg-primary/10 text-primary text-xs px-2 py-0.5">
              Bientôt
            </div>
            <div className="text-sm uppercase tracking-wide text-primary">Pro</div>
            <div className="mt-1 font-serif text-3xl">9 € <span className="text-base text-muted-foreground">/ mois</span></div>
            <ul className="mt-4 space-y-2 text-sm">
              <li className="flex gap-2"><Check className="h-4 w-4 text-primary mt-0.5" /> Scénarios illimités et sauvegardés</li>
              <li className="flex gap-2"><Check className="h-4 w-4 text-primary mt-0.5" /> PDF détaillé exportable</li>
              <li className="flex gap-2"><Check className="h-4 w-4 text-primary mt-0.5" /> Alertes évolution des barèmes</li>
              <li className="flex gap-2"><Check className="h-4 w-4 text-primary mt-0.5" /> Support prioritaire</li>
            </ul>
            <Button asChild className="mt-6 w-full" variant="secondary">
              <a href="mailto:contact@netfrontalier.example?subject=Notif%20lancement%20Pro">
                Me prévenir au lancement
              </a>
            </Button>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

function FAQ() {
  const faqs = [
    {
      q: "Quelle différence entre l'impôt à la source à Genève et dans le canton de Vaud ?",
      a: "Chaque canton applique son propre barème d'impôt à la source. Genève a historiquement des taux plus élevés à revenu équivalent, mais tout dépend de votre situation familiale et de vos enfants à charge. NetFrontalier applique un barème simplifié par canton et affiche le taux effectif.",
    },
    {
      q: "Le permis G, c'est quoi exactement ?",
      a: "Le permis G est l'autorisation frontalière : vous travaillez en Suisse tout en résidant en France (retour au domicile au moins une fois par semaine). Ce calculateur est calibré pour ce statut.",
    },
    {
      q: "Suis-je imposé·e en France en plus de la Suisse ?",
      a: "En principe non pour GE, VD et VS pour un frontalier classique : l'impôt est prélevé à la source en Suisse. Vous devez toutefois déclarer vos revenus suisses en France. Consultez la convention fiscale et un fiduciaire pour votre cas précis.",
    },
    {
      q: "Le 2e pilier (LPP) est-il inclus dans le calcul ?",
      a: "Oui, en approximation : nous appliquons un taux moyen part salariée de 7 %. Le taux réel dépend de votre âge, de votre caisse de pension et du plan choisi par l'employeur.",
    },
    {
      q: "Quel taux de change CHF → EUR utilisez-vous ?",
      a: "Par défaut 0,95, modifiable dans le formulaire. Le taux réel dépend de votre banque, du moment du change et des frais. Utilisez le taux qui reflète votre pratique.",
    },
  ];
  return (
    <section className="mx-auto max-w-3xl px-4 md:px-6 py-16 border-t border-border/60">
      <h2 className="text-3xl font-serif text-primary">Questions fréquentes</h2>
      <Accordion type="single" collapsible className="mt-6">
        {faqs.map((f, i) => (
          <AccordionItem key={i} value={`f${i}`}>
            <AccordionTrigger className="text-left">{f.q}</AccordionTrigger>
            <AccordionContent className="text-muted-foreground">{f.a}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
}
