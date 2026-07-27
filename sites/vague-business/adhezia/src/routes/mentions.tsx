import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/mentions")({
  head: () => ({
    meta: [
      { title: "Mentions légales — Adhezia" },
      { name: "description", content: "Mentions légales et informations sur Adhezia." },
      { property: "og:title", content: "Mentions légales — Adhezia" },
      { property: "og:description", content: "Mentions légales et informations sur Adhezia." },
    ],
  }),
  component: Mentions,
});

function Mentions() {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-16">
        <Link to="/" className="text-sm text-muted-foreground hover:text-primary">← Retour</Link>
        <h1 className="text-4xl mt-4">Mentions légales</h1>
        <div className="prose prose-sm mt-8 space-y-4 text-foreground/90">
          <p><strong>Éditeur :</strong> Adhezia — projet en cours de constitution, Suisse.</p>
          <p><strong>Contact :</strong> hello@adhezia.ch</p>
          <p><strong>Hébergement :</strong> Application MVP — les données sont conservées localement dans votre navigateur.</p>
          <p><strong>Données personnelles :</strong> Aucune donnée n'est transmise à un serveur tiers dans cette version. Vous restez seul·e propriétaire des informations saisies. Vous pouvez à tout moment réinitialiser la base depuis Paramètres.</p>
          <p><strong>Propriété intellectuelle :</strong> La marque Adhezia et les contenus du site sont protégés.</p>
        </div>
      </div>
    </div>
  );
}
