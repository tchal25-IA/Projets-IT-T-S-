import type { CoachSession } from "@/hooks/use-coaching";
import type { RoutineBlock } from "@/lib/routine-generator";

/** Convertit la séance perso du coach en blocs jouables (mêmes cases à cocher). */
export function coachToBlocks(cs: CoachSession): RoutineBlock[] {
  return (cs.blocs ?? []).map((b) => ({
    pilier: b.pilier,
    titre: b.titre || "Bloc",
    duree: "Coach",
    exercises: b.exercices ?? [],
    intensite: "Modérée" as const,
  }));
}

/** completedExercises: Record<blockIndex, exerciseIndex[]> */
export type ExerciseState = Record<number, number[]>;

export function totalExercises(routine: RoutineBlock[]) {
  return routine.reduce((sum, b) => sum + b.exercises.length, 0);
}
export function totalDone(routine: RoutineBlock[], state: ExerciseState) {
  return routine.reduce((sum, b, i) => sum + (state[i]?.length ?? 0), 0);
}
export function blockDone(block: RoutineBlock, i: number, state: ExerciseState) {
  return (state[i]?.length ?? 0) >= block.exercises.length;
}

export function formatDuration(totalSec: number): string {
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

export const TEMPS_OPTIONS = [
  { value: 1, label: "15 min", sub: "Sprint" },
  { value: 2, label: "30 min", sub: "Standard" },
  { value: 3, label: "60 min+", sub: "Complète" },
];
export const ENERGIE_LABELS = ["", "Épuisé", "Fatigué", "Neutre", "Dynamisé", "Au max"];
export const HUMEUR_LABELS = ["", "Stressé", "Bas", "Neutre", "Positif", "Invincible"];
export const RESSENTI_LABELS = ["", "Difficile", "Mitigé", "Correct", "Très bon", "Excellent"];

export const STORAGE_KEY = "ff-routine-state";
