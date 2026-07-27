import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/adhezia/AppShell";

export const Route = createFileRoute("/app")({
  head: () => ({
    meta: [
      { title: "Espace club — Adhezia" },
      { name: "description", content: "Gérez vos membres, cotisations et check-in dans votre espace club Adhezia." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AppShell,
});
