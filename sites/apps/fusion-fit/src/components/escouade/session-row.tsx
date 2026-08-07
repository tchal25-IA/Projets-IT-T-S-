import { useState } from "react";
import { Timer, Smile, MessageSquare, ChevronDown, ChevronUp, CheckCircle2, Circle } from "lucide-react";
import { useSetSessionComment, useCoachSessionFor, type CoachSession } from "@/hooks/use-coaching";
import { notify } from "@/hooks/use-notifications";
import { generateRoutine, splitFormat } from "@/lib/routine-generator";
import { formatDuree, RESSENTI_LABELS, type Session } from "./types";

/** Carte d'une session passée + détail blocs/exercices + commentaire coach */
export function SessionRow({ s, abonneId }: { s: Session; abonneId: string }) {
  const { mutateAsync: saveComment, isPending } = useSetSessionComment();
  const { data: coachSession } = useCoachSessionFor(abonneId);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(s.coach_comment ?? "");
  const [comment, setComment] = useState(s.coach_comment ?? "");
  const [open, setOpen] = useState(false);

  const ressColor =
    s.ressenti_score == null ? "var(--ff-text-muted)"
    : s.ressenti_score <= 2 ? "oklch(0.65 0.22 25)"
    : s.ressenti_score === 3 ? "var(--ff-amber)"
    : "var(--ff-green)";

  async function envoyer() {
    try {
      await saveComment({ checkinId: s.id, comment: draft.trim() });
      setComment(draft.trim());
      setEditing(false);
      if (draft.trim()) {
        await notify(abonneId, "commentaire", "Ton coach a commenté ta séance",
          draft.trim(), "/fusionfit/stats");
      }
    } catch (e) {
      alert(e instanceof Error ? e.message : "Erreur");
    }
  }

  const detail = buildSessionDetail(s, coachSession ?? null);
  const completed = new Set(s.blocs_completes ?? []);

  return (
    <div
      className="rounded-lg border p-2.5 space-y-1.5"
      style={{ borderColor: "var(--ff-border)", background: "var(--ff-surface-2)" }}
    >
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full text-left space-y-1.5"
      >
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-semibold">
            {new Date(s.date).toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" })}
          </p>
          <div className="flex items-center gap-2">
            {s.session_source === "coach" && (
              <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded border" style={{ borderColor: "var(--ff-cyan)", color: "var(--ff-cyan)" }}>
                séance coach
              </span>
            )}
            {!s.session_ended && (
              <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded border" style={{ borderColor: "var(--ff-amber)", color: "var(--ff-amber)" }}>
                en cours
              </span>
            )}
            <span className="text-sm font-bold tabular-nums" style={{ color: "var(--ff-cyan)" }}>{s.serenite}%</span>
            {open
              ? <ChevronUp className="h-4 w-4" style={{ color: "var(--ff-text-muted)" }} />
              : <ChevronDown className="h-4 w-4" style={{ color: "var(--ff-text-muted)" }} />}
          </div>
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] font-mono" style={{ color: "var(--ff-text-muted)" }}>
          <span>⚡ Énergie {s.energie}/5</span>
          <span>🧠 Humeur {s.humeur}/5</span>
          {s.temps != null && (
            <span>⏱ {s.temps === 1 ? "15 min" : s.temps === 2 ? "30 min" : "60 min+"}</span>
          )}
          <span className="flex items-center gap-1"><Timer className="h-3 w-3" /> {formatDuree(s.session_duration_sec)}</span>
          <span>{s.nb_blocs ?? 0} bloc(s) · {(s.blocs_completes ?? []).length} fait(s)</span>
        </div>
      </button>

      {s.objectif_du_jour && (
        <p className="text-[11px]" style={{ color: "var(--ff-amber)" }}>
          🎯 Objectif du jour : {s.objectif_du_jour}
        </p>
      )}
      {s.ressenti_score != null && (
        <div className="flex items-center gap-1.5 text-[11px]" style={{ color: ressColor }}>
          <Smile className="h-3 w-3" />
          <span className="font-semibold">Ressenti : {RESSENTI_LABELS[s.ressenti_score]}</span>
        </div>
      )}
      {s.ressenti_note && (
        <p className="text-xs italic leading-relaxed" style={{ color: "var(--ff-text)" }}>
          « {s.ressenti_note} »
        </p>
      )}

      {open && (
        <div className="pt-2 mt-1 border-t space-y-2" style={{ borderColor: "var(--ff-border)" }}>
          <p className="text-[10px] font-mono uppercase tracking-wider" style={{ color: "var(--ff-cyan)" }}>
            Détail de l&apos;entraînement · archive
          </p>
          {detail.length === 0 ? (
            <p className="text-[11px]" style={{ color: "var(--ff-text-muted)" }}>
              Impossible de reconstruire le détail (données incomplètes).
            </p>
          ) : (
            detail.map((block, i) => {
              const done = completed.has(i);
              const { format, exercises } = splitFormat(block.exercises);
              return (
                <div
                  key={i}
                  className="rounded-md border p-2 space-y-1"
                  style={{
                    borderColor: done ? "var(--ff-green)" : "var(--ff-border)",
                    background: done ? "oklch(0.65 0.18 145 / 8%)" : "var(--ff-surface)",
                  }}
                >
                  <div className="flex items-center gap-2">
                    {done
                      ? <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0" style={{ color: "var(--ff-green)" }} />
                      : <Circle className="h-3.5 w-3.5 flex-shrink-0" style={{ color: "var(--ff-text-muted)" }} />}
                    <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded border"
                      style={{ borderColor: "var(--ff-border)", color: "var(--ff-text-muted)" }}>
                      {block.pilier}
                    </span>
                    <p className="text-xs font-semibold flex-1">{block.titre}</p>
                    {format && (
                      <span className="text-[9px] font-mono uppercase" style={{ color: "var(--ff-cyan)" }}>{format}</span>
                    )}
                  </div>
                  <ul className="pl-5 space-y-0.5">
                    {exercises.map((ex, j) => (
                      <li key={j} className="text-[11px]" style={{ color: "var(--ff-text-muted)" }}>· {ex}</li>
                    ))}
                  </ul>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Commentaire du coach */}
      {!editing && comment && (
        <div className="rounded-md border p-2 mt-1" style={{ borderColor: "var(--ff-cyan)", background: "oklch(0.78 0.16 198 / 8%)" }}>
          <p className="text-[10px] font-mono uppercase mb-0.5 flex items-center gap-1" style={{ color: "var(--ff-cyan)" }}>
            <MessageSquare className="h-3 w-3" /> Ton commentaire (visible par l&apos;abonné)
          </p>
          <p className="text-xs" style={{ color: "var(--ff-text)" }}>{comment}</p>
          <button onClick={() => { setDraft(comment); setEditing(true); }} className="text-[10px] mt-1 underline" style={{ color: "var(--ff-text-muted)" }}>
            Modifier
          </button>
        </div>
      )}
      {!editing && !comment && (
        <button
          onClick={() => { setDraft(""); setEditing(true); }}
          className="flex items-center gap-1 text-[11px] mt-1"
          style={{ color: "var(--ff-cyan)" }}
        >
          <MessageSquare className="h-3 w-3" /> Ajouter un commentaire
        </button>
      )}
      {editing && (
        <div className="space-y-1.5 mt-1">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Feedback sur cette séance (visible par l'abonné)…"
            rows={2}
            className="w-full px-2 py-1.5 rounded border bg-transparent text-xs outline-none resize-y min-h-[3.5rem]"
            style={{ borderColor: "var(--ff-cyan)", color: "var(--ff-text)" }}
          />
          <div className="flex gap-2">
            <button onClick={envoyer} disabled={isPending}
              className="flex-1 py-1 rounded border text-[11px] font-bold"
              style={{ borderColor: "var(--ff-cyan)", background: "oklch(0.78 0.16 198 / 20%)", color: "var(--ff-cyan)" }}>
              {isPending ? "…" : "Enregistrer"}
            </button>
            <button onClick={() => setEditing(false)}
              className="px-3 py-1 rounded border text-[11px]"
              style={{ borderColor: "var(--ff-border)", color: "var(--ff-text-muted)" }}>
              Annuler
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

type DetailBlock = { pilier: string; titre: string; exercises: string[] };

function buildSessionDetail(s: Session, coachSession: CoachSession | null): DetailBlock[] {
  if (s.session_source === "coach" && coachSession?.blocs?.length) {
    return coachSession.blocs.map((b) => ({
      pilier: b.pilier,
      titre: b.titre || "Bloc",
      exercises: b.exercices ?? [],
    }));
  }
  if (s.temps != null && s.energie != null && s.humeur != null) {
    return generateRoutine({ temps: s.temps, energie: s.energie, humeur: s.humeur }).map((b) => ({
      pilier: b.pilier,
      titre: b.titre,
      exercises: b.exercises,
    }));
  }
  // Fallback minimal si pas de reconstruction possible
  const n = Math.max(s.nb_blocs ?? 0, (s.blocs_completes ?? []).length);
  return Array.from({ length: n }, (_, i) => ({
    pilier: "—",
    titre: `Bloc ${i + 1}`,
    exercises: [],
  }));
}
