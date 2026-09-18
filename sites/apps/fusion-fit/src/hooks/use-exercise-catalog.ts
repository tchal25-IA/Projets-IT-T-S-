import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./use-auth";
import type { CoachExercise } from "./use-coach-exercises";

/** Référentiel d'exercices du coach de l'athlète (consignes, scaling, médias). */
export function useCoachExercisesForAthlete(coachId: string | null | undefined) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["coach-exercises", "for-athlete", coachId, user?.id],
    enabled: !!user && !!coachId,
    staleTime: 60_000,
    queryFn: async (): Promise<CoachExercise[]> => {
      const { data, error } = await (supabase as unknown as { from: (t: string) => any })
        .from("coach_exercises")
        .select("*")
        .eq("coach_id", coachId!)
        .order("nom", { ascending: true });
      if (error) throw new Error(error.message);
      return (data ?? []) as CoachExercise[];
    },
  });
}

export function matchExercise(
  line: string,
  catalog: CoachExercise[],
): CoachExercise | null {
  const lower = line.toLowerCase();
  let best: CoachExercise | null = null;
  for (const ex of catalog) {
    const nom = ex.nom.trim();
    if (!nom) continue;
    if (lower.includes(nom.toLowerCase())) {
      if (!best || nom.length > best.nom.length) best = ex;
    }
  }
  return best;
}
