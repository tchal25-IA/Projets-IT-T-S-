import { prisma } from "@/lib/db";
import type { Role } from "@/generated/prisma/client";
import { leadVisibilityWhere, clientVisibilityWhere } from "@/lib/permissions";

export type DashboardMetrics = {
  leadsTotal: number;
  leadsOpen: number;
  leadsClosed: number;
  leadsLost: number;
  winRate: number;
  pipelineValue: number;
  closedCa: number;
  callsToday: number;
  rdvToday: number;
  overdueCalls: number;
  clientsTotal: number;
  clientsEnLivraison: number;
  clientsActifs: number;
  commissionsTotal: number;
  commissionsAVerser: number;
  commissionsVersees: number;
  byStatus: { name: string; value: number }[];
  byProduct: { name: string; value: number }[];
  recentLeads: {
    id: string;
    companyName: string;
    status: string;
    productName: string;
    estimatedValue: number | null;
    commercialName: string | null;
  }[];
  nextActions: {
    id: string;
    companyName: string;
    nextCallAt: Date | null;
    status: string;
  }[];
};

export async function computeDashboardMetrics(
  userId: string,
  role: Role,
  productId: string | null
): Promise<DashboardMetrics> {
  const where = leadVisibilityWhere(userId, role, { productId });
  const clientWhere = clientVisibilityWhere(userId, role, { productId });

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const [
    leads,
    clients,
    dealLines,
    commissions,
    callsToday,
    rdvToday,
  ] = await Promise.all([
    prisma.lead.findMany({
      where,
      include: {
        product: true,
        commercial: true,
        dealLines: true,
      },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.client.findMany({ where: clientWhere }),
    prisma.dealLine.findMany({
      where:
        Object.keys(where).length === 0 && Object.keys(clientWhere).length === 0
          ? {}
          : { OR: [{ lead: where }, { client: clientWhere }] },
    }),
    prisma.commission.findMany({
      where:
        role === "APPORTEUR" || role === "COMMERCIAL"
          ? { userId }
          : productId
            ? { lead: { productId } }
            : {},
    }),
    prisma.activity.count({
      where: {
        type: "APPEL",
        createdAt: { gte: startOfDay },
        lead: where,
        ...(role === "COMMERCIAL" ? { userId } : {}),
      },
    }),
    prisma.activity.count({
      where: {
        type: "RDV",
        createdAt: { gte: startOfDay },
        lead: where,
        ...(role === "COMMERCIAL" ? { userId } : {}),
      },
    }),
  ]);

  const openStatuses = ["NOUVEAU", "CONTACTE", "QUALIFIE", "RDV_PLANIFIE", "PROPOSITION"];
  const leadsOpen = leads.filter((l) => openStatuses.includes(l.status)).length;
  const leadsClosed = leads.filter((l) => l.status === "CLOSE").length;
  const leadsLost = leads.filter((l) => l.status === "PERDU").length;
  const decided = leadsClosed + leadsLost;
  const winRate = decided > 0 ? Math.round((leadsClosed / decided) * 100) : 0;

  const pipelineValue = leads
    .filter((l) => openStatuses.includes(l.status))
    .reduce((s, l) => s + (l.estimatedValue ?? 0), 0);

  const closedCa = leads
    .filter((l) => l.status === "CLOSE")
    .reduce(
      (s, l) => s + l.dealLines.reduce((a, d) => a + d.amountHt, 0),
      0
    );

  const overdueCalls = leads.filter(
    (l) =>
      l.nextCallAt &&
      l.nextCallAt < new Date() &&
      openStatuses.includes(l.status)
  ).length;

  const statusMap = new Map<string, number>();
  for (const l of leads) {
    statusMap.set(l.status, (statusMap.get(l.status) ?? 0) + 1);
  }
  const byStatus = [...statusMap.entries()].map(([name, value]) => ({
    name,
    value,
  }));

  const productMap = new Map<string, number>();
  for (const l of leads) {
    productMap.set(l.product.name, (productMap.get(l.product.name) ?? 0) + 1);
  }
  const byProduct = [...productMap.entries()].map(([name, value]) => ({
    name,
    value,
  }));

  return {
    leadsTotal: leads.length,
    leadsOpen,
    leadsClosed,
    leadsLost,
    winRate,
    pipelineValue,
    closedCa,
    callsToday,
    rdvToday,
    overdueCalls,
    clientsTotal: clients.length,
    clientsEnLivraison: clients.filter((c) => c.status === "EN_LIVRAISON").length,
    clientsActifs: clients.filter((c) => c.status === "ACTIF").length,
    commissionsTotal: commissions.reduce((s, c) => s + c.amountHt, 0),
    commissionsAVerser: commissions
      .filter((c) => c.status === "A_VERSER" || c.status === "CALCULEE")
      .reduce((s, c) => s + c.amountHt, 0),
    commissionsVersees: commissions
      .filter((c) => c.status === "VERSEE")
      .reduce((s, c) => s + c.amountHt, 0),
    byStatus,
    byProduct,
    recentLeads: leads.slice(0, 8).map((l) => ({
      id: l.id,
      companyName: l.companyName,
      status: l.status,
      productName: l.product.name,
      estimatedValue: l.estimatedValue,
      commercialName: l.commercial?.fullName ?? null,
    })),
    nextActions: leads
      .filter((l) => openStatuses.includes(l.status))
      .sort((a, b) => {
        const ta = a.nextCallAt?.getTime() ?? Number.MAX_SAFE_INTEGER;
        const tb = b.nextCallAt?.getTime() ?? Number.MAX_SAFE_INTEGER;
        return ta - tb;
      })
      .slice(0, 6)
      .map((l) => ({
        id: l.id,
        companyName: l.companyName,
        nextCallAt: l.nextCallAt,
        status: l.status,
      })),
  };
}
