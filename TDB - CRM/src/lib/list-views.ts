import type { LeadStatus, Prisma } from "@/generated/prisma/client";
import { OPEN_STATUSES } from "@/lib/utils";

export type SystemViewId =
  | "all"
  | "mine"
  | "hot"
  | "overdue"
  | "closes_month"
  | "open";

export const SYSTEM_VIEWS: {
  id: SystemViewId;
  label: string;
  description: string;
}[] = [
  { id: "all", label: "Tous", description: "Tous les leads visibles" },
  { id: "mine", label: "Mes leads", description: "Assignés à moi" },
  { id: "open", label: "Pipeline ouvert", description: "Hors closé / perdu" },
  { id: "hot", label: "Chauds", description: "Score / proposition / RDV" },
  { id: "overdue", label: "Relances en retard", description: "nextCallAt dépassé" },
  { id: "closes_month", label: "Closés du mois", description: "Closes ce mois" },
];

export function systemViewWhere(
  view: SystemViewId,
  userId: string
): Prisma.LeadWhereInput {
  const startMonth = new Date();
  startMonth.setDate(1);
  startMonth.setHours(0, 0, 0, 0);

  switch (view) {
    case "mine":
      return {
        OR: [{ commercialId: userId }, { apporteurId: userId }],
      };
    case "open":
      return { status: { in: OPEN_STATUSES } };
    case "hot":
      return {
        status: {
          in: ["QUALIFIE", "RDV_PLANIFIE", "PROPOSITION"] as LeadStatus[],
        },
      };
    case "overdue":
      return {
        nextCallAt: { lt: new Date() },
        status: { in: OPEN_STATUSES },
      };
    case "closes_month":
      return {
        status: "CLOSE",
        closedAt: { gte: startMonth },
      };
    case "all":
    default:
      return {};
  }
}

export function parseSavedFilters(
  filters: unknown
): Prisma.LeadWhereInput {
  if (!filters || typeof filters !== "object") return {};
  const f = filters as Record<string, unknown>;
  const where: Prisma.LeadWhereInput = {};
  if (typeof f.status === "string") {
    where.status = f.status as LeadStatus;
  }
  if (f.overdue === true) {
    where.nextCallAt = { lt: new Date() };
  }
  if (typeof f.productId === "string") {
    where.productId = f.productId;
  }
  if (typeof f.q === "string" && f.q.trim()) {
    const q = f.q.trim();
    where.OR = [
      { companyName: { contains: q, mode: "insensitive" } },
      { contactName: { contains: q, mode: "insensitive" } },
      { email: { contains: q, mode: "insensitive" } },
    ];
  }
  return where;
}
