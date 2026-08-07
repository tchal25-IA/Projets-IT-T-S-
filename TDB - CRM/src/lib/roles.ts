import type { Role } from "@/generated/prisma/client";

export function isFullAccess(role: Role) {
  return role === "ASSOCIE" || role === "ADMIN";
}

export function isDirection(role: Role) {
  return (
    role === "DIRECTION_VF" ||
    role === "DIRECTION_BOOKFLOW" ||
    isFullAccess(role)
  );
}

export function isProductDirection(role: Role) {
  return role === "DIRECTION_VF" || role === "DIRECTION_BOOKFLOW";
}

export function canManageUsers(role: Role) {
  return isFullAccess(role);
}

export function canCloseDeal(role: Role) {
  return isDirection(role) || role === "COMMERCIAL";
}

export function canSeeBilling(role: Role) {
  return isDirection(role) || role === "COMMERCIAL";
}

export function canSeeMargins(role: Role) {
  return isDirection(role);
}

export function canSeeCommissions(role: Role) {
  return isDirection(role) || role === "APPORTEUR" || role === "COMMERCIAL";
}

export function canEditLead(role: Role) {
  return role !== "APPORTEUR";
}
