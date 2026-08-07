import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./use-auth";

export type CheckinRow = {
  id: string;
  user_id: string;
  date: string;
  temps: number;
  energie: number;
  humeur: number;
  objectif_du_jour: string | null;
  blocs_completes: number[];
  nb_blocs: number;
  serenite: number;
  session_started_at: string | null;
  session_ended_at: string | null;
  session_duration_sec: number | null;
  session_ended: boolean;
  ressenti_score: number | null;
  ressenti_note: string | null;
  coach_comment: string | null;
  session_source: string | null;
  created_at: string;
  updated_at: string;
};

export type SaveCheckinPayload = {
  temps: number;
  energie: number;
  humeur: number;
  objectif_du_jour?: string | null;
  blocs_completes: number[];
  nb_blocs: number;
  serenite: number;
  session_started_at?: string | null;
  session_ended_at?: string | null;
  session_duration_sec?: number | null;
  session_ended?: boolean;
  ressenti_score?: number | null;
  ressenti_note?: string | null;
  session_source?: string | null;
};

export function useCheckins(limit = 30) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["checkins", user?.id, limit],
    enabled: !!user,
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchOnMount: "always",
    queryFn: async () => {
      const { data, error } = await supabase
        .from("check_ins")
        .select("*")
        .eq("user_id", user!.id)
        .order("date", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return (data ?? []) as CheckinRow[];
    },
  });
}

// Récupère la session de check-in du jour la plus récente (en cours ou terminée).
export function useTodayCheckin() {
  const { user } = useAuth();
  const today = new Date().toISOString().slice(0, 10);
  return useQuery({
    queryKey: ["checkin-today", user?.id, today],
    enabled: !!user,
    staleTime: 30_000,
    queryFn: async () => {
      const { data } = await supabase
        .from("check_ins")
        .select("*")
        .eq("user_id", user!.id)
        .eq("date", today)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      return (data ?? null) as CheckinRow | null;
    },
  });
}

// Sauvegarde une session : crée une nouvelle ligne si `id` absent, met à jour sinon.
// Renvoie la ligne (incluant l'id) pour permettre des mises à jour subséquentes.
export function useSaveCheckin() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const today = new Date().toISOString().slice(0, 10);
  return useMutation({
    mutationFn: async (payload: SaveCheckinPayload & { id?: string }) => {
      const { id, ...rest } = payload;
      const patch = {
        ...rest,
        session_source: rest.session_source ?? undefined,
      };
      if (id) {
        const { data, error } = await supabase
          .from("check_ins")
          .update(patch)
          .eq("id", id)
          .select()
          .single();
        if (error) throw error;
        return data as CheckinRow;
      }
      const { data, error } = await supabase
        .from("check_ins")
        .insert({ user_id: user!.id, date: today, ...patch })
        .select()
        .single();
      if (error) throw error;
      return data as CheckinRow;
    },
    onSuccess: (data) => {
      qc.setQueryData(["checkin-today", user?.id, today], data);
      qc.invalidateQueries({ queryKey: ["checkins", user?.id] });
      qc.invalidateQueries({ queryKey: ["profile", user?.id] });
    },
  });
}

/** Profil léger pour options d'objectif du check-in. */
export function useMyObjectifsProfile() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["profile-objectifs", user?.id],
    enabled: !!user,
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select(
          "objectif_principal, objectif_moyen_terme, objectif_long_terme, objectifs_secondaires, onboarding_done",
        )
        .eq("user_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}
