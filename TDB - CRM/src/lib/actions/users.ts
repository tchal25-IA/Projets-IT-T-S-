"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { canManageUsers } from "@/lib/utils";
import { requireUser } from "@/lib/actions/helpers";
import { parseRole } from "@/lib/access";
import bcrypt from "bcryptjs";

const MIN_PASSWORD = 8;

export async function createUser(formData: FormData) {
  const user = await requireUser();
  if (!canManageUsers(user.role)) throw new Error("Accès refusé");

  const email = String(formData.get("email") || "").toLowerCase().trim();
  const fullName = String(formData.get("fullName") || "").trim();
  const role = parseRole(String(formData.get("role") || "COMMERCIAL"));
  const password = String(formData.get("password") || "");

  if (!email || !fullName) throw new Error("Champs requis manquants");
  if (password.length < MIN_PASSWORD) {
    throw new Error(`Mot de passe trop court (min. ${MIN_PASSWORD} caractères)`);
  }

  await prisma.user.create({
    data: {
      email,
      fullName,
      role,
      passwordHash: await bcrypt.hash(password, 12),
    },
  });

  revalidatePath("/admin/users");
}

export async function updateUser(formData: FormData) {
  const actor = await requireUser();
  if (!canManageUsers(actor.role)) throw new Error("Accès refusé");

  const id = String(formData.get("id") || "");
  if (!id) throw new Error("Utilisateur manquant");

  const email = String(formData.get("email") || "").toLowerCase().trim();
  const fullName = String(formData.get("fullName") || "").trim();
  const role = parseRole(String(formData.get("role") || "COMMERCIAL"));
  const active =
    formData.get("active") === "on" || formData.get("active") === "true";
  const password = String(formData.get("password") || "").trim();

  const data: {
    email: string;
    fullName: string;
    role: ReturnType<typeof parseRole>;
    active: boolean;
    passwordHash?: string;
  } = { email, fullName, role, active };

  if (password) {
    if (password.length < MIN_PASSWORD) {
      throw new Error(`Mot de passe trop court (min. ${MIN_PASSWORD} caractères)`);
    }
    data.passwordHash = await bcrypt.hash(password, 12);
  }

  await prisma.user.update({ where: { id }, data });
  revalidatePath("/admin/users");
}

export async function deleteUser(userId: string) {
  const actor = await requireUser();
  if (!canManageUsers(actor.role)) throw new Error("Accès refusé");
  if (actor.id === userId)
    throw new Error("Vous ne pouvez pas supprimer votre propre compte");

  const target = await prisma.user.findUnique({ where: { id: userId } });
  if (!target) throw new Error("Utilisateur introuvable");

  await prisma.lead.updateMany({
    where: { commercialId: userId },
    data: { commercialId: null },
  });
  await prisma.lead.updateMany({
    where: { apporteurId: userId },
    data: { apporteurId: null },
  });
  await prisma.task.deleteMany({ where: { userId } });
  await prisma.savedView.deleteMany({ where: { userId } });
  await prisma.quota.deleteMany({ where: { userId } });
  await prisma.notification.deleteMany({ where: { userId } });
  await prisma.commission.deleteMany({ where: { userId } });
  await prisma.activity.updateMany({
    where: { userId },
    data: { userId: null },
  });
  await prisma.user.delete({ where: { id: userId } });

  revalidatePath("/admin/users");
}

export async function toggleUserActive(userId: string, active: boolean) {
  const user = await requireUser();
  if (!canManageUsers(user.role)) throw new Error("Accès refusé");
  if (user.id === userId && !active) {
    throw new Error("Vous ne pouvez pas désactiver votre propre compte");
  }
  await prisma.user.update({ where: { id: userId }, data: { active } });
  revalidatePath("/admin/users");
}

export async function upsertQuota(formData: FormData) {
  const user = await requireUser();
  if (!canManageUsers(user.role)) throw new Error("Accès refusé");

  const userId = String(formData.get("userId") || "");
  const yearMonth = String(formData.get("yearMonth") || "").slice(0, 7);
  const targetCloses = Number(formData.get("targetCloses") || 0);
  const targetCa = Number(formData.get("targetCa") || 0);
  if (!userId || !/^\d{4}-\d{2}$/.test(yearMonth)) {
    throw new Error("Champs requis");
  }
  if (!Number.isFinite(targetCloses) || targetCloses < 0) {
    throw new Error("Objectif closes invalide");
  }
  if (!Number.isFinite(targetCa) || targetCa < 0) {
    throw new Error("Objectif CA invalide");
  }

  await prisma.quota.upsert({
    where: { userId_yearMonth: { userId, yearMonth } },
    create: { userId, yearMonth, targetCloses, targetCa },
    update: { targetCloses, targetCa },
  });

  revalidatePath("/admin/quotas");
  revalidatePath("/dashboard");
}
