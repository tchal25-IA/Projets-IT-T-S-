import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./use-auth";
import { todayISO } from "@/lib/dates";

export type ProgramCompletion = {
  id: string;
  program_id: string;
  abonne_id: string;
  coach_id: string;
  jour: string;
  date: string;
  titre: string;
  ressenti_score: number | null;
  ressenti_note: string | null;
  session_started_at: string | null;
  session_ended_at: string | null;
  session_duration_sec: number | null;
  created_at: string;
  updated_at: string;
};

// Historique des validations de l'abonné courant pour un programme (dernières N).
export function useMyProgramCompletions(programId: string | undefined, limit = 14) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["program-completions", "mine", user?.id, programId],
    enabled: !!user && !!programId,
    staleTime: 15_000,
    queryFn: async () => {
      const { data } = await supabase
        .from("program_completions")
        .select("*")
        .eq("abonne_id", user!.id)
        .eq("program_id", programId!)
        .order("date", { ascending: false })
        .limit(limit);
      return (data ?? []) as ProgramCompletion[];
    },
  });
}

// Historique des validations d'un abonné, vu par son coach.
export function useAbonneProgramCompletions(abonneId: string | undefined, limit = 20) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["program-completions", "coach-view", user?.id, abonneId],
    enabled: !!user && !!abonneId,
    staleTime: 15_000,
    queryFn: async () => {
      const { data } = await supabase
        .from("program_completions")
        .select("*")
        .eq("abonne_id", abonneId!)
        .order("date", { ascending: false })
        .limit(limit);
      return (data ?? []) as ProgramCompletion[];
    },
  });
}

export function useValidateProgramDay() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (p: {
      programId: string;
      coachId: string;
      jour: string;
      titre: string;
      ressentiScore?: number | null;
      ressentiNote?: string | null;
      date?: string;
      sessionStartedAt?: string | null;
      sessionEndedAt?: string | null;
      sessionDurationSec?: number | null;
    }) => {
      const row = {
        program_id: p.programId,
        abonne_id: user!.id,
        coach_id: p.coachId,
        jour: p.jour,
        date: p.date ?? todayISO(),
        titre: p.titre,
        ressenti_score: p.ressentiScore ?? null,
        ressenti_note: p.ressentiNote ?? null,
        session_started_at: p.sessionStartedAt ?? null,
        session_ended_at: p.sessionEndedAt ?? null,
        session_duration_sec: p.sessionDurationSec ?? null,
      };
      const { data, error } = await supabase
        .from("program_completions")
        .upsert(row, { onConflict: "abonne_id,date" })
        .select()
        .single();
      if (error) throw new Error(error.message);
      return data as ProgramCompletion;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["program-completions", "mine", user?.id, vars.programId] });
      qc.invalidateQueries({ queryKey: ["program-completions", "coach-view"] });
    },
  });
}
