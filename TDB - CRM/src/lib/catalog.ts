import { prisma } from "@/lib/db";
import { COMMISSION_RATES } from "@/lib/utils";
import { parseFieldSchema } from "@/lib/fields";
import { isProductInterested, productBlock } from "@/lib/custom-data";

export type CommissionRates = {
  APPORTEUR: number;
  COMMERCIAL: number;
};

/** Rates depuis Paramètres, fallback constantes. */
export async function getCommissionRates(): Promise<CommissionRates> {
  const rules = await prisma.commissionRule.findMany({
    where: { active: true },
  });
  const map: CommissionRates = {
    APPORTEUR: COMMISSION_RATES.APPORTEUR,
    COMMERCIAL: COMMISSION_RATES.COMMERCIAL,
  };
  for (const r of rules) {
    if (r.roleKey === "APPORTEUR" || r.roleKey === "COMMERCIAL") {
      map[r.roleKey] = r.ratePercent;
    }
  }
  return map;
}

export async function ensureDefaultCommissionRules() {
  await prisma.commissionRule.upsert({
    where: { roleKey: "APPORTEUR" },
    create: {
      roleKey: "APPORTEUR",
      label: "Apporteur d'affaires",
      ratePercent: COMMISSION_RATES.APPORTEUR,
      sortOrder: 0,
    },
    update: {},
  });
  await prisma.commissionRule.upsert({
    where: { roleKey: "COMMERCIAL" },
    create: {
      roleKey: "COMMERCIAL",
      label: "Commercial (close)",
      ratePercent: COMMISSION_RATES.COMMERCIAL,
      sortOrder: 1,
    },
    update: {},
  });
}

/**
 * Crée / met à jour des DealLines à partir des formules choisies
 * dans customData (champs optionsFrom=offerings).
 */
export async function syncDealLinesFromQualification(
  leadId: string,
  customData: Record<string, unknown>
) {
  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    select: { clientId: true },
  });
  if (!lead) return;

  const products = await prisma.product.findMany({
    where: { active: true },
    include: {
      offerings: { where: { active: true } },
    },
  });

  for (const product of products) {
    const block = productBlock(
      customData,
      product.slug,
      parseFieldSchema(product.fieldSchema).map((f) => f.key)
    );
    const interested = isProductInterested(customData, product.slug, {
      hasBlockValues: Object.keys(block).length > 0,
    });
    if (!interested && Object.keys(block).length === 0) continue;

    const fields = parseFieldSchema(product.fieldSchema).filter(
      (f) => f.optionsFrom === "offerings"
    );
    for (const field of fields) {
      const selected = block[field.key];
      if (typeof selected !== "string" || !selected.trim()) continue;

      const offering = product.offerings.find((o) => o.name === selected);
      if (!offering) continue;

      const existing = await prisma.dealLine.findFirst({
        where: { leadId, offeringId: offering.id },
      });

      const isRecurring =
        offering.kind === "SUBSCRIPTION" || offering.kind === "MAINTENANCE";
      const amountHt = offering.amountHt ?? 0;

      if (existing) {
        await prisma.dealLine.update({
          where: { id: existing.id },
          data: {
            label: offering.name,
            amountHt,
            isRecurring,
            clientId: lead.clientId,
          },
        });
      } else {
        await prisma.dealLine.create({
          data: {
            leadId,
            clientId: lead.clientId,
            offeringId: offering.id,
            label: offering.name,
            amountHt,
            billingStatus: "DEVIS",
            isRecurring,
          },
        });
      }
    }
  }
}
