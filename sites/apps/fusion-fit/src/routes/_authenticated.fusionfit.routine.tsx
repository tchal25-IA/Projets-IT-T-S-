import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useCallback, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Zap, Clock, Flame, Brain, ChevronRight, Play, RotateCcw, CheckCircle2, Circle, CalendarCheck, Info, Timer, Square, Smile, Shuffle } from "lucide-react";
import { useTodayCheckin, useSaveCheckin, type SaveCheckinPayload } from "@/hooks/use-checkins";
import { useMyCoachSession, type CoachSession } from "@/hooks/use-coaching";
import { useMyProgram } from "@/hooks/use-program";
import { useAuth } from "@/hooks/use-auth";
import { ProgrammeJourCard } from "@/components/programme-jour-card";
import {
  generateRoutine, tipFor, scalingFor, splitFormat,
  type CheckInState, type RoutineBlock,
} from "@/lib/routine-generator";
import { FF, PILIER_COLORS } from "@/lib/ff-colors";

export const Route = createFileRoute("/_authenticated/fusionfit/routine")({
  component: RoutinePage,
});

const TEMPS_OPTIONS = [
  { value: 1, label: "15 min", sub: "Sprint" },
  { value: 2, label: "30 min", sub: "Standard" },
  { value: 3, label: "60 min+", sub: "Complète" },
];
const ENERGIE_LABELS = ["", "Épuisé", "Fatigué", "Neutre", "Dynamisé", "Au max"];
const HUMEUR_LABELS  = ["", "Stressé", "Bas", "Neutre", "Positif", "Invincible"];

// Convertit la séance perso du coach en blocs jouables (mêmes cases à cocher).
function coachToBlocks(cs: CoachSession): RoutineBlock[] {
  return (cs.blocs ?? []).map((b) => ({
    pilier: b.pilier,
    titre: b.titre || "Bloc",
    duree: "Coach",
    exercises: b.exercices ?? [],
    intensite: "Modérée" as const,
  }));
}

const STORAGE_KEY = "ff-routine-state";

// completedExercises: Record<blockIndex, exerciseIndex[]>
type ExerciseState = Record<number, number[]>;

function totalExercises(routine: RoutineBlock[]) {
  return routine.reduce((sum, b) => sum + b.exercises.length, 0);
}
function totalDone(routine: RoutineBlock[], state: ExerciseState) {
  return routine.reduce((sum, b, i) => sum + (state[i]?.length ?? 0), 0);
}
function blockDone(block: RoutineBlock, i: number, state: ExerciseState) {
  return (state[i]?.length ?? 0) >= block.exercises.length;
}

function RoutinePage() {
  const { data: todayCheckin, isLoading, refetch: refetchToday } = useTodayCheckin();
  const { mutateAsync: saveCheckinAsync, isPending: isSaving } = useSaveCheckin();
  const { data: program } = useMyProgram();
  const qc = useQueryClient();
  const { user } = useAuth();

  const [step, setStep]       = useState<"checkin" | "routine">("checkin");
  const [checkIn, setCheckIn] = useState<CheckInState>({ temps: null, energie: null, humeur: null });
  const [exState, setExState] = useState<ExerciseState>({});
  const [expandedTips, setExpandedTips] = useState<Set<string>>(new Set());
  const [expandedScaling, setExpandedScaling] = useState<Set<string>>(new Set());
  // Identité de la session courante (ligne en BDD)
  const [sessionId, setSessionId] = useState<string | null>(null);
  // Chronomètre & fin de session
  const [sessionStartedAt, setSessionStartedAt] = useState<string | null>(null);
  const [sessionEndedAt, setSessionEndedAt]     = useState<string | null>(null);
  const [sessionEnded, setSessionEnded]         = useState<boolean>(false);
  const [ressentiScore, setRessentiScore]       = useState<number | null>(null);
  const [ressentiNote, setRessentiNote]         = useState<string>("");
  const [now, setNow] = useState<number>(() => Date.now());
  // Source de la séance : programme de base auto-généré ou séance perso du coach
  const [source, setSource] = useState<"base" | "coach">("base");
  const { data: coachSession } = useMyCoachSession();

  const initialized = useRef(false);

  useEffect(() => {
    if (isLoading) return;
    if (initialized.current) return;
    initialized.current = true;

    if (todayCheckin && !todayCheckin.session_ended) {
      // On reprend la session du jour qui n'est pas encore terminée
      setSessionId(todayCheckin.id);
      setCheckIn({ temps: todayCheckin.temps, energie: todayCheckin.energie, humeur: todayCheckin.humeur });
      const isCoach = todayCheckin.session_source === "coach";
      setSource(isCoach ? "coach" : "base");
      const restored: ExerciseState = {};
      const r = isCoach && coachSession
        ? coachToBlocks(coachSession)
        : generateRoutine({ temps: todayCheckin.temps, energie: todayCheckin.energie, humeur: todayCheckin.humeur });
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
    // Sinon, page check-in vierge (la dernière session est terminée ou il n'y en a pas)
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.date === new Date().toISOString().slice(0, 10) && parsed.checkIn) {
          setCheckIn(parsed.checkIn);
        }
      }
    } catch { /* ignore */ }
  }, [isLoading, todayCheckin]);

  useEffect(() => {
    if (step !== "routine" || !sessionStartedAt || sessionEndedAt) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [step, sessionStartedAt, sessionEndedAt]);

  const canGenerate = checkIn.temps !== null && checkIn.energie !== null && checkIn.humeur !== null;
  const routine =
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
      temps: ci.temps, energie: ci.energie, humeur: ci.humeur,
      blocs_completes: completed, nb_blocs: blocks.length, serenite: s,
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
    // Force la création d'une nouvelle ligne (explicitId=null). Le chrono ne
    // démarre plus automatiquement ici : l'athlète prépare son matériel et
    // clique "Démarrer" quand il est prêt (cf. bouton plus bas).
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
    // Force la mise à jour immédiate de l'historique et des stats
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
    setCheckIn({ temps: null, energie: null, humeur: null });
    setExState({});
    setSessionId(null);
    setSessionStartedAt(null);
    setSessionEndedAt(null);
    setSessionEnded(false);
    setRessentiScore(null);
    setRessentiNote("");
    localStorage.removeItem(STORAGE_KEY);
  }


  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-6 w-6 rounded-full border-2 animate-spin" style={{ borderColor: FF.cyan, borderTopColor: "transparent" }} />
      </div>
    );
  }


  if (step === "routine") {
    return (
      <div className="space-y-5">
        {source === "coach" && coachSession && (
          <div className="rounded-2xl p-3 border" style={{ background: FF.cyanBg20, borderColor: FF.cyan }}>
            <p className="text-[10px] font-mono uppercase tracking-[0.2em]" style={{ color: FF.cyan }}>
              ★ Séance de ton coach
            </p>
            <p className="font-bold text-sm mt-0.5" style={{ color: FF.text }}>{coachSession.titre}</p>
            {coachSession.objectif && (
              <p className="text-xs mt-0.5" style={{ color: FF.textMuted }}>{coachSession.objectif}</p>
            )}
          </div>
        )}
        {/* Chronomètre de session */}
        <div className="rounded-2xl p-4 border flex items-center justify-between" style={{ background: FF.surface, borderColor: FF.border }}>
          <div className="flex items-center gap-3">
            <Timer className="h-5 w-5" style={{ color: sessionEnded ? FF.textMuted : FF.cyan }} />
            <div>
              <p className="text-[10px] font-mono uppercase tracking-[0.25em]" style={{ color: FF.textMuted }}>
                {sessionEnded ? "Session terminée" : sessionStartedAt ? "Session en cours" : "Session"}
              </p>
              <p className="text-xl font-bold tabular-nums" style={{ color: sessionEnded ? FF.textMuted : FF.cyan }}>
                {formatDuration(elapsedSec)}
              </p>
            </div>
          </div>
          {!sessionStartedAt && !sessionEnded && (
            <button
              onClick={() => {
                const startedAt = new Date().toISOString();
                setSessionStartedAt(startedAt);
                setNow(Date.now());
                persistCheckin(checkIn, exState, routine, { session_started_at: startedAt });
              }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-semibold uppercase tracking-widest"
              style={{ background: FF.cyanBg20, borderColor: FF.cyan, color: FF.cyan }}
            >
              <Play className="h-3.5 w-3.5" /> Démarrer
            </button>
          )}
          {sessionStartedAt && !sessionEnded && (
            <button
              onClick={handleEndSession}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-semibold uppercase tracking-widest"
              style={{ background: FF.surface2, borderColor: FF.border, color: FF.text }}
            >
              <Square className="h-3.5 w-3.5" /> Terminer
            </button>
          )}
        </div>

        {/* Jauge de Sérénité */}
        <div className="rounded-2xl p-5 border" style={{ background: FF.surface, borderColor: FF.border }}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-mono uppercase tracking-[0.25em]" style={{ color: FF.textMuted }}>
              Jauge de Sérénité
            </span>
            <span className="text-2xl font-bold tabular-nums" style={{ color: FF.cyan }}>{serenite}%</span>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ background: FF.surface2 }}>
            <div className="h-full rounded-full transition-all ff-glow-cyan" style={{ width: `${serenite}%`, background: FF.cyan }} />
          </div>
          <p className="mt-3 text-xs" style={{ color: FF.textMuted }}>
            {serenite === 100
              ? "✓ Mission accomplie — Agent confirmé."
              : `${total - done} exercice(s) restant(s)`}
          </p>
        </div>


        {/* Blocs de routine */}
        {routine.map((block, i) => {
          const allDone = blockDone(block, i, exState);
          const colors  = PILIER_COLORS[block.pilier];
          const checked = new Set(exState[i] ?? []);
          const { format, exercises: exList } = splitFormat(block.exercises);
          return (
            <div key={i} className="rounded-2xl border overflow-hidden transition-all"
              style={{ background: allDone ? colors.bg : FF.surface, borderColor: allDone ? colors.border : FF.border }}>
              {/* Block header */}
              <div className="flex items-center gap-3 px-4 pt-4 pb-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded border"
                      style={{ background: colors.bg, color: colors.text, borderColor: colors.border }}>
                      {block.pilier}
                    </span>
                    <span className="text-[11px] font-mono" style={{ color: FF.textMuted }}>
                      {block.duree} · {block.intensite}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap mt-1.5">
                    <h3 className="font-semibold text-base">{block.titre}</h3>
                    {format && (
                      <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full border"
                        style={{ borderColor: colors.border, color: colors.text }}>
                        {format}
                      </span>
                    )}
                  </div>
                </div>
                {allDone && (
                  <CheckCircle2 className="h-5 w-5 flex-shrink-0" style={{ color: colors.text }} />
                )}
              </div>

              {/* Individual exercises */}
              <ul className="px-4 pb-4 space-y-1.5">
                {exList.map((ex, j) => {
                  const exDone = checked.has(j + (block.exercises.length - exList.length));
                  const tipKey = `${i}-${j}`;
                  const tip = tipFor(ex);
                  const scaling = scalingFor(ex);
                  return (
                    <li key={j}>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => toggleExercise(i, j + (block.exercises.length - exList.length))}
                          aria-label={exDone ? "Décocher" : "Cocher"}
                          style={{ color: exDone ? colors.text : FF.textMuted }}
                          className="flex-shrink-0"
                        >
                          {exDone
                            ? <CheckCircle2 className="h-5 w-5" />
                            : <Circle className="h-5 w-5" />}
                        </button>
                        <span
                          className="text-sm flex-1 leading-snug"
                          style={{
                            color: exDone ? FF.textMuted : FF.text,
                            textDecoration: exDone ? "line-through" : "none",
                          }}
                        >
                          {ex}
                        </span>
                        {scaling && (
                          <button
                            onClick={() => toggleScaling(tipKey)}
                            aria-label="Alternative / scaling"
                            className="flex-shrink-0"
                            style={{ color: expandedScaling.has(tipKey) ? FF.cyan : FF.textMuted }}
                          >
                            <Shuffle className="h-3.5 w-3.5" />
                          </button>
                        )}
                        {tip && (
                          <button
                            onClick={() => toggleTip(tipKey)}
                            aria-label="Explication"
                            className="flex-shrink-0"
                            style={{ color: FF.textMuted }}
                          >
                            <Info className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                      {tip && expandedTips.has(tipKey) && (
                        <p className="ml-7 mt-0.5 text-[11px] leading-relaxed" style={{ color: FF.textMuted }}>
                          {tip}
                        </p>
                      )}
                      {scaling && expandedScaling.has(tipKey) && (
                        <p className="ml-7 mt-0.5 text-[11px] leading-relaxed rounded-lg px-2 py-1.5"
                          style={{ color: FF.cyan, background: FF.cyanBg }}>
                          🔄 {scaling}
                        </p>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}

        {/* Bouton principal — termine la séance, enregistre et actualise l'historique */}
        {sessionStartedAt && !sessionEnded && (
          <button
            onClick={handleEndSession}
            disabled={isSaving}
            className="w-full flex items-center justify-center gap-2 py-4 rounded-xl border text-sm font-bold uppercase tracking-widest disabled:opacity-60"
            style={{ background: FF.cyanBg20, borderColor: FF.cyan, color: FF.cyan, boxShadow: FF.glowCyan }}
          >
            <Square className="h-4 w-4" />
            {isSaving ? "Enregistrement…" : "Terminer la séance"}
          </button>
        )}


        {sessionEnded && (
          <RessentiQuiz
            initialScore={ressentiScore}
            initialNote={ressentiNote}
            durationSec={elapsedSec}
            onSave={handleSaveRessenti}
          />
        )}

        <button onClick={reset} className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border text-sm font-semibold uppercase tracking-widest"
          style={{ borderColor: FF.border, color: FF.textMuted, background: FF.surface }}>
          <RotateCcw className="h-4 w-4" />
          Nouveau check-in
        </button>
      </div>
    );
  }


  // ── Check-in ────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Séance du jour proposée par le coach (au-dessus du check-in) */}
      <ProgrammeJourCard program={program ?? null} />

      <div>
        <p className="text-[10px] font-mono uppercase tracking-[0.25em]" style={{ color: FF.cyan }}>
          // Sujet Zéro · Calibration
        </p>
        <h1 className="mt-2 text-2xl font-bold">Comment tu te sens aujourd'hui ?</h1>
        <p className="mt-1 text-sm" style={{ color: FF.textMuted }}>
          Trois petites questions pour t'aider à composer la séance qui te correspond.
        </p>
      </div>


      <Section icon={<Clock className="h-4 w-4" />} label="Temps disponible">
        <div className="grid grid-cols-3 gap-2">
          {TEMPS_OPTIONS.map((opt) => {
            const active = checkIn.temps === opt.value;
            return (
              <button key={opt.value} onClick={() => setCheckIn((s) => ({ ...s, temps: opt.value }))}
                className="flex flex-col items-center py-3 rounded-xl border text-center transition-all"
                style={{
                  background: active ? FF.cyanBg20 : FF.surface2,
                  borderColor: active ? FF.cyan : FF.border,
                  color: active ? FF.cyan : FF.textMuted,
                  boxShadow: active ? FF.glowCyan : "none",
                }}>
                <span className="font-bold text-sm">{opt.label}</span>
                <span className="text-[10px] font-mono uppercase mt-0.5">{opt.sub}</span>
              </button>
            );
          })}
        </div>
      </Section>

      <Section icon={<Flame className="h-4 w-4" />} label="Niveau d'énergie">
        <ScaleSelector value={checkIn.energie} labels={ENERGIE_LABELS} color={FF.amber}
          onChange={(v) => setCheckIn((s) => ({ ...s, energie: v }))} />
      </Section>

      <Section icon={<Brain className="h-4 w-4" />} label="État mental">
        <ScaleSelector value={checkIn.humeur} labels={HUMEUR_LABELS} color={FF.green}
          onChange={(v) => setCheckIn((s) => ({ ...s, humeur: v }))} />
      </Section>

      {/* Choix de séance : coach vs base */}
      {canGenerate && coachSession && coachSession.blocs?.length > 0 && (
        <button
          onClick={() => handleGenerate("coach")}
          className="w-full rounded-xl border p-4 text-left transition-all"
          style={{ background: FF.cyanBg20, borderColor: FF.cyan, boxShadow: FF.glowCyan }}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase tracking-[0.2em]" style={{ color: FF.cyan }}>
              ★ Séance de ton coach
            </span>
            <span className="text-[10px] font-mono" style={{ color: FF.textMuted }}>
              {coachSession.date_seance
                ? `prévue le ${new Date(coachSession.date_seance).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}`
                : `tous les ${coachSession.frequence_jours}j`}
            </span>
          </div>
          <p className="mt-1 font-bold text-base" style={{ color: FF.text }}>{coachSession.titre}</p>
          {coachSession.objectif && (
            <p className="text-xs mt-0.5" style={{ color: FF.textMuted }}>{coachSession.objectif}</p>
          )}
          <div className="mt-2 flex items-center gap-2 text-xs font-bold uppercase tracking-widest" style={{ color: FF.cyan }}>
            <Play className="h-4 w-4" /> Faire cette séance <ChevronRight className="h-4 w-4" />
          </div>
        </button>
      )}

      <button disabled={!canGenerate} onClick={() => handleGenerate("base")}
        className="w-full flex items-center justify-center gap-2 py-4 rounded-xl text-sm font-bold uppercase tracking-widest border transition-all"
        style={{
          background: canGenerate && !coachSession ? FF.cyanBg20 : FF.surface2,
          borderColor: canGenerate ? (coachSession ? FF.border : FF.cyan) : FF.border,
          color: canGenerate ? (coachSession ? FF.text : FF.cyan) : FF.textMuted,
          boxShadow: canGenerate && !coachSession ? FF.glowCyan : "none",
          cursor: canGenerate ? "pointer" : "not-allowed",
        }}>
        <Play className="h-4 w-4" />
        {coachSession ? "Programme de base" : "Générer ma routine"}
        <ChevronRight className="h-4 w-4" />
      </button>

      {todayCheckin === null && (
        <p className="text-center text-xs flex items-center justify-center gap-1.5" style={{ color: FF.textMuted }}>
          <CalendarCheck className="h-3.5 w-3.5" />
          Aucun check-in aujourd'hui — commencez !
        </p>
      )}
    </div>
  );
}

function Section({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3" style={{ color: FF.textMuted }}>
        {icon}
        <span className="text-xs font-mono uppercase tracking-widest">{label}</span>
      </div>
      {children}
    </div>
  );
}

function ScaleSelector({ value, labels, color, onChange }: {
  value: number | null; labels: string[]; color: string; onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((n) => {
          const active = value === n;
          return (
            <button key={n} onClick={() => onChange(n)}
              className="flex-1 h-10 rounded-lg border text-sm font-bold transition-all"
              style={{
                background: active ? `color-mix(in oklab, ${color} 18%, transparent)` : FF.surface2,
                borderColor: active ? color : FF.border,
                color: active ? color : FF.textMuted,
                boxShadow: active ? `0 0 10px color-mix(in oklab, ${color} 35%, transparent)` : "none",
              }}>
              {n}
            </button>
          );
        })}
      </div>
      {value !== null && (
        <p className="mt-2 text-xs font-mono uppercase tracking-wider text-center" style={{ color }}>
          {labels[value]}
        </p>
      )}
    </div>
  );
}

function formatDuration(totalSec: number): string {
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

const RESSENTI_LABELS = ["", "Difficile", "Mitigé", "Correct", "Très bon", "Excellent"];

function RessentiQuiz({
  initialScore,
  initialNote,
  durationSec,
  onSave,
}: {
  initialScore: number | null;
  initialNote: string;
  durationSec: number;
  onSave: (score: number, note: string) => void;
}) {
  const [score, setScore] = useState<number | null>(initialScore);
  const [note, setNote] = useState<string>(initialNote);
  const [saved, setSaved] = useState<boolean>(initialScore !== null);

  return (
    <div className="rounded-2xl p-5 border space-y-4" style={{ background: FF.surface, borderColor: FF.border }}>
      <div className="flex items-center gap-2">
        <Smile className="h-4 w-4" style={{ color: FF.cyan }} />
        <span className="text-xs font-mono uppercase tracking-widest" style={{ color: FF.textMuted }}>
          Ressenti post-session · {formatDuration(durationSec)}
        </span>
      </div>
      <p className="text-sm" style={{ color: FF.text }}>
        Comment t'es-tu senti pendant cette session ? Ces données sont partagées avec ton coach.
      </p>
      <ScaleSelector
        value={score}
        labels={RESSENTI_LABELS}
        color={FF.cyan}
        onChange={(v) => { setScore(v); setSaved(false); }}
      />
      <textarea
        value={note}
        onChange={(e) => { setNote(e.target.value); setSaved(false); }}
        placeholder="Une note pour ton coach ? (optionnel)"
        rows={3}
        className="w-full rounded-lg border px-3 py-2 text-sm bg-transparent"
        style={{ borderColor: FF.border, color: FF.text }}
      />
      <button
        onClick={() => { if (score !== null) { onSave(score, note); setSaved(true); } }}
        disabled={score === null}
        className="w-full py-3 rounded-xl border text-sm font-bold uppercase tracking-widest"
        style={{
          background: score === null ? FF.surface2 : FF.cyanBg20,
          borderColor: score === null ? FF.border : FF.cyan,
          color: score === null ? FF.textMuted : FF.cyan,
          cursor: score === null ? "not-allowed" : "pointer",
        }}
      >
        {saved ? "✓ Ressenti enregistré" : "Enregistrer mon ressenti"}
      </button>
    </div>
  );
}
