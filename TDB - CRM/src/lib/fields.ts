export type FieldDef = {
  key: string;
  label: string;
  type: "text" | "select" | "boolean" | "number" | "date" | "textarea";
  options?: string[];
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
  { key: "formuleMaintenance", label: "Formule maintenance", type: "text" },
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
  { key: "planCible", label: "Offre / plan cible", type: "text" },
  { key: "demoEffectuee", label: "Essai / démo effectuée", type: "boolean" },
  { key: "goLive", label: "Date de go-live", type: "date" },
];
