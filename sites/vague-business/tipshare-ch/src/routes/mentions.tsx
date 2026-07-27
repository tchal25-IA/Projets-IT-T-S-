import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";

export const Route = createFileRoute("/mentions")({
  head: () => ({
    meta: [
      { title: "Mentions légales — TipShare" },
      { name: "description", content: "Mentions légales et informations sur TipShare." },
      { property: "og:title", content: "Mentions légales — TipShare" },
      { property: "og:description", content: "Informations légales TipShare." },
    ],
  }),
  component: MentionsPage,
});

function MentionsPage() {
  return (
    <AppShell>
      <h1 className="brand-serif text-3xl text-primary">Mentions légales</h1>
      <div className="prose prose-sm mt-4 max-w-none text-charcoal/80">
        <p>
          <strong>TipShare</strong> est un outil de répartition de pourboires pour restaurants,
          cafés, bars et salons en Suisse et en France.
        </p>
        <h2 className="brand-serif mt-6 text-xl text-primary">Éditeur</h2>
        <p>TipShare — démo MVP. Éditeur à préciser.</p>
        <h2 className="brand-serif mt-6 text-xl text-primary">Données</h2>
        <p>
          Dans cette version MVP, toutes vos données (équipe, journées, tips) sont stockées
          uniquement dans le navigateur (localStorage) de l'appareil utilisé. Aucun serveur
          ne reçoit ces informations.
        </p>
        <h2 className="brand-serif mt-6 text-xl text-primary">Contact</h2>
        <p>contact@tipshare.example</p>
      </div>
    </AppShell>
  );
}
