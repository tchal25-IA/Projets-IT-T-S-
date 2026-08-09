import type { Role, Prisma } from "@/generated/prisma/client";
import { isDirection, isFullAccess } from "@/lib/roles";

export function leadVisibilityWhere(
  userId: string,
  role: Role,
  options?: { productId?: string | null }
): Prisma.LeadWhereInput {
  switch (role) {
    case "ASSOCIE":
    case "ADMIN":
      return {};
    case "DIRECTION_VF":
    case "DIRECTION_BOOKFLOW":
      return options?.productId
        ? { productId: options.productId }
        : { id: "__none__" };
    case "COMMERCIAL":
      return { commercialId: userId };
    case "APPORTEUR":
      return { apporteurId: userId };
    default:
      return { id: "__none__" };
  }
}

export function clientVisibilityWhere(
  userId: string,
  role: Role,
  options?: { productId?: string | null }
): Prisma.ClientWhereInput {
  if (isFullAccess(role)) return {};

  if (role === "DIRECTION_VF" || role === "DIRECTION_BOOKFLOW") {
    return options?.productId
      ? { leads: { some: { productId: options.productId } } }
      : { id: "__none__" };
  }

  if (role === "COMMERCIAL") {
    return { leads: { some: { commercialId: userId } } };
  }

  if (role === "APPORTEUR") {
    return { leads: { some: { apporteurId: userId } } };
  }

  return { id: "__none__" };
}

export function navForRole(role: Role) {
  if (role === "APPORTEUR") {
    return [
      { href: "/dashboard", label: "Mon tableau de bord" },
      { href: "/leads", label: "Mes leads" },
      { href: "/taches", label: "Mes tâches" },
      { href: "/clients", label: "Mes clients" },
    ];
  }

  const base = [
    { href: "/dashboard", label: "Tableau de bord" },
    { href: "/leads", label: "Leads" },
    { href: "/taches", label: "Tâches" },
  ];

  if (role === "COMMERCIAL" || isDirection(role)) {
    base.push({ href: "/pipeline", label: "Pipeline" });
    base.push({ href: "/appels", label: "File d'appels" });
    base.push({ href: "/clients", label: "Clients" });
    base.push({ href: "/facturation", label: "Facturation" });
  }

  if (isDirection(role)) {
    base.push({ href: "/stats", label: "Statistiques" });
  }

  if (isFullAccess(role)) {
    base.push({ href: "/import", label: "Import" });
    base.push({ href: "/admin/parametres", label: "Paramètres" });
    base.push({ href: "/admin/users", label: "Utilisateurs" });
    base.push({ href: "/admin/quotas", label: "Objectifs" });
  }

  return base;
}
