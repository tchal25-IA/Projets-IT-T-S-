import type { Role } from "@/generated/prisma/client";

export const PRODUCT_SLUGS = {
  VITRINEFLASH: "vitrineflash",
  BOOKFLOW: "bookflow",
} as const;

export type ProductSlug = (typeof PRODUCT_SLUGS)[keyof typeof PRODUCT_SLUGS];

export function productSlugForRole(role: Role): string | null {
  if (role === "DIRECTION_VF") return PRODUCT_SLUGS.VITRINEFLASH;
  if (role === "DIRECTION_BOOKFLOW") return PRODUCT_SLUGS.BOOKFLOW;
  return null;
}
