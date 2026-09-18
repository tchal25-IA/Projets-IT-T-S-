import { useState, useEffect, useRef } from "react";
import {
  Sparkles, Check, ClipboardList, Play, Square, Timer, Target, Loader2,
  Shuffle, ExternalLink, Film,
} from "lucide-react";
import { useMyProgramCompletions, useValidateProgramDay } from "@/hooks/use-program-completions";
import { useCoachExercisesForAthlete, matchExercise } from "@/hooks/use-exercise-catalog";
import { notify, getMyPrenom } from "@/hooks/use-notifications";
import { useAuth } from "@/hooks/use-auth";
import { FF } from "@/lib/ff-colors";
import { todayJourFr, todayISO, blocsForJour } from "@/lib/dates";
import { scalingFor } from "@/lib/routine-generator";

type Bloc = { jour: string; titre: string; details: string };
export type ProgramLite = {
  id: string;
  coach_id: string;
  titre: string;
  objectif?: string | null;
  blocs: Bloc[];
};

const RPE_LABELS = ["", "Très dur", "Dur", "Correct", "Facile", "Très facile"];
const FATIGUE_LABELS = ["", "Épuisé", "Fatigué", "OK", "Frais", "En pleine forme"];

function formatDuration(totalSec: number): string {
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

function isSessionValidated(
  c: { ressenti_score: number | null } | undefined,
): boolean {
  return c?.ressenti_score != null;
}

function isSessionInProgress(
  c: { ressenti_score: number | null; session_started_at: string | null } | undefined,
): boolean {
  return !!c?.session_started_at && c.ressenti_score == null;
}

function youtubeEmbed(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtu.be")) {
      const id = u.pathname.replace("/", "");
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
    if (u.hostname.includes("youtube.com")) {
      const id = u.searchParams.get("v");
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
  } catch { /* ignore */ }
  return null;
}

/** Séance du jour issue du programme bibliothèque du coach. */
export function ProgrammeJourCard({
  program,
  focusObjectif,
}: {
  program: ProgramLite | null;
  focusObjectif?: string | null;
}) {
  const { user } = useAuth();
  const today = todayJourFr();
  const todayISOStr = todayISO();
  const blocsToday = blocsForJour(program?.blocs, today);
  const { data: completions = [] } = useMyProgramCompletions(program?.id);
  const { data: exerciseCatalog = [] } = useCoachExercisesForAthlete(program?.coach_id);
  const { mutateAsync: validate, isPending } = useValidateProgramDay();
  const todayCompletion = completions.find((c) => c.date === todayISOStr);
  const validated = isSessionValidated(todayCompletion);
  const inProgress = isSessionInProgress(todayCompletion);

  const [showRessenti, setShowRessenti] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [fatigue, setFatigue] = useState<number | null>(null);
  const [note, setNote] = useState("");

  const [sessionStartedAt, setSessionStartedAt] = useState<string | null>(
    todayCompletion?.session_started_at ?? null,
  );
  const [sessionEndedAt, setSessionEndedAt] = useState<string | null>(
    todayCompletion?.session_ended_at ?? null,
  );
  const [now, setNow] = useState<number>(() => Date.now());
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setSessionStartedAt(todayCompletion?.session_started_at ?? null);
    setSessionEndedAt(todayCompletion?.session_ended_at ?? null);
  }, [todayCompletion?.session_started_at, todayCompletion?.session_ended_at]);

  const sessionEnded = !!sessionEndedAt;
  const elapsedSec = sessionStartedAt
    ? Math.max(
        0,
        Math.floor(
          ((sessionEndedAt ? new Date(sessionEndedAt).getTime() : now) -
            new Date(sessionStartedAt).getTime()) /
            1000,
        ),
      )
    : 0;

  useEffect(() => {
    if (sessionStartedAt && !sessionEndedAt) {
      intervalRef.current = setInterval(() => setNow(Date.now()), 1000);
      return () => {
        if (intervalRef.current) clearInterval(intervalRef.current);
      };
    }
  }, [sessionStartedAt, sessionEndedAt]);

  const objectifAffiche =
    focusObjectif?.trim() ||
    program?.objectif?.trim() ||
    null;

  const titreSeance = blocsToday.map((b) => b.titre).join(", ") || "Séance";

  async function demarrer() {
    if (!program) return;
    const startedAt = new Date().toISOString();
    setSessionStartedAt(startedAt);
    setNow(Date.now());
    await validate({
      programId: program.id,
      coachId: program.coach_id,
      jour: today,
      titre: titreSeance,
      sessionStartedAt: startedAt,
      sessionEndedAt: null,
      sessionDurationSec: null,
    });
  }

  async function terminer() {
    if (!program) return;
    const endedAt = new Date().toISOString();
    const duration = sessionStartedAt
      ? Math.max(
          0,
          Math.floor(
            (new Date(endedAt).getTime() - new Date(sessionStartedAt).getTime()) / 1000,
          ),
        )
      : null;
    setSessionEndedAt(endedAt);
    if (intervalRef.current) clearInterval(intervalRef.current);
    await validate({
      programId: program.id,
      coachId: program.coach_id,
      jour: today,
      titre: titreSeance,
      sessionStartedAt,
      sessionEndedAt: endedAt,
      sessionDurationSec: duration,
    });
    setShowRessenti(true);
  }

  /** Ouvre le questionnaire de validation (avec ou sans chrono). */
  async function ouvrirValidation() {
    if (!program) return;
    if (!sessionStartedAt) {
      const startedAt = new Date().toISOString();
      setSessionStartedAt(startedAt);
      await validate({
        programId: program.id,
        coachId: program.coach_id,
        jour: today,
        titre: titreSeance,
        sessionStartedAt: startedAt,
        sessionEndedAt: null,
        sessionDurationSec: null,
      });
    }
    if (!sessionEndedAt) {
      const endedAt = new Date().toISOString();
      const duration = sessionStartedAt
        ? Math.max(0, Math.floor((Date.now() - new Date(sessionStartedAt).getTime()) / 1000))
        : 0;
      setSessionEndedAt(endedAt);
      if (intervalRef.current) clearInterval(intervalRef.current);
      await validate({
        programId: program.id,
        coachId: program.coach_id,
        jour: today,
        titre: titreSeance,
        sessionStartedAt: sessionStartedAt ?? new Date().toISOString(),
        sessionEndedAt: endedAt,
        sessionDurationSec: duration || elapsedSec || null,
      });
    }
    setShowRessenti(true);
  }

  async function valider() {
    if (!program) return;
    if (!score || !fatigue) {
      setShowRessenti(true);
      return;
    }
    try {
      const endedAt = sessionEndedAt ?? new Date().toISOString();
      const startedAt = sessionStartedAt ?? endedAt;
      const duration = Math.max(
        0,
        Math.floor((new Date(endedAt).getTime() - new Date(startedAt).getTime()) / 1000),
      );
      await validate({
        programId: program.id,
        coachId: program.coach_id,
        jour: today,
        titre: titreSeance,
        ressentiScore: score,
        fatigueScore: fatigue,
        ressentiNote: note.trim() || null,
        sessionStartedAt: startedAt,
        sessionEndedAt: endedAt,
        sessionDurationSec: duration || elapsedSec || null,
      });
      const prenom = user ? await getMyPrenom(user.id) : "Ton athlète";
      await notify(
        program.coach_id,
        "programme_valide",
        `${prenom} a validé sa séance`,
        `« ${blocsToday[0]?.titre ?? today} » — RPE ${score}/5 · fatigue ${fatigue}/5.`,
        user ? `/fusionfit/escouade/${user.id}` : "/fusionfit/escouade",
      );
      setShowRessenti(false);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Erreur");
    }
  }

  if (!program) {
    return (
      <section
        className="rounded-2xl border p-4"
        style={{ background: FF.surface, borderColor: FF.border }}
      >
        <p
          className="text-xs font-mono uppercase tracking-wider flex items-center gap-1 mb-2"
          style={{ color: FF.cyan }}
        >
          <ClipboardList className="h-3.5 w-3.5" /> Séance du jour
        </p>
        <p className="text-xs" style={{ color: FF.textMuted }}>
          Ton coach n&apos;a pas encore publié de programme depuis la bibliothèque.
        </p>
      </section>
    );
  }

  const borderColor = validated ? FF.green : inProgress ? FF.amber : FF.cyan;

  return (
    <section
      className="rounded-2xl border-2 p-4 space-y-3"
      style={{ background: FF.surface, borderColor }}
    >
      <div className="flex items-center justify-between gap-2">
        <p
          className="text-xs font-mono uppercase tracking-wider flex items-center gap-1"
          style={{ color: FF.cyan }}
        >
          <Sparkles className="h-3.5 w-3.5" /> Programme · {today}
        </p>
        {validated ? (
          <span
            className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full border flex items-center gap-1"
            style={{ borderColor: FF.green, color: FF.green }}
          >
            <Check className="h-3 w-3" /> Validé
          </span>
        ) : inProgress ? (
          <span
            className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full border flex items-center gap-1"
            style={{ borderColor: FF.amber, color: FF.amber }}
          >
            <Loader2 className="h-3 w-3 animate-spin" /> En cours
          </span>
        ) : null}
      </div>

      <div>
        <p className="font-bold text-sm">{program.titre}</p>
        {objectifAffiche && (
          <p className="text-xs mt-1 flex items-start gap-1.5" style={{ color: FF.amber }}>
            <Target className="h-3.5 w-3.5 mt-0.5 shrink-0" />
            <span>
              <span className="font-mono uppercase text-[10px] tracking-wider">Objectif · </span>
              {objectifAffiche}
            </span>
          </p>
        )}
      </div>

      {blocsToday.length === 0 ? (
        <p className="text-sm" style={{ color: FF.textMuted }}>
          Repos — aucune séance prévue aujourd&apos;hui.
        </p>
      ) : (
        <div className="space-y-2">
          {blocsToday.map((b, i) => (
            <ProgramBlocView key={i} bloc={b} catalog={exerciseCatalog} />
          ))}
        </div>
      )}

      {blocsToday.length > 0 && sessionStartedAt && !validated && (
        <div
          className="rounded-xl p-3 border flex items-center justify-between"
          style={{ background: FF.surface2, borderColor: FF.border }}
        >
          <div className="flex items-center gap-3">
            <Timer
              className="h-5 w-5"
              style={{ color: sessionEnded ? FF.textMuted : FF.cyan }}
            />
            <div>
              <p
                className="text-[10px] font-mono uppercase tracking-[0.2em]"
                style={{ color: FF.textMuted }}
              >
                {sessionEnded ? "Session terminée" : "Session en cours"}
              </p>
              <p
                className="text-xl font-bold tabular-nums"
                style={{ color: sessionEnded ? FF.textMuted : FF.cyan }}
              >
                {formatDuration(elapsedSec)}
              </p>
            </div>
          </div>
          {!sessionEnded && (
            <button
              onClick={terminer}
              disabled={isPending}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-semibold uppercase tracking-widest disabled:opacity-50"
              style={{ background: FF.surface, borderColor: FF.border, color: FF.text }}
            >
              <Square className="h-3.5 w-3.5" /> Terminer
            </button>
          )}
        </div>
      )}

      {blocsToday.length > 0 && !sessionStartedAt && !showRessenti && !validated && (
        <div className="space-y-2">
          <button
            onClick={demarrer}
            disabled={isPending}
            className="w-full py-2.5 rounded-xl border text-sm font-bold uppercase tracking-widest disabled:opacity-50"
            style={{ borderColor: FF.cyan, background: FF.cyanBg20, color: FF.cyan }}
          >
            <span className="flex items-center justify-center gap-2">
              <Play className="h-4 w-4" /> Démarrer
            </span>
          </button>
          <button
            onClick={ouvrirValidation}
            disabled={isPending}
            className="w-full py-2.5 rounded-xl border text-sm font-bold uppercase tracking-widest disabled:opacity-50"
            style={{ borderColor: FF.amber, background: "oklch(0.78 0.18 55 / 12%)", color: FF.amber }}
          >
            <span className="flex items-center justify-center gap-2">
              <Check className="h-4 w-4" /> Valider la séance
            </span>
          </button>
        </div>
      )}

      {blocsToday.length > 0 && sessionStartedAt && !validated && !showRessenti && (
        <button
          onClick={ouvrirValidation}
          disabled={isPending}
          className="w-full py-2.5 rounded-xl border text-sm font-bold uppercase tracking-widest disabled:opacity-50"
          style={{ borderColor: FF.amber, background: "oklch(0.78 0.18 55 / 12%)", color: FF.amber }}
        >
          <span className="flex items-center justify-center gap-2">
            <Check className="h-4 w-4" /> Valider la séance
          </span>
        </button>
      )}

      {showRessenti && !validated && (
        <div className="space-y-3 pt-2 border-t" style={{ borderColor: FF.border }}>
          <p className="text-xs font-semibold" style={{ color: FF.text }}>
            Questionnaire de fin d&apos;effort
          </p>

          <div>
            <p className="text-[11px] font-mono uppercase mb-1.5" style={{ color: FF.textMuted }}>
              RPE / Ressenti (1–5)
            </p>
            <div className="flex gap-1.5">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  onClick={() => setScore(n)}
                  className="flex-1 py-2 rounded-lg border text-xs font-bold"
                  style={{
                    borderColor: score === n ? FF.cyan : FF.border,
                    background: score === n ? FF.cyanBg20 : "transparent",
                    color: score === n ? FF.cyan : FF.textMuted,
                  }}
                >
                  {n}
                </button>
              ))}
            </div>
            {score != null && (
              <p className="text-center text-[11px] font-mono uppercase mt-1" style={{ color: FF.cyan }}>
                {RPE_LABELS[score]}
              </p>
            )}
          </div>

          <div>
            <p className="text-[11px] font-mono uppercase mb-1.5" style={{ color: FF.textMuted }}>
              Fatigue (1–5)
            </p>
            <div className="flex gap-1.5">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  onClick={() => setFatigue(n)}
                  className="flex-1 py-2 rounded-lg border text-xs font-bold"
                  style={{
                    borderColor: fatigue === n ? FF.amber : FF.border,
                    background: fatigue === n ? "oklch(0.78 0.18 55 / 15%)" : "transparent",
                    color: fatigue === n ? FF.amber : FF.textMuted,
                  }}
                >
                  {n}
                </button>
              ))}
            </div>
            {fatigue != null && (
              <p className="text-center text-[11px] font-mono uppercase mt-1" style={{ color: FF.amber }}>
                {FATIGUE_LABELS[fatigue]}
              </p>
            )}
          </div>

          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Remarques pour ton coach (douleur, matériel, ressenti…)"
            rows={2}
            className="w-full px-3 py-2 rounded-lg border bg-transparent text-sm outline-none resize-none"
            style={{ borderColor: FF.border, color: FF.text }}
          />
          <button
            onClick={valider}
            disabled={isPending || !score || !fatigue}
            className="w-full py-2.5 rounded-xl border text-sm font-bold uppercase tracking-widest disabled:opacity-50"
            style={{ borderColor: FF.cyan, background: FF.cyanBg20, color: FF.cyan }}
          >
            {isPending ? "…" : "Confirmer la validation"}
          </button>
        </div>
      )}

      {todayCompletion?.ressenti_score != null && (
        <p className="text-[11px] font-mono" style={{ color: FF.green }}>
          Validé · RPE {todayCompletion.ressenti_score}/5
          {todayCompletion.fatigue_score != null && ` · Fatigue ${todayCompletion.fatigue_score}/5`}
          {todayCompletion.session_duration_sec != null && (
            <span className="ml-2" style={{ color: FF.textMuted }}>
              · {formatDuration(todayCompletion.session_duration_sec)}
            </span>
          )}
        </p>
      )}
    </section>
  );
}

function ProgramBlocView({
  bloc,
  catalog,
}: {
  bloc: Bloc;
  catalog: import("@/hooks/use-coach-exercises").CoachExercise[];
}) {
  const lines = (bloc.details || "")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  return (
    <div
      className="rounded-lg border p-2.5 space-y-2"
      style={{ borderColor: FF.border, background: FF.surface2 }}
    >
      <p className="font-semibold text-sm">{bloc.titre}</p>
      {lines.length === 0 ? null : (
        <ul className="space-y-2">
          {lines.map((line, j) => {
            const matched = matchExercise(line, catalog);
            const scaling = matched?.scaling || scalingFor(line);
            const media = matched?.media_url;
            const embed = media ? youtubeEmbed(media) : null;
            return (
              <li key={j} className="space-y-1.5">
                <p className="text-xs leading-relaxed" style={{ color: FF.text }}>{line}</p>
                {scaling && (
                  <p
                    className="text-[11px] leading-relaxed rounded-lg px-2 py-1.5 flex items-start gap-1.5"
                    style={{ color: FF.cyan, background: FF.cyanBg }}
                  >
                    <Shuffle className="h-3 w-3 mt-0.5 shrink-0" />
                    <span><span className="font-semibold">Alternative / Scaling · </span>{scaling}</span>
                  </p>
                )}
                {media && (
                  <div className="rounded-lg overflow-hidden border" style={{ borderColor: FF.border }}>
                    {embed ? (
                      <iframe
                        title={`Démo ${matched?.nom ?? "exercice"}`}
                        src={embed}
                        className="w-full aspect-video"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    ) : matched?.media_kind === "image" || /\.(jpg|jpeg|png|webp|gif)(\?|$)/i.test(media) ? (
                      <img src={media} alt={matched?.nom ?? "Démo"} className="w-full max-h-40 object-cover" />
                    ) : (
                      <a
                        href={media}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-3 py-2 text-[11px]"
                        style={{ color: FF.cyan }}
                      >
                        <Film className="h-3.5 w-3.5" /> Voir la démo
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
