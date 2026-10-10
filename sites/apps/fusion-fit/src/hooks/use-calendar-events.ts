import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase as supabaseTyped } from "@/integrations/supabase/client";
// Tables atelier/calendar/journal pas encore dans types générés
const supabase = supabaseTyped as any;
import { useAuth } from "./use-auth";

export type CalendarEvent = {
  id: string;
  coach_id: string;
  athlete_id: string | null;
  event_type: string;
  title: string;
  description: string | null;
  starts_at: string;
  ends_at: string | null;
  rpe_planned: number | null;
  duration_min: number | null;
  load_ua: number | null;
  status: string;
};

export function useCalendarEvents(rangeStart: Date, rangeEnd: Date) {
  const { user, role } = useAuth();
  return useQuery({
    queryKey: ["calendar-events", user?.id, rangeStart.toISOString(), rangeEnd.toISOString()],
    enabled: !!user,
    staleTime: 30_000,
    queryFn: async (): Promise<CalendarEvent[]> => {
      let q = supabase
        .from("calendar_events")
        .select("*")
        .gte("starts_at", rangeStart.toISOString())
        .lte("starts_at", rangeEnd.toISOString())
        .order("starts_at");
      if (role === "coach") q = q.eq("coach_id", user!.id);
      else q = q.eq("athlete_id", user!.id);
      const { data, error } = await q;
      if (error) throw new Error(error.message);
      return (data ?? []) as CalendarEvent[];
    },
  });
}

export function useCreateCalendarEvent() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      title: string;
      athleteId?: string | null;
      startsAt: string;
      durationMin?: number;
      rpePlanned?: number;
      eventType?: string;
    }) => {
      if (!user) throw new Error("Non connecté");
      const duration = input.durationMin ?? 60;
      const rpe = input.rpePlanned ?? null;
      const { error } = await supabase.from("calendar_events").insert({
        coach_id: user.id,
        athlete_id: input.athleteId ?? null,
        event_type: input.eventType ?? "session",
        title: input.title.trim(),
        starts_at: input.startsAt,
        duration_min: duration,
        rpe_planned: rpe,
        load_ua: rpe != null ? rpe * duration : null,
        status: "planned",
      });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["calendar-events"] }),
  });
}
