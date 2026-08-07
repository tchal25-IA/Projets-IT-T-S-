import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./use-auth";
import { notify, getMyPrenom } from "./use-notifications";

const sb = supabase as unknown as { from: (t: string) => any; rpc: (f: string, a?: Record<string, unknown>) => Promise<any> };

export type CoachEvent = {
  id: string;
  coach_id: string;
  titre: string;
  objectif: string | null;
  lieu: string | null;
  starts_at: string;
  capacity: number;
  audience: "escouade" | "libre";
  squad_id: string | null;
  reminder_sent_at: string | null;
  created_at: string;
};

export type EventRegistration = {
  id: string;
  event_id: string;
  user_id: string;
  status: "invite" | "inscrit" | "refuse";
};

export function useCoachEvents(rangeStart: Date, rangeEnd: Date) {
  const { user, role } = useAuth();
  return useQuery({
    queryKey: ["coach-events", user?.id, role, rangeStart.toISOString(), rangeEnd.toISOString()],
    enabled: !!user,
    staleTime: 20_000,
    queryFn: async () => {
      let q = sb
        .from("coach_events")
        .select("*")
        .gte("starts_at", rangeStart.toISOString())
        .lte("starts_at", rangeEnd.toISOString())
        .order("starts_at", { ascending: true });
      if (role === "coach") {
        q = q.eq("coach_id", user!.id);
      }
      const { data, error } = await q;
      if (error) throw new Error(error.message);
      return (data ?? []) as CoachEvent[];
    },
  });
}

export function useMyEventRegistrations(eventIds: string[]) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["event-regs", user?.id, eventIds.join(",")],
    enabled: !!user && eventIds.length > 0,
    staleTime: 15_000,
    queryFn: async () => {
      const { data, error } = await sb
        .from("event_registrations")
        .select("*")
        .eq("user_id", user!.id)
        .in("event_id", eventIds);
      if (error) throw new Error(error.message);
      return (data ?? []) as EventRegistration[];
    },
  });
}

export function useEventRegistrationCounts(eventIds: string[]) {
  return useQuery({
    queryKey: ["event-reg-counts", eventIds.join(",")],
    enabled: eventIds.length > 0,
    staleTime: 15_000,
    queryFn: async () => {
      const { data, error } = await sb
        .from("event_registrations")
        .select("event_id, status")
        .in("event_id", eventIds)
        .eq("status", "inscrit");
      if (error) throw new Error(error.message);
      const counts: Record<string, number> = {};
      for (const r of (data ?? []) as Array<{ event_id: string }>) {
        counts[r.event_id] = (counts[r.event_id] ?? 0) + 1;
      }
      return counts;
    },
  });
}

export function useCreateCoachEvent() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      titre: string;
      objectif?: string;
      lieu?: string;
      starts_at: string;
      capacity: number;
      audience: "escouade" | "libre";
      squad_id?: string | null;
    }) => {
      if (!user) throw new Error("Non connecté");
      const { data: event, error } = await sb
        .from("coach_events")
        .insert({
          coach_id: user.id,
          titre: payload.titre,
          objectif: payload.objectif || null,
          lieu: payload.lieu || null,
          starts_at: payload.starts_at,
          capacity: payload.capacity,
          audience: payload.audience,
          squad_id: payload.squad_id ?? null,
        })
        .select()
        .single();
      if (error) throw new Error(error.message);

      // Destinataires : membres escouade ou tous les abonnés
      let destIds: string[] = [];
      if (payload.audience === "escouade" && payload.squad_id) {
        const { data: members } = await sb
          .from("squad_members")
          .select("abonne_id")
          .eq("squad_id", payload.squad_id);
        destIds = (members ?? []).map((m: { abonne_id: string }) => m.abonne_id);
      } else {
        const { data: assigns } = await sb
          .from("coach_assignments")
          .select("abonne_id")
          .eq("coach_id", user.id);
        destIds = (assigns ?? []).map((a: { abonne_id: string }) => a.abonne_id);
      }

      if (destIds.length) {
        const regs = destIds.map((uid) => ({
          event_id: event.id,
          user_id: uid,
          status: "invite",
        }));
        await sb.from("event_registrations").insert(regs);

        const prenom = await getMyPrenom(user.id);
        const quand = new Date(payload.starts_at).toLocaleString("fr-FR", {
          weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
        });
        for (const uid of destIds) {
          await notify(
            uid,
            "evenement",
            `${prenom} propose un événement`,
            `${payload.titre} · ${quand}${payload.lieu ? ` · ${payload.lieu}` : ""}. Inscris-toi ou refuse.`,
            "/fusionfit/agenda",
          );
        }
      }

      return event as CoachEvent;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["coach-events"] });
      qc.invalidateQueries({ queryKey: ["event-regs"] });
      qc.invalidateQueries({ queryKey: ["event-reg-counts"] });
    },
  });
}

export function useRespondEvent() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (p: { eventId: string; status: "inscrit" | "refuse"; coachId: string; titre: string }) => {
      if (!user) throw new Error("Non connecté");

      if (p.status === "inscrit") {
        const { count } = await sb
          .from("event_registrations")
          .select("id", { count: "exact", head: true })
          .eq("event_id", p.eventId)
          .eq("status", "inscrit");
        const { data: ev } = await sb.from("coach_events").select("capacity").eq("id", p.eventId).maybeSingle();
        if (ev && (count ?? 0) >= ev.capacity) {
          throw new Error("Plus de places disponibles.");
        }
      }

      const { error } = await sb
        .from("event_registrations")
        .upsert(
          { event_id: p.eventId, user_id: user.id, status: p.status, updated_at: new Date().toISOString() },
          { onConflict: "event_id,user_id" },
        );
      if (error) throw new Error(error.message);

      const prenom = await getMyPrenom(user.id);
      await notify(
        p.coachId,
        "evenement",
        p.status === "inscrit" ? `${prenom} s'inscrit` : `${prenom} refuse`,
        `Événement « ${p.titre} »`,
        "/fusionfit/agenda",
      );
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["event-regs"] });
      qc.invalidateQueries({ queryKey: ["event-reg-counts"] });
      qc.invalidateQueries({ queryKey: ["coach-events"] });
    },
  });
}

/** Poll rappels créneaux + événements (H-1). */
export function useAgendaRemindersPoll() {
  const { user } = useAuth();
  useEffect(() => {
    if (!user) return;
    const tick = () => {
      void sb.rpc("send_creneau_reminders");
      void sb.rpc("send_event_reminders");
    };
    tick();
    const id = setInterval(tick, 5 * 60_000);
    return () => clearInterval(id);
  }, [user]);
}
