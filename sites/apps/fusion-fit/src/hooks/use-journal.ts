import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase as supabaseTyped } from "@/integrations/supabase/client";
// Tables atelier/calendar/journal pas encore dans types générés
const supabase = supabaseTyped as any;
import { useAuth } from "./use-auth";

export type JournalCategory =
  | "note"
  | "sante"
  | "seance"
  | "nutrition"
  | "mental"
  | "alerte"
  | "bilan";

export type JournalEntry = {
  id: string;
  coach_id: string;
  athlete_id: string;
  category: JournalCategory;
  body: string;
  is_shared: boolean;
  created_at: string;
};

export function useJournalEntries(athleteId: string | null) {
  const { user, role } = useAuth();
  return useQuery({
    queryKey: ["journal", athleteId, user?.id],
    enabled: !!user && !!athleteId,
    staleTime: 20_000,
    queryFn: async (): Promise<JournalEntry[]> => {
      let q = supabase
        .from("journal_entries")
        .select("*")
        .eq("athlete_id", athleteId!)
        .order("created_at", { ascending: false })
        .limit(40);
      if (role === "coach") q = q.eq("coach_id", user!.id);
      const { data, error } = await q;
      if (error) throw new Error(error.message);
      return (data ?? []) as JournalEntry[];
    },
  });
}

export function useAddJournalEntry() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      athleteId: string;
      body: string;
      category?: JournalCategory;
      isShared?: boolean;
    }) => {
      if (!user) throw new Error("Non connecté");
      const { error } = await supabase.from("journal_entries").insert({
        coach_id: user.id,
        athlete_id: input.athleteId,
        body: input.body.trim(),
        category: input.category ?? "note",
        is_shared: input.isShared !== false,
      });
      if (error) throw new Error(error.message);
    },
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ["journal", v.athleteId] });
    },
  });
}
