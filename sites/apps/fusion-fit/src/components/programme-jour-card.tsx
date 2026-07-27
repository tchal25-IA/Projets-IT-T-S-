import { useState, useEffect, useRef } from "react";
import { Sparkles, Check, ClipboardList, Play, Square, Timer } from "lucide-react";
import { useMyProgramCompletions, useValidateProgramDay } from "@/hooks/use-program-completions";
import { notify, getMyPrenom } from "@/hooks/use-notifications";
import { useAuth } from "@/hooks/use-auth";
import { FF } from "@/lib/ff-colors";
import { todayJourFr, todayISO } from "@/lib/dates";

type Bloc = { jour: string; titre: string; details: string };
export type ProgramLite = { id: string; coach_id: string; titre: string; blocs: Bloc[] };

const RESSENTI_LABELS = ["", "Très dur", "Dur", "Correct", "Facile", "Très facile"];

function formatDuration(totalSec: number): string {
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

// Séance du jour issue du programme du coach. Affichée en tête de l'onglet
// Routine ; l'abonné démarre un chronomètre, termine la séance puis laisse
// un ressenti visible par son coach.
export function ProgrammeJourCard({ program }: { program: ProgramLite | null }) {
  const { user } = useAuth();
  const today = todayJourFr();
  const todayISOStr = todayISO();
  const blocsToday = program?.blocs.filter((b) => b.jour === today) ?? [];
  const { data: completions = [] } = useMyProgramCompletions(program?.id);
  const { mutateAsync: validate, isPending } = useValidateProgramDay();
  const todayCompletion = completions.find((c) => c.date === todayISOStr);

  const [showRessenti, setShowRessenti] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [note, setNote] = useState("");

  // Chronomètre de séance
  const [sessionStartedAt, setSessionStartedAt] = useState<string | null>(todayCompletion?.session_started_at ?? null);
  const [sessionEndedAt, setSessionEndedAt] = useState<string | null>(todayCompletion?.session_ended_at ?? null);
  const [now, setNow] = useState<number>(() => Date.now());
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Synchronise l'état du chronomètre avec la ligne en base après mutation/refetch
  useEffect(() => {
    setSessionStartedAt(todayCompletion?.session_started_at ?? null);
    setSessionEndedAt(todayCompletion?.session_ended_at ?? null);
  }, [todayCompletion?.session_started_at, todayCompletion?.session_ended_at]);

  const sessionEnded = !!sessionEndedAt;
  const elapsedSec = sessionStartedAt
    ? Math.max(
        0,
        Math.floor(
          ((sessionEndedAt ? new Date(sessionEndedAt).getTime() : now) - new Date(sessionStartedAt).getTime()) / 1000
        )
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

  async function demarrer() {
    if (!program) return;
    const startedAt = new Date().toISOString();
    setSessionStartedAt(startedAt);
    setNow(Date.now());
    await validate({
      programId: program.id,
      coachId: program.coach_id,
      jour: today,
      titre: blocsToday.map((b) => b.titre).join(", ") || "Repos",
      sessionStartedAt: startedAt,
      sessionEndedAt: null,
      sessionDurationSec: null,
    });
  }

  async function terminer() {
    if (!program) return;
    const endedAt = new Date().toISOString();
    const duration = sessionStartedAt
      ? Math.max(0, Math.floor((new Date(endedAt).getTime() - new Date(sessionStartedAt).getTime()) / 1000))
      : null;
    setSessionEndedAt(endedAt);
    if (intervalRef.current) clearInterval(intervalRef.current);
    await validate({
      programId: program.id,
      coachId: program.coach_id,
      jour: today,
      titre: blocsToday.map((b) => b.titre).join(", ") || "Repos",
      sessionStartedAt,
      sessionEndedAt: endedAt,
      sessionDurationSec: duration,
    });
    setShowRessenti(true);
  }

  async function valider() {
    if (!program) return;
    if (!score) { setShowRessenti(true); return; }
    try {
      await validate({
        programId: program.id,
        coachId: program.coach_id,
        jour: today,
        titre: blocsToday.map((b) => b.titre).join(", ") || "Repos",
        ressentiScore: score,
        ressentiNote: note.trim() || null,
        sessionStartedAt,
        sessionEndedAt,
        sessionDurationSec: elapsedSec,
      });
      const prenom = user ? await getMyPrenom(user.id) : "Ton abonné";
      await notify(program.coach_id, "programme_valide", `${prenom} a validé sa séance`,
        `« ${blocsToday[0]?.titre ?? today} » — ressenti : ${RESSENTI_LABELS[score]}.`,
        user ? `/fusionfit/escouade/${user.id}` : "/fusionfit/escouade");
      setShowRessenti(false);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Erreur");
    }
  }

  if (!program) {
    return (
      <section className="rounded-2xl border p-4" style={{ background: FF.surface, borderColor: FF.border }}>
        <p className="text-xs font-mono uppercase tracking-wider flex items-center gap-1 mb-2" style={{ color: FF.cyan }}>
          <ClipboardList className="h-3.5 w-3.5" /> Séance du jour
        </p>
        <p className="text-xs" style={{ color: FF.textMuted }}>
          Ton coach n'a pas encore publié de programme. Tu peux faire ton check-in du jour ci-dessous.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border-2 p-4 space-y-3"
      style={{ background: FF.surface, borderColor: todayCompletion ? FF.green : FF.cyan }}>
      <div className="flex items-center justify-between">
        <p className="text-xs font-mono uppercase tracking-wider flex items-center gap-1" style={{ color: FF.cyan }}>
          <Sparkles className="h-3.5 w-3.5" /> Séance du jour · {today}
        </p>
        {todayCompletion && (
          <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full border flex items-center gap-1"
            style={{ borderColor: FF.green, color: FF.green }}>
            <Check className="h-3 w-3" /> Validé
          </span>
        )}
      </div>

      {blocsToday.length === 0 ? (
        <p className="text-sm" style={{ color: FF.textMuted }}>Repos — aucune séance prévue aujourd'hui.</p>
      ) : (
        <div className="space-y-2">
          {blocsToday.map((b, i) => (
            <div key={i} className="rounded-lg border p-2.5" style={{ borderColor: FF.border, background: FF.surface2 }}>
              <p className="font-semibold text-sm">{b.titre}</p>
              {b.details && (
                <p className="text-xs mt-1 leading-relaxed whitespace-pre-line" style={{ color: FF.textMuted }}>{b.details}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Chronomètre de séance du jour */}
      {blocsToday.length > 0 && !todayCompletion && sessionStartedAt && (
        <div className="rounded-xl p-3 border flex items-center justify-between"
          style={{ background: FF.surface2, borderColor: FF.border }}>
          <div className="flex items-center gap-3">
            <Timer className="h-5 w-5" style={{ color: sessionEnded ? FF.textMuted : FF.cyan }} />
            <div>
              <p className="text-[10px] font-mono uppercase tracking-[0.2em]" style={{ color: FF.textMuted }}>
                {sessionEnded ? "Session terminée" : "Session en cours"}
              </p>
              <p className="text-xl font-bold tabular-nums" style={{ color: sessionEnded ? FF.textMuted : FF.cyan }}>
                {formatDuration(elapsedSec)}
              </p>
            </div>
          </div>
          {!sessionEnded && (
            <button onClick={terminer} disabled={isPending}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-semibold uppercase tracking-widest disabled:opacity-50"
              style={{ background: FF.surface, borderColor: FF.border, color: FF.text }}>
              <Square className="h-3.5 w-3.5" /> Terminer
            </button>
          )}
        </div>
      )}

      {blocsToday.length > 0 && !todayCompletion && !sessionStartedAt && !showRessenti && (
        <button onClick={demarrer} disabled={isPending}
          className="w-full py-2.5 rounded-xl border text-sm font-bold uppercase tracking-widest disabled:opacity-50"
          style={{ borderColor: FF.cyan, background: FF.cyanBg20, color: FF.cyan }}>
          <span className="flex items-center justify-center gap-2">
            <Play className="h-4 w-4" /> Suivre cette séance
          </span>
        </button>
      )}

      {/* Reprendre le ressenti si la séance est terminée en base mais pas encore notée */}
      {blocsToday.length > 0 && todayCompletion?.session_ended_at && todayCompletion.ressenti_score == null && !showRessenti && (
        <button onClick={() => setShowRessenti(true)} disabled={isPending}
          className="w-full py-2.5 rounded-xl border text-sm font-bold uppercase tracking-widest disabled:opacity-50"
          style={{ borderColor: FF.cyan, background: FF.cyanBg20, color: FF.cyan }}>
          Donner mon ressenti
        </button>
      )}

      {(showRessenti || (todayCompletion?.session_ended_at && todayCompletion.ressenti_score == null)) && (
        <div className="space-y-2 pt-1 border-t" style={{ borderColor: FF.border }}>
          <p className="text-[11px] font-mono uppercase" style={{ color: FF.textMuted }}>Ton ressenti</p>
          <div className="flex gap-1.5">
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} onClick={() => setScore(n)}
                className="flex-1 py-2 rounded-lg border text-xs font-bold"
                style={{
                  borderColor: score === n ? FF.cyan : FF.border,
                  background: score === n ? FF.cyanBg20 : "transparent",
                  color: score === n ? FF.cyan : FF.textMuted,
                }}>
                {n}
              </button>
            ))}
          </div>
          {score != null && (
            <p className="text-center text-[11px] font-mono uppercase" style={{ color: FF.cyan }}>
              {RESSENTI_LABELS[score]}
            </p>
          )}
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Une note pour ton coach (optionnel)…"
            rows={2}
            className="w-full px-3 py-2 rounded-lg border bg-transparent text-sm outline-none resize-none"
            style={{ borderColor: FF.border, color: FF.text }}
          />
          <button onClick={valider} disabled={isPending || !score}
            className="w-full py-2 rounded-xl border text-sm font-bold uppercase tracking-widest disabled:opacity-50"
            style={{ borderColor: FF.cyan, background: FF.cyanBg20, color: FF.cyan }}>
            {isPending ? "…" : "Confirmer"}
          </button>
        </div>
      )}

      {todayCompletion?.ressenti_score != null && (
        <p className="text-[11px] font-mono" style={{ color: FF.green }}>
          Ressenti envoyé : {RESSENTI_LABELS[todayCompletion.ressenti_score]}
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
