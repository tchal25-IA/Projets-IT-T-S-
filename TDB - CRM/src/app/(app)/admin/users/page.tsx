import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/ui";
import { isFullAccess } from "@/lib/utils";
import { UsersAdmin } from "@/components/users-admin";

export default async function AdminUsersPage() {
  const session = await auth();
  if (!session?.user) return null;
  if (!isFullAccess(session.user.role)) {
    redirect("/dashboard");
  }

  const users = await prisma.user.findMany({ orderBy: { fullName: "asc" } });

  return (
    <div>
      <PageHeader
        title="Gestion des utilisateurs"
        subtitle="Créez, modifiez ou supprimez les accès en autonomie (Associé / Admin)"
      />
      <UsersAdmin
        users={users.map((u) => ({
          id: u.id,
          email: u.email,
          fullName: u.fullName,
          role: u.role,
          active: u.active,
        }))}
        currentUserId={session.user.id}
      />
    </div>
  );
}
