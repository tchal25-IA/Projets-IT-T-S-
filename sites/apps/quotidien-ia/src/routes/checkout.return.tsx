import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

type Search = { session_id?: string };

export const Route = createFileRoute("/checkout/return")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    session_id: typeof s.session_id === "string" ? s.session_id : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Merci — Quotidien IA" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ReturnPage,
});

function ReturnPage() {
  const { session_id } = Route.useSearch();
  return (
    <div className="mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center p-8 text-center">
      <CheckCircle2 className="h-16 w-16 text-green-500" />
      <h1 className="mt-4 text-3xl font-bold">Abonnement confirmé</h1>
      <p className="mt-2 text-muted-foreground">
        {session_id
          ? "Votre essai gratuit de 30 jours a démarré. Vous pouvez commencer à utiliser tous vos modules."
          : "Session introuvable. Si vous avez été débité, contactez le support."}
      </p>
      <div className="mt-6 flex gap-3">
        <Button asChild>
          <Link to="/mes-outils">Accéder à mes outils</Link>
        </Button>
        <Button asChild variant="outline">
          <Link to="/parametres">Voir mon abonnement</Link>
        </Button>
      </div>
    </div>
  );
}
