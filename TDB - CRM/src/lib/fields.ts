export type FieldDef = {
  key: string;
  label: string;
  type: "text" | "select" | "boolean" | "number" | "date" | "textarea";
  options?: string[];
  /** Si "offerings", les options viennent de ProductOffering (catalogue Paramètres). */
  optionsFrom?: "offerings" | null;
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
    label: "Formule / prestation",
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
    label: "Offre / abonnement",
    type: "select",
    optionsFrom: "offerings",
  },
  { key: "demoEffectuee", label: "Essai / démo effectuée", type: "boolean" },
  { key: "goLive", label: "Date de go-live", type: "date" },
];

export function enrichFieldsWithOfferings(
  fields: FieldDef[],
  offeringNames: string[]
): FieldDef[] {
  return fields.map((f) => {
    if (f.optionsFrom === "offerings") {
      return {
        ...f,
        type: "select",
        options: offeringNames.length
          ? offeringNames
          : f.options ?? [],
      };
    }
    return f;
  });
}

export function parseFieldSchema(raw: unknown): FieldDef[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter(
    (f): f is FieldDef =>
      Boolean(f) &&
      typeof f === "object" &&
      typeof (f as FieldDef).key === "string" &&
      typeof (f as FieldDef).label === "string" &&
      typeof (f as FieldDef).type === "string"
  );
}
