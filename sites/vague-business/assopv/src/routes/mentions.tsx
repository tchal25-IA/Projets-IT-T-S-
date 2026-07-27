import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/mentions")({
  head: () => ({
    meta: [
      { title: "Mentions & disclaimer — AssoPV" },
      { name: "description", content: "AssoPV n'est pas un conseil juridique. Vérifiez toujours vos statuts et la législation applicable." },
      { property: "og:title", content: "Mentions & disclaimer — AssoPV" },
      { property: "og:description", content: "AssoPV n'est pas un conseil juridique." },
    ],
  }),
  component: Mentions,
});

function Mentions() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/60">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-5">
          <Link to="/" className="font-serif text-2xl font-semibold">
            Asso<span className="text-accent">PV</span>
          </Link>
          <Link to="/ag" className="text-sm underline underline-offset-4">Préparer mon AG</Link>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="font-serif text-4xl">Mentions</h1>
        <div className="prose prose-neutral mt-8 space-y-6 text-foreground">
          <section>
            <h2 className="font-serif text-2xl">Pas un conseil juridique</h2>
            <p className="text-muted-foreground">
              AssoPV est un outil qui vous aide à mettre en forme les documents habituels d'une assemblée générale d'association suisse (art. 60 ss CC). Les modèles proposés reflètent des usages courants mais <strong>ne constituent pas un conseil juridique</strong>.
            </p>
          </section>
          <section>
            <h2 className="font-serif text-2xl">Vérifiez vos statuts</h2>
            <p className="text-muted-foreground">
              Les délais de convocation, règles de quorum, majorités requises et modalités de vote sont fixés par les statuts de votre association. Vérifiez-les avant l'envoi de la convocation et l'organisation de l'AG.
            </p>
          </section>
          <section>
            <h2 className="font-serif text-2xl">Données</h2>
            <p className="text-muted-foreground">
              Les informations que vous saisissez restent dans votre navigateur (localStorage). Aucune donnée n'est envoyée à un serveur dans la version gratuite actuelle.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
