import type { FieldDef } from "@/lib/fields";
import { BOOKFLOW_FIELDS, VITRINEFLASH_FIELDS } from "@/lib/fields";
import type { Prisma } from "@/generated/prisma/client";

export function productBlock(
  customData: Record<string, unknown> | null | undefined,
  slug: "vitrineflash" | "bookflow"
): Record<string, unknown> {
  const data = customData ?? {};
  const nested = data[slug];
  if (nested && typeof nested === "object" && !Array.isArray(nested)) {
    return nested as Record<string, unknown>;
  }
  const known =
    slug === "vitrineflash"
      ? VITRINEFLASH_FIELDS.map((f) => f.key)
      : BOOKFLOW_FIELDS.map((f) => f.key);
  const out: Record<string, unknown> = {};
  for (const k of known) {
    if (k in data) out[k] = data[k];
  }
  return out;
}

function parseValue(key: string, raw: string): unknown {
  if (raw === "true" || raw === "on") return true;
  if (raw === "false") return false;
  if (raw !== "" && !Number.isNaN(Number(raw)) && /budget|volume|rdv|score/i.test(key)) {
    return Number(raw);
  }
  if (raw !== "") return raw;
  return undefined;
}

/** Parse les champs custom_* / custom_vf_* / custom_bf_* d'un FormData. */
export function parseCustomFormData(formData: FormData): {
  vitrineflash: Record<string, unknown>;
  bookflow: Record<string, unknown>;
  flat: Record<string, unknown>;
  interestedVf: boolean;
  interestedBf: boolean;
} {
  const vitrineflash: Record<string, unknown> = {};
  const bookflow: Record<string, unknown> = {};
  const flat: Record<string, unknown> = {};

  for (const [key, value] of formData.entries()) {
    const raw = String(value);
    if (key.startsWith("custom_vf_")) {
      const k = key.replace("custom_vf_", "");
      const v = parseValue(k, raw);
      if (v !== undefined) vitrineflash[k] = v;
    } else if (key.startsWith("custom_bf_")) {
      const k = key.replace("custom_bf_", "");
      const v = parseValue(k, raw);
      if (v !== undefined) bookflow[k] = v;
    } else if (key.startsWith("custom_")) {
      const k = key.replace("custom_", "");
      const v = parseValue(k, raw);
      if (v !== undefined) flat[k] = v;
    }
  }

  const interestedVf =
    formData.get("interested_vf") === "true" ||
    formData.getAll("interested_vf").includes("true");
  const interestedBf =
    formData.get("interested_bf") === "true" ||
    formData.getAll("interested_bf").includes("true");

  return { vitrineflash, bookflow, flat, interestedVf, interestedBf };
}

export function buildCustomDataPayload(
  formData: FormData,
  previous?: Record<string, unknown> | null
): Prisma.InputJsonValue {
  const prev = previous ?? {};
  const parsed = parseCustomFormData(formData);
  const prevVf = productBlock(prev, "vitrineflash");
  const prevBf = productBlock(prev, "bookflow");

  return {
    ...prev,
    vitrineflash: { ...prevVf, ...parsed.vitrineflash, ...parsed.flat },
    bookflow: { ...prevBf, ...parsed.bookflow },
    interested_vitrineflash: parsed.interestedVf,
    interested_bookflow: parsed.interestedBf,
  } as Prisma.InputJsonValue;
}

export function fieldsForProduct(slug: string): FieldDef[] {
  if (slug === "bookflow") return BOOKFLOW_FIELDS;
  return VITRINEFLASH_FIELDS;
}
