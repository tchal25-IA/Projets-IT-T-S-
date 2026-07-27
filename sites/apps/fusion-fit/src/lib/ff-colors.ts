// Constantes de design FusionFit — source unique de vérité
// Usage : import { FF } from "@/lib/ff-colors"
// En CSS inline : style={{ color: FF.cyan }}

export const FF = {
  bg:          "var(--ff-bg)",
  surface:     "var(--ff-surface)",
  surface2:    "var(--ff-surface-2)",
  border:      "var(--ff-border)",
  text:        "var(--ff-text)",
  textMuted:   "var(--ff-text-muted)",
  cyan:        "var(--ff-cyan)",
  cyanDim:     "var(--ff-cyan-dim)",
  amber:       "var(--ff-amber)",
  red:         "var(--ff-red)",
  green:       "var(--ff-green)",
  glowCyan:    "var(--ff-glow-cyan)",
  glowAmber:   "var(--ff-glow-amber)",

  // Backgrounds tintés (pour badges, blocs actifs…)
  cyanBg:   "oklch(0.78 0.16 198 / 15%)",
  cyanBg20: "oklch(0.78 0.16 198 / 20%)",
  amberBg:  "oklch(0.78 0.18 55  / 15%)",
  greenBg:  "oklch(0.68 0.16 155 / 15%)",
  redBg:    "oklch(0.65 0.20 22  / 12%)",
} as const;

export type PilierKey = "Bouger" | "Respirer" | "Nourrir";

export const PILIER_COLORS: Record<PilierKey, { bg: string; text: string; border: string }> = {
  Bouger:   { bg: FF.cyanBg,  text: FF.cyan,  border: FF.cyan  },
  Respirer: { bg: FF.greenBg, text: FF.green, border: FF.green },
  Nourrir:  { bg: FF.amberBg, text: FF.amber, border: FF.amber },
};

// Métadonnées des plans d'abonnement (source unique, réutilisée profil abonné + coach)
export const ABONNEMENT_PLANS: Record<string, { nom: string; prix: string; couleur: string }> = {
  decouverte: { nom: "Découverte", prix: "Gratuit", couleur: FF.cyan },
  initiative: { nom: "Initiative", prix: "29€/mois", couleur: FF.amber },
  elite:      { nom: "Élite",      prix: "59€/mois", couleur: "oklch(0.80 0.20 300)" },
};

export const ABONNEMENT_STATUTS: Record<string, { label: string; couleur: string }> = {
  essai:  { label: "Essai",   couleur: FF.cyan },
  actif:  { label: "Actif",   couleur: FF.green },
  expire: { label: "Expiré",  couleur: FF.red },
  annule: { label: "Annulé",  couleur: FF.textMuted },
};
