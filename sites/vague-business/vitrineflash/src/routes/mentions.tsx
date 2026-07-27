import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/mentions")({
  head: () => ({
    meta: [
      { title: "Mentions légales — VitrineFlash" },
      { name: "description", content: "Mentions légales de VitrineFlash, service de refonte de sites vitrines en 48h." },
      { property: "og:title", content: "Mentions légales — VitrineFlash" },
      { property: "og:description", content: "Mentions légales et informations éditeur VitrineFlash." },
    ],
  }),
  component: Mentions,
});

function Mentions() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 md:py-24">
      <h1 className="font-brand text-4xl font-black tracking-tight md:text-5xl">Mentions légales</h1>
      <div className="mt-8 space-y-8 text-sm leading-relaxed text-foreground/85">
        <section>
          <h2 className="font-brand text-xl font-bold text-foreground">Éditeur</h2>
          <p className="mt-2">
            VitrineFlash — service de refonte de sites vitrines en 48h.<br />
            Basé en Suisse Romande, opérant en Suisse et en France.<br />
            Contact : hello@vitrineflash.ch
          </p>
        </section>
        <section>
          <h2 className="font-brand text-xl font-bold text-foreground">Hébergement</h2>
          <p className="mt-2">Sites hébergés sur Lovable Cloud.</p>
        </section>
        <section>
          <h2 className="font-brand text-xl font-bold text-foreground">Propriété intellectuelle</h2>
          <p className="mt-2">
            Le nom « VitrineFlash », le logo et l'ensemble des éléments graphiques présents sur ce site sont la propriété exclusive de leur auteur. Toute reproduction sans autorisation est interdite.
          </p>
        </section>
        <section>
          <h2 className="font-brand text-xl font-bold text-foreground">Données personnelles</h2>
          <p className="mt-2">
            Les informations transmises via le formulaire de brief sont utilisées uniquement pour préparer votre projet. Aucune donnée n'est revendue. Conformément à la LPD (Suisse) et au RGPD (UE), vous pouvez demander la suppression de vos données à hello@vitrineflash.ch.
          </p>
        </section>
        <section>
          <h2 className="font-brand text-xl font-bold text-foreground">Cookies</h2>
          <p className="mt-2">Ce site n'utilise pas de cookies de tracking tiers.</p>
        </section>
      </div>
    </div>
  );
}
