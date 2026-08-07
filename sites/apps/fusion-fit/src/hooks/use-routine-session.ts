import { useState, useEffect, useCallback, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useTodayCheckin, useSaveCheckin, type SaveCheckinPayload } from "@/hooks/use-checkins";
import { useMyCoachSession } from "@/hooks/use-coaching";
import { useAuth } from "@/hooks/use-auth";
import {
  generateRoutine,
  type CheckInState,
  type RoutineBlock,
} from "@/lib/routine-generator";
import {
  coachToBlocks,
  totalExercises,
  totalDone,
  blockDone,
  STORAGE_KEY,
  type ExerciseState,
} from "@/lib/routine-utils";

export function useRoutineSession() {
  const { data: todayCheckin, isLoading, refetch: refetchToday } = useTodayCheckin();
  const { mutateAsync: saveCheckinAsync, isPending: isSaving } = useSaveCheckin();
  const qc = useQueryClient();
  const { user } = useAuth();

  const [step, setStep] = useState<"checkin" | "routine">("checkin");
  const [checkIn, setCheckIn] = useState<CheckInState>({
    temps: null,
    energie: null,
    humeur: null,
    objectif_du_jour: null,
  });
  const [exState, setExState] = useState<ExerciseState>({});
  const [expandedTips, setExpandedTips] = useState<Set<string>>(new Set());
  const [expandedScaling, setExpandedScaling] = useState<Set<string>>(new Set());
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionStartedAt, setSessionStartedAt] = useState<string | null>(null);
  const [sessionEndedAt, setSessionEndedAt] = useState<string | null>(null);
  const [sessionEnded, setSessionEnded] = useState<boolean>(false);
  const [ressentiScore, setRessentiScore] = useState<number | null>(null);
  const [ressentiNote, setRessentiNote] = useState<string>("");
  const [now, setNow] = useState<number>(() => Date.now());
  const [source, setSource] = useState<"base" | "coach">("base");

  const initialized = useRef(false);
  const { data: coachSession, isLoading: coachSessionLoading } = useMyCoachSession();

  useEffect(() => {
    if (isLoading) return;
    // Attendre la séance perso si on doit restaurer une session coach
    if (
      todayCheckin &&
      !todayCheckin.session_ended &&
      todayCheckin.session_source === "coach" &&
      coachSessionLoading
    ) {
      return;
    }
    if (initialized.current) return;
    initialized.current = true;

    if (todayCheckin && !todayCheckin.session_ended) {
      setSessionId(todayCheckin.id);
      setCheckIn({
        temps: todayCheckin.temps,
        energie: todayCheckin.energie,
        humeur: todayCheckin.humeur,
        objectif_du_jour: todayCheckin.objectif_du_jour ?? null,
      });
      const isCoach = todayCheckin.session_source === "coach" && !!coachSession;
      setSource(isCoach ? "coach" : "base");
      const restored: ExerciseState = {};
      const r = isCoach && coachSession
        ? coachToBlocks(coachSession)
        : generateRoutine({
            temps: todayCheckin.temps,
            energie: todayCheckin.energie,
            humeur: todayCheckin.humeur,
            objectif_du_jour: todayCheckin.objectif_du_jour ?? null,
          });
      todayCheckin.blocs_completes.forEach((bi: number) => {
        restored[bi] = r[bi] ? r[bi].exercises.map((_, j) => j) : [];
      });
      setExState(restored);
      setSessionStartedAt(todayCheckin.session_started_at);
      setSessionEndedAt(todayCheckin.session_ended_at);
      setSessionEnded(todayCheckin.session_ended);
      setRessentiScore(todayCheckin.ressenti_score);
      setRessentiNote(todayCheckin.ressenti_note ?? "");
      setStep("routine");
      return;
    }
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.date === new Date().toISOString().slice(0, 10) && parsed.checkIn) {
          setCheckIn(parsed.checkIn);
        }
      }
    } catch { /* ignore */ }
  }, [isLoading, todayCheckin, coachSession, coachSessionLoading]);

  useEffect(() => {
    if (step !== "routine" || !sessionStartedAt || sessionEndedAt) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [step, sessionStartedAt, sessionEndedAt]);

  const canGenerate =
    checkIn.temps !== null &&
    checkIn.energie !== null &&
    checkIn.humeur !== null &&
    !!checkIn.objectif_du_jour?.trim();
  const routine: RoutineBlock[] =
    step !== "routine" ? []
    : source === "coach" && coachSession ? coachToBlocks(coachSession)
    : generateRoutine(checkIn);
  const total = totalExercises(routine);
  const done = totalDone(routine, exState);
  const serenite = total === 0 ? 0 : Math.round((done / total) * 100);

  const elapsedSec = sessionStartedAt
    ? Math.max(0, Math.floor(((sessionEndedAt ? new Date(sessionEndedAt).getTime() : now) - new Date(sessionStartedAt).getTime()) / 1000))
    : 0;

  useEffect(() => {
    if (step === "checkin" && !canGenerate) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      date: new Date().toISOString().slice(0, 10),
      step, checkIn,
    }));
  }, [step, checkIn, canGenerate]);

  const persistCheckin = useCallback(async (
    ci: CheckInState,
    es: ExerciseState,
    blocks: RoutineBlock[],
    extra?: Partial<SaveCheckinPayload>,
    explicitId?: string | null,
  ): Promise<string | null> => {
    if (!ci.temps || !ci.energie || !ci.humeur) return null;
    const completed = blocks.map((b, i) => blockDone(b, i, es) ? i : -1).filter((i) => i >= 0);
    const t = totalExercises(blocks);
    const d = totalDone(blocks, es);
    const s = t === 0 ? 0 : Math.round((d / t) * 100);
    const targetId = explicitId !== undefined ? explicitId : sessionId;
    const row = await saveCheckinAsync({
      ...(targetId ? { id: targetId } : {}),
      temps: ci.temps,
      energie: ci.energie,
      humeur: ci.humeur,
      objectif_du_jour: ci.objectif_du_jour?.trim() || null,
      blocs_completes: completed,
      nb_blocs: blocks.length,
      serenite: s,
      ...extra,
    });
    if (!targetId) setSessionId(row.id);
    return row.id;
  }, [saveCheckinAsync, sessionId]);

  async function handleGenerate(chosen: "base" | "coach" = "base") {
    setSource(chosen);
    setStep("routine");
    setSessionStartedAt(null);
    setSessionEndedAt(null);
    setSessionEnded(false);
    setExState({});
    setRessentiScore(null);
    setRessentiNote("");
    setSessionId(null);
    setNow(Date.now());
    const blocks = chosen === "coach" && coachSession ? coachToBlocks(coachSession) : generateRoutine(checkIn);
    await persistCheckin(checkIn, {}, blocks, {
      session_started_at: null,
      session_ended_at: null,
      session_duration_sec: null,
      session_ended: false,
      ressenti_score: null,
      ressenti_note: null,
      session_source: chosen,
    }, null);
  }

  function toggleExercise(blockIdx: number, exIdx: number) {
    if (sessionEnded) return;
    const cur = new Set(exState[blockIdx] ?? []);
    if (cur.has(exIdx)) cur.delete(exIdx); else cur.add(exIdx);
    const next = { ...exState, [blockIdx]: [...cur] };
    setExState(next);
    void persistCheckin(checkIn, next, routine);
  }

  async function handleEndSession() {
    const endedAt = new Date().toISOString();
    const duration = sessionStartedAt
      ? Math.max(0, Math.floor((new Date(endedAt).getTime() - new Date(sessionStartedAt).getTime()) / 1000))
      : null;
    setSessionEndedAt(endedAt);
    setSessionEnded(true);
    await persistCheckin(checkIn, exState, routine, {
      session_ended_at: endedAt,
      session_duration_sec: duration,
      session_ended: true,
    });
    await Promise.all([
      refetchToday(),
      qc.invalidateQueries({ queryKey: ["checkins", user?.id] }),
    ]);
  }

  async function handleSaveRessenti(score: number, note: string) {
    setRessentiScore(score);
    setRessentiNote(note);
    await persistCheckin(checkIn, exState, routine, {
      ressenti_score: score,
      ressenti_note: note || null,
    });
    await qc.invalidateQueries({ queryKey: ["checkins", user?.id] });
  }

  function toggleTip(key: string) {
    setExpandedTips((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  }

  function toggleScaling(key: string) {
    setExpandedScaling((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  }

  function reset() {
    initialized.current = false;
    setSource("base");
    setStep("checkin");
    setCheckIn({ temps: null, energie: null, humeur: null, objectif_du_jour: null });
    setExState({});
    setSessionId(null);
    setSessionStartedAt(null);
    setSessionEndedAt(null);
    setSessionEnded(false);
    setRessentiScore(null);
    setRessentiNote("");
    localStorage.removeItem(STORAGE_KEY);
  }

  function startSession() {
    const startedAt = new Date().toISOString();
    setSessionStartedAt(startedAt);
    setNow(Date.now());
    persistCheckin(checkIn, exState, routine, { session_started_at: startedAt });
  }

  return {
    isLoading,
    isSaving,
    todayCheckin,
    coachSession,
    step,
    checkIn,
    setCheckIn,
    exState,
    expandedTips,
    expandedScaling,
    sessionStartedAt,
    sessionEnded,
    ressentiScore,
    ressentiNote,
    source,
    canGenerate,
    routine,
    total,
    done,
    serenite,
    elapsedSec,
    handleGenerate,
    toggleExercise,
    handleEndSession,
    handleSaveRessenti,
    toggleTip,
    toggleScaling,
    reset,
    startSession,
  };
}

export type RoutineSessionApi = ReturnType<typeof useRoutineSession>;
