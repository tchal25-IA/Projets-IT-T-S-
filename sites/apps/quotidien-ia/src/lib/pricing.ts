// Catalogue d'abonnement Quotidien IA
// Règles (cf. spec) :
//  - Abonnement plafonné à 9,99 €/mois.
//  - -10 % si annuel. 1 mois d'essai gratuit.
//  - Parrainage : 6 mois all-inclusive offerts via code, +2 mois par filleul inscrit.
//  - Finance & Finance + sont exclusifs. Vie admin & Vie admin + sont exclusifs.
//  - Finance + inclut la connexion automatique à Finzy.
//  - Vie admin + inclut la connexion automatique à Paperasse.

export type CategoryId =
  | "finance"
  | "finance_plus"
  | "productivite"
  | "evenements"
  | "voyage"
  | "contenu"
  | "vie_admin"
  | "vie_admin_plus";

export type CategoryGroup = "finance" | "productivite" | "evenements" | "voyage" | "contenu" | "vie_admin";

export type Category = {
  id: CategoryId;
  group: CategoryGroup;
  label: string;
  description: string;
  priceMonthly: number; // EUR / mois
  badge?: string;
  exclusiveWith?: CategoryId;
  /** Outils Lovable connectés automatiquement quand cette catégorie est cochée. */
  autoTools?: string[];
};

export const PRICING_CAP = 9.99;
export const ANNUAL_DISCOUNT = 0.1;
export const TRIAL_DAYS = 30;
export const REFERRAL_BONUS_MONTHS = 6;
export const REFERRER_BONUS_PER_REFERRAL = 2;

export const CATEGORIES: Category[] = [
  {
    id: "finance",
    group: "finance",
    label: "Finance & fiscalité",
    description: "Budget mensuel, projections 5 ans, simulateurs, objectifs d'épargne, fiscalité FR/CH.",
    priceMonthly: 3,
    exclusiveWith: "finance_plus",
  },
  {
    id: "finance_plus",
    group: "finance",
    label: "Option Finance +",
    description: "Tout Finance + connexion automatique à Finzy (compte inclus) pour vos comptes, crédits et projections.",
    priceMonthly: 5.99,
    badge: "Option +",
    exclusiveWith: "finance",
    autoTools: ["Finzy"],
  },
  {
    id: "productivite",
    group: "productivite",
    label: "Productivité & organisation",
    description: "Tâches, Kanban, Gantt, missions, ma semaine — toute votre organisation au même endroit.",
    priceMonthly: 2,
  },
  {
    id: "evenements",
    group: "evenements",
    label: "Événements",
    description: "Calendrier fluide, notes, pièces jointes et rappels pour le quotidien.",
    priceMonthly: 0,
    badge: "Inclus",
  },
  {
    id: "voyage",
    group: "voyage",
    label: "Voyage & déplacements",
    description: "Comparateur temps / coût pour vos trajets.",
    priceMonthly: 0,
    badge: "Inclus",
  },
  {
    id: "contenu",
    group: "contenu",
    label: "Contenu & connaissance",
    description: "Résumé, traduction, vérification de sources assistés par IA.",
    priceMonthly: 0,
    badge: "Inclus",
  },
  {
    id: "vie_admin",
    group: "vie_admin",
    label: "Vie admin & pro",
    description: "Checklists, modèles de courriers (attestation d'hébergement, etc.), rappels administratifs.",
    priceMonthly: 0,
    badge: "Inclus",
    exclusiveWith: "vie_admin_plus",
  },
  {
    id: "vie_admin_plus",
    group: "vie_admin",
    label: "Option Vie admin +",
    description: "Tout Vie admin + connexion automatique à Paperasse pour centraliser vos documents.",
    priceMonthly: 2,
    badge: "Option +",
    exclusiveWith: "vie_admin",
    autoTools: ["Paperasse"],
  },
];

export function computeMonthly(selected: CategoryId[]): number {
  const sum = CATEGORIES.filter((c) => selected.includes(c.id)).reduce((s, c) => s + c.priceMonthly, 0);
  return Math.min(sum, PRICING_CAP);
}

export function computeAnnualMonthly(selected: CategoryId[]): number {
  return computeMonthly(selected) * (1 - ANNUAL_DISCOUNT);
}

export function formatEUR(n: number): string {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(n);
}

/** Outils Lovable connectés automatiquement d'après l'abonnement. */
export function autoConnectedTools(selected: CategoryId[]): string[] {
  const set = new Set<string>();
  CATEGORIES.filter((c) => selected.includes(c.id)).forEach((c) => c.autoTools?.forEach((t) => set.add(t)));
  return Array.from(set);
}

export type PendingChange = {
  selected: CategoryId[];
  billing: "monthly" | "annual";
  /** Date d'effet au 1er du mois suivant (ISO). */
  effectiveAt: string;
};

export type Subscription = {
  selected: CategoryId[];
  billing: "monthly" | "annual";
  referralCode?: string;
  trialEndsAt: string;
  createdAt: string;
  /** Modification programmée, appliquée automatiquement au 1er du mois suivant. */
  pendingChange?: PendingChange;
};

export const LS_SUBSCRIPTION = "qia:subscription";
export const LS_ONBOARDED = "qia:onboarded";
export const LS_REFERRAL = "qia:referral";

/** Renvoie la date du 1er du mois suivant à 00:00 (ISO). */
export function nextFirstOfMonthISO(from: Date = new Date()): string {
  const d = new Date(from.getFullYear(), from.getMonth() + 1, 1, 0, 0, 0, 0);
  return d.toISOString();
}

/** Applique automatiquement une modification programmée si la date d'effet est atteinte. */
export function applyPendingIfDue(sub: Subscription | null): Subscription | null {
  if (!sub || !sub.pendingChange) return sub;
  if (new Date(sub.pendingChange.effectiveAt).getTime() <= Date.now()) {
    return {
      ...sub,
      selected: sub.pendingChange.selected,
      billing: sub.pendingChange.billing,
      pendingChange: undefined,
    };
  }
  return sub;
}

export type ReferralEntry = {
  code: string;
  name: string;
  signedUpAt: string;
};

export type ReferralState = {
  /** Code de parrainage à partager. */
  myCode: string;
  /** Liste des filleuls inscrits via mon code. */
  referrals: ReferralEntry[];
};

/** Génère un code de parrainage simple et lisible. */
export function generateReferralCode(seed?: string): string {
  const base = (seed ?? Math.random().toString(36)).replace(/[^A-Za-z0-9]/g, "").toUpperCase();
  const slug = (base.slice(0, 4) || "AMI").padEnd(4, "X");
  const num = Math.floor(1000 + Math.random() * 9000);
  return `${slug}${num}`;
}
