export type FieldDef = {
  key: string;
  label: string;
  type: "text" | "select" | "boolean" | "number" | "date" | "textarea";
  options?: string[];
  /** Si "offerings", les options viennent des ProductOffering actifs du produit. */
  optionsFrom?: "offerings";
  required?: boolean;
};

export const VITRINEFLASH_FIELDS: FieldDef[] = [
  {
    key: "besoin",
    label: "Type de besoin",
    type: "select",
    options: ["Création", "Reprise", "Modification"],
    required: true,
  },
  { key: "urlActuelle", label: "URL actuelle", type: "text" },
  { key: "cms", label: "CMS / techno", type: "text" },
  { key: "budget", label: "Budget indicatif (€)", type: "number" },
  { key: "maintenance", label: "Avec maintenance", type: "boolean" },
  {
    key: "formuleMaintenance",
    label: "Formule maintenance",
    type: "select",
    optionsFrom: "offerings",
  },
  { key: "pages", label: "Pages / fonctionnalités", type: "textarea" },
  { key: "deadline", label: "Deadline souhaitée", type: "date" },
  { key: "hebergement", label: "Hébergement / domaine", type: "text" },
];

export const BOOKFLOW_FIELDS: FieldDef[] = [
  {
    key: "casUsage",
    label: "Cas d'usage",
    type: "select",
    options: ["Coach", "Salon", "Freelance", "Cabinet", "Autre"],
  },
  { key: "volumeRdv", label: "Volume RDV / mois", type: "number" },
  { key: "integrations", label: "Intégrations souhaitées", type: "textarea" },
  {
    key: "planCible",
    label: "Offre / plan cible",
    type: "select",
    optionsFrom: "offerings",
  },
  { key: "demoEffectuee", label: "Essai / démo effectuée", type: "boolean" },
  { key: "goLive", label: "Date de go-live", type: "date" },
];

export const FIELD_TYPES: FieldDef["type"][] = [
  "text",
  "select",
  "boolean",
  "number",
  "date",
  "textarea",
];

export function parseFieldSchema(raw: unknown): FieldDef[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const f = item as Record<string, unknown>;
      const key = String(f.key || "").trim();
      const label = String(f.label || "").trim();
      const type = String(f.type || "text") as FieldDef["type"];
      if (!key || !label || !FIELD_TYPES.includes(type)) return null;
      const def: FieldDef = { key, label, type };
      if (Array.isArray(f.options)) {
        def.options = f.options.map(String).filter(Boolean);
      }
      if (f.optionsFrom === "offerings") def.optionsFrom = "offerings";
      if (f.required === true) def.required = true;
      return def;
    })
    .filter(Boolean) as FieldDef[];
}

/** Injecte les noms d'offerings dans les champs optionsFrom=offerings. */
export function withOfferingOptions(
  fields: FieldDef[],
  offeringNames: string[]
): FieldDef[] {
  return fields.map((f) => {
    if (f.optionsFrom !== "offerings") return f;
    return {
      ...f,
      type: "select" as const,
      options: offeringNames.length ? offeringNames : f.options ?? [],
    };
  });
}
