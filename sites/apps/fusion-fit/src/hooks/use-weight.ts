import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./use-auth";
import { todayISO } from "@/lib/dates";

// Table weight_entries : le client typé sera régénéré après migration.
const sb = supabase as unknown as { from: (t: string) => any };

export type WeightEntry = {
  id: string;
  user_id: string;
  date: string;
  weight_kg: number;
  note: string | null;
  created_at: string;
  updated_at: string;
};

export function useMyWeightEntries(limit = 52) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["weight-entries", "mine", user?.id],
    enabled: !!user,
    staleTime: 30_000,
    queryFn: async () => {
      const { data } = await sb
        .from("weight_entries")
        .select("*")
        .eq("user_id", user!.id)
        .order("date", { ascending: false })
        .limit(limit);
      return (data ?? []) as WeightEntry[];
    },
  });
}

export function useAbonneWeightEntries(abonneId: string | undefined, limit = 52) {
  return useQuery({
    queryKey: ["weight-entries", "coach-view", abonneId],
    enabled: !!abonneId,
    staleTime: 30_000,
    queryFn: async () => {
      const { data } = await sb
        .from("weight_entries")
        .select("*")
        .eq("user_id", abonneId!)
        .order("date", { ascending: false })
        .limit(limit);
      return (data ?? []) as WeightEntry[];
    },
  });
}

export function useSaveWeight() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (p: { weightKg: number; date?: string; note?: string | null }) => {
      const row = {
        user_id: user!.id,
        date: p.date ?? todayISO(),
        weight_kg: p.weightKg,
        note: p.note ?? null,
      };
      const { data, error } = await sb
        .from("weight_entries")
        .upsert(row, { onConflict: "user_id,date" })
        .select()
        .single();
      if (error) throw new Error(error.message);
      return data as WeightEntry;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["weight-entries", "mine", user?.id] });
    },
  });
}

export function useDeleteWeight() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await sb.from("weight_entries").delete().eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["weight-entries", "mine", user?.id] });
    },
  });
}
