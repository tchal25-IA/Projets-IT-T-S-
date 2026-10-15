"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { TaskPriority } from "@/generated/prisma/client";
import { requireUser } from "@/lib/actions/helpers";
import { assertLeadAccess, assertAccountAccess } from "@/lib/access";
import { isDirection, isFullAccess } from "@/lib/roles";
import { requireOrg, orgWhere } from "@/lib/tenant";

const PRIORITIES: TaskPriority[] = ["LOW", "MEDIUM", "HIGH"];

export async function createTask(formData: FormData) {
  const user = await requireUser();
  const orgId = await requireOrg();
  const title = String(formData.get("title") || "").trim().slice(0, 200);
  if (!title) throw new Error("Titre requis");

  const leadId = String(formData.get("leadId") || "") || null;
  const accountId = String(formData.get("accountId") || formData.get("clientId") || "") || null;
  if (leadId) await assertLeadAccess(user, leadId);
  if (accountId) await assertAccountAccess(user, accountId);

  let assigneeId = String(formData.get("userId") || "") || user.id;
  // Non-direction : on ne peut assigner qu'à soi-même
  if (!isDirection(user.role) && assigneeId !== user.id) {
    assigneeId = user.id;
  }

  const dueRaw = String(formData.get("dueAt") || "");
  const priority = String(formData.get("priority") || "MEDIUM") as TaskPriority;
  if (!PRIORITIES.includes(priority)) throw new Error("Priorité invalide");

  await prisma.task.create({
    data: {
      organizationId: orgId,
      title,
      userId: assigneeId,
      leadId,
      accountId,
      dueAt: dueRaw ? new Date(dueRaw) : null,
      priority,
    },
  });

  revalidatePath("/taches");
  revalidatePath("/dashboard");
  if (leadId) revalidatePath(`/leads/${leadId}`);
}

export async function toggleTaskDone(taskId: string, done: boolean) {
  const user = await requireUser();
  const orgId = await requireOrg();
  const task = await prisma.task.findFirst({ 
    where: orgWhere(orgId, { id: taskId })
  });
  if (!task) throw new Error("Tâche introuvable");
  if (task.userId !== user.id && !isDirection(user.role)) {
    throw new Error("Accès refusé");
  }
  if (task.leadId) await assertLeadAccess(user, task.leadId);

  await prisma.task.update({
    where: { id: taskId },
    data: { doneAt: done ? new Date() : null },
  });

  revalidatePath("/taches");
  revalidatePath("/dashboard");
  if (task.leadId) revalidatePath(`/leads/${task.leadId}`);
}

export async function deleteTask(taskId: string) {
  const user = await requireUser();
  const orgId = await requireOrg();
  const task = await prisma.task.findFirst({ 
    where: orgWhere(orgId, { id: taskId })
  });
  if (!task) return;
  if (task.userId !== user.id && !isFullAccess(user.role)) {
    throw new Error("Accès refusé");
  }
  await prisma.task.delete({ where: { id: taskId } });
  revalidatePath("/taches");
  revalidatePath("/dashboard");
}
