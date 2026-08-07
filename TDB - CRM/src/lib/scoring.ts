import type { LeadStatus } from "@/generated/prisma/client";
import { productBlock } from "@/lib/custom-data";

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
  const vf = productBlock(custom, "vitrineflash");
  const bf = productBlock(custom, "bookflow");
  const budget = Number(vf.budget ?? custom.budget ?? 0);
  if (budget >= 2000) score += 10;
  else if (budget >= 1000) score += 5;

  const volume = Number(bf.volumeRdv ?? custom.volumeRdv ?? 0);
  if (volume >= 80) score += 10;
  else if (volume >= 30) score += 5;

  const interestCount =
    lead.interests?.length ??
    [
      custom.interested_vitrineflash,
      custom.interested_bookflow,
      vf.besoin,
      bf.casUsage,
    ].filter(Boolean).length;
  if (interestCount >= 2) score += 8;
  else if (interestCount >= 1) score += 4;

  if (lead.nextCallAt && lead.nextCallAt.getTime() < Date.now()) score += 5;

  return Math.max(0, Math.min(100, Math.round(score)));
}

export function scoreTone(score: number): "success" | "warning" | "danger" | "neutral" {
  if (score >= 70) return "success";
  if (score >= 45) return "warning";
  if (score >= 25) return "neutral";
  return "danger";
}
