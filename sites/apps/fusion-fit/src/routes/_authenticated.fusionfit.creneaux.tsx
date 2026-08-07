import { createFileRoute, redirect } from "@tanstack/react-router";

/** Ancienne route Créneaux → Agenda */
export const Route = createFileRoute("/_authenticated/fusionfit/creneaux")({
  beforeLoad: () => {
    throw redirect({ to: "/fusionfit/agenda" });
  },
});
