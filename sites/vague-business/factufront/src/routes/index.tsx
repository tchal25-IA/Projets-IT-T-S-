import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card } from "@/components/ui/card";
import { Check, FileText, Globe2, Zap } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "FactuFront — Facture TVA CH ou FR, en CHF ou EUR, PDF pro en 2 minutes" },
      {
        name: "description",
        content:
          "Outil de facturation minimaliste pour indépendants et micro-SMEs frontaliers. TVA Suisse ou France, multi-devise CHF/EUR, PDF prêt à envoyer.",
      },
      { property: "og:title", content: "FactuFront — Facture pro en 2 minutes" },
      {
        property: "og:description",
        content: "TVA CH ou FR · CHF & EUR · PDF pro · pensé pour freelances frontaliers.",
      },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border/60">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <Link to="/" className="font-brand text-2xl">
            FactuFront
          </Link>
          <nav className="hidden items-center gap-8 text-sm text-muted-foreground md:flex">
            <a href="#pricing" className="hover:text-foreground">Tarifs</a>
            <a href="#faq" className="hover:text-foreground">FAQ</a>
            <Link to="/mentions" className="hover:text-foreground">Mentions</Link>
          </nav>
          <Link to="/app">
            <Button size="sm" variant="outline">Ouvrir l'app</Button>
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-6 pt-20 pb-24">
        <div className="grid gap-12 lg:grid-cols-[1.1fr_1fr] lg:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-sage" />
              Suisse · France · frontaliers
            </div>
            <h1 className="font-brand mt-6 text-5xl leading-[1.05] tracking-tight text-foreground md:text-6xl">
              Facture TVA CH ou FR,<br />
              en CHF ou EUR,<br />
              <span className="text-sage">PDF pro en 2 minutes.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg text-muted-foreground">
              FactuFront fait une seule chose, et bien&nbsp;: sortir une facture correcte
              et se faire payer. Pas un logiciel de compta. Trois écrans&nbsp;:
              clients, facture, PDF.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/app/factures/nouvelle">
                <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90">
                  Créer ma première facture
                </Button>
              </Link>
              <a href="#pricing">
                <Button size="lg" variant="outline">Voir les tarifs</Button>
              </a>
            </div>
            <ul className="mt-8 grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
              <li className="flex items-center gap-2"><Check className="h-4 w-4 text-sage" /> TVA 8.1% (CH) ou 20% (FR)</li>
              <li className="flex items-center gap-2"><Check className="h-4 w-4 text-sage" /> Multi-devise CHF + EUR</li>
              <li className="flex items-center gap-2"><Check className="h-4 w-4 text-sage" /> Numérotation automatique</li>
              <li className="flex items-center gap-2"><Check className="h-4 w-4 text-sage" /> Bloc paiement IBAN + placeholder QR</li>
            </ul>
          </div>

          <InvoicePreviewCard />
        </div>
      </section>

      <section className="border-y border-border/60 bg-card/40">
        <div className="mx-auto grid max-w-6xl gap-8 px-6 py-16 md:grid-cols-3">
          <Feature
            icon={<Zap className="h-5 w-5 text-sage" />}
            title="3 écrans, zéro friction"
            body="Clients → Facture → PDF. Pas de plan comptable, pas de menus interminables."
          />
          <Feature
            icon={<Globe2 className="h-5 w-5 text-sage" />}
            title="Pensé frontaliers"
            body="Bascule CH/FR selon le client. TVA, devise et format de date s'adaptent."
          />
          <Feature
            icon={<FileText className="h-5 w-5 text-sage" />}
            title="PDF propre, imprimable"
            body="Mise en page A4 nette. IBAN + placeholder QR-facture Suisse prêt à brancher."
          />
        </div>
      </section>

      <section id="pricing" className="mx-auto max-w-6xl px-6 py-24">
        <h2 className="font-brand text-4xl tracking-tight">Tarifs simples</h2>
        <p className="mt-3 max-w-xl text-muted-foreground">
          Moins cher que Bexio, Factomos ou Indy. Aucune carte pour démarrer.
        </p>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          <PriceCard
            name="Free"
            price="0 €"
            note="3 factures / mois"
            features={["Modèles CH & FR", "Multi-devise", "Export PDF"]}
            cta="Commencer"
          />
          <PriceCard
            highlighted
            name="Solo"
            price="12 €"
            note="par mois"
            features={["Factures illimitées", "Clients illimités", "Relances (bientôt)"]}
            cta="Choisir Solo"
          />
          <PriceCard
            name="Pro"
            price="19 €"
            note="par mois"
            features={["Multi-entités", "QR-facture Suisse SIX", "Assistance prioritaire"]}
            cta="Choisir Pro"
          />
        </div>
      </section>

      <section id="faq" className="border-t border-border/60 bg-card/40">
        <div className="mx-auto max-w-3xl px-6 py-24">
          <h2 className="font-brand text-4xl tracking-tight">Questions fréquentes</h2>
          <Accordion type="single" collapsible className="mt-8">
            <AccordionItem value="q1">
              <AccordionTrigger>Quelle différence entre facturer en Suisse et en France ?</AccordionTrigger>
              <AccordionContent>
                En Suisse, la TVA principale est de 8.1% et le numéro TVA suit le format
                CHE-xxx.xxx.xxx TVA. En France, la TVA normale est de 20%, avec un
                numéro FR + SIRET. Les mentions obligatoires diffèrent&nbsp;: FactuFront
                les gère automatiquement selon le pays du vendeur et du client.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="q2">
              <AccordionTrigger>Quand utiliser 8.1% (CH) plutôt que 20% (FR) ?</AccordionTrigger>
              <AccordionContent>
                La TVA appliquée dépend du pays d'établissement du vendeur et du type de
                prestation. Un indépendant établi en Suisse facture en général à 8.1% ;
                un auto-entrepreneur français facture à 20% (ou 0% en franchise en base).
                Cet outil ne remplace pas votre fiduciaire.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="q3">
              <AccordionTrigger>Puis-je facturer en CHF et en EUR ?</AccordionTrigger>
              <AccordionContent>
                Oui. Chaque client a une devise préférée et chaque facture peut être émise
                en CHF ou EUR, avec le formatage local (fr-CH / fr-FR). Idéal pour les
                frontaliers qui facturent des deux côtés de la frontière.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="q4">
              <AccordionTrigger>Est-ce un logiciel de comptabilité ?</AccordionTrigger>
              <AccordionContent>
                Non. FactuFront est un outil d'aide à la facturation. Pas de bilan, pas de
                déclaration TVA, pas de rapprochement bancaire. Une seule mission&nbsp;:
                sortir une facture propre et se faire payer.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="q5">
              <AccordionTrigger>Et la QR-facture Suisse ?</AccordionTrigger>
              <AccordionContent>
                FactuFront affiche un bloc dédié « QR-facture Suisse » quand le vendeur est
                établi en Suisse. Dans cette version MVP, il s'agit d'un emplacement
                réservé prêt à être branché sur la norme SIX. Le bloc IBAN reste utilisable.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </section>

      <footer className="border-t border-border/60">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-4 px-6 py-10 text-sm text-muted-foreground md:flex-row md:items-center">
          <div>© {new Date().getFullYear()} FactuFront — fait pour freelances CH & FR.</div>
          <div className="flex gap-6">
            <Link to="/mentions" className="hover:text-foreground">Mentions légales</Link>
            <Link to="/app" className="hover:text-foreground">Ouvrir l'app</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

function Feature({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div>
      <div className="flex h-9 w-9 items-center justify-center rounded-md bg-accent">{icon}</div>
      <h3 className="mt-4 text-base font-semibold text-foreground">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{body}</p>
    </div>
  );
}

function PriceCard({
  name,
  price,
  note,
  features,
  cta,
  highlighted,
}: {
  name: string;
  price: string;
  note: string;
  features: string[];
  cta: string;
  highlighted?: boolean;
}) {
  return (
    <Card
      className={`p-6 ${
        highlighted ? "border-sage ring-1 ring-sage/40 shadow-md" : ""
      }`}
    >
      <div className="flex items-baseline justify-between">
        <h3 className="text-lg font-semibold">{name}</h3>
        {highlighted && (
          <span className="rounded-full bg-sage/15 px-2 py-0.5 text-xs text-sage-foreground">
            Populaire
          </span>
        )}
      </div>
      <div className="mt-4 flex items-baseline gap-1">
        <span className="font-brand text-4xl">{price}</span>
        <span className="text-sm text-muted-foreground">/ {note}</span>
      </div>
      <ul className="mt-5 space-y-2 text-sm">
        {features.map((f) => (
          <li key={f} className="flex items-center gap-2">
            <Check className="h-4 w-4 text-sage" /> {f}
          </li>
        ))}
      </ul>
      <Link to="/app" className="mt-6 block">
        <Button
          className="w-full"
          variant={highlighted ? "default" : "outline"}
        >
          {cta}
        </Button>
      </Link>
    </Card>
  );
}

function InvoicePreviewCard() {
  return (
    <div className="relative">
      <div className="absolute -inset-4 -z-10 rounded-2xl bg-sage/20 blur-2xl" />
      <Card className="overflow-hidden border-border/70 bg-card p-0 shadow-xl">
        <div className="flex items-center justify-between border-b border-border/60 px-5 py-3 text-xs text-muted-foreground">
          <span>Facture · FF-2026-0042</span>
          <span className="rounded-full bg-sage/15 px-2 py-0.5 text-sage-foreground">Envoyée</span>
        </div>
        <div className="px-6 py-6">
          <div className="flex items-start justify-between">
            <div>
              <div className="font-brand text-xl">Studio Lemaire</div>
              <div className="mt-1 text-xs text-muted-foreground">Genève · CHE-123.456.789 TVA</div>
            </div>
            <div className="text-right text-xs text-muted-foreground">
              <div>Émise le 24.07.2026</div>
              <div>Échéance 23.08.2026</div>
            </div>
          </div>
          <div className="mt-6 space-y-2 text-sm">
            <Row desc="Direction artistique — mai" qty="2 j" total="CHF 1 300.00" />
            <Row desc="Refonte identité (phase 1)" qty="1" total="CHF 1 800.00" />
            <Row desc="Réunion cadrage" qty="1 h" total="CHF   150.00" />
          </div>
          <div className="mt-6 border-t border-border/60 pt-4 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>Sous-total HT</span><span>CHF 3 250.00</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>TVA 8.1%</span><span>CHF   263.25</span>
            </div>
            <div className="mt-2 flex justify-between text-base font-semibold">
              <span>Total TTC</span><span>CHF 3 513.25</span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

function Row({ desc, qty, total }: { desc: string; qty: string; total: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-foreground">{desc}</span>
      <span className="flex items-center gap-6 text-muted-foreground">
        <span>{qty}</span>
        <span className="w-28 text-right tabular-nums text-foreground">{total}</span>
      </span>
    </div>
  );
}
