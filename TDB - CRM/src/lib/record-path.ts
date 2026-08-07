import type { LeadStatus } from "@/generated/prisma/client";

/** Ordre du parcours commercial (Sales Path Salesforce). */
export const PATH_ORDER: LeadStatus[] = [
  "NOUVEAU",
  "CONTACTE",
  "QUALIFIE",
  "RDV_PLANIFIE",
  "PROPOSITION",
  "CLOSE",
];

export type RecordTabId =
  | "resume"
  | "contact"
  | "qualification"
  | "acteurs"
  | "activites"
  | "prestations"
  | "facturation"
  | "commissions"
  | "livraison"
  | "historique";

export type RecordTabDef = {
  id: RecordTabId;
  label: string;
  /** Statut lead minimum pour débloquer (CLOSE pour onglets client). */
  unlockAt: LeadStatus | "CLIENT";
  description: string;
};

/** Onglets de la fiche unique Lead → Client (format dès le départ). */
export const RECORD_TABS: RecordTabDef[] = [
  {
    id: "resume",
    label: "Résumé",
    unlockAt: "NOUVEAU",
    description: "Vue d'ensemble et parcours",
  },
  {
    id: "contact",
    label: "Contact",
    unlockAt: "NOUVEAU",
    description: "Identité entreprise & contact",
  },
  {
    id: "qualification",
    label: "Qualification",
    unlockAt: "NOUVEAU",
    description: "Champs produits du catalogue",
  },
  {
    id: "activites",
    label: "Activités",
    unlockAt: "CONTACTE",
    description: "Appels, notes, RDV, relances",
  },
  {
    id: "acteurs",
    label: "Acteurs",
    unlockAt: "QUALIFIE",
    description: "Apporteur, commercial, responsabilités",
  },
  {
    id: "prestations",
    label: "Prestations",
    unlockAt: "PROPOSITION",
    description: "Lignes de devis / services",
  },
  {
    id: "facturation",
    label: "Facturation",
    unlockAt: "CLOSE",
    description: "Statuts devis → payé",
  },
  {
    id: "commissions",
    label: "Commissions",
    unlockAt: "CLOSE",
    description: "Rémunération apporteur & commercial",
  },
  {
    id: "livraison",
    label: "Livraison",
    unlockAt: "CLOSE",
    description: "Suivi client post-signature",
  },
  {
    id: "historique",
    label: "Historique",
    unlockAt: "NOUVEAU",
    description: "Audit des modifications de champs",
  },
];

export function statusRank(status: LeadStatus): number {
  if (status === "PERDU") return -1;
  const i = PATH_ORDER.indexOf(status);
  return i >= 0 ? i : 0;
}

export function unlockRank(unlockAt: LeadStatus | "CLIENT"): number {
  if (unlockAt === "CLIENT") return PATH_ORDER.indexOf("CLOSE");
  return statusRank(unlockAt);
}

export function isTabUnlocked(
  tab: RecordTabDef,
  leadStatus: LeadStatus,
  hasClient: boolean
): boolean {
  if (leadStatus === "PERDU") {
    return tab.id === "resume" || tab.id === "contact" || tab.id === "activites";
  }
  const current = statusRank(leadStatus);
  const needed = unlockRank(tab.unlockAt);
  if (tab.unlockAt === "CLOSE" || tab.unlockAt === "CLIENT") {
    return hasClient || leadStatus === "CLOSE";
  }
  return current >= needed;
}

export function pathProgress(status: LeadStatus): {
  steps: { status: LeadStatus; label: string; state: "done" | "current" | "todo" | "lost" }[];
  percent: number;
} {
  if (status === "PERDU") {
    return {
      steps: PATH_ORDER.map((s) => ({
        status: s,
        label: s,
        state: "lost" as const,
      })),
      percent: 0,
    };
  }
  const current = statusRank(status);
  const steps = PATH_ORDER.map((s, i) => ({
    status: s,
    label: s,
    state: (i < current ? "done" : i === current ? "current" : "todo") as
      | "done"
      | "current"
      | "todo",
  }));
  const percent = Math.round((current / (PATH_ORDER.length - 1)) * 100);
  return { steps, percent };
}
