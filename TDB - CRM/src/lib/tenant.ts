/**
 * Tenant (Organization) helpers for multi-tenant CRM
 * All business queries MUST filter by organizationId
 */

import { auth } from "@/lib/auth";
import type { Session } from "next-auth";

/**
 * Get organization ID from current session
 * Throws if no valid session or organization
 */
export async function requireOrg(session?: Session | null): Promise<string> {
  const s = session ?? (await auth());
  if (!s?.user?.organizationId) {
    throw new Error("No organization context - user must be logged in with valid org");
  }
  return s.user.organizationId;
}

/**
 * Get organization ID from session, returns null if not available
 */
export async function getOrg(session?: Session | null): Promise<string | null> {
  const s = session ?? (await auth());
  return s?.user?.organizationId ?? null;
}

/**
 * Create a Prisma where filter for organization scoping
 * Use this as base filter for all multi-tenant queries
 */
export function orgFilter(organizationId: string) {
  return { organizationId };
}

/**
 * Combine org filter with additional where conditions
 */
export function orgWhere<T extends Record<string, unknown>>(
  organizationId: string,
  where?: T
): T & { organizationId: string } {
  return {
    ...where,
    organizationId,
  } as T & { organizationId: string };
}

/**
 * Ensure a record belongs to the current organization
 * Throws if record has different organizationId
 */
export function ensureOrgMatch(
  recordOrgId: string,
  currentOrgId: string,
  resourceName = "Resource"
): void {
  if (recordOrgId !== currentOrgId) {
    throw new Error(
      `${resourceName} does not belong to your organization (access denied)`
    );
  }
}

/**
 * Type-safe organization ID
 */
export type OrgId = string & { readonly __brand: "OrgId" };

/**
 * Create branded OrgId type (for extra type safety)
 */
export function createOrgId(id: string): OrgId {
  return id as OrgId;
}
