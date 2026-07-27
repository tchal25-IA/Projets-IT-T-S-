import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/mentions")({
  head: () => ({
    meta: [
      { title: "Mentions & disclaimer — FactuFront" },
      {
        name: "description",
        content:
          "FactuFront est un outil d'aide à la facturation. Il ne remplace pas un conseil fiscal ou comptable.",
      },
      { property: "og:title", content: "Mentions & disclaimer — FactuFront" },
      { property: "og:description", content: "Outil d'aide à la facturation, pas un conseil fiscal." },
    ],
  }),
  component: Mentions,
});

function Mentions() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">
        ← Retour
      </Link>
      <h1 className="font-brand mt-6 text-4xl tracking-tight">Mentions & disclaimer</h1>
      <div className="prose prose-sm mt-8 max-w-none text-foreground">
        <p className="text-muted-foreground">
          FactuFront est un <strong>outil d'aide à la facturation</strong>. Il ne constitue
          pas un conseil fiscal, comptable ou juridique.
        </p>
        <p className="mt-4 text-muted-foreground">
          Les taux de TVA proposés (8.1% / 2.6% pour la Suisse, 20% / 10% / 5.5% pour la
          France) sont indicatifs. Le taux applicable dépend de la nature de la prestation,
          du régime fiscal du vendeur et du client, et peut évoluer. Il est de la
          responsabilité de l'utilisateur de vérifier auprès de sa fiduciaire, de son
          expert-comptable ou de l'administration fiscale compétente.
        </p>
        <p className="mt-4 text-muted-foreground">
          Le bloc « QR-facture Suisse » affiché sur les factures émises depuis la Suisse
          est un <strong>emplacement réservé</strong> dans cette version. Il ne remplace
          pas un QR-code SIX conforme et scannable. Pour un vrai QR-facture, prévoyez
          l'intégration d'une bibliothèque conforme à la norme SIX.
        </p>
        <p className="mt-4 text-muted-foreground">
          Les données sont stockées localement dans votre navigateur (localStorage). Pensez
          à exporter vos factures en PDF pour les archiver.
        </p>
      </div>
      <div className="mt-10">
        <Link to="/app">
          <Button>Ouvrir l'app</Button>
        </Link>
      </div>
    </div>
  );
}
