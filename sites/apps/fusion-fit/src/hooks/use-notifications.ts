import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./use-auth";

export type NotificationRow = {
  id: string;
  user_id: string;
  actor_id: string | null;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  read_at: string | null;
  created_at: string;
};

// Crée une notification pour un destinataire (coach <-> abonné) via RPC sécurisée.
// N'échoue jamais bruyamment : une notif ratée ne doit pas bloquer l'action métier.
export async function notify(
  userId: string,
  type: string,
  title: string,
  body?: string | null,
  link?: string | null,
) {
  try {
    const { error } = await (supabase as unknown as {
      rpc: (f: string, a: Record<string, unknown>) => Promise<{ error: { message: string } | null }>;
    }).rpc("create_notification", {
      p_user_id: userId,
      p_type: type,
      p_title: title,
      p_body: body ?? null,
      p_link: link ?? null,
    });
    // Le RPC Supabase ne rejette jamais la promesse : une erreur SQL (ex.
    // "Non autorisé", table absente...) revient dans `error` sans jamais
    // passer par le catch. Sans ce log, un échec de notif était invisible.
    if (error) console.error("[notify] échec create_notification:", error.message);
  } catch (e) {
    console.error("[notify] exception:", e);
  }
}

// Prénom de l'utilisateur courant (cache module) — pour signer les
// notifications afin que le destinataire sache immédiatement QUI est concerné.
let myPrenomCache: { userId: string; prenom: string } | null = null;
export async function getMyPrenom(userId: string): Promise<string> {
  if (myPrenomCache?.userId === userId) return myPrenomCache.prenom;
  const { data } = await supabase
    .from("profiles").select("prenom").eq("user_id", userId).maybeSingle();
  const prenom = data?.prenom ?? "Un utilisateur";
  myPrenomCache = { userId, prenom };
  return prenom;
}

export function useNotifications(limit = 30) {
  const { user } = useAuth();
  const qc = useQueryClient();

  useEffect(() => {
    if (!user) return;
    const ch = supabase
      .channel(`notifs:${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        () => {
          qc.invalidateQueries({ queryKey: ["notifications", user.id] });
          qc.invalidateQueries({ queryKey: ["notif-unread", user.id] });
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user, qc]);

  return useQuery({
    queryKey: ["notifications", user?.id],
    enabled: !!user,
    staleTime: 15_000,
    queryFn: async () => {
      const { data } = await supabase
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit);
      return (data ?? []) as NotificationRow[];
    },
  });
}

export function useUnreadNotifCount() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["notif-unread", user?.id],
    enabled: !!user,
    staleTime: 15_000,
    queryFn: async () => {
      const { count } = await supabase
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .is("read_at", null);
      return count ?? 0;
    },
  });
}

// Notification "push" best-effort (Notification API du navigateur) pour les
// créneaux (demande de réservation + validation/refus). Fonctionne quand
// l'app/onglet est ouvert (ou en arrière-plan) ; une vraie push à app fermée
// nécessiterait un service worker + clés VAPID + serveur d'envoi (hors scope
// ici, à prévoir en phase 2 si besoin).
export function useCreneauPushNotifications() {
  const { user } = useAuth();
  useEffect(() => {
    if (!user) return;
    if (typeof window === "undefined" || typeof Notification === "undefined") return;
    if (Notification.permission === "default") {
      Notification.requestPermission().catch(() => {});
    }
    const ch = supabase
      .channel(`push-creneaux:${user.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        (payload) => {
          const row = payload.new as NotificationRow;
          if (row.type !== "creneau") return;
          if (Notification.permission !== "granted") return;
          try {
            const n = new Notification(row.title, {
              body: row.body ?? undefined,
              icon: "/icon-192.png",
              tag: row.id,
            });
            n.onclick = () => {
              window.focus();
              if (row.link) window.location.assign(row.link);
            };
          } catch { /* ignore (permission révoquée entre-temps, etc.) */ }
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user]);
}

export function useMarkNotifRead() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (ids?: string[]) => {
      const now = new Date().toISOString();
      let q = supabase.from("notifications").update({ read_at: now }).is("read_at", null);
      if (ids && ids.length) q = supabase.from("notifications").update({ read_at: now }).in("id", ids);
      await q;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications", user?.id] });
      qc.invalidateQueries({ queryKey: ["notif-unread", user?.id] });
    },
  });
}
