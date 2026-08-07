import type { LeadStatus } from "@/generated/prisma/client";

type ScoreLead = {
  status: LeadStatus;
  source?: string | null;
  website?: string | null;
  email?: string | null;
  phone?: string | null;
  estimatedValue?: number | null;
  customData?: unknown;
  interests?: { productSlug: string }[];
  nextCallAt?: Date | null;
};

function collectNumericSignals(custom: Record<string, unknown>): number[] {
  const nums: number[] = [];
  const walk = (obj: unknown) => {
    if (!obj || typeof obj !== "object" || Array.isArray(obj)) return;
    for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
      if (k.startsWith("interested_")) continue;
      if (typeof v === "number" && Number.isFinite(v)) nums.push(v);
      else if (
        typeof v === "string" &&
        v.trim() !== "" &&
        !Number.isNaN(Number(v)) &&
        /budget|volume|rdv|ca|montant|amount/i.test(k)
      ) {
        nums.push(Number(v));
      } else if (v && typeof v === "object") {
        walk(v);
      }
    }
  };
  walk(custom);
  return nums;
}

/** Score lead 0–100 pour prioriser la file d'appels. */
export function computeLeadScore(lead: ScoreLead): number {
  let score = 10;

  const statusPts: Partial<Record<LeadStatus, number>> = {
    NOUVEAU: 5,
    CONTACTE: 15,
    QUALIFIE: 25,
    RDV_PLANIFIE: 35,
    PROPOSITION: 45,
    CLOSE: 0,
    PERDU: 0,
  };
  score += statusPts[lead.status] ?? 0;

  if (lead.website) score += 10;
  if (lead.email) score += 8;
  if (lead.phone) score += 7;

  const src = (lead.source ?? "").toLowerCase();
  if (src.includes("apporteur")) score += 12;
  else if (src.includes("manuel")) score += 8;
  else if (src.includes("import")) score += 5;

  if (lead.estimatedValue && lead.estimatedValue >= 1500) score += 10;
  else if (lead.estimatedValue && lead.estimatedValue >= 500) score += 5;

  const custom = (lead.customData ?? {}) as Record<string, unknown>;
  const nums = collectNumericSignals(custom);
  const budgetish = Math.max(0, ...nums.filter((n) => n >= 100), 0);
  if (budgetish >= 2000) score += 10;
  else if (budgetish >= 1000) score += 5;

  const volumeish = Math.max(0, ...nums.filter((n) => n > 0 && n < 100), 0);
  if (volumeish >= 80) score += 10;
  else if (volumeish >= 30) score += 5;

  const interestSlugs = new Set<string>();
  for (const i of lead.interests ?? []) interestSlugs.add(i.productSlug);
  for (const key of Object.keys(custom)) {
    if (!key.startsWith("interested_")) continue;
    if (!custom[key]) continue;
    const slug = key.replace(/^interested_/, "");
    if (slug === "vf") interestSlugs.add("vitrineflash");
    else if (slug === "bf") interestSlugs.add("bookflow");
    else interestSlugs.add(slug);
  }
  for (const [key, val] of Object.entries(custom)) {
    if (key.startsWith("interested_")) continue;
    if (val && typeof val === "object" && !Array.isArray(val)) {
      if (Object.keys(val as object).length > 0) interestSlugs.add(key);
    }
  }

  if (interestSlugs.size >= 2) score += 8;
  else if (interestSlugs.size >= 1) score += 4;

  if (lead.nextCallAt && lead.nextCallAt.getTime() < Date.now()) score += 5;

  return Math.max(0, Math.min(100, Math.round(score)));
}

export function scoreTone(score: number): "success" | "warning" | "danger" | "neutral" {
  if (score >= 70) return "success";
  if (score >= 45) return "warning";
  if (score >= 25) return "neutral";
  return "danger";
}
