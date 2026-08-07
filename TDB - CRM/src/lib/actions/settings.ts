"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { isFullAccess } from "@/lib/roles";
import { requireUser } from "@/lib/actions/helpers";
import { parseFieldSchema, type FieldDef } from "@/lib/fields";
import type { BillingPeriod, OfferingKind, Prisma } from "@/generated/prisma/client";

async function requireSetup() {
  const user = await requireUser();
  if (!isFullAccess(user.role)) throw new Error("Accès refusé");
  return user;
}

function revalidateSettings() {
  revalidatePath("/admin/parametres");
  revalidatePath("/leads");
  revalidatePath("/leads/new");
}

function slugify(raw: string) {
  return raw
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
    .slice(0, 40);
}

export async function upsertProduct(formData: FormData) {
  await requireSetup();
  const id = String(formData.get("id") || "");
  const name = String(formData.get("name") || "").trim();
  let slug = String(formData.get("slug") || "").trim().toLowerCase();
  const description = String(formData.get("description") || "").trim() || null;
  const active =
    formData.get("active") === "on" || formData.get("active") === "true";
  const sortOrder = Number(formData.get("sortOrder") || 0);

  if (!name) throw new Error("Nom requis");
  if (!slug) slug = slugify(name);
  if (!/^[a-z0-9_-]+$/.test(slug)) throw new Error("Slug invalide");

  if (id) {
    await prisma.product.update({
      where: { id },
      data: { name, description, active, sortOrder },
    });
  } else {
    await prisma.product.create({
      data: {
        name,
        slug,
        description,
        active,
        sortOrder: Number.isFinite(sortOrder) ? sortOrder : 0,
        fieldSchema: [] as Prisma.InputJsonValue,
      },
    });
  }
  revalidateSettings();
}

export async function updateProductFieldSchema(formData: FormData) {
  await requireSetup();
  const productId = String(formData.get("productId") || "");
  const raw = String(formData.get("fieldSchemaJson") || "[]");
  if (!productId) throw new Error("Produit manquant");

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("JSON champs invalide");
  }
  const fields = parseFieldSchema(parsed);
  // Validate keys unique
  const keys = new Set<string>();
  for (const f of fields) {
    if (!f.key.trim()) throw new Error("Chaque champ doit avoir une clé");
    if (keys.has(f.key)) throw new Error(`Clé dupliquée : ${f.key}`);
    keys.add(f.key);
  }

  await prisma.product.update({
    where: { id: productId },
    data: { fieldSchema: fields as unknown as Prisma.InputJsonValue },
  });
  revalidateSettings();
}

export async function addProductField(formData: FormData) {
  await requireSetup();
  const productId = String(formData.get("productId") || "");
  const key = String(formData.get("key") || "").trim();
  const label = String(formData.get("label") || "").trim();
  const type = String(formData.get("type") || "text") as FieldDef["type"];
  const optionsRaw = String(formData.get("options") || "").trim();
  const optionsFrom =
    formData.get("optionsFrom") === "offerings" ? "offerings" : null;
  if (!productId || !key || !label) throw new Error("Champs requis");

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) throw new Error("Produit introuvable");
  const fields = parseFieldSchema(product.fieldSchema);
  if (fields.some((f) => f.key === key)) throw new Error("Clé déjà utilisée");

  const next: FieldDef = {
    key,
    label,
    type: optionsFrom ? "select" : type,
    optionsFrom,
    options: optionsRaw
      ? optionsRaw.split("|").map((s) => s.trim()).filter(Boolean)
      : undefined,
    required: formData.get("required") === "on",
  };
  fields.push(next);
  await prisma.product.update({
    where: { id: productId },
    data: { fieldSchema: fields as unknown as Prisma.InputJsonValue },
  });
  revalidateSettings();
}

export async function removeProductField(productId: string, key: string) {
  await requireSetup();
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) throw new Error("Produit introuvable");
  const fields = parseFieldSchema(product.fieldSchema).filter((f) => f.key !== key);
  await prisma.product.update({
    where: { id: productId },
    data: { fieldSchema: fields as unknown as Prisma.InputJsonValue },
  });
  revalidateSettings();
}

export async function upsertOffering(formData: FormData) {
  await requireSetup();
  const id = String(formData.get("id") || "");
  const productId = String(formData.get("productId") || "");
  const name = String(formData.get("name") || "").trim();
  const code = String(formData.get("code") || "").trim() || null;
  const kind = String(formData.get("kind") || "OTHER") as OfferingKind;
  const billingPeriod = String(
    formData.get("billingPeriod") || "NONE"
  ) as BillingPeriod;
  const amountRaw = String(formData.get("amountHt") || "").trim();
  const amountHt = amountRaw === "" ? null : Number(amountRaw);
  const active =
    formData.get("active") === "on" ||
    formData.get("active") === "true" ||
    !id;
  const sortOrder = Number(formData.get("sortOrder") || 0);

  if (!productId || !name) throw new Error("Produit et nom requis");
  if (amountHt != null && !Number.isFinite(amountHt)) {
    throw new Error("Montant invalide");
  }

  const data = {
    productId,
    name,
    code,
    kind,
    billingPeriod,
    amountHt,
    active,
    sortOrder: Number.isFinite(sortOrder) ? sortOrder : 0,
  };

  if (id) {
    await prisma.productOffering.update({ where: { id }, data });
  } else {
    await prisma.productOffering.create({ data });
  }
  revalidateSettings();
}

export async function deleteOffering(id: string) {
  await requireSetup();
  await prisma.productOffering.delete({ where: { id } });
  revalidateSettings();
}

export async function toggleOfferingActive(id: string, active: boolean) {
  await requireSetup();
  await prisma.productOffering.update({ where: { id }, data: { active } });
  revalidateSettings();
}

export async function upsertCommissionRule(formData: FormData) {
  await requireSetup();
  const roleKey = String(formData.get("roleKey") || "").trim().toUpperCase();
  const label = String(formData.get("label") || "").trim();
  const ratePercent = Number(formData.get("ratePercent") || 0);
  if (!["APPORTEUR", "COMMERCIAL"].includes(roleKey)) {
    throw new Error("Rôle commission invalide");
  }
  if (!Number.isFinite(ratePercent) || ratePercent < 0 || ratePercent > 100) {
    throw new Error("Taux invalide (0–100)");
  }

  await prisma.commissionRule.upsert({
    where: { roleKey },
    create: {
      roleKey,
      label: label || roleKey,
      ratePercent,
      active: true,
    },
    update: {
      label: label || roleKey,
      ratePercent,
      active: true,
    },
  });
  revalidateSettings();
}
