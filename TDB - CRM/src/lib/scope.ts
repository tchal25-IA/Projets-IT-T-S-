import { prisma } from "@/lib/db";
import type { Role } from "@/generated/prisma/client";
import { productSlugForRole } from "@/lib/utils";

export async function getScopedProductId(role: Role): Promise<string | null> {
  const slug = productSlugForRole(role);
  if (!slug) return null;
  const product = await prisma.product.findUnique({ where: { slug } });
  return product?.id ?? null;
}
