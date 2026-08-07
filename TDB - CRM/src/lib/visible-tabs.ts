import type { Role } from "@/generated/prisma/client";
import type { RecordTabId } from "@/lib/record-path";

export function visibleTabsForRole(role: Role): RecordTabId[] {
  if (role === "APPORTEUR") {
    return [
      "resume",
      "contact",
      "qualification",
      "activites",
      "acteurs",
      "commissions",
      "livraison",
      "historique",
    ];
  }
  return [
    "resume",
    "contact",
    "qualification",
    "activites",
    "acteurs",
    "prestations",
    "facturation",
    "commissions",
    "livraison",
    "historique",
  ];
}
