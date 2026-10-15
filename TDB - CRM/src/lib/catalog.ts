import { prisma } from "@/lib/db";
import { COMMISSION_RATES } from "@/lib/utils";
import { parseFieldSchema } from "@/lib/fields";
import { isProductInterested, productBlock } from "@/lib/custom-data";
import { requireOrg, orgWhere } from "@/lib/tenant";

export type CommissionRates = {
  APPORTEUR: number;
  COMMERCIAL: number;
};

/** Rates depuis Paramètres (scoped by org), fallback constantes. */
export async function getCommissionRates(): Promise<CommissionRates> {
  const orgId = await requireOrg();
  const rules = await prisma.commissionRule.findMany({
    where: orgWhere(orgId, { active: true }),
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

/**
 * Creates / updates Opportunities from selected offerings in customData
 * (fields with optionsFrom=offerings).
 */
export async function syncDealLinesFromQualification(
  leadId: string,
  customData: Record<string, unknown>
) {
  const orgId = await requireOrg();
  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    select: { accountId: true },
  });
  if (!lead) return;

  const products = await prisma.product.findMany({
    where: orgWhere(orgId, { active: true }),
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

      const existing = await prisma.opportunity.findFirst({
        where: orgWhere(orgId, { leadId, offeringId: offering.id }),
      });

      const isRecurring =
        offering.kind === "SUBSCRIPTION" || offering.kind === "MAINTENANCE";
      const amount = offering.amountHt ?? 0;

      if (existing) {
        await prisma.opportunity.update({
          where: { id: existing.id },
          data: {
            name: offering.name,
            amount,
            isRecurring,
            accountId: lead.accountId,
          },
        });
      } else {
        await prisma.opportunity.create({
          data: {
            organizationId: orgId,
            leadId,
            accountId: lead.accountId,
            offeringId: offering.id,
            name: offering.name,
            amount,
            billingStatus: "DEVIS",
            stage: "QUALIFICATION",
            isRecurring,
          },
        });
      }
    }
  }
}
