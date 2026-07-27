import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/mentions")({
  head: () => ({
    meta: [
      { title: "Mentions légales — FrontBudget" },
      { name: "description", content: "Mentions légales de FrontBudget." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Mentions,
});

function Mentions() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">← Retour</Link>
      <h1 className="mt-6 text-3xl font-semibold">Mentions légales</h1>
      <div className="mt-6 space-y-4 text-sm text-muted-foreground">
        <p><strong>Éditeur.</strong> FrontBudget — démonstration MVP.</p>
        <p><strong>Hébergement.</strong> Lovable.</p>
        <p>
          <strong>Données personnelles.</strong> FrontBudget ne collecte aucune donnée personnelle.
          L'ensemble de vos transactions, comptes et budgets est stocké localement dans votre
          navigateur (localStorage). Aucune information n'est transmise à un serveur.
        </p>
        <p><strong>Cookies.</strong> Aucun cookie de tracking n'est utilisé.</p>
        <p><strong>Contact.</strong> contact@frontbudget.example</p>
      </div>
    </div>
  );
}
