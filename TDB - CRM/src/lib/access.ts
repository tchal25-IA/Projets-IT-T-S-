import { prisma } from "@/lib/db";
import { leadVisibilityWhere, clientVisibilityWhere } from "@/lib/permissions";
import { getScopedProductId } from "@/lib/scope";
import {
  canEditLead,
  canSeeBilling,
  canCloseDeal,
} from "@/lib/roles";
import type { Role } from "@/generated/prisma/client";
import { timingSafeEqual } from "crypto";

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
  const productId = await getScopedProductId(user.role);
  const lead = await prisma.lead.findFirst({
    where: {
      id: leadId,
      ...leadVisibilityWhere(user.id, user.role, { productId }),
    },
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

export async function assertClientAccess(user: AuthUser, clientId: string) {
  const productId = await getScopedProductId(user.role);
  const client = await prisma.client.findFirst({
    where: {
      id: clientId,
      ...clientVisibilityWhere(user.id, user.role, { productId }),
    },
  });
  if (!client) throw new Error("Accès refusé");
  if (!canSeeBilling(user.role) && user.role !== "APPORTEUR") {
    // apporteur peut voir client lié ; mutations billing déjà gated ailleurs
  }
  return client;
}

export async function assertDealLineAccess(user: AuthUser, dealLineId: string) {
  if (!canSeeBilling(user.role)) throw new Error("Accès refusé");
  const productId = await getScopedProductId(user.role);
  const line = await prisma.dealLine.findFirst({
    where: {
      id: dealLineId,
      OR: [
        {
          lead: leadVisibilityWhere(user.id, user.role, { productId }),
        },
        {
          client: clientVisibilityWhere(user.id, user.role, { productId }),
        },
      ],
    },
    include: { lead: true, client: true },
  });
  if (!line) throw new Error("Accès refusé");
  return line;
}

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
