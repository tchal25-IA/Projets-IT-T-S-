import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase as supabaseTyped } from "@/integrations/supabase/client";
// Tables atelier/calendar/journal pas encore dans types générés
const supabase = supabaseTyped as any;
import { useAuth } from "./use-auth";
import type { LibraryHit } from "./use-library-search";

export type AtelierPhase = "warm_up" | "main" | "cool_down";
export type AtelierBlockType =
  | "single"
  | "superset"
  | "circuit"
  | "amrap"
  | "emom"
  | "tabata"
  | "chipper"
  | "rest";

export type AtelierSession = {
  id: string;
  coach_id: string;
  kind: "template" | "instance";
  athlete_id: string | null;
  source_session_id: string | null;
  title: string;
  objectif: string | null;
  scheduled_for: string | null;
  status: string;
  customized: boolean;
  version: number;
  created_at: string;
  updated_at: string;
};

export type AtelierBlock = {
  id: string;
  session_id: string;
  phase: AtelierPhase;
  block_type: AtelierBlockType;
  position: string;
  config: Record<string, unknown>;
};

export type AtelierItem = {
  id: string;
  block_id: string;
  library_item_id: string | null;
  library_item_revision: number | null;
  exercise_snapshot: Record<string, unknown>;
  position: string;
  level: number | null;
  sets: number | null;
  reps: number | null;
  duration_s: number | null;
  load: string | null;
  tempo: string | null;
  rest_s: number | null;
  rpe: number | null;
  note: string | null;
};

function nextPos(existing: string[]): string {
  return `a${existing.length.toString(36)}`;
}

export function useAtelierTemplates() {
  const { user, role } = useAuth();
  return useQuery({
    queryKey: ["atelier-templates", user?.id],
    enabled: !!user && role === "coach",
    staleTime: 15_000,
    queryFn: async (): Promise<AtelierSession[]> => {
      const { data, error } = await supabase
        .from("atelier_sessions")
        .select("*")
        .eq("coach_id", user!.id)
        .eq("kind", "template")
        .order("updated_at", { ascending: false });
      if (error) throw new Error(error.message);
      return (data ?? []) as AtelierSession[];
    },
  });
}

export function useAtelierSessionDetail(sessionId: string | null) {
  return useQuery({
    queryKey: ["atelier-session", sessionId],
    enabled: !!sessionId,
    queryFn: async () => {
      const { data: session, error } = await supabase
        .from("atelier_sessions")
        .select("*")
        .eq("id", sessionId!)
        .maybeSingle();
      if (error) throw new Error(error.message);
      if (!session) return null;

      const { data: blocks, error: bErr } = await supabase
        .from("atelier_session_blocks")
        .select("*")
        .eq("session_id", sessionId!)
        .order("position");
      if (bErr) throw new Error(bErr.message);

      const blockIds = (blocks ?? []).map((b: { id: string }) => b.id);
      let items: AtelierItem[] = [];
      if (blockIds.length) {
        const { data: its, error: iErr } = await supabase
          .from("atelier_session_items")
          .select("*")
          .in("block_id", blockIds)
          .order("position");
        if (iErr) throw new Error(iErr.message);
        items = (its ?? []) as AtelierItem[];
      }

      return {
        session: session as AtelierSession,
        blocks: (blocks ?? []) as AtelierBlock[],
        items,
      };
    },
  });
}

export function useAtelierMutations() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const invalidate = (sessionId?: string) => {
    qc.invalidateQueries({ queryKey: ["atelier-templates"] });
    if (sessionId) qc.invalidateQueries({ queryKey: ["atelier-session", sessionId] });
  };

  const createTemplate = useMutation({
    mutationFn: async (input: { title: string; objectif?: string }) => {
      if (!user) throw new Error("Non connecté");
      const { data: session, error } = await supabase
        .from("atelier_sessions")
        .insert({
          coach_id: user.id,
          kind: "template",
          title: input.title.trim(),
          objectif: input.objectif?.trim() || null,
          status: "draft",
          created_by: user.id,
        })
        .select("*")
        .single();
      if (error) throw new Error(error.message);

      const phases: AtelierPhase[] = ["warm_up", "main", "cool_down"];
      const { error: bErr } = await supabase.from("atelier_session_blocks").insert(
        phases.map((phase, i) => ({
          session_id: session.id,
          phase,
          block_type: "single",
          position: `a${i}`,
          config: {},
        })),
      );
      if (bErr) throw new Error(bErr.message);
      return session as AtelierSession;
    },
    onSuccess: () => invalidate(),
  });

  const updateSessionMeta = useMutation({
    mutationFn: async (input: { id: string; title?: string; objectif?: string | null; status?: string }) => {
      const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
      if (input.title !== undefined) patch.title = input.title;
      if (input.objectif !== undefined) patch.objectif = input.objectif;
      if (input.status !== undefined) patch.status = input.status;
      const { error } = await supabase.from("atelier_sessions").update(patch).eq("id", input.id);
      if (error) throw new Error(error.message);
      return input.id;
    },
    onSuccess: (id) => invalidate(id),
  });

  const addItemFromLibrary = useMutation({
    mutationFn: async (input: {
      sessionId: string;
      phase: AtelierPhase;
      hit: LibraryHit;
      level?: number;
    }) => {
      const { data: blocks, error: bErr } = await supabase
        .from("atelier_session_blocks")
        .select("*")
        .eq("session_id", input.sessionId)
        .eq("phase", input.phase)
        .order("position");
      if (bErr) throw new Error(bErr.message);

      let block = (blocks ?? [])[0] as AtelierBlock | undefined;
      if (!block) {
        const { data: created, error } = await supabase
          .from("atelier_session_blocks")
          .insert({
            session_id: input.sessionId,
            phase: input.phase,
            block_type: "single",
            position: nextPos([]),
            config: {},
          })
          .select("*")
          .single();
        if (error) throw new Error(error.message);
        block = created as AtelierBlock;
      }

      const { data: existing } = await supabase
        .from("atelier_session_items")
        .select("position")
        .eq("block_id", block.id);
      const pos = nextPos((existing ?? []).map((e: { position: string }) => e.position));

      const snap = {
        code: input.hit.code,
        nom_fr: input.hit.nom_fr,
        nom_en: input.hit.nom_en,
        categorie: input.hit.categorie,
        materiel: input.hit.materiel,
        muscles_principaux: input.hit.muscles_principaux,
      };

      const { error: iErr } = await supabase.from("atelier_session_items").insert({
        block_id: block.id,
        library_item_id: input.hit.id,
        exercise_snapshot: snap,
        position: pos,
        level: input.level ?? 2,
        sets: 3,
        reps: 10,
      });
      if (iErr) throw new Error(iErr.message);

      await supabase
        .from("atelier_sessions")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", input.sessionId);
      return input.sessionId;
    },
    onSuccess: (id) => invalidate(id),
  });

  const updateItem = useMutation({
    mutationFn: async (input: {
      sessionId: string;
      itemId: string;
      patch: Partial<Pick<AtelierItem, "level" | "sets" | "reps" | "duration_s" | "load" | "tempo" | "rest_s" | "rpe" | "note">>;
    }) => {
      const { error } = await supabase
        .from("atelier_session_items")
        .update(input.patch)
        .eq("id", input.itemId);
      if (error) throw new Error(error.message);
      await supabase
        .from("atelier_sessions")
        .update({ updated_at: new Date().toISOString(), customized: true })
        .eq("id", input.sessionId);
      return input.sessionId;
    },
    onSuccess: (id) => invalidate(id),
  });

  const deleteItem = useMutation({
    mutationFn: async (input: { sessionId: string; itemId: string }) => {
      const { error } = await supabase.from("atelier_session_items").delete().eq("id", input.itemId);
      if (error) throw new Error(error.message);
      return input.sessionId;
    },
    onSuccess: (id) => invalidate(id),
  });

  const deleteTemplate = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("atelier_sessions").delete().eq("id", id).eq("kind", "template");
      if (error) throw new Error(error.message);
    },
    onSuccess: () => invalidate(),
  });

  const assignTemplate = useMutation({
    mutationFn: async (input: {
      templateId: string;
      athleteIds: string[];
      scheduledFor?: string | null;
    }) => {
      const key = `assign-${input.templateId}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const { data, error } = await supabase.rpc("assign_atelier_template", {
        p_template_id: input.templateId,
        p_athlete_ids: input.athleteIds,
        p_idempotency_key: key,
        p_scheduled_for: input.scheduledFor ?? null,
      });
      if (error) throw new Error(error.message);
      return data as {
        batch_id: string;
        ok_count: number;
        instance_ids: string[];
        failures: Array<{ athlete_id: string; error: string }>;
      };
    },
    onSuccess: () => invalidate(),
  });

  const moveItemPhase = useMutation({
    mutationFn: async (input: {
      sessionId: string;
      itemId: string;
      fromBlockId: string;
      toPhase: AtelierPhase;
    }) => {
      const { data: blocks, error: bErr } = await supabase
        .from("atelier_session_blocks")
        .select("*")
        .eq("session_id", input.sessionId)
        .eq("phase", input.toPhase)
        .order("position");
      if (bErr) throw new Error(bErr.message);
      let block = (blocks ?? [])[0] as AtelierBlock | undefined;
      if (!block) {
        const { data: created, error } = await supabase
          .from("atelier_session_blocks")
          .insert({
            session_id: input.sessionId,
            phase: input.toPhase,
            block_type: "single",
            position: "a0",
            config: {},
          })
          .select("*")
          .single();
        if (error) throw new Error(error.message);
        block = created as AtelierBlock;
      }
      const { data: existing } = await supabase
        .from("atelier_session_items")
        .select("position")
        .eq("block_id", block.id);
      const pos = nextPos((existing ?? []).map((e: { position: string }) => e.position));
      const { error } = await supabase
        .from("atelier_session_items")
        .update({ block_id: block.id, position: pos })
        .eq("id", input.itemId);
      if (error) throw new Error(error.message);
      return input.sessionId;
    },
    onSuccess: (id) => invalidate(id),
  });

  return {
    createTemplate,
    updateSessionMeta,
    addItemFromLibrary,
    updateItem,
    deleteItem,
    deleteTemplate,
    assignTemplate,
    moveItemPhase,
  };
}
