import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense } from "react";
import { ListChecks } from "lucide-react";
import { PageHeader } from "@/components/page-header";

const TaskManager = lazy(() =>
  import("@/components/task-manager").then((m) => ({ default: m.TaskManager }))
);

export const Route = createFileRoute("/productivite")({
  head: () => ({
    meta: [
      { title: "Productivité & organisation — Quotidien IA" },
      {
        name: "description",
        content: "Gérez vos tâches, projets et missions. Vue Kanban, Gantt, échéances et tableau de bord.",
      },
      { property: "og:title", content: "Productivité — Quotidien IA" },
      {
        property: "og:description",
        content: "Gestionnaire de tâches et projets intégré — Kanban, Gantt, Ma semaine, Missions.",
      },
    ],
  }),
  component: ProductivitePage,
});

function ProductivitePage() {
  return (
    <div className="space-y-6">
      <PageHeader
        icon={ListChecks}
        eyebrow="Module"
        title="Productivité & organisation"
        description="Gérez vos tâches, projets et missions. Kanban, Gantt, échéances — tout en un."
      />
      <Suspense fallback={<div className="py-12 text-center text-sm text-muted-foreground">Chargement…</div>}>
        <TaskManager />
      </Suspense>
    </div>
  );
}
