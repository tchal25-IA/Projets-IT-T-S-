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

const PUSH_TYPES = new Set([
  "creneau",
  "creneau_rappel",
  "evenement",
  "event_rappel",
  "message",
  "programme",
  "programme_valide",
  "commentaire",
  "seance",
  "avis",
]);

/** Push navigateur (Notification API) pour créneaux + messages (+ autres types clés). */
export function useCreneauPushNotifications() {
  const { user } = useAuth();
  useEffect(() => {
    if (!user) return;
    if (typeof window === "undefined" || typeof Notification === "undefined") return;
    if (Notification.permission === "default") {
      Notification.requestPermission().catch(() => {});
    }
    const ch = supabase
      .channel(`push-notifs:${user.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        (payload) => {
          const row = payload.new as NotificationRow;
          if (!PUSH_TYPES.has(row.type)) return;
          if (Notification.permission !== "granted") return;
          try {
            const n = new Notification(row.title, {
              body: row.body ?? undefined,
              icon: "/icon-192.png",
              tag: row.id,
            });
            n.onclick = () => {
              window.focus();
              if (row.link && row.link.startsWith("/fusionfit")) {
                window.location.assign(row.link);
              }
            };
          } catch { /* ignore */ }
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user]);
}

/** Enregistre une subscription Web Push (VAPID) si la clé publique est dispo. */
export function useRegisterWebPush() {
  const { user } = useAuth();
  useEffect(() => {
    if (!user || typeof window === "undefined") return;
    const vapid = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined;
    if (!vapid || !("serviceWorker" in navigator) || !("PushManager" in window)) return;

    let cancelled = false;
    (async () => {
      try {
        const reg = await navigator.serviceWorker.register("/sw.js");
        const permission = await Notification.requestPermission();
        if (permission !== "granted" || cancelled) return;
        const sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapid),
        });
        const json = sub.toJSON();
        if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) return;
        await supabase.from("push_subscriptions").upsert(
          {
            user_id: user.id,
            endpoint: json.endpoint,
            p256dh: json.keys.p256dh,
            auth: json.keys.auth,
          },
          { onConflict: "user_id,endpoint" },
        );
      } catch (e) {
        console.warn("[webpush] registration skipped:", e);
      }
    })();
    return () => { cancelled = true; };
  }, [user]);
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
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
