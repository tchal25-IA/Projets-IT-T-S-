import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/mentions")({
  head: () => ({
    meta: [
      { title: "Mentions légales — FiduciaFind" },
      { name: "description", content: "Mentions légales et conditions d'utilisation de FiduciaFind." },
      { property: "og:title", content: "Mentions légales — FiduciaFind" },
      { property: "og:description", content: "Mentions légales de FiduciaFind." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Mentions,
});

function Mentions() {
  return (
    <article className="mx-auto max-w-3xl px-4 py-16 prose prose-neutral">
      <h1 className="brand-serif text-4xl">Mentions légales</h1>
      <p className="mt-4 text-muted-foreground">Dernière mise à jour : 2026</p>

      <h2 className="brand-serif mt-8 text-2xl">Éditeur</h2>
      <p>FiduciaFind est un projet de démonstration (MVP). Les fiduciaires listées sur cette version sont fictives et à titre d'illustration uniquement.</p>

      <h2 className="brand-serif mt-8 text-2xl">Données personnelles</h2>
      <p>Les demandes de devis envoyées via cette version de démonstration sont stockées localement dans votre navigateur (localStorage) et ne sont transmises à aucun tiers.</p>

      <h2 className="brand-serif mt-8 text-2xl">Propriété intellectuelle</h2>
      <p>Le nom « FiduciaFind » et l'ensemble des éléments graphiques sont protégés. Toute reproduction est soumise à autorisation.</p>

      <h2 className="brand-serif mt-8 text-2xl">Contact</h2>
      <p>Pour toute question : hello@fiduciafind.example</p>
    </article>
  );
}
