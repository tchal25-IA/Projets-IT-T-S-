import { todayISO, todayJourFr, blocsForJour } from "@/lib/dates";
import type { CoachSession } from "@/hooks/use-coaching";
import type { ProgramLite } from "@/components/programme-jour-card";

export type SeanceKind = "perso" | "hebdo" | "base";

export type SeanceDuJour = {
  kind: SeanceKind;
  label: string;
  titre: string;
  objectif: string | null;
  /** Séance perso active aujourd'hui */
  perso: CoachSession | null;
  /** Programme hebdo avec blocs du jour */
  program: ProgramLite | null;
  blocsTodayCount: number;
};

/** True si la séance perso coach s'applique aujourd'hui. */
export function isPersoActiveToday(session: CoachSession | null | undefined): boolean {
  if (!session?.actif) return false;
  const blocs = Array.isArray(session.blocs) ? session.blocs : [];
  if (blocs.length === 0) return false;

  const today = todayISO();
  if (session.date_seance) {
    // date_seance = jour cible exact (prioritaire)
    return session.date_seance.slice(0, 10) === today;
  }

  // Fréquence : active si le nombre de jours depuis updated_at (ou aujourd'hui) matche
  // Convention : sans date_seance, considéré actif tous les jours tant que `actif`.
  // frequence_jours sert surtout d'info UI ; on ne bloque pas si null/0.
  return true;
}

/**
 * Résout LA séance du jour :
 * 1. Séance perso coach (si active aujourd'hui)
 * 2. Programme hebdo (bloc du jour)
 * 3. Routine de base (check-in → générateur)
 */
export function resolveSeanceDuJour(
  coachSession: CoachSession | null | undefined,
  program: ProgramLite | null | undefined,
): SeanceDuJour {
  const today = todayJourFr();
  const blocsToday = blocsForJour(program?.blocs, today);

  if (isPersoActiveToday(coachSession ?? null)) {
    return {
      kind: "perso",
      label: "Séance perso coach",
      titre: coachSession!.titre,
      objectif: coachSession!.objectif,
      perso: coachSession!,
      program: program ?? null,
      blocsTodayCount: blocsToday.length,
    };
  }

  if (program && blocsToday.length > 0) {
    return {
      kind: "hebdo",
      label: "Programme hebdo · jour",
      titre: blocsToday.map((b) => b.titre).join(", ") || program.titre,
      objectif: program.objectif ?? null,
      perso: null,
      program,
      blocsTodayCount: blocsToday.length,
    };
  }

  return {
    kind: "base",
    label: "Routine de base",
    titre: "Séance adaptée à ton check-in",
    objectif: null,
    perso: null,
    program: program ?? null,
    blocsTodayCount: 0,
  };
}
