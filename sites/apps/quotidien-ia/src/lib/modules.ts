import {
  LayoutDashboard,
  Wallet,
  ListChecks,
  CalendarDays,
  Plane,
  BookOpen,
  Briefcase,
  FolderCog,
  Wrench,
  Settings,
  Gift,
  FileText,
  type LucideIcon,
} from "lucide-react";


export type ModuleDef = {
  to: string;
  label: string;
  short: string;
  icon: LucideIcon;
  description: string;
  status: "ready" | "minimal" | "soon";
};

export const MODULES: ModuleDef[] = [
  {
    to: "/finance",
    label: "Finance & fiscalité",
    short: "Finance",
    icon: Wallet,
    description: "Budget, crédits, immo, épargne, fiscalité FR/CH.",
    status: "ready",
  },
  {
    to: "/productivite",
    label: "Productivité & organisation",
    short: "Productivité",
    icon: ListChecks,
    description: "Tâches, objectifs, planification.",
    status: "ready",
  },
  {
    to: "/evenements",
    label: "Événements & conférences",
    short: "Événements",
    icon: CalendarDays,
    description: "Préparation, checklist, notes, rappels.",
    status: "ready",
  },
  {
    to: "/voyage",
    label: "Voyage & déplacements",
    short: "Voyage",
    icon: Plane,
    description: "Comparaison temps/coût (P1).",
    status: "minimal",
  },
  {
    to: "/contenu",
    label: "Contenu & connaissance",
    short: "Contenu",
    icon: BookOpen,
    description: "Résumé, traduction, vérification.",
    status: "ready",
  },
  {
    to: "/business",
    label: "Business & création",
    short: "Business",
    icon: Briefcase,
    description: "Offre, pricing, pitch.",
    status: "minimal",
  },
  {
    to: "/vie-admin",
    label: "Vie admin & pro",
    short: "Vie admin",
    icon: FolderCog,
    description: "Checklists, modèles, rappels.",
    status: "minimal",
  },
];

export const TOP_NAV = [
  { to: "/", label: "Accueil", icon: LayoutDashboard },
  ...MODULES.map((m) => ({ to: m.to, label: m.short, icon: m.icon })),
  { to: "/paperasse", label: "Paperasse", icon: FileText },
  { to: "/mes-outils", label: "Mes outils", icon: Wrench },
  { to: "/parrainage", label: "Parrainage", icon: Gift },
  { to: "/parametres", label: "Paramètres", icon: Settings },
] as const;

export const EXTERNAL_TOOLS: Array<{
  name: string;
  url: string;
  description: string;
  tag: string;
  internal?: boolean;
  /** Si défini, l'outil n'apparaît que lorsque l'utilisateur a souscrit à une de ces options. */
  requiresCategory?: string[];
  /** Si défini, l'outil n'apparaît que pour ce pays de travail (profil). */
  requiresCountry?: "FR" | "CH";
}> = [
  {
    name: "Budget Prévisionnel",
    url: "/finance/budget-previsionnel",
    description: "Tableau de bord éditable : revenus, charges, épargne, projections 5 ans.",
    tag: "Budget",
    internal: true,
  },
  {
    name: "Finzy",
    url: "https://finzy-v3.lovable.app",
    description: "Finances perso, immo, crédits, projections — connexion automatique avec Finance +.",
    tag: "Finance",
    requiresCategory: ["finance_plus"],
  },
  {
    name: "Investlocatif",
    url: "https://investlocatif.lovable.app",
    description: "Investissement locatif, quittances.",
    tag: "Immobilier",
  },
  {
    name: "Impôt CH",
    url: "https://impot-ch.lovable.app",
    description: "Fiscalité Genève / Suisse (indicatif).",
    tag: "Fiscalité",
    requiresCountry: "CH",
  },
  {
    name: "Paperasse",
    url: "/paperasse",
    description: "9 agents IA spécialisés (fiscaliste, comptable, notaire, syndic…) — intégrés nativement.",
    tag: "Admin",
    internal: true,
  },
  {
    name: "TaskFlow",
    url: "/productivite",
    description: "Gestion de tâches et projets intégrée — Kanban, Gantt, échéances.",
    tag: "Productivité",
    internal: true,
  },
];


export const OFFICIAL_SOURCES: Array<{ label: string; url: string; country?: "FR" | "CH" }> = [
  { label: "Impôts (France)", url: "https://www.impots.gouv.fr/", country: "FR" },
  { label: "Service Public (France)", url: "https://www.service-public.fr/", country: "FR" },
  { label: "Calculateur fiscal AFC (Suisse)", url: "https://swisstaxcalculator.estv.admin.ch/#/home/", country: "CH" },
  { label: "Impôt à la source — Genève", url: "https://www.ge.ch/impot-source", country: "CH" },
];
