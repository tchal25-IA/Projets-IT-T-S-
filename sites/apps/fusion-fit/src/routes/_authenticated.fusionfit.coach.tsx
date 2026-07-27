import { createFileRoute, redirect } from "@tanstack/react-router";

// L'ancien tableau de bord coach est fusionné dans /fusionfit/escouade,
// qui gère abonnés, programmes, IA fatigue, escouades et invitations.
export const Route = createFileRoute("/_authenticated/fusionfit/coach")({
  beforeLoad: () => {
    throw redirect({ to: "/fusionfit/escouade" });
  },
});
