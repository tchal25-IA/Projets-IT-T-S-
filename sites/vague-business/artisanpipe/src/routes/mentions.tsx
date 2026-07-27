import { createFileRoute, Link } from "@tanstack/react-router";
import { Hammer } from "lucide-react";

export const Route = createFileRoute("/mentions")({
  head: () => ({
    meta: [
      { title: "Mentions légales — ArtisanPipe" },
      { name: "description", content: "Mentions légales et informations sur ArtisanPipe." },
      { property: "og:title", content: "Mentions légales — ArtisanPipe" },
      { property: "og:description", content: "Mentions légales d'ArtisanPipe." },
    ],
  }),
  component: Mentions,
});

function Mentions() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Hammer className="h-5 w-5" />
            </div>
            <span className="font-display text-xl font-bold uppercase">ArtisanPipe</span>
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="font-display text-4xl font-bold uppercase">Mentions légales</h1>
        <div className="prose mt-6 space-y-4 text-muted-foreground">
          <p>
            ArtisanPipe est un produit en version MVP. Les informations et données saisies dans
            l'application sont stockées localement dans le navigateur de l'utilisateur.
          </p>
          <h2 className="font-display text-2xl font-bold uppercase text-foreground">Éditeur</h2>
          <p>ArtisanPipe — démonstration produit.</p>
          <h2 className="font-display text-2xl font-bold uppercase text-foreground">Données</h2>
          <p>
            Aucune donnée personnelle n'est transmise à un serveur tiers dans cette version.
            Effacer le stockage du navigateur supprime toutes vos données.
          </p>
          <h2 className="font-display text-2xl font-bold uppercase text-foreground">Contact</h2>
          <p>Pour toute question : hello@artisanpipe.example</p>
        </div>
      </main>
    </div>
  );
}
