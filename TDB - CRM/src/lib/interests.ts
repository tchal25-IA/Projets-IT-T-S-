import { prisma } from "@/lib/db";

/**
 * Synchronise LeadInterest à partir des flags interested_{slug}
 * et des blocs customData[slug] non vides.
 */
export async function syncLeadInterests(
  leadId: string,
  customData: Record<string, unknown>,
  primarySlug?: string | null,
  knownSlugs?: string[]
) {
  const products =
    knownSlugs && knownSlugs.length
      ? knownSlugs
      : (
          await prisma.product.findMany({
            where: { active: true },
            select: { slug: true },
          })
        ).map((p) => p.slug);

  const slugs = new Set<string>();
  if (primarySlug) slugs.add(primarySlug);

  for (const slug of products) {
    if (customData[`interested_${slug}`]) slugs.add(slug);
    const block = customData[slug];
    if (
      block &&
      typeof block === "object" &&
      !Array.isArray(block) &&
      Object.keys(block as object).length > 0
    ) {
      slugs.add(slug);
    }
  }

  // Compat legacy
  if (customData.interested_vitrineflash) slugs.add("vitrineflash");
  if (customData.interested_bookflow) slugs.add("bookflow");

  await prisma.leadInterest.deleteMany({ where: { leadId } });
  if (slugs.size === 0) return;
  await prisma.leadInterest.createMany({
    data: [...slugs].map((productSlug) => ({ leadId, productSlug })),
  });
}
