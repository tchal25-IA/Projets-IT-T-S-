import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { markAllNotificationsRead, markNotificationRead } from "@/lib/actions";
import { PageHeader, Card, Badge, Button } from "@/components/ui";
import { formatDateTime } from "@/lib/utils";
import Link from "next/link";

export default async function NotificationsPage() {
  const session = await auth();
  if (!session?.user) return null;

  const notifications = await prisma.notification.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <PageHeader
        title="Notifications"
        subtitle="Alertes in-app (assignations, closes, imports, rappels)"
        actions={
          <form action={markAllNotificationsRead}>
            <Button type="submit" variant="secondary">
              Tout marquer lu
            </Button>
          </form>
        }
      />
      <div className="space-y-3">
        {notifications.map((n) => (
          <Card key={n.id} className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <p className="font-medium text-stone-900">{n.title}</p>
                {!n.read ? <Badge tone="info">Non lu</Badge> : null}
              </div>
              <p className="mt-1 text-sm text-stone-600">{n.body}</p>
              <p className="mt-1 text-xs text-stone-500">{formatDateTime(n.createdAt)}</p>
            </div>
            <div className="flex gap-2">
              {n.link ? (
                <Link href={n.link}>
                  <Button variant="secondary">Ouvrir</Button>
                </Link>
              ) : null}
              {!n.read ? (
                <form
                  action={async () => {
                    "use server";
                    await markNotificationRead(n.id);
                  }}
                >
                  <Button type="submit" variant="ghost">
                    Lu
                  </Button>
                </form>
              ) : null}
            </div>
          </Card>
        ))}
        {notifications.length === 0 ? (
          <Card>
            <p className="text-sm text-stone-500">Aucune notification.</p>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
