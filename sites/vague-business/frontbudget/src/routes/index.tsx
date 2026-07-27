import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "FrontBudget — Budget CHF + EUR pour frontaliers" },
      { name: "description", content: "Le budget multi-devises pensé frontalier : salaire CHF, vie en EUR, taux de change inclus." },
      { property: "og:title", content: "FrontBudget — Budget frontalier CHF + EUR" },
      { property: "og:description", content: "Sachez ce qu'il vous reste vraiment après change et dépenses. Free 1 mois." },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-6 pt-16 pb-24 sm:pt-24">
        <div className="grid gap-12 md:grid-cols-2 md:items-center">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-mint-soft/60 px-3 py-1 text-xs font-medium text-primary">
              <span className="h-1.5 w-1.5 rounded-full bg-mint" />
              Pensé pour les frontaliers GE · VD · VS
            </span>
            <h1 className="mt-6 text-5xl leading-[1.05] font-semibold tracking-tight sm:text-6xl">
              Votre budget,<br />
              <span className="text-primary">en francs et en euros.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg text-muted-foreground">
              FrontBudget vous montre ce qu'il vous reste vraiment chaque mois,
              une fois le change fait et les dépenses passées. Pas d'appli
              suisse générique, pas d'usine à gaz.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" className="rounded-full px-6">
                <Link to="/app">Voir mon mois →</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="rounded-full px-6">
                <a href="#pricing">Voir les tarifs</a>
              </Button>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              Free 1 mois · aucune carte requise · données locales
            </p>
          </div>

          <HeroCard />
        </div>
      </section>

      {/* Why */}
      <section className="border-y border-border bg-cream/60">
        <div className="mx-auto grid max-w-6xl gap-8 px-6 py-16 md:grid-cols-3">
          {[
            { t: "Multi-devises natif", d: "CHF pour le salaire, EUR pour la vie. Un seul tableau de bord, un seul reste-à-vivre." },
            { t: "Taux de change à vous", d: "Vous fixez le taux (celui de votre banque, Wise, etc.). FrontBudget calcule autour." },
            { t: "Vos données restent chez vous", d: "Stockage local. Pas de compte, pas d'API bancaire, pas de revente." },
          ].map((f) => (
            <div key={f.t}>
              <h3 className="text-xl font-semibold">{f.t}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{f.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="mx-auto max-w-5xl px-6 py-20">
        <h2 className="text-center text-3xl font-semibold sm:text-4xl">Simple, comme un budget bien tenu</h2>
        <p className="mx-auto mt-3 max-w-xl text-center text-muted-foreground">
          Commencez gratuitement. Passez Pro quand vous en voulez plus.
        </p>
        <div className="mt-12 grid gap-6 md:grid-cols-2">
          <PriceCard
            title="Free"
            price="0 €"
            note="1 mois complet"
            features={["Dashboard mois en cours", "Comptes CHF & EUR", "1 taux de change personnalisé", "Jusqu'à 4 budgets"]}
            cta={<Button asChild variant="outline" className="w-full rounded-full"><Link to="/app">Commencer</Link></Button>}
          />
          <PriceCard
            highlighted
            title="Pro"
            price="8 € / mois"
            note="Bientôt"
            features={["Budgets illimités", "Historique multi-mois", "Alertes WhatsApp", "Export CSV & impression"]}
            cta={<Button className="w-full rounded-full" disabled>Bientôt disponible</Button>}
          />
        </div>
      </section>

      {/* FAQ */}
      <section className="border-t border-border bg-cream/60">
        <div className="mx-auto max-w-3xl px-6 py-20">
          <h2 className="text-3xl font-semibold sm:text-4xl">Questions frontalières</h2>
          <Accordion type="single" collapsible className="mt-8">
            <AccordionItem value="1">
              <AccordionTrigger>Pourquoi pas juste Revolut ou ma banque ?</AccordionTrigger>
              <AccordionContent>
                Les apps bancaires classent des transactions, mais ne pensent pas frontalier :
                elles ne fusionnent pas propre­ment un compte CHF et un compte EUR sous un
                seul budget, avec votre taux de change réel. FrontBudget est bâti pour ça.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="2">
              <AccordionTrigger>Comment est géré le taux de change ?</AccordionTrigger>
              <AccordionContent>
                Vous entrez votre taux CHF → EUR dans les paramètres (celui de votre banque
                ou de Wise, par exemple). Toutes les conversions du tableau de bord partent
                de là. Vous pouvez l'ajuster chaque mois.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="3">
              <AccordionTrigger>Où sont mes données ?</AccordionTrigger>
              <AccordionContent>
                Dans votre navigateur, uniquement. Pas de compte à créer, pas de serveur
                qui stocke vos transactions. Pour effacer : bouton « Réinitialiser » dans
                les paramètres.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="4">
              <AccordionTrigger>Et pour l'impôt ou le salaire net ?</AccordionTrigger>
              <AccordionContent>
                FrontBudget gère le cashflow, pas la fiscalité. Pour estimer votre net
                d'impôt frontalier, un outil dédié comme NetFrontalier fait mieux le job —
                on ne cherche pas à le remplacer.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </section>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-8 text-sm text-muted-foreground">
          <div className="font-brand text-lg text-foreground">FrontBudget</div>
          <div className="flex gap-6">
            <Link to="/mentions" className="hover:text-foreground">Mentions légales</Link>
            <a href="#pricing" className="hover:text-foreground">Tarifs</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

function Header() {
  return (
    <header className="border-b border-border">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link to="/" className="font-brand text-2xl font-semibold tracking-tight">
          Front<span className="text-primary">Budget</span>
        </Link>
        <nav className="flex items-center gap-2">
          <a href="#pricing" className="hidden text-sm text-muted-foreground hover:text-foreground sm:inline">
            Tarifs
          </a>
          <Button asChild size="sm" className="rounded-full">
            <Link to="/app">Ouvrir l'app</Link>
          </Button>
        </nav>
      </div>
    </header>
  );
}

function HeroCard() {
  return (
    <div className="paper-card p-6 sm:p-8">
      <div className="flex items-center justify-between text-xs uppercase tracking-wide text-muted-foreground">
        <span>Mois en cours</span>
        <span>EUR</span>
      </div>
      <div className="mt-2 flex items-baseline gap-3">
        <div className="text-5xl font-semibold tracking-tight">2 384 €</div>
        <div className="text-sm text-mint">reste à vivre</div>
      </div>
      <div className="mt-6 space-y-4">
        <Bar label="Loyer" spent={1250} limit={1300} />
        <Bar label="Courses" spent={560} limit={600} />
        <Bar label="Transport" spent={128} limit={200} />
        <Bar label="Loisirs" spent={96} limit={250} />
      </div>
      <div className="mt-6 flex items-center justify-between border-t border-border pt-4 text-sm">
        <span className="text-muted-foreground">Salaire CHF 6 800</span>
        <span className="font-medium">≈ 7 072 €</span>
      </div>
    </div>
  );
}

function Bar({ label, spent, limit }: { label: string; spent: number; limit: number }) {
  const pct = Math.min(100, (spent / limit) * 100);
  const alert = pct >= 90;
  return (
    <div>
      <div className="flex justify-between text-sm">
        <span>{label}</span>
        <span className="text-muted-foreground">{spent} / {limit} €</span>
      </div>
      <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-muted">
        <div
          className={`h-full rounded-full ${alert ? "bg-warning" : "bg-mint"}`}
          style={{ width: `${pct}%`, backgroundColor: alert ? "var(--warning)" : "var(--mint)" }}
        />
      </div>
    </div>
  );
}

function PriceCard({
  title, price, note, features, cta, highlighted,
}: { title: string; price: string; note: string; features: string[]; cta: React.ReactNode; highlighted?: boolean }) {
  return (
    <div className={`paper-card p-8 ${highlighted ? "ring-2 ring-primary" : ""}`}>
      <div className="flex items-baseline justify-between">
        <h3 className="text-2xl font-semibold">{title}</h3>
        <span className="text-xs text-muted-foreground">{note}</span>
      </div>
      <div className="mt-4 text-4xl font-semibold tracking-tight">{price}</div>
      <ul className="mt-6 space-y-2 text-sm">
        {features.map((f) => (
          <li key={f} className="flex gap-2">
            <span className="text-mint">✓</span>{f}
          </li>
        ))}
      </ul>
      <div className="mt-8">{cta}</div>
    </div>
  );
}
