import type { CategoryId } from "./pricing";

// Applications externes (projets Lovable séparés) connectées en SSO depuis Quotidien IA.
// Le droit d'accès découle de l'abonnement : l'option « + » correspondante débloque l'app
// (bundle unique — aucune facturation côté Finzy / Paperasse).

export type ConnectedAppKey = "finzy" | "paperasse";

export type ConnectedApp = {
  key: ConnectedAppKey;
  label: string;
  /** Catégorie d'abonnement qui débloque l'application. */
  requires: CategoryId;
  /** Variable d'environnement contenant l'URL de production de l'app. */
  urlEnv: string;
  /** Variable d'environnement contenant le secret SSO partagé avec l'app. */
  secretEnv: string;
};

export const CONNECTED_APPS: ConnectedApp[] = [
  { key: "finzy", label: "Finzy", requires: "finance_plus", urlEnv: "FINZY_URL", secretEnv: "SSO_SECRET_FINZY" },
  { key: "paperasse", label: "Paperasse", requires: "vie_admin_plus", urlEnv: "PAPERASSE_URL", secretEnv: "SSO_SECRET_PAPERASSE" },
];

/** Renvoie les clés des applications externes débloquées par l'abonnement. */
export function entitledApps(selected: CategoryId[]): ConnectedAppKey[] {
  return CONNECTED_APPS.filter((a) => selected.includes(a.requires)).map((a) => a.key);
}
