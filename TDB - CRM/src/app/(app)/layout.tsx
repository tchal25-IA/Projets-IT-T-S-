import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { navForRole } from "@/lib/permissions";
import { AppShell } from "@/components/app-shell";
import { FlashToast } from "@/components/flash-toast";
import { Suspense } from "react";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const unreadCount = await prisma.notification.count({
    where: { userId: session.user.id, read: false },
  });

  return (
    <AppShell
      nav={navForRole(session.user.role)}
      user={session.user}
      unreadCount={unreadCount}
    >
      <Suspense fallback={null}>
        <FlashToast />
      </Suspense>
      {children}
    </AppShell>
  );
}
