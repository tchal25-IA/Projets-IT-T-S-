import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./use-auth";
import { notify, getMyPrenom } from "./use-notifications";

export type MessageRow = {
  id: string;
  conversation_id: string;
  from_user_id: string;
  texte: string;
  type: string;
  created_at: string;
};

// ─── Coach de l'abonné courant (via coach_assignments) ────────────────
export function useCoachId() {
  const { user, role } = useAuth();
  return useQuery({
    queryKey: ["coach-id", user?.id],
    enabled: !!user && role !== "coach",
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const { data } = await supabase
        .from("coach_assignments")
        .select("coach_id")
        .eq("abonne_id", user!.id)
        .maybeSingle();
      return data?.coach_id ?? null;
    },
  });
}

// ─── Conversation get-or-create entre coach et abonné ─────────────────
export function useConversationId(otherUserId: string | null | undefined) {
  const { user, role } = useAuth();
  return useQuery({
    queryKey: ["conversation", user?.id, otherUserId],
    enabled: !!user && !!otherUserId,
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const coach_id = role === "coach" ? user!.id : otherUserId!;
      const abonne_id = role === "coach" ? otherUserId! : user!.id;
      const { data: existing } = await supabase
        .from("conversations")
        .select("id")
        .eq("coach_id", coach_id)
        .eq("abonne_id", abonne_id)
        .maybeSingle();
      if (existing) return existing.id;
      const { data: created, error } = await supabase
        .from("conversations")
        .insert({ coach_id, abonne_id })
        .select("id")
        .single();
      if (error) throw error;
      return created.id;
    },
  });
}

// ─── Messages d'une conversation ──────────────────────────────────────
export function useMessages(conversationId: string | null | undefined) {
  return useQuery({
    queryKey: ["messages", conversationId],
    enabled: !!conversationId,
    staleTime: 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", conversationId!)
        .order("created_at", { ascending: true })
        .limit(200);
      if (error) throw error;
      return (data ?? []) as MessageRow[];
    },
  });
}

// ─── Realtime sur une conversation ────────────────────────────────────
export function useMessagesRealtime(
  conversationId: string | null | undefined,
  onNewMessage: () => void
) {
  useEffect(() => {
    if (!conversationId) return;
    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        onNewMessage
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [conversationId, onNewMessage]);
}

export function useSendMessage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      conversation_id: string;
      texte: string;
      type?: string;
    }) => {
      const { error } = await supabase.from("messages").insert({
        conversation_id: payload.conversation_id,
        from_user_id: user!.id,
        texte: payload.texte.trim(),
        type: payload.type ?? "normal",
      });
      if (error) throw error;
      await supabase
        .from("conversations")
        .update({ last_message_at: new Date().toISOString() })
        .eq("id", payload.conversation_id);
      // Notification nominative au destinataire, avec lien direct vers la
      // conversation (deep link ?with=<expéditeur>).
      const { data: conv } = await supabase
        .from("conversations")
        .select("coach_id, abonne_id")
        .eq("id", payload.conversation_id)
        .maybeSingle();
      if (conv) {
        const dest = conv.coach_id === user!.id ? conv.abonne_id : conv.coach_id;
        const prenom = await getMyPrenom(user!.id);
        const extrait = payload.texte.trim().slice(0, 80);
        await notify(dest, "message", `Message de ${prenom}`, extrait,
          `/fusionfit/messagerie?with=${user!.id}`);
        await supabase.rpc("enqueue_email_for_user", {
          p_user_id: dest,
          p_subject: `Message de ${prenom} — FusionFit`,
          p_body: extrait,
          p_kind: "message",
        });
      }
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["messages", vars.conversation_id] });
      qc.invalidateQueries({ queryKey: ["unread-count"] });
    },
  });
}

// ─── Badge non-lu (toutes conversations de l'utilisateur) ─────────────
export function useUnreadCount() {
  const { user, role } = useAuth();
  const qc = useQueryClient();

  // Realtime: refresh on any new message
  useEffect(() => {
    if (!user) return;
    const ch = supabase
      .channel(`unread:${user.id}`)
      .on("postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        () => qc.invalidateQueries({ queryKey: ["unread-count", user.id] }))
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user, qc]);

  return useQuery({
    queryKey: ["unread-count", user?.id],
    enabled: !!user,
    staleTime: 15_000,
    queryFn: async () => {
      const col = role === "coach" ? "coach_id" : "abonne_id";
      const readCol = role === "coach" ? "coach_last_read_at" : "abonne_last_read_at";
      const { data: convs } = await supabase
        .from("conversations")
        .select(`id, last_message_at, ${readCol}`)
        .eq(col, user!.id);
      if (!convs) return 0;
      let count = 0;
      for (const c of convs as Array<Record<string, string>>) {
        const lastMsg = c.last_message_at;
        const lastRead = c[readCol];
        if (lastMsg && (!lastRead || lastMsg > lastRead)) count += 1;
      }
      return count;
    },
  });
}

export function useMarkConversationRead() {
  const { user, role } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (conversationId: string) => {
      if (!user) return;
      const patch: Record<string, string> = {};
      patch[role === "coach" ? "coach_last_read_at" : "abonne_last_read_at"] = new Date().toISOString();
      await supabase
        .from("conversations")
        .update(patch as never)
        .eq("id", conversationId);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["unread-count", user?.id] });
    },
  });
}

// ─── Athlètes du coach (liste + stats agrégées depuis check_ins) ──────
export type AthleteStats = {
  user_id: string;
  prenom: string;
  email: string | null;
  niveau_agent: number;
  objectif_principal: string | null;
  avatar_url: string | null;
  total_checkins: number;
  last_checkin: string | null;
  avg_energie: number | null;
  avg_humeur: number | null;
};

export function useAthletes() {
  const { user, role } = useAuth();
  return useQuery({
    queryKey: ["athletes", user?.id],
    enabled: role === "coach" && !!user,
    staleTime: 60_000,
    queryFn: async () => {
      const { data: assigns } = await supabase
        .from("coach_assignments")
        .select("abonne_id")
        .eq("coach_id", user!.id);
      const ids = (assigns ?? []).map((a) => a.abonne_id);
      if (!ids.length) return [] as AthleteStats[];

      const { data: profs } = await supabase
        .from("profiles")
        .select("user_id, prenom, email, niveau_agent, objectif_principal, avatar_url")
        .in("user_id", ids);

      const { data: checks } = await supabase
        .from("check_ins")
        .select("user_id, energie, humeur, created_at")
        .in("user_id", ids);

      return (profs ?? []).map((p): AthleteStats => {
        const mine = (checks ?? []).filter((c) => c.user_id === p.user_id);
        const total = mine.length;
        const avg = (k: "energie" | "humeur") =>
          total ? +(mine.reduce((s, c) => s + (c[k] as number), 0) / total).toFixed(1) : null;
        const last = mine.reduce<string | null>(
          (acc, c) => (!acc || c.created_at > acc ? c.created_at : acc),
          null
        );
        return {
          user_id: p.user_id,
          prenom: p.prenom,
          email: p.email,
          niveau_agent: p.niveau_agent ?? 1,
          objectif_principal: p.objectif_principal,
          avatar_url: p.avatar_url ?? null,
          total_checkins: total,
          last_checkin: last,
          avg_energie: avg("energie"),
          avg_humeur: avg("humeur"),
        };
      });
    },
  });
}
