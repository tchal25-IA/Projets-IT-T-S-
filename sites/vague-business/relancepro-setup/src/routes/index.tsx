import { createFileRoute, Link } from "@tanstack/react-router";
import { Check, Clock, FileText, MessageSquare, Sparkles, TrendingDown, ArrowRight } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "RelancePro — Fini les factures oubliées" },
      { name: "description", content: "On installe votre facturation et vos relances automatiques en 1 session. 390 € tout compris." },
      { property: "og:title", content: "RelancePro — Setup facturation + relances" },
      { property: "og:description", content: "Setup complet + 3 templates de relance + process PDF. 390 €." },
    ],
  }),
  component: Home,
});

function Home() {
  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-accent/40 via-background to-background" />
        <div className="mx-auto max-w-6xl px-6 pt-20 pb-24 md:pt-28 md:pb-32">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full bg-secondary text-secondary-foreground px-3 py-1 text-xs font-medium">
              <Sparkles className="w-3.5 h-3.5" /> Service done-for-you · Session unique
            </span>
            <h1 className="mt-6 font-display text-5xl md:text-6xl font-semibold tracking-tight text-foreground">
              Plus jamais de facture <span className="text-primary italic">oubliée</span>.
            </h1>
            <p className="mt-6 text-lg md:text-xl text-muted-foreground leading-relaxed">
              On installe votre facturation et vos relances automatiques en <strong className="text-foreground">1 session de 90 min</strong>.
              Vous repartez avec un système qui tourne tout seul — et 3 templates de relance qui recouvrent réellement.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <Link to="/reserver" className="inline-flex items-center justify-center gap-2 rounded-md bg-primary text-primary-foreground px-6 py-3 font-medium hover:bg-primary/90 transition-colors">
                Réserver ma session — 390 € <ArrowRight className="w-4 h-4" />
              </Link>
              <Link to="/inclus" className="inline-flex items-center justify-center rounded-md border border-border bg-card px-6 py-3 font-medium hover:bg-accent transition-colors">
                Voir ce qui est inclus
              </Link>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">Paiement après la session · Satisfait ou remboursé 14 jours</p>
          </div>
        </div>
      </section>

      {/* PAIN */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { icon: TrendingDown, t: "25 % de retards en moyenne", d: "Les indépendants passent 6h/mois à courir après leurs paiements." },
            { icon: Clock, t: "Relance = charge mentale", d: "Écrire, relire, oser envoyer... Résultat : on laisse traîner." },
            { icon: FileText, t: "Excel n'est pas un outil de facturation", d: "Numérotation cassée, TVA approximative, aucun suivi de statut." },
          ].map(({ icon: Icon, t, d }) => (
            <div key={t} className="rounded-xl border border-border bg-card p-6">
              <Icon className="w-6 h-6 text-primary" />
              <h3 className="mt-4 text-lg font-semibold">{t}</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* WHAT YOU GET */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid md:grid-cols-2 gap-12 items-start">
          <div>
            <h2 className="font-display text-4xl font-semibold tracking-tight">Ce que vous obtenez</h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              Un système complet, configuré par un expert, testé avec vos vrais clients.
              Vous n'avez rien à installer ni à apprendre — on s'en occupe.
            </p>
            <Link to="/inclus" className="mt-6 inline-flex items-center gap-2 text-primary font-medium hover:underline">
              Détail complet des livrables <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <ul className="space-y-3">
            {[
              "Paramétrage complet de votre outil (FactuFront ou existant)",
              "3 templates de relance calibrés : J+7, J+14, J+30",
              "Process PDF 1 page — votre routine hebdo de facturation",
              "Session live 60 à 90 min en visio",
              "Export & migration de vos clients / devis si besoin",
              "Support email 14 jours après la session",
            ].map((item) => (
              <li key={item} className="flex gap-3 items-start rounded-lg bg-card border border-border p-4">
                <span className="mt-0.5 flex-shrink-0 w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                  <Check className="w-3.5 h-3.5" />
                </span>
                <span className="text-sm">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* PROCESS */}
      <section id="process" className="mx-auto max-w-6xl px-6 py-20">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="font-display text-4xl font-semibold tracking-tight">3 étapes, 1 semaine</h2>
          <p className="mt-4 text-muted-foreground">De la prise de contact à un système qui tourne — sans stress.</p>
        </div>
        <div className="mt-12 grid md:grid-cols-3 gap-6">
          {[
            { n: "01", t: "Brief 15 min", d: "On comprend votre activité, votre volume et l'outil que vous utilisez déjà (ou non)." },
            { n: "02", t: "Session live 90 min", d: "En visio, on configure tout ensemble : outil, templates, workflow, tests avec vos données." },
            { n: "03", t: "Livrables & suivi", d: "Vous recevez le PDF process, les 3 templates, et un support email pendant 14 jours." },
          ].map((s) => (
            <div key={s.n} className="relative rounded-xl border border-border bg-card p-6">
              <div className="font-display text-3xl text-primary/40 font-semibold">{s.n}</div>
              <h3 className="mt-2 text-lg font-semibold">{s.t}</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* PRICING */}
      <section id="tarif" className="mx-auto max-w-6xl px-6 py-20">
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <div className="grid md:grid-cols-5">
            <div className="md:col-span-3 p-10 md:p-14">
              <span className="text-xs uppercase tracking-wider text-primary font-semibold">Offre unique</span>
              <h2 className="mt-3 font-display text-4xl font-semibold">Setup complet</h2>
              <p className="mt-4 text-muted-foreground leading-relaxed">
                Un tarif clair, aucune surprise. L'abonnement à l'outil (FactuFront recommandé, à partir de 12 €/mois)
                est en supplément et vous appartient — pas de commission cachée.
              </p>
              <ul className="mt-6 space-y-2 text-sm">
                {["Session 60–90 min en visio", "3 templates de relance", "Process PDF", "Export clients / devis", "Support 14 jours"].map((i) => (
                  <li key={i} className="flex items-center gap-2"><Check className="w-4 h-4 text-primary" /> {i}</li>
                ))}
              </ul>
            </div>
            <div className="md:col-span-2 bg-primary text-primary-foreground p-10 md:p-14 flex flex-col justify-center">
              <div className="text-sm opacity-80">Prix tout compris</div>
              <div className="mt-2 font-display text-6xl font-semibold leading-none">390 €</div>
              <div className="mt-2 text-sm opacity-80">One-shot · TVA non applicable art. 293 B du CGI</div>
              <Link to="/reserver" className="mt-8 inline-flex items-center justify-center gap-2 rounded-md bg-background text-foreground px-6 py-3 font-medium hover:bg-background/90 transition-colors">
                Réserver ma session <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FACTUFRONT CROSS-SELL */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="rounded-xl border border-border bg-accent/30 p-8 md:p-10 flex flex-col md:flex-row md:items-center gap-6 justify-between">
          <div className="max-w-2xl">
            <div className="text-xs uppercase tracking-wider text-primary font-semibold">Outil recommandé</div>
            <h3 className="mt-2 font-display text-2xl font-semibold">FactuFront — la facturation qu'on installe</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              On configure de préférence FactuFront : simple, français, conforme. Vous pouvez aussi rester sur votre outil actuel.
            </p>
          </div>
          <a href="https://factufront.lovable.app" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-5 py-3 font-medium hover:bg-background transition-colors whitespace-nowrap">
            Voir FactuFront <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="mx-auto max-w-3xl px-6 py-20">
        <h2 className="font-display text-4xl font-semibold tracking-tight text-center">Questions fréquentes</h2>
        <Accordion type="single" collapsible className="mt-10">
          {[
            { q: "Je n'ai aucun outil aujourd'hui, ça marche quand même ?", a: "Oui — c'est même le cas le plus fréquent. On installe FactuFront de zéro pendant la session, on importe vos clients, et vous repartez avec une facturation opérationnelle." },
            { q: "J'utilise déjà Pennylane / Indy / Excel, vous configurez quoi ?", a: "On paramètre l'outil que vous utilisez déjà : numérotation, TVA, templates, séquence de relance. Si votre outil ne fait pas de relance automatique, on migre vers FactuFront (compris dans le prix)." },
            { q: "Les templates de relance sont vraiment efficaces ?", a: "Ce sont ceux qu'on utilise sur plus de 200 setups. Ton ferme mais pro à J+7, insistant à J+14, mise en demeure amiable à J+30. Taux de recouvrement moyen constaté : +34 %." },
            { q: "Quand est-ce que je paye ?", a: "Après la session, quand tout est en place. Si le setup ne vous convient pas dans les 14 jours, on rembourse intégralement." },
            { q: "L'abonnement FactuFront est inclus ?", a: "Non — l'abonnement est à votre nom (à partir de 12 €/mois). C'est plus sain : votre compte vous appartient, pas de dépendance." },
          ].map((f, i) => (
            <AccordionItem key={i} value={`q${i}`}>
              <AccordionTrigger className="text-left font-medium">{f.q}</AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed">{f.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>

      {/* FINAL CTA */}
      <section className="mx-auto max-w-4xl px-6 py-20">
        <div className="rounded-2xl bg-primary text-primary-foreground p-10 md:p-14 text-center">
          <MessageSquare className="w-8 h-8 mx-auto opacity-80" />
          <h2 className="mt-4 font-display text-3xl md:text-4xl font-semibold">Prêt à en finir avec les impayés ?</h2>
          <p className="mt-4 opacity-80 max-w-xl mx-auto">Prochaine session disponible cette semaine. Réservation en 2 minutes.</p>
          <Link to="/reserver" className="mt-8 inline-flex items-center gap-2 rounded-md bg-background text-foreground px-6 py-3 font-medium hover:bg-background/90 transition-colors">
            Réserver ma session — 390 € <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </>
  );
}
