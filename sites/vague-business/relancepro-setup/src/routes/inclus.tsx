import { createFileRoute, Link } from "@tanstack/react-router";
import { Check, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/inclus")({
  head: () => ({
    meta: [
      { title: "Ce qui est inclus — RelancePro" },
      { name: "description", content: "Livrables détaillés de la session RelancePro : paramétrage, templates, process PDF, migration." },
      { property: "og:title", content: "Livrables — RelancePro" },
      { property: "og:description", content: "Le détail complet de ce qu'on installe pendant la session à 390 €." },
    ],
  }),
  component: Inclus,
});

const items = [
  {
    t: "Paramétrage de l'outil de facturation",
    d: "FactuFront (recommandé) ou votre outil actuel. Numérotation légale conforme, mentions obligatoires, TVA, coordonnées bancaires, logo, conditions de paiement, pénalités de retard.",
  },
  {
    t: "3 templates de relance calibrés",
    d: "J+7 rappel courtois, J+14 relance ferme, J+30 mise en demeure amiable. Textes prêts à l'emploi, adaptés à votre ton, prêts à automatiser dans l'outil.",
  },
  {
    t: "Process PDF 1 page",
    d: "Votre routine hebdo synthétique : quand émettre, quand relancer, quand escalader. Imprimable, affichable au mur ou dans Notion.",
  },
  {
    t: "Session live 60 à 90 minutes",
    d: "En visio, écran partagé. On configure ensemble avec vos vrais clients et vos vrais montants. Vous voyez tout, vous comprenez tout.",
  },
  {
    t: "Export et migration si nécessaire",
    d: "Vos clients, articles, devis actuels sont importés dans le nouvel outil. Aucune ressaisie manuelle.",
  },
  {
    t: "Test grandeur nature",
    d: "On envoie une vraie facture test + une relance test pour valider que la chaîne complète fonctionne dans vos conditions.",
  },
  {
    t: "Support email 14 jours",
    d: "Vous avez un doute, une question, un client rétif ? Vous nous écrivez, on répond sous 24h ouvrées.",
  },
  {
    t: "Garantie satisfait ou remboursé 14 jours",
    d: "Si le setup ne vous convient pas dans les 14 jours suivant la session, on rembourse intégralement les 390 €.",
  },
];

function Inclus() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-16">
      <div className="mb-12">
        <span className="text-xs uppercase tracking-wider text-primary font-semibold">Livrables détaillés</span>
        <h1 className="mt-3 font-display text-4xl md:text-5xl font-semibold tracking-tight">Tout ce qui est inclus</h1>
        <p className="mt-4 text-muted-foreground text-lg leading-relaxed">
          Le prix est fixe : 390 € tout compris. Aucun frais caché, aucun upsell surprise.
          L'abonnement à l'outil (à partir de 12 €/mois) est à votre nom et vous appartient.
        </p>
      </div>

      <ul className="space-y-4">
        {items.map((i) => (
          <li key={i.t} className="rounded-xl border border-border bg-card p-6 flex gap-5">
            <span className="mt-1 flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center">
              <Check className="w-4 h-4" />
            </span>
            <div>
              <h3 className="font-semibold text-lg">{i.t}</h3>
              <p className="mt-1.5 text-muted-foreground leading-relaxed text-sm">{i.d}</p>
            </div>
          </li>
        ))}
      </ul>

      <div className="mt-12 rounded-2xl bg-primary text-primary-foreground p-8 md:p-10 flex flex-col md:flex-row md:items-center gap-6 justify-between">
        <div>
          <div className="font-display text-3xl font-semibold">390 € tout compris</div>
          <div className="mt-1 opacity-80 text-sm">Payé après la session · Garantie 14 jours</div>
        </div>
        <Link to="/reserver" className="inline-flex items-center gap-2 rounded-md bg-background text-foreground px-6 py-3 font-medium hover:bg-background/90 transition-colors whitespace-nowrap">
          Réserver ma session <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
