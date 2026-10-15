import { prisma } from "@/lib/db";
import { leadVisibilityWhere, accountVisibilityWhere } from "@/lib/permissions";
import { getScopedProductId } from "@/lib/scope";
import {
  canEditLead,
  canSeeBilling,
  canCloseDeal,
} from "@/lib/roles";
import type { Role } from "@/generated/prisma/client";
import { timingSafeEqual } from "crypto";
import { requireOrg, orgWhere } from "@/lib/tenant";

export type AuthUser = {
  id: string;
  role: Role;
  fullName: string;
  email?: string;
};

export function safeEqualString(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ba.length !== bb.length) return false;
  return timingSafeEqual(ba, bb);
}

export async function assertLeadAccess(
  user: AuthUser,
  leadId: string,
  opts?: { requireEdit?: boolean; requireClose?: boolean }
) {
  const orgId = await requireOrg();
  const productId = await getScopedProductId(user.role);
  const lead = await prisma.lead.findFirst({
    where: orgWhere(orgId, {
      id: leadId,
      ...leadVisibilityWhere(user.id, user.role, { productId }),
    }),
    include: { product: true },
  });
  if (!lead) throw new Error("Accès refusé");
  if (opts?.requireEdit && !canEditLead(user.role)) {
    throw new Error("Accès refusé");
  }
  if (opts?.requireClose && !canCloseDeal(user.role)) {
    throw new Error("Droit insuffisant pour closer");
  }
  return lead;
}

export async function assertAccountAccess(user: AuthUser, accountId: string) {
  const orgId = await requireOrg();
  const productId = await getScopedProductId(user.role);
  const account = await prisma.account.findFirst({
    where: orgWhere(orgId, {
      id: accountId,
      ...accountVisibilityWhere(user.id, user.role, { productId }),
    }),
  });
  if (!account) throw new Error("Accès refusé");
  if (!canSeeBilling(user.role) && user.role !== "APPORTEUR") {
    // apporteur peut voir account lié ; mutations billing déjà gated ailleurs
  }
  return account;
}

export async function assertOpportunityAccess(user: AuthUser, opportunityId: string) {
  if (!canSeeBilling(user.role)) throw new Error("Accès refusé");
  const orgId = await requireOrg();
  const productId = await getScopedProductId(user.role);
  const opp = await prisma.opportunity.findFirst({
    where: orgWhere(orgId, {
      id: opportunityId,
      OR: [
        {
          lead: leadVisibilityWhere(user.id, user.role, { productId }),
        },
        {
          account: accountVisibilityWhere(user.id, user.role, { productId }),
        },
      ],
    }),
    include: { lead: true, account: true },
  });
  if (!opp) throw new Error("Accès refusé");
  return opp;
}

// Legacy aliases for backward compatibility
export const assertClientAccess = assertAccountAccess;
export const assertDealLineAccess = assertOpportunityAccess;

export function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export const ROLES = [
  "ASSOCIE",
  "DIRECTION_VF",
  "DIRECTION_BOOKFLOW",
  "COMMERCIAL",
  "APPORTEUR",
  "ADMIN",
] as const;

export function parseRole(raw: string): Role {
  if ((ROLES as readonly string[]).includes(raw)) return raw as Role;
  throw new Error("Rôle invalide");
}
