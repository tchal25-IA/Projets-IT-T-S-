import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./use-auth";

export type CoachExercise = {
  id: string;
  coach_id: string;
  nom: string;
  consigne: string | null;
  tags: string[];
  scaling: string | null;
  created_at: string;
  updated_at: string;
};

const sb = supabase as unknown as { from: (t: string) => any };

export function useCoachExercises() {
  const { user, role } = useAuth();
  return useQuery({
    queryKey: ["coach-exercises", user?.id],
    enabled: !!user && role === "coach",
    staleTime: 30_000,
    queryFn: async (): Promise<CoachExercise[]> => {
      const { data, error } = await sb
        .from("coach_exercises")
        .select("*")
        .eq("coach_id", user!.id)
        .order("nom", { ascending: true });
      if (error) throw new Error(error.message);
      return (data ?? []) as CoachExercise[];
    },
  });
}

export function useSaveCoachExercise() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      id?: string;
      nom: string;
      consigne?: string | null;
      tags?: string[];
      scaling?: string | null;
    }) => {
      const row = {
        coach_id: user!.id,
        nom: payload.nom.trim(),
        consigne: payload.consigne?.trim() || null,
        tags: payload.tags ?? [],
        scaling: payload.scaling?.trim() || null,
        updated_at: new Date().toISOString(),
      };
      if (payload.id) {
        const { data, error } = await sb
          .from("coach_exercises")
          .update(row)
          .eq("id", payload.id)
          .select()
          .single();
        if (error) throw new Error(error.message);
        return data as CoachExercise;
      }
      const { data, error } = await sb.from("coach_exercises").insert(row).select().single();
      if (error) throw new Error(error.message);
      return data as CoachExercise;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["coach-exercises", user?.id] });
    },
  });
}

export function useDeleteCoachExercise() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await sb.from("coach_exercises").delete().eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["coach-exercises", user?.id] });
    },
  });
}

/** Déclenche les rappels créneau H-1 (à appeler périodiquement côté client / cron). */
export function useCreneauRemindersPoll() {
  const { user } = useAuth();
  useQuery({
    queryKey: ["creneau-reminders-poll", user?.id],
    enabled: !!user,
    staleTime: 5 * 60_000,
    refetchInterval: 5 * 60_000,
    queryFn: async () => {
      const { error } = await supabase.rpc("send_creneau_reminders" as never);
      if (error) {
        // Fonction peut ne pas encore être déployée — silencieux
        console.warn("send_creneau_reminders:", error.message);
      }
      return true;
    },
  });
}
