/**
 * NetFrontalier — Tax & social contributions estimation engine
 *
 * MVP scope: French cross-border workers (frontaliers) with Permis G
 * employed in Switzerland (cantons: GE, VD, VS).
 *
 * ⚠️ Barèmes simplifiés MVP — à calibrer avec sources officielles :
 *   - AVS/AI/APG salarié : 5.3% (2025)
 *   - AC (assurance chômage) : 1.1% jusqu'à CHF 148'200/an
 *   - LPP (2e pilier) : approximation moyenne 7% part salarié
 *   - AANP (accident non-pro) : ~1.4% part salarié (varie par employeur)
 *   - APG maternité + divers : ~0.5%
 *   - Impôt à la source : barèmes cantonaux frontalier simplifiés progressifs
 *
 * Sources à intégrer en v2 :
 *   - AFC : https://www.estv.admin.ch
 *   - AVS : https://www.ahv-iv.ch
 *   - Barèmes ISS GE : https://www.ge.ch/impot-source
 *   - Barèmes ISS VD : https://www.vd.ch
 *   - Barèmes ISS VS : https://www.vs.ch
 */

export type Canton = "GE" | "VD" | "VS";
export type Situation = "celibataire" | "marie";

export interface CalcInput {
  brutMensuelCHF: number;
  canton: Canton;
  commune: string;
  situation: Situation;
  enfants: number; // 0..4
  tempsPartielPct: number; // 50..100
  tauxChange: number; // CHF -> EUR
}

export interface CalcBreakdown {
  brutMensuel: number;
  brutAnnuel: number;
  cotisations: {
    avs: number; // AVS/AI/APG
    ac: number; // Chômage
    aanp: number; // Accident non pro
    lpp: number; // 2e pilier estimé
    total: number;
  };
  impotSourceMensuel: number;
  impotSourceAnnuel: number;
  netCHFMensuel: number;
  netCHFAnnuel: number;
  netEURMensuel: number;
  netEURAnnuel: number;
  tauxImposition: number; // effectif %
  tauxPrelevementTotal: number; // cotis + impôt
}

// --- Cotisations sociales suisses (salarié) ---
const TAUX_AVS = 0.053;
const TAUX_AC = 0.011;
const PLAFOND_AC_ANNUEL = 148_200;
const TAUX_AANP = 0.014;
const TAUX_LPP_APPROX = 0.07; // moyenne, dépend de l'âge — approximation MVP

function cotisationsMensuelles(brutMensuel: number) {
  const brutAnnuel = brutMensuel * 12;
  const avs = brutMensuel * TAUX_AVS;
  const acAssiette = Math.min(brutAnnuel, PLAFOND_AC_ANNUEL) / 12;
  const ac = acAssiette * TAUX_AC;
  const aanp = brutMensuel * TAUX_AANP;
  const lpp = brutMensuel * TAUX_LPP_APPROX;
  const total = avs + ac + aanp + lpp;
  return { avs, ac, aanp, lpp, total };
}

// --- Impôt à la source — barèmes simplifiés frontalier ---
// Tables progressives par tranches de revenu annuel imposable (après cotisations sociales).
// Valeurs indicatives calibrées grossièrement sur barèmes 2024/2025.
type Bareme = { seuil: number; taux: number }[];

const BAREME_GE_CELIB: Bareme = [
  { seuil: 30000, taux: 0.045 },
  { seuil: 60000, taux: 0.095 },
  { seuil: 90000, taux: 0.135 },
  { seuil: 130000, taux: 0.17 },
  { seuil: 180000, taux: 0.2 },
  { seuil: Infinity, taux: 0.225 },
];

const BAREME_GE_MARIE: Bareme = [
  { seuil: 40000, taux: 0.025 },
  { seuil: 80000, taux: 0.065 },
  { seuil: 120000, taux: 0.1 },
  { seuil: 170000, taux: 0.135 },
  { seuil: 230000, taux: 0.17 },
  { seuil: Infinity, taux: 0.2 },
];

const BAREME_VD_CELIB: Bareme = [
  { seuil: 30000, taux: 0.04 },
  { seuil: 60000, taux: 0.085 },
  { seuil: 90000, taux: 0.125 },
  { seuil: 130000, taux: 0.16 },
  { seuil: 180000, taux: 0.19 },
  { seuil: Infinity, taux: 0.215 },
];

const BAREME_VD_MARIE: Bareme = [
  { seuil: 40000, taux: 0.022 },
  { seuil: 80000, taux: 0.06 },
  { seuil: 120000, taux: 0.095 },
  { seuil: 170000, taux: 0.13 },
  { seuil: 230000, taux: 0.16 },
  { seuil: Infinity, taux: 0.19 },
];

const BAREME_VS_CELIB: Bareme = [
  { seuil: 30000, taux: 0.038 },
  { seuil: 60000, taux: 0.08 },
  { seuil: 90000, taux: 0.115 },
  { seuil: 130000, taux: 0.145 },
  { seuil: 180000, taux: 0.175 },
  { seuil: Infinity, taux: 0.2 },
];

const BAREME_VS_MARIE: Bareme = [
  { seuil: 40000, taux: 0.02 },
  { seuil: 80000, taux: 0.055 },
  { seuil: 120000, taux: 0.09 },
  { seuil: 170000, taux: 0.12 },
  { seuil: 230000, taux: 0.15 },
  { seuil: Infinity, taux: 0.18 },
];

function selectBareme(canton: Canton, situation: Situation): Bareme {
  if (canton === "GE") return situation === "marie" ? BAREME_GE_MARIE : BAREME_GE_CELIB;
  if (canton === "VD") return situation === "marie" ? BAREME_VD_MARIE : BAREME_VD_CELIB;
  return situation === "marie" ? BAREME_VS_MARIE : BAREME_VS_CELIB;
}

/** Réduction par enfant à charge — approximation MVP */
function reductionEnfants(enfants: number): number {
  // Réduction en points de taux (approx : -0.4 pt par enfant)
  return Math.min(enfants, 4) * 0.004;
}

function tauxImpot(revenuAnnuelImposable: number, bareme: Bareme): number {
  for (const tranche of bareme) {
    if (revenuAnnuelImposable <= tranche.seuil) return tranche.taux;
  }
  return bareme[bareme.length - 1].taux;
}

export function calculer(input: CalcInput): CalcBreakdown {
  const facteurTempsPartiel = Math.max(50, Math.min(100, input.tempsPartielPct)) / 100;
  const brutMensuel = Math.max(0, input.brutMensuelCHF) * facteurTempsPartiel;
  const brutAnnuel = brutMensuel * 12;

  const cotisations = cotisationsMensuelles(brutMensuel);

  const revenuImposableAnnuel = brutAnnuel - cotisations.total * 12;
  const bareme = selectBareme(input.canton, input.situation);
  const tauxBase = tauxImpot(revenuImposableAnnuel, bareme);
  const taux = Math.max(0, tauxBase - reductionEnfants(input.enfants));

  const impotSourceMensuel = (revenuImposableAnnuel / 12) * taux;
  const impotSourceAnnuel = impotSourceMensuel * 12;

  const netCHFMensuel = brutMensuel - cotisations.total - impotSourceMensuel;
  const netCHFAnnuel = netCHFMensuel * 12;

  const taux_change = input.tauxChange > 0 ? input.tauxChange : 0.95;
  const netEURMensuel = netCHFMensuel * taux_change;
  const netEURAnnuel = netEURMensuel * 12;

  const tauxImposition = brutMensuel > 0 ? impotSourceMensuel / brutMensuel : 0;
  const tauxPrelevementTotal =
    brutMensuel > 0 ? (cotisations.total + impotSourceMensuel) / brutMensuel : 0;

  return {
    brutMensuel,
    brutAnnuel,
    cotisations,
    impotSourceMensuel,
    impotSourceAnnuel,
    netCHFMensuel,
    netCHFAnnuel,
    netEURMensuel,
    netEURAnnuel,
    tauxImposition,
    tauxPrelevementTotal,
  };
}

export const COMMUNES: Record<Canton, string[]> = {
  GE: [
    "Genève (ville)",
    "Carouge",
    "Meyrin",
    "Vernier",
    "Lancy",
    "Onex",
    "Thônex",
    "Autre / moyenne cantonale",
  ],
  VD: [
    "Lausanne",
    "Nyon",
    "Morges",
    "Yverdon-les-Bains",
    "Vevey",
    "Renens",
    "Rolle",
    "Autre / moyenne cantonale",
  ],
  VS: [
    "Sion",
    "Martigny",
    "Monthey",
    "Sierre",
    "Brigue",
    "Viège",
    "Saint-Maurice",
    "Autre / moyenne cantonale",
  ],
};

export const CANTON_LABEL: Record<Canton, string> = {
  GE: "Genève (GE)",
  VD: "Vaud (VD)",
  VS: "Valais (VS)",
};

export function formatCHF(n: number): string {
  return new Intl.NumberFormat("fr-CH", {
    style: "currency",
    currency: "CHF",
    maximumFractionDigits: 0,
  }).format(n);
}

export function formatEUR(n: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(n);
}

export function formatPct(n: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "percent",
    maximumFractionDigits: 1,
  }).format(n);
}
