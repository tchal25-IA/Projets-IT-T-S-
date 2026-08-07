import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import type {
  LeadStatus,
  Role,
  BillingStatus,
  ClientStatus,
  CommissionStatus,
} from "@/generated/prisma/client";

export { type FieldDef, VITRINEFLASH_FIELDS, BOOKFLOW_FIELDS, enrichFieldsWithOfferings, parseFieldSchema } from "@/lib/fields";
export { productBlock, fieldsForProduct, formPrefixForSlug } from "@/lib/custom-data";
export {
  isFullAccess,
  isDirection,
  isProductDirection,
  canManageUsers,
  canCloseDeal,
  canSeeBilling,
  canSeeMargins,
  canSeeCommissions,
  canEditLead,
} from "@/lib/roles";
export { PRODUCT_SLUGS, productSlugForRole } from "@/lib/products";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const ROLE_LABELS: Record<Role, string> = {
  ASSOCIE: "Associé",
  DIRECTION_VF: "Direction VitrineFlash",
  DIRECTION_BOOKFLOW: "Direction Bookflow",
  COMMERCIAL: "Commercial",
  APPORTEUR: "Apporteur d'affaires",
  ADMIN: "Admin",
};

export const STATUS_LABELS: Record<LeadStatus, string> = {
  NOUVEAU: "Nouveau",
  CONTACTE: "Contacté",
  QUALIFIE: "Qualifié",
  RDV_PLANIFIE: "RDV planifié",
  PROPOSITION: "Proposition",
  CLOSE: "Closé",
  PERDU: "Perdu",
};

export const PIPELINE_STATUSES: LeadStatus[] = [
  "NOUVEAU",
  "CONTACTE",
  "QUALIFIE",
  "RDV_PLANIFIE",
  "PROPOSITION",
  "CLOSE",
  "PERDU",
];

export const OPEN_STATUSES: LeadStatus[] = [
  "NOUVEAU",
  "CONTACTE",
  "QUALIFIE",
  "RDV_PLANIFIE",
  "PROPOSITION",
];

export const CALL_QUEUE_STATUSES: LeadStatus[] = [
  "NOUVEAU",
  "CONTACTE",
  "QUALIFIE",
  "RDV_PLANIFIE",
];

export const BILLING_LABELS: Record<BillingStatus, string> = {
  DEVIS: "Devis",
  A_FACTURER: "À facturer",
  FACTURE: "Facturé",
  PAYE: "Payé",
};

export const CLIENT_STATUS_LABELS: Record<ClientStatus, string> = {
  EN_LIVRAISON: "En livraison",
  ACTIF: "Actif",
  MAINTENANCE: "Maintenance",
};

export const COMMISSION_STATUS_LABELS: Record<CommissionStatus, string> = {
  CALCULEE: "Calculée",
  A_VERSER: "À verser",
  VERSEE: "Versée",
};

export const COMMISSION_RATES = {
  APPORTEUR: 10,
  COMMERCIAL: 15,
} as const;

export function formatEuro(value: number | null | undefined) {
  const n = value ?? 0;
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(n);
}

export function formatDate(value: Date | string | null | undefined) {
  if (!value) return "—";
  const d = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(d);
}

export function formatDateTime(value: Date | string | null | undefined) {
  if (!value) return "—";
  const d = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

export function normalizeWebsite(raw: string): string | null {
  const s = raw.trim().toLowerCase();
  if (!s) return null;
  return s
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/\/$/, "");
}

export function normalizeEmail(raw: string): string | null {
  const s = raw.trim().toLowerCase();
  return s.includes("@") ? s : null;
}
