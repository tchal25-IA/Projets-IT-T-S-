import { prisma } from "@/lib/db";
import type { Role } from "@/generated/prisma/client";
import { productSlugForRole } from "@/lib/utils";
import { requireOrg, orgWhere } from "@/lib/tenant";

export async function getScopedProductId(role: Role): Promise<string | null> {
  const slug = productSlugForRole(role);
  if (!slug) return null;
  const orgId = await requireOrg();
  const product = await prisma.product.findFirst({ 
    where: orgWhere(orgId, { slug })
  });
  return product?.id ?? null;
}
