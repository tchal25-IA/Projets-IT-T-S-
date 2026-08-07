// Plan gates FusionFit — source unique pour features payantes
export type PlanId = "decouverte" | "initiative" | "elite";
export type AbonnementStatut = "essai" | "actif" | "expire" | "annule";

export const PLAN_ORDER: PlanId[] = ["decouverte", "initiative", "elite"];

export function planRank(plan: string | null | undefined): number {
  const idx = PLAN_ORDER.indexOf((plan as PlanId) ?? "decouverte");
  return idx < 0 ? 0 : idx;
}

export function hasActiveAccess(
  plan: string | null | undefined,
  statut: string | null | undefined,
): boolean {
  if (statut === "actif") return true;
  // Essai Découverte : accès limité
  if (statut === "essai" && (plan === "decouverte" || !plan)) return true;
  return false;
}

export type FeatureKey =
  | "ia_fatigue"
  | "creneaux_illimites"
  | "programme_coach"
  | "bilans_video"
  | "escouades_premium"
  | "suivi_prioritaire";

const FEATURE_MIN_PLAN: Record<FeatureKey, PlanId> = {
  programme_coach: "initiative",
  ia_fatigue: "initiative",
  creneaux_illimites: "initiative",
  suivi_prioritaire: "elite",
  bilans_video: "elite",
  escouades_premium: "elite",
};

/** Limite créneaux / mois hors plan Initiative+ */
export const CRENEAUX_FREE_MONTHLY_LIMIT = 2;

export function canAccessFeature(
  feature: FeatureKey,
  plan: string | null | undefined,
  statut: string | null | undefined,
): boolean {
  // Features payantes : uniquement abonnement actif (pas l'essai découverte)
  const required = FEATURE_MIN_PLAN[feature];
  if (planRank(required) > 0) {
    if (statut !== "actif") return false;
    return planRank(plan) >= planRank(required);
  }
  // Features de base : actif ou essai découverte
  return hasActiveAccess(plan, statut);
}

export function upgradeHint(feature: FeatureKey): string {
  const required = FEATURE_MIN_PLAN[feature];
  const labels: Record<PlanId, string> = {
    decouverte: "Découverte",
    initiative: "Initiative",
    elite: "Élite",
  };
  return `Disponible dès le plan ${labels[required]}.`;
}

export const STRIPE_PLAN_BY_PRICE_ENV: Record<string, PlanId> = {
  STRIPE_PRICE_INITIATIVE: "initiative",
  STRIPE_PRICE_ELITE: "elite",
};
