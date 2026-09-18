import type { ProgramCompletion } from "@/hooks/use-program-completions";
import type { Session } from "@/components/escouade/types";

/** Convertit une validation programme en entrée d'archive coach (sans écraser les check-ins). */
export function completionToArchiveSession(c: ProgramCompletion): Session {
  const validated = c.ressenti_score != null;
  const ended = validated || !!c.session_ended_at;
  return {
    id: `prog:${c.id}`,
    date: c.date,
    serenite: validated ? 100 : ended ? 60 : 30,
    energie: 3,
    humeur: 3,
    temps: null,
    objectif_du_jour: `${c.jour} · ${c.titre}`,
    nb_blocs: 1,
    blocs_completes: validated ? [0] : [],
    session_duration_sec: c.session_duration_sec,
    session_ended: ended,
    ressenti_score: c.ressenti_score,
    ressenti_note: c.ressenti_note,
    coach_comment: null,
    session_source: "programme",
  };
}

/**
 * Fusionne check-ins + validations programme pour l'archive coach.
 * Priorité au check-in s'il existe déjà pour la même date (données plus riches).
 */
export function mergeArchiveSessions(
  checkins: Session[],
  completions: ProgramCompletion[],
): Session[] {
  const byDate = new Map<string, Session>();
  for (const s of checkins) {
    if (!byDate.has(s.date)) byDate.set(s.date, s);
  }
  for (const c of completions) {
    if (byDate.has(c.date)) continue;
    byDate.set(c.date, completionToArchiveSession(c));
  }
  return [...byDate.values()].sort((a, b) => b.date.localeCompare(a.date));
}
