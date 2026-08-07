import { prisma } from "@/lib/db";

const LEGACY_INTEREST: Record<string, string> = {
  interested_vf: "vitrineflash",
  interested_bf: "bookflow",
};

export async function syncLeadInterests(
  leadId: string,
  customData: Record<string, unknown>,
  primarySlug?: string | null
) {
  const slugs = new Set<string>();
  if (primarySlug) slugs.add(primarySlug);

  for (const [key, value] of Object.entries(customData)) {
    if (key.startsWith("interested_") && value) {
      const slug = key.replace(/^interested_/, "");
      if (slug && slug !== "vf" && slug !== "bf") slugs.add(slug);
    }
    if (LEGACY_INTEREST[key] && value) slugs.add(LEGACY_INTEREST[key]);
  }

  // Blocs produit non vides
  const products = await prisma.product.findMany({
    where: { active: true },
    select: { slug: true },
  });
  for (const p of products) {
    const block = customData[p.slug];
    if (block && typeof block === "object" && !Array.isArray(block)) {
      if (Object.keys(block as object).length > 0) slugs.add(p.slug);
    }
  }

  await prisma.leadInterest.deleteMany({ where: { leadId } });
  if (slugs.size === 0) return;
  await prisma.leadInterest.createMany({
    data: [...slugs].map((productSlug) => ({ leadId, productSlug })),
  });
}
