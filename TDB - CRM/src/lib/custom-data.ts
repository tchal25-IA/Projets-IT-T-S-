import type { FieldDef } from "@/lib/fields";
import { BOOKFLOW_FIELDS, VITRINEFLASH_FIELDS, parseFieldSchema } from "@/lib/fields";
import type { Prisma } from "@/generated/prisma/client";

/** Préfixe formulaire pour un slug produit (compat vf/bf historiques). */
export function formPrefixForSlug(slug: string): string {
  if (slug === "vitrineflash") return "custom_vf_";
  if (slug === "bookflow") return "custom_bf_";
  return `custom_p_${slug}_`;
}

export function interestFieldForSlug(slug: string): string {
  if (slug === "vitrineflash") return "interested_vf";
  if (slug === "bookflow") return "interested_bf";
  return `interested_${slug}`;
}

export function productBlock(
  customData: Record<string, unknown> | null | undefined,
  slug: string,
  fieldKeys?: string[]
): Record<string, unknown> {
  const data = customData ?? {};
  const nested = data[slug];
  if (nested && typeof nested === "object" && !Array.isArray(nested)) {
    return nested as Record<string, unknown>;
  }
  const known =
    fieldKeys ??
    (slug === "vitrineflash"
      ? VITRINEFLASH_FIELDS.map((f) => f.key)
      : slug === "bookflow"
        ? BOOKFLOW_FIELDS.map((f) => f.key)
        : []);
  const out: Record<string, unknown> = {};
  for (const k of known) {
    if (k in data) out[k] = data[k];
  }
  return out;
}

function parseValue(key: string, raw: string): unknown {
  if (raw === "true" || raw === "on") return true;
  if (raw === "false") return false;
  if (raw !== "" && !Number.isNaN(Number(raw)) && /budget|volume|rdv|score|amount/i.test(key)) {
    return Number(raw);
  }
  if (raw !== "") return raw;
  return undefined;
}

function isChecked(formData: FormData, name: string): boolean {
  return (
    formData.get(name) === "true" ||
    formData.getAll(name).includes("true") ||
    formData.get(name) === "on"
  );
}

/** Parse FormData multi-produits vers customData nested. */
export function buildCustomDataPayload(
  formData: FormData,
  previous?: Record<string, unknown> | null,
  productSlugs: string[] = ["vitrineflash", "bookflow"]
): Prisma.InputJsonValue {
  const prev = { ...(previous ?? {}) } as Record<string, unknown>;
  const next: Record<string, unknown> = { ...prev };

  for (const slug of productSlugs) {
    const prefix = formPrefixForSlug(slug);
    const block: Record<string, unknown> = {
      ...productBlock(prev, slug),
    };
    for (const [key, value] of formData.entries()) {
      if (!key.startsWith(prefix)) continue;
      const k = key.slice(prefix.length);
      const v = parseValue(k, String(value));
      if (v !== undefined) block[k] = v;
    }
    // Champs plats custom_* au create lead (produit primaire unique)
    if (productSlugs.length === 1) {
      for (const [key, value] of formData.entries()) {
        if (!key.startsWith("custom_") || key.startsWith("custom_vf_") || key.startsWith("custom_bf_") || key.startsWith("custom_p_"))
          continue;
        const k = key.replace("custom_", "");
        const v = parseValue(k, String(value));
        if (v !== undefined) block[k] = v;
      }
    }

    next[slug] = block;

    const interestName = interestFieldForSlug(slug);
    const interested =
      isChecked(formData, interestName) ||
      isChecked(formData, `interested_${slug}`);
    next[`interested_${slug}`] = interested;
  }

  return next as Prisma.InputJsonValue;
}

export function fieldsForProduct(slug: string, schema?: unknown): FieldDef[] {
  const fromDb = parseFieldSchema(schema);
  if (fromDb.length) return fromDb;
  if (slug === "bookflow") return BOOKFLOW_FIELDS;
  if (slug === "vitrineflash") return VITRINEFLASH_FIELDS;
  return [];
}
