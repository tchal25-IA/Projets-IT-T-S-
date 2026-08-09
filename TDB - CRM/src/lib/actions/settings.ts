"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { canManageUsers } from "@/lib/utils";
import { requireUser, revalidateCrm } from "@/lib/actions/helpers";
import {
  FIELD_TYPES,
  parseFieldSchema,
  type FieldDef,
} from "@/lib/fields";
import type { BillingPeriod, OfferingKind } from "@/generated/prisma/client";

function requireSettingsAdmin(role: string) {
  if (!canManageUsers(role as never)) throw new Error("Accès refusé");
}

function slugify(input: string) {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
}

function revalidateSettings() {
  revalidatePath("/admin/parametres");
  revalidateCrm();
}

export async function upsertProduct(formData: FormData) {
  const user = await requireUser();
  requireSettingsAdmin(user.role);

  const id = String(formData.get("id") || "");
  const name = String(formData.get("name") || "").trim();
  let slug = String(formData.get("slug") || "").trim().toLowerCase();
  const description = String(formData.get("description") || "").trim() || null;
  const sortOrder = Number(formData.get("sortOrder") || 0);
  const active =
    formData.get("active") === "on" || formData.get("active") === "true";

  if (!name) throw new Error("Nom requis");
  if (!slug) slug = slugify(name);
  if (!/^[a-z0-9-]+$/.test(slug)) throw new Error("Slug invalide");

  if (id) {
    await prisma.product.update({
      where: { id },
      data: {
        name,
        slug,
        description,
        sortOrder: Number.isFinite(sortOrder) ? sortOrder : 0,
        active,
      },
    });
  } else {
    await prisma.product.create({
      data: {
        name,
        slug,
        description,
        sortOrder: Number.isFinite(sortOrder) ? sortOrder : 0,
        active,
        fieldSchema: [],
      },
    });
  }

  revalidateSettings();
}

export async function toggleProductActive(productId: string, active: boolean) {
  const user = await requireUser();
  requireSettingsAdmin(user.role);
  await prisma.product.update({ where: { id: productId }, data: { active } });
  revalidateSettings();
}

export async function upsertOffering(formData: FormData) {
  const user = await requireUser();
  requireSettingsAdmin(user.role);

  const id = String(formData.get("id") || "");
  const productId = String(formData.get("productId") || "");
  const name = String(formData.get("name") || "").trim();
  const code = String(formData.get("code") || "").trim() || null;
  const kind = String(formData.get("kind") || "ONE_SHOT") as OfferingKind;
  const billingPeriod = String(
    formData.get("billingPeriod") || "NONE"
  ) as BillingPeriod;
  const amountRaw = String(formData.get("amountHt") || "").trim();
  const amountHt = amountRaw === "" ? null : Number(amountRaw);
  const sortOrder = Number(formData.get("sortOrder") || 0);
  const active =
    formData.get("active") === "on" || formData.get("active") === "true";

  if (!productId || !name) throw new Error("Produit et nom requis");
  if (
    !["ONE_SHOT", "SUBSCRIPTION", "MAINTENANCE", "OTHER"].includes(kind)
  ) {
    throw new Error("Type de prestation invalide");
  }
  if (!["NONE", "MONTHLY", "YEARLY"].includes(billingPeriod)) {
    throw new Error("Période invalide");
  }
  if (amountHt != null && (!Number.isFinite(amountHt) || amountHt < 0)) {
    throw new Error("Montant invalide");
  }

  const data = {
    productId,
    name,
    code,
    kind,
    billingPeriod,
    amountHt,
    sortOrder: Number.isFinite(sortOrder) ? sortOrder : 0,
    active,
  };

  if (id) {
    await prisma.productOffering.update({ where: { id }, data });
  } else {
    await prisma.productOffering.create({ data });
  }

  revalidateSettings();
}

export async function deleteOffering(offeringId: string) {
  const user = await requireUser();
  requireSettingsAdmin(user.role);
  await prisma.productOffering.delete({ where: { id: offeringId } });
  revalidateSettings();
}

export async function toggleOfferingActive(offeringId: string, active: boolean) {
  const user = await requireUser();
  requireSettingsAdmin(user.role);
  await prisma.productOffering.update({
    where: { id: offeringId },
    data: { active },
  });
  revalidateSettings();
}

export async function saveProductFieldSchema(formData: FormData) {
  const user = await requireUser();
  requireSettingsAdmin(user.role);

  const productId = String(formData.get("productId") || "");
  if (!productId) throw new Error("Produit manquant");

  const keys = formData.getAll("fieldKey").map(String);
  const labels = formData.getAll("fieldLabel").map(String);
  const types = formData.getAll("fieldType").map(String);
  const optionsList = formData.getAll("fieldOptions").map(String);
  const optionsFromList = formData.getAll("fieldOptionsFrom").map(String);
  const requiredList = formData.getAll("fieldRequired").map(String);

  const fields: FieldDef[] = [];
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i].trim();
    const label = (labels[i] ?? "").trim();
    const type = (types[i] ?? "text") as FieldDef["type"];
    if (!key || !label) continue;
    if (!FIELD_TYPES.includes(type)) continue;
    const def: FieldDef = { key, label, type };
    if (optionsFromList[i] === "offerings") {
      def.optionsFrom = "offerings";
      def.type = "select";
    } else if (type === "select") {
      def.options = (optionsList[i] ?? "")
        .split("|")
        .map((s) => s.trim())
        .filter(Boolean);
    }
    if (requiredList[i] === "true") def.required = true;
    fields.push(def);
  }

  // Validate parse round-trip
  const validated = parseFieldSchema(fields);
  await prisma.product.update({
    where: { id: productId },
    data: { fieldSchema: validated },
  });

  revalidateSettings();
}
