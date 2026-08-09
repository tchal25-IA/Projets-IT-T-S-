import type { FieldDef } from "@/lib/fields";
import { BOOKFLOW_FIELDS, VITRINEFLASH_FIELDS, parseFieldSchema } from "@/lib/fields";
import type { Prisma } from "@/generated/prisma/client";

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
    (slug === "bookflow"
      ? BOOKFLOW_FIELDS.map((f) => f.key)
      : slug === "vitrineflash"
        ? VITRINEFLASH_FIELDS.map((f) => f.key)
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

/**
 * Parse FormData :
 * - interested_{slug}=true|false
 * - custom_{slug}_{fieldKey}
 * - custom_{fieldKey} (plat, fusionné dans le premier produit intéressé / primaire)
 */
export function parseCustomFormData(
  formData: FormData,
  productSlugs: string[]
): {
  bySlug: Record<string, Record<string, unknown>>;
  flat: Record<string, unknown>;
  interested: Record<string, boolean>;
} {
  const bySlug: Record<string, Record<string, unknown>> = {};
  const flat: Record<string, unknown> = {};
  const interested: Record<string, boolean> = {};
  const slugSet = new Set(productSlugs);

  for (const slug of productSlugs) {
    bySlug[slug] = {};
    const hidden = formData.get(`interested_${slug}`);
    const all = formData.getAll(`interested_${slug}`);
    interested[slug] =
      all.includes("true") ||
      String(hidden) === "true" ||
      // legacy VF/BF checkboxes
      (slug === "vitrineflash" &&
        (formData.getAll("interested_vf").includes("true") ||
          formData.get("interested_vf") === "true")) ||
      (slug === "bookflow" &&
        (formData.getAll("interested_bf").includes("true") ||
          formData.get("interested_bf") === "true"));
  }

  for (const [key, value] of formData.entries()) {
    const raw = String(value);
    if (key.startsWith("custom_")) {
      const rest = key.slice("custom_".length);
      // custom_vf_ / custom_bf_ legacy
      if (rest.startsWith("vf_")) {
        const k = rest.slice(3);
        const v = parseValue(k, raw);
        if (v !== undefined) {
          bySlug.vitrineflash = bySlug.vitrineflash ?? {};
          bySlug.vitrineflash[k] = v;
        }
        continue;
      }
      if (rest.startsWith("bf_")) {
        const k = rest.slice(3);
        const v = parseValue(k, raw);
        if (v !== undefined) {
          bySlug.bookflow = bySlug.bookflow ?? {};
          bySlug.bookflow[k] = v;
        }
        continue;
      }
      // custom_{slug}_{field}
      const maybeSlug = productSlugs.find(
        (s) => rest === s || rest.startsWith(`${s}_`)
      );
      if (maybeSlug && rest.startsWith(`${maybeSlug}_`)) {
        const k = rest.slice(maybeSlug.length + 1);
        const v = parseValue(k, raw);
        if (v !== undefined) {
          bySlug[maybeSlug] = bySlug[maybeSlug] ?? {};
          bySlug[maybeSlug][k] = v;
        }
        continue;
      }
      // flat custom_field
      if (!slugSet.has(rest)) {
        const v = parseValue(rest, raw);
        if (v !== undefined) flat[rest] = v;
      }
    }
  }

  return { bySlug, flat, interested };
}

export function buildCustomDataPayload(
  formData: FormData,
  previous?: Record<string, unknown> | null,
  productSlugs: string[] = ["vitrineflash", "bookflow"]
): Prisma.InputJsonValue {
  const prev = previous ?? {};
  const parsed = parseCustomFormData(formData, productSlugs);
  const next: Record<string, unknown> = { ...prev };

  for (const slug of productSlugs) {
    const keys = Object.keys(
      (prev[slug] as Record<string, unknown> | undefined) ?? {}
    );
    const prevBlock = productBlock(prev, slug, keys);
    next[slug] = { ...prevBlock, ...(parsed.bySlug[slug] ?? {}) };
    next[`interested_${slug}`] = Boolean(parsed.interested[slug]);
  }

  // Fusionner flat dans le premier slug intéressé, sinon premier slug
  if (Object.keys(parsed.flat).length) {
    const target =
      productSlugs.find((s) => parsed.interested[s]) ?? productSlugs[0];
    if (target) {
      next[target] = {
        ...((next[target] as Record<string, unknown>) ?? {}),
        ...parsed.flat,
      };
    }
  }

  // Compat legacy flags
  if ("vitrineflash" in next) {
    next.interested_vitrineflash = next.interested_vitrineflash ?? false;
  }
  if ("bookflow" in next) {
    next.interested_bookflow = next.interested_bookflow ?? false;
  }

  return next as Prisma.InputJsonValue;
}

export function fieldsForProduct(
  slug: string,
  fieldSchema?: unknown
): FieldDef[] {
  const fromDb = parseFieldSchema(fieldSchema);
  if (fromDb.length) return fromDb;
  if (slug === "bookflow") return BOOKFLOW_FIELDS;
  if (slug === "vitrineflash") return VITRINEFLASH_FIELDS;
  return [];
}

export function interestFlagKey(slug: string) {
  return `interested_${slug}`;
}
