import type { Bloc } from "@/data/program-templates";

export type Profile = {
  user_id: string;
  prenom: string;
  email: string | null;
  objectif_principal: string | null;
  objectif_moyen_terme?: string | null;
  objectif_long_terme?: string | null;
  objectifs_secondaires?: string[] | null;
  objectif_course: string | null;
  discipline: string | null;
  historique_sportif?: string | null;
  antecedents_blessures?: string | null;
  sexe?: string | null;
  age?: number | null;
  taille_cm?: number | null;
  niveau_agent: number;
  abonnement_plan: string | null;
  abonnement_statut: string | null;
  onboarding_done?: boolean;
  questionnaire_sass?: Record<string, unknown> | null;
};

export type Program = {
  id?: string;
  abonne_id: string;
  coach_id: string;
  titre: string;
  objectif: string;
  blocs: Bloc[];
};

/** Session récente de l'abonné (check-in + ressenti) lisible par le coach via RLS dédiée. */
export type Session = {
  id: string;
  date: string;
  serenite: number;
  energie: number;
  humeur: number;
  objectif_du_jour?: string | null;
  nb_blocs: number;
  blocs_completes: number[];
  session_duration_sec: number | null;
  session_ended: boolean;
  ressenti_score: number | null;
  ressenti_note: string | null;
  coach_comment: string | null;
  session_source: string | null;
};

/** Template enregistré par le coach dans sa bibliothèque (table program_templates). */
export type DbTemplate = { id: string; titre: string; objectif: string | null; blocs: Bloc[] };

export const JOURS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];

export const RESSENTI_LABELS = ["", "Très dur", "Dur", "Correct", "Facile", "Très facile"];

export function formatDuree(sec: number | null): string {
  if (!sec) return "—";
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return m > 0 ? `${m} min ${s.toString().padStart(2, "0")}s` : `${s}s`;
}
