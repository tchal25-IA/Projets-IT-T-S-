"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/actions/helpers";
import { requireOrg, orgWhere } from "@/lib/tenant";

export async function markNotificationRead(id: string) {
  const user = await requireUser();
  const orgId = await requireOrg();
  await prisma.notification.updateMany({
    where: orgWhere(orgId, { id, userId: user.id }),
    data: { read: true },
  });
  revalidatePath("/dashboard");
  revalidatePath("/notifications");
}

export async function markAllNotificationsRead() {
  const user = await requireUser();
  const orgId = await requireOrg();
  await prisma.notification.updateMany({
    where: orgWhere(orgId, { userId: user.id, read: false }),
    data: { read: true },
  });
  revalidatePath("/dashboard");
  revalidatePath("/notifications");
}
