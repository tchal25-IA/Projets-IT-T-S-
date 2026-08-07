"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { Prisma } from "@/generated/prisma/client";
import { requireUser } from "@/lib/actions/helpers";

export async function saveLeadView(formData: FormData) {
  const user = await requireUser();
  const name = String(formData.get("name") || "").trim();
  if (!name) throw new Error("Nom requis");

  const filters = {
    status: String(formData.get("status") || "") || undefined,
    productId: String(formData.get("productId") || "") || undefined,
    q: String(formData.get("q") || "") || undefined,
    overdue: formData.get("overdue") === "on",
  };

  await prisma.savedView.create({
    data: {
      name,
      entity: "LEAD",
      userId: user.id,
      isShared: formData.get("isShared") === "on",
      filters: filters as Prisma.InputJsonValue,
    },
  });

  revalidatePath("/leads");
}

export async function deleteSavedView(id: string) {
  const user = await requireUser();
  await prisma.savedView.deleteMany({
    where: { id, userId: user.id },
  });
  revalidatePath("/leads");
}
