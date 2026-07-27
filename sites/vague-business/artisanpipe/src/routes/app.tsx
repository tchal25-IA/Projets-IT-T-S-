import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";

export const Route = createFileRoute("/app")({
  head: () => ({
    meta: [
      { title: "Pipeline — ArtisanPipe" },
      { name: "description", content: "Votre pipeline artisan : prospects, devis, relances." },
      { property: "og:title", content: "Pipeline — ArtisanPipe" },
      { property: "og:description", content: "Prospects, devis, relances en un coup d'œil." },
    ],
  }),
  component: AppShell,
});
