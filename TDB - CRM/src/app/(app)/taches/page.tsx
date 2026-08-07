import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { createTask, toggleTaskDone, deleteTask } from "@/lib/actions";
import { PageHeader, Card, Button, Input, Select, Badge } from "@/components/ui";
import { formatDateTime, isDirection } from "@/lib/utils";
import { isFullAccess } from "@/lib/roles";

export default async function TachesPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const session = await auth();
  if (!session?.user) return null;
  const sp = await searchParams;
  const tab = sp.tab ?? "today";

  const now = new Date();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  const weekEnd = new Date(start);
  weekEnd.setDate(weekEnd.getDate() + 7);

  const scope =
    session.user.role === "COMMERCIAL" || session.user.role === "APPORTEUR"
      ? { userId: session.user.id }
      : isDirection(session.user.role) || isFullAccess(session.user.role)
        ? {}
        : { userId: session.user.id };

  const tasks = await prisma.task.findMany({
    where: {
      ...scope,
      doneAt: null,
      ...(tab === "today"
        ? { dueAt: { gte: start, lt: end } }
        : tab === "week"
          ? { dueAt: { gte: start, lt: weekEnd } }
          : tab === "overdue"
            ? { dueAt: { lt: start } }
            : {}),
    },
    include: {
      lead: true,
      client: true,
      user: true,
    },
    orderBy: [{ dueAt: "asc" }, { priority: "desc" }],
  });

  const users =
    isFullAccess(session.user.role) || isDirection(session.user.role)
      ? await prisma.user.findMany({
          where: {
            active: true,
            role: { in: ["COMMERCIAL", "ASSOCIE", "DIRECTION_VF", "DIRECTION_BOOKFLOW"] },
          },
          orderBy: { fullName: "asc" },
        })
      : [];

  const tabs = [
    { id: "today", label: "Aujourd'hui" },
    { id: "week", label: "Cette semaine" },
    { id: "overdue", label: "En retard" },
    { id: "all", label: "Toutes" },
  ];

  return (
    <div>
      <PageHeader
        title="Agenda / Tâches"
        subtitle="Suivi des actions assignées — style Salesforce Tasks"
      />

      <div className="mb-4 flex flex-wrap gap-2">
        {tabs.map((t) => (
          <Link
            key={t.id}
            href={`/taches?tab=${t.id}`}
            className={`rounded-md px-3 py-1.5 text-sm ${
              tab === t.id
                ? "bg-teal-800 text-white"
                : "bg-white text-stone-700 border border-stone-200"
            }`}
          >
            {t.label}
          </Link>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <Card>
          <div className="divide-y divide-stone-100">
            {tasks.map((task) => (
              <div
                key={task.id}
                className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-medium">{task.title}</p>
                  <p className="text-xs text-stone-500">
                    {task.user.fullName}
                    {task.lead ? (
                      <>
                        {" · "}
                        <Link
                          href={`/leads/${task.lead.id}`}
                          className="text-teal-800 hover:underline"
                        >
                          {task.lead.companyName}
                        </Link>
                      </>
                    ) : null}
                    {task.dueAt ? ` · ${formatDateTime(task.dueAt)}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    tone={
                      task.priority === "HIGH"
                        ? "danger"
                        : task.priority === "LOW"
                          ? "neutral"
                          : "warning"
                    }
                  >
                    {task.priority}
                  </Badge>
                  <form
                    action={async () => {
                      "use server";
                      await toggleTaskDone(task.id, true);
                    }}
                  >
                    <Button type="submit" variant="secondary">
                      Fait
                    </Button>
                  </form>
                  <form
                    action={async () => {
                      "use server";
                      await deleteTask(task.id);
                    }}
                  >
                    <Button type="submit" variant="ghost">
                      ✕
                    </Button>
                  </form>
                </div>
              </div>
            ))}
            {tasks.length === 0 ? (
              <p className="py-6 text-sm text-stone-500">Aucune tâche.</p>
            ) : null}
          </div>
        </Card>

        <Card>
          <h2 className="mb-3 text-sm font-semibold">Nouvelle tâche</h2>
          <form action={createTask} className="space-y-3">
            <Input name="title" placeholder="Titre" required />
            <Input name="dueAt" type="datetime-local" />
            <Select name="priority" defaultValue="MEDIUM">
              <option value="LOW">Basse</option>
              <option value="MEDIUM">Moyenne</option>
              <option value="HIGH">Haute</option>
            </Select>
            {users.length > 0 ? (
              <Select name="userId" defaultValue={session.user.id}>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.fullName}
                  </option>
                ))}
              </Select>
            ) : (
              <input type="hidden" name="userId" value={session.user.id} />
            )}
            <Input name="leadId" placeholder="Lead ID (optionnel)" />
            <Button type="submit" className="w-full">
              Créer
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
