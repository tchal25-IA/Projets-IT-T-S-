import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/mentions")({
  head: () => ({
    meta: [
      { title: "Mentions légales — AutoFlux" },
      { name: "description", content: "Mentions légales, éditeur, hébergement et traitement des données AutoFlux." },
      { property: "og:title", content: "Mentions légales — AutoFlux" },
      { property: "og:description", content: "Informations légales AutoFlux." },
    ],
  }),
  component: Mentions,
});

function Mentions() {
  return (
    <section className="container-x py-16">
      <div className="mx-auto max-w-2xl">
        <div className="font-mono text-xs tracking-widest text-muted-foreground">§ LÉGAL</div>
        <h1 className="mt-2 text-4xl font-bold">Mentions légales</h1>

        <div className="prose prose-sm mt-8 max-w-none space-y-6 text-sm leading-relaxed">
          <div>
            <h2 className="font-display text-lg font-semibold">Éditeur</h2>
            <p className="mt-1 text-muted-foreground">
              AutoFlux Sàrl — Rue du Petit-Chêne 38, 1003 Lausanne, Suisse.<br />
              CHE-XXX.XXX.XXX · TVA CH.<br />
              Contact : hello@autoflux.io
            </p>
          </div>

          <div>
            <h2 className="font-display text-lg font-semibold">Hébergement</h2>
            <p className="mt-1 text-muted-foreground">
              Site hébergé sur infrastructure edge Cloudflare (Union Européenne / Suisse).
            </p>
          </div>

          <div>
            <h2 className="font-display text-lg font-semibold">Propriété intellectuelle</h2>
            <p className="mt-1 text-muted-foreground">
              L'ensemble du site (contenus, marque « AutoFlux », graphismes) est protégé. Toute reproduction sans autorisation est interdite.
            </p>
          </div>

          <div>
            <h2 className="font-display text-lg font-semibold">Données personnelles</h2>
            <p className="mt-1 text-muted-foreground">
              Les briefs soumis via le formulaire d'audit sont stockés localement sur votre navigateur (localStorage) et transmis à AutoFlux uniquement dans le cadre de la relation commerciale. Conformément au RGPD et à la nLPD suisse, vous disposez d'un droit d'accès, de rectification et de suppression : hello@autoflux.io.
            </p>
          </div>

          <div>
            <h2 className="font-display text-lg font-semibold">Cookies</h2>
            <p className="mt-1 text-muted-foreground">
              Ce site n'utilise pas de cookies de suivi publicitaire.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
