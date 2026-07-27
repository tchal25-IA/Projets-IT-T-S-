import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./use-auth";

// Les tables coach_sessions / coach_reviews sont récentes : le client typé sera
// régénéré par Lovable après la migration. En attendant on caste en any.
const sb = supabase as unknown as {
  from: (t: string) => any;
  rpc: (f: string, args: Record<string, unknown>) => Promise<{ data: unknown; error: { message: string } | null }>;
};

export type CoachBloc = { pilier: "Bouger" | "Respirer" | "Nourrir"; titre: string; exercices: string[] };

export type CoachSession = {
  id: string;
  coach_id: string;
  abonne_id: string;
  titre: string;
  objectif: string | null;
  blocs: CoachBloc[];
  frequence_jours: number;
  date_seance: string | null;
  actif: boolean;
  updated_at: string;
};

// ─── Séance perso : lecture abonné (sa propre séance) ─────────────────
export function useMyCoachSession() {
  const { user, role } = useAuth();
  return useQuery({
    queryKey: ["coach-session", "mine", user?.id],
    enabled: !!user && role !== "coach",
    staleTime: 30_000,
    queryFn: async () => {
      const { data } = await sb
        .from("coach_sessions")
        .select("*")
        .eq("abonne_id", user!.id)
        .eq("actif", true)
        .maybeSingle();
      return (data ?? null) as CoachSession | null;
    },
  });
}

// ─── Séance perso : lecture/écriture coach pour un abonné ─────────────
export function useCoachSessionFor(abonneId: string | undefined) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["coach-session", "for", user?.id, abonneId],
    enabled: !!user && !!abonneId,
    staleTime: 30_000,
    queryFn: async () => {
      const { data } = await sb
        .from("coach_sessions")
        .select("*")
        .eq("coach_id", user!.id)
        .eq("abonne_id", abonneId!)
        .maybeSingle();
      return (data ?? null) as CoachSession | null;
    },
  });
}

export function useSaveCoachSession() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      id?: string;
      abonne_id: string;
      titre: string;
      objectif: string | null;
      blocs: CoachBloc[];
      frequence_jours: number;
      date_seance?: string | null;
      actif?: boolean;
    }) => {
      const row = {
        coach_id: user!.id,
        abonne_id: payload.abonne_id,
        titre: payload.titre,
        objectif: payload.objectif,
        blocs: payload.blocs,
        frequence_jours: payload.frequence_jours,
        date_seance: payload.date_seance ?? null,
        actif: payload.actif ?? true,
      };
      const { data, error } = await sb
        .from("coach_sessions")
        .upsert(row, { onConflict: "coach_id,abonne_id" })
        .select()
        .single();
      if (error) throw new Error(error.message);
      return data as CoachSession;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["coach-session", "for", user?.id, vars.abonne_id] });
      qc.invalidateQueries({ queryKey: ["coach-session", "mine"] });
    },
  });
}

// ─── Commentaire de séance (coach → check-in d'un abonné) ─────────────
export function useSetSessionComment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (p: { checkinId: string; comment: string }) => {
      const { error } = await sb.rpc("set_session_comment", {
        p_checkin_id: p.checkinId,
        p_comment: p.comment,
      });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["abonne-sessions"] });
      qc.invalidateQueries({ queryKey: ["checkins"] });
    },
  });
}

// ─── Avis / notation du coach ─────────────────────────────────────────
export type CoachReview = {
  id: string;
  coach_id: string;
  abonne_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  updated_at: string;
};

// Avis de l'abonné courant sur son coach
export function useMyReview(coachId: string | null | undefined) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["coach-review", "mine", user?.id, coachId],
    enabled: !!user && !!coachId,
    staleTime: 30_000,
    queryFn: async () => {
      const { data } = await sb
        .from("coach_reviews")
        .select("*")
        .eq("coach_id", coachId!)
        .eq("abonne_id", user!.id)
        .maybeSingle();
      return (data ?? null) as CoachReview | null;
    },
  });
}

export function useSaveReview() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (p: { coachId: string; rating: number; comment: string | null }) => {
      const { error } = await sb
        .from("coach_reviews")
        .upsert(
          { coach_id: p.coachId, abonne_id: user!.id, rating: p.rating, comment: p.comment },
          { onConflict: "coach_id,abonne_id" }
        );
      if (error) throw new Error(error.message);
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["coach-review", "mine", user?.id, vars.coachId] });
      qc.invalidateQueries({ queryKey: ["coach-reviews", vars.coachId] });
      qc.invalidateQueries({ queryKey: ["coach-overview"] });
    },
  });
}

// Liste des avis d'un coach + moyenne
export function useCoachReviews(coachId: string | null | undefined) {
  return useQuery({
    queryKey: ["coach-reviews", coachId],
    enabled: !!coachId,
    staleTime: 30_000,
    queryFn: async () => {
      const { data } = await sb
        .from("coach_reviews")
        .select("id, rating, comment, updated_at, abonne_id")
        .eq("coach_id", coachId!)
        .order("updated_at", { ascending: false });
      const list = (data ?? []) as Array<Pick<CoachReview, "id" | "rating" | "comment" | "updated_at" | "abonne_id">>;
      const avg = list.length ? +(list.reduce((s, r) => s + r.rating, 0) / list.length).toFixed(1) : null;
      return { list, avg, count: list.length };
    },
  });
}

// Vue d'ensemble du coach connecté : nb abonnés + note moyenne
export function useCoachOverview() {
  const { user, role } = useAuth();
  return useQuery({
    queryKey: ["coach-overview", user?.id],
    enabled: role === "coach" && !!user,
    staleTime: 30_000,
    queryFn: async () => {
      const { count: nbAbonnes } = await sb
        .from("coach_assignments")
        .select("abonne_id", { count: "exact", head: true })
        .eq("coach_id", user!.id);
      const { data: reviews } = await sb
        .from("coach_reviews")
        .select("rating")
        .eq("coach_id", user!.id);
      const list = (reviews ?? []) as Array<{ rating: number }>;
      const avg = list.length ? +(list.reduce((s, r) => s + r.rating, 0) / list.length).toFixed(1) : null;
      return { nbAbonnes: nbAbonnes ?? 0, avgRating: avg, nbReviews: list.length };
    },
  });
}
