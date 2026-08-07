import { Play, RotateCcw, CheckCircle2, Circle, Info, Timer, Square, Shuffle } from "lucide-react";
import { tipFor, scalingFor, splitFormat, type RoutineBlock } from "@/lib/routine-generator";
import { FF, PILIER_COLORS } from "@/lib/ff-colors";
import { formatDuration, blockDone, type ExerciseState } from "@/lib/routine-utils";
import { RessentiQuiz } from "./routine-ui";
import type { CoachSession } from "@/hooks/use-coaching";

export function RoutinePlayer({
  source,
  coachSession,
  sessionStartedAt,
  sessionEnded,
  elapsedSec,
  serenite,
  total,
  done,
  routine,
  exState,
  expandedTips,
  expandedScaling,
  isSaving,
  ressentiScore,
  ressentiNote,
  onStart,
  onEnd,
  onToggleExercise,
  onToggleTip,
  onToggleScaling,
  onSaveRessenti,
  onReset,
}: {
  source: "base" | "coach";
  coachSession: CoachSession | null | undefined;
  sessionStartedAt: string | null;
  sessionEnded: boolean;
  elapsedSec: number;
  serenite: number;
  total: number;
  done: number;
  routine: RoutineBlock[];
  exState: ExerciseState;
  expandedTips: Set<string>;
  expandedScaling: Set<string>;
  isSaving: boolean;
  ressentiScore: number | null;
  ressentiNote: string;
  onStart: () => void;
  onEnd: () => void;
  onToggleExercise: (blockIdx: number, exIdx: number) => void;
  onToggleTip: (key: string) => void;
  onToggleScaling: (key: string) => void;
  onSaveRessenti: (score: number, note: string) => void;
  onReset: () => void;
}) {
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
            onClick={onStart}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-semibold uppercase tracking-widest"
            style={{ background: FF.cyanBg20, borderColor: FF.cyan, color: FF.cyan }}
          >
            <Play className="h-3.5 w-3.5" /> Démarrer
          </button>
        )}
        {sessionStartedAt && !sessionEnded && (
          <button
            onClick={onEnd}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-semibold uppercase tracking-widest"
            style={{ background: FF.surface2, borderColor: FF.border, color: FF.text }}
          >
            <Square className="h-3.5 w-3.5" /> Terminer
          </button>
        )}
      </div>

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

      {routine.map((block, i) => {
        const allDone = blockDone(block, i, exState);
        const colors = PILIER_COLORS[block.pilier];
        const checked = new Set(exState[i] ?? []);
        const { format, exercises: exList } = splitFormat(block.exercises);
        return (
          <div key={i} className="rounded-2xl border overflow-hidden transition-all"
            style={{ background: allDone ? colors.bg : FF.surface, borderColor: allDone ? colors.border : FF.border }}>
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
                        onClick={() => onToggleExercise(i, j + (block.exercises.length - exList.length))}
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
                          onClick={() => onToggleScaling(tipKey)}
                          aria-label="Alternative / scaling"
                          className="flex-shrink-0"
                          style={{ color: expandedScaling.has(tipKey) ? FF.cyan : FF.textMuted }}
                        >
                          <Shuffle className="h-3.5 w-3.5" />
                        </button>
                      )}
                      {tip && (
                        <button
                          onClick={() => onToggleTip(tipKey)}
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

      {sessionStartedAt && !sessionEnded && (
        <button
          onClick={onEnd}
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
          onSave={onSaveRessenti}
        />
      )}

      <button onClick={onReset} className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border text-sm font-semibold uppercase tracking-widest"
        style={{ borderColor: FF.border, color: FF.textMuted, background: FF.surface }}>
        <RotateCcw className="h-4 w-4" />
        Nouveau check-in
      </button>
    </div>
  );
}
