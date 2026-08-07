import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./use-auth";

export type EscouadeAbonne = {
  user_id: string;
  prenom: string;
  email: string | null;
  objectif_principal: string | null;
  avatar_url: string | null;
};
export type EscouadeInvit = {
  id: string;
  token: string;
  email: string | null;
  used_at: string | null;
  expires_at: string;
};
export type EscouadeSquad = {
  id: string;
  nom: string;
  objectif: string;
  couleur: string;
};
export type EscouadeMembership = { squad_id: string; abonne_id: string };

export function useEscouadeData() {
  const { user, role } = useAuth();
  const enabled = !!user && role === "coach";

  return useQuery({
    queryKey: ["escouade", user?.id],
    enabled,
    staleTime: 30_000,
    queryFn: async () => {
      if (!user) {
        return { abonnes: [] as EscouadeAbonne[], invits: [] as EscouadeInvit[], squads: [] as EscouadeSquad[], members: [] as EscouadeMembership[] };
      }

      const { data: assigns } = await supabase
        .from("coach_assignments")
        .select("abonne_id")
        .eq("coach_id", user.id);
      const ids = assigns?.map((a) => a.abonne_id) ?? [];

      let abonnes: EscouadeAbonne[] = [];
      if (ids.length) {
        const { data: profs } = await supabase
          .from("profiles")
          .select("user_id, prenom, email, objectif_principal, avatar_url")
          .in("user_id", ids);
        abonnes = (profs as EscouadeAbonne[]) ?? [];
      }

      const { data: inv } = await supabase
        .from("invitations")
        .select("*")
        .eq("coach_id", user.id)
        .is("used_at", null)
        .order("created_at", { ascending: false });

      const { data: sq } = await supabase
        .from("squads")
        .select("*")
        .eq("coach_id", user.id)
        .order("created_at", { ascending: false });

      const sqIds = sq?.map((s) => s.id) ?? [];
      let members: EscouadeMembership[] = [];
      if (sqIds.length) {
        const { data: mems } = await supabase
          .from("squad_members")
          .select("squad_id, abonne_id")
          .in("squad_id", sqIds);
        members = (mems as EscouadeMembership[]) ?? [];
      }

      return {
        abonnes,
        invits: (inv as EscouadeInvit[]) ?? [],
        squads: (sq as EscouadeSquad[]) ?? [],
        members,
      };
    },
  });
}

export function useCreateInvitation() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (email: string) => {
      if (!user) throw new Error("Non authentifié");
      const { data, error } = await supabase
        .from("invitations")
        .insert({ coach_id: user.id, email: email.trim() || null })
        .select()
        .single();
      if (error) throw new Error(error.message);
      return data as EscouadeInvit;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["escouade", user?.id] }),
  });
}

export function useSquadMutations() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ["escouade", user?.id] });

  const createSquad = useMutation({
    mutationFn: async (form: { nom: string; objectif: string }) => {
      if (!user) throw new Error("Non authentifié");
      const { data, error } = await supabase
        .from("squads")
        .insert({ coach_id: user.id, nom: form.nom.trim(), objectif: form.objectif.trim() })
        .select()
        .single();
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: invalidate,
  });

  const deleteSquad = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("squads").delete().eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: invalidate,
  });

  const toggleMember = useMutation({
    mutationFn: async ({
      squadId,
      abonneId,
      inGroup,
    }: {
      squadId: string;
      abonneId: string;
      inGroup: boolean;
    }) => {
      if (inGroup) {
        const { error } = await supabase
          .from("squad_members")
          .delete()
          .eq("squad_id", squadId)
          .eq("abonne_id", abonneId);
        if (error) throw new Error(error.message);
      } else {
        const { error } = await supabase
          .from("squad_members")
          .insert({ squad_id: squadId, abonne_id: abonneId });
        if (error) throw new Error(error.message);
      }
    },
    onSuccess: invalidate,
  });

  return { createSquad, deleteSquad, toggleMember };
}

export function useSquadLeaderboard(squadId: string | null) {
  return useQuery({
    queryKey: ["squad-leaderboard", squadId],
    enabled: !!squadId,
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("squad_leaderboard", {
        p_squad_id: squadId!,
      });
      if (error) throw new Error(error.message);
      return (data ?? []) as Array<{
        abonne_id: string;
        prenom: string;
        checkins_7j: number;
        completions_7j: number;
      }>;
    },
  });
}

export function useSquadChallenges(squadId: string | null) {
  const { user } = useAuth();
  const qc = useQueryClient();

  const list = useQuery({
    queryKey: ["squad-challenges", squadId],
    enabled: !!squadId,
    staleTime: 30_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("squad_challenges")
        .select("*")
        .eq("squad_id", squadId!)
        .order("created_at", { ascending: false });
      if (error) throw new Error(error.message);
      return data ?? [];
    },
  });

  const create = useMutation({
    mutationFn: async (input: {
      titre: string;
      description?: string;
      metric?: string;
      target_value?: number;
      ends_at?: string;
    }) => {
      if (!user || !squadId) throw new Error("Données manquantes");
      const { data, error } = await supabase
        .from("squad_challenges")
        .insert({
          squad_id: squadId,
          coach_id: user.id,
          titre: input.titre,
          description: input.description ?? "",
          metric: input.metric ?? "checkins",
          target_value: input.target_value ?? 5,
          ends_at: input.ends_at ?? undefined,
        })
        .select()
        .single();
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["squad-challenges", squadId] }),
  });

  return { list, create };
}
