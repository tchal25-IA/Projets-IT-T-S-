import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/mentions")({
  head: () => ({
    meta: [
      { title: "Mentions légales — RelancePro" },
      { name: "description", content: "Mentions légales du service RelancePro." },
      { property: "og:title", content: "Mentions légales — RelancePro" },
      { property: "og:description", content: "Informations légales du service RelancePro." },
    ],
  }),
  component: Mentions,
});

function Mentions() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16 prose-neutral">
      <h1 className="font-display text-4xl font-semibold tracking-tight">Mentions légales</h1>

      <section className="mt-10 space-y-2">
        <h2 className="font-display text-xl font-semibold">Éditeur</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          RelancePro — service proposé par un entrepreneur indépendant.<br />
          Contact : contact@relancepro.fr<br />
          SIREN : à compléter · TVA non applicable, art. 293 B du CGI.
        </p>
      </section>

      <section className="mt-8 space-y-2">
        <h2 className="font-display text-xl font-semibold">Hébergement</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Site hébergé par Lovable — infrastructure Cloudflare.
        </p>
      </section>

      <section className="mt-8 space-y-2">
        <h2 className="font-display text-xl font-semibold">Données personnelles</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Les informations saisies via le formulaire de réservation sont stockées localement dans votre navigateur
          et utilisées uniquement pour préparer votre session. Vous pouvez à tout moment demander la suppression de vos données
          par email à contact@relancepro.fr.
        </p>
      </section>

      <section className="mt-8 space-y-2">
        <h2 className="font-display text-xl font-semibold">Propriété intellectuelle</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Les contenus livrés lors de la session (templates, process PDF) sont sous licence d'usage personnel non transférable.
        </p>
      </section>

      <section className="mt-8 space-y-2">
        <h2 className="font-display text-xl font-semibold">Cookies</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Ce site n'utilise pas de cookies de traçage ni d'outils d'analyse tiers.
        </p>
      </section>
    </div>
  );
}
