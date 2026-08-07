/** Options d'objectif pour le check-in et l'affichage profil. */

export type ObjectifOption = {
  value: string;
  label: "principal" | "secondaire" | "moyen_terme" | "long_terme";
};

function uniqPush(out: ObjectifOption[], seen: Set<string>, value: string, label: ObjectifOption["label"]) {
  const v = value.trim();
  if (!v) return;
  const key = v.toLowerCase();
  if (seen.has(key)) return;
  seen.add(key);
  out.push({ value: v, label });
}

/** Liste ordonnée : principal → secondaires → moyen → long (dédoublonnée). */
export function buildObjectifOptionsDetailed(profile: {
  objectif_principal?: string | null;
  objectif_moyen_terme?: string | null;
  objectif_long_terme?: string | null;
  objectifs_secondaires?: unknown;
} | null | undefined): ObjectifOption[] {
  if (!profile) return [];
  const secondaires = Array.isArray(profile.objectifs_secondaires)
    ? profile.objectifs_secondaires.filter((x): x is string => typeof x === "string" && x.trim().length > 0)
    : [];

  const seen = new Set<string>();
  const out: ObjectifOption[] = [];
  uniqPush(out, seen, profile.objectif_principal ?? "", "principal");
  for (const s of secondaires) uniqPush(out, seen, s, "secondaire");
  uniqPush(out, seen, profile.objectif_moyen_terme ?? "", "moyen_terme");
  uniqPush(out, seen, profile.objectif_long_terme ?? "", "long_terme");
  return out;
}

/** Compat : liste de strings (principal d'abord). */
export function buildObjectifOptions(profile: {
  objectif_principal?: string | null;
  objectif_moyen_terme?: string | null;
  objectif_long_terme?: string | null;
  objectifs_secondaires?: unknown;
} | null | undefined): string[] {
  return buildObjectifOptionsDetailed(profile).map((o) => o.value);
}

export const OBJECTIF_LABEL_FR: Record<ObjectifOption["label"], string> = {
  principal: "Objectif principal",
  secondaire: "Objectif secondaire",
  moyen_terme: "Moyen terme",
  long_terme: "Long terme",
};
