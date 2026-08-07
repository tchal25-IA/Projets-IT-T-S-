import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./use-auth";
import { getMyPrenom, notify } from "./use-notifications";
import { CRENEAUX_FREE_MONTHLY_LIMIT, canAccessFeature } from "@/lib/plan-gates";

export type TrainingSlot = {
  id: string;
  abonne_id: string;
  coach_id: string;
  date_slot: string;
  duree_min: number;
  lieu: string | null;
  note: string | null;
  status: string;
  proposed_by: string;
  created_at: string;
};

export function useMyCoachId() {
  const { user, role } = useAuth();
  return useQuery({
    queryKey: ["my-coach-id", user?.id],
    enabled: !!user && role === "abonne",
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

export function useTrainingSlots() {
  const { user, role } = useAuth();
  return useQuery({
    queryKey: ["training-slots", user?.id, role],
    enabled: !!user,
    staleTime: 20_000,
    queryFn: async () => {
      let q = supabase.from("training_slots").select("*").order("date_slot", { ascending: true });
      if (role === "coach") q = q.eq("coach_id", user!.id);
      else q = q.eq("abonne_id", user!.id);
      const { data, error } = await q;
      if (error) throw new Error(error.message);
      return (data ?? []) as TrainingSlot[];
    },
  });
}

export function useMyAbonnement() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["my-abonnement", user?.id],
    enabled: !!user,
    staleTime: 60_000,
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("abonnement_plan, abonnement_statut, abonnement_depuis")
        .eq("user_id", user!.id)
        .maybeSingle();
      return {
        plan: (data?.abonnement_plan as string) ?? "decouverte",
        statut: (data?.abonnement_statut as string) ?? "essai",
        depuis: data?.abonnement_depuis as string | null,
      };
    },
  });
}

export function useCreateCreneau() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data: abonnement } = useMyAbonnement();
  const { data: slots } = useTrainingSlots();
  const { data: coachId } = useMyCoachId();

  return useMutation({
    mutationFn: async (input: {
      date_slot: string;
      duree_min: number;
      lieu?: string;
      note?: string;
      coach_id?: string;
      abonne_id?: string;
    }) => {
      if (!user) throw new Error("Non authentifié");

      const unlimited = canAccessFeature(
        "creneaux_illimites",
        abonnement?.plan,
        abonnement?.statut,
      );
      if (!unlimited) {
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        const count =
          slots?.filter(
            (s) => s.abonne_id === user.id && s.created_at >= monthStart && s.status !== "refuse",
          ).length ?? 0;
        if (count >= CRENEAUX_FREE_MONTHLY_LIMIT) {
          throw new Error(
            `Limite de ${CRENEAUX_FREE_MONTHLY_LIMIT} créneaux/mois atteinte. Passe en Initiative pour illimité.`,
          );
        }
      }

      const coach_id = input.coach_id ?? coachId;
      if (!coach_id) throw new Error("Aucun coach assigné");

      const row = {
        abonne_id: input.abonne_id ?? user.id,
        coach_id,
        date_slot: input.date_slot,
        duree_min: input.duree_min,
        lieu: input.lieu ?? "",
        note: input.note ?? "",
        status: "propose",
        proposed_by: user.id,
      };

      const { data, error } = await supabase.from("training_slots").insert(row).select().single();
      if (error) throw new Error(error.message);

      const prenom = await getMyPrenom(user.id);
      const dest = row.coach_id === user.id ? row.abonne_id : row.coach_id;
      await notify(
        dest,
        "creneau",
        `Créneau proposé par ${prenom}`,
        input.note || "Nouvelle demande de créneau",
        "/fusionfit/agenda",
      );
      await supabase.rpc("enqueue_email_for_user", {
        p_user_id: dest,
        p_subject: `Créneau proposé par ${prenom}`,
        p_body: input.note || "Nouvelle demande de créneau sur FusionFit.",
        p_kind: "creneau",
      });

      return data as TrainingSlot;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["training-slots"] });
    },
  });
}

export function useUpdateCreneauStatus() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      status,
      date_slot,
      note,
      notifyUserId,
    }: {
      id: string;
      status: string;
      date_slot?: string;
      note?: string;
      notifyUserId: string;
    }) => {
      if (!user) throw new Error("Non authentifié");
      const patch: {
        status: string;
        date_slot?: string;
        note?: string;
      } = { status };
      if (date_slot) patch.date_slot = date_slot;
      if (note !== undefined) patch.note = note;
      const { error } = await supabase.from("training_slots").update(patch).eq("id", id);
      if (error) throw new Error(error.message);

      const prenom = await getMyPrenom(user.id);
      const label =
        status === "valide"
          ? "validé"
          : status === "refuse"
            ? "refusé"
            : status === "contre_propose"
              ? "contre-proposé"
              : "mis à jour";
      await notify(
        notifyUserId,
        "creneau",
        `Créneau ${label} par ${prenom}`,
        note || undefined,
        "/fusionfit/agenda",
      );
      await supabase.rpc("enqueue_email_for_user", {
        p_user_id: notifyUserId,
        p_subject: `Créneau ${label} — FusionFit`,
        p_body: note || `Ton créneau a été ${label}.`,
        p_kind: "creneau",
      });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["training-slots"] }),
  });
}
