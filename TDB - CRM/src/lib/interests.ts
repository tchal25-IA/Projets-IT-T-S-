import { prisma } from "@/lib/db";

export async function syncLeadInterests(
  leadId: string,
  customData: Record<string, unknown>,
  primarySlug?: string | null
) {
  const slugs = new Set<string>();
  if (primarySlug) slugs.add(primarySlug);
  if (customData.interested_vitrineflash) slugs.add("vitrineflash");
  if (customData.interested_bookflow) slugs.add("bookflow");
  const vf = customData.vitrineflash as Record<string, unknown> | undefined;
  const bf = customData.bookflow as Record<string, unknown> | undefined;
  if (vf && Object.keys(vf).length > 0) slugs.add("vitrineflash");
  if (bf && Object.keys(bf).length > 0) slugs.add("bookflow");

  await prisma.leadInterest.deleteMany({ where: { leadId } });
  if (slugs.size === 0) return;
  await prisma.leadInterest.createMany({
    data: [...slugs].map((productSlug) => ({ leadId, productSlug })),
  });
}
