import { useState } from "react";
import { Timer, Smile, MessageSquare } from "lucide-react";
import { useSetSessionComment } from "@/hooks/use-coaching";
import { notify } from "@/hooks/use-notifications";
import { formatDuree, RESSENTI_LABELS, type Session } from "./types";

/** Carte d'une session passée + commentaire éditable du coach */
export function SessionRow({ s, abonneId }: { s: Session; abonneId: string }) {
  const { mutateAsync: saveComment, isPending } = useSetSessionComment();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(s.coach_comment ?? "");
  const [comment, setComment] = useState(s.coach_comment ?? "");

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

  return (
    <div
      className="rounded-lg border p-2.5 space-y-1.5"
      style={{ borderColor: "var(--ff-border)", background: "var(--ff-surface-2)" }}
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
        </div>
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] font-mono" style={{ color: "var(--ff-text-muted)" }}>
        <span>⚡ Énergie {s.energie}/5</span>
        <span>🧠 Humeur {s.humeur}/5</span>
        <span className="flex items-center gap-1"><Timer className="h-3 w-3" /> {formatDuree(s.session_duration_sec)}</span>
      </div>
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

      {/* Commentaire du coach */}
      {!editing && comment && (
        <div className="rounded-md border p-2 mt-1" style={{ borderColor: "var(--ff-cyan)", background: "oklch(0.78 0.16 198 / 8%)" }}>
          <p className="text-[10px] font-mono uppercase mb-0.5 flex items-center gap-1" style={{ color: "var(--ff-cyan)" }}>
            <MessageSquare className="h-3 w-3" /> Ton commentaire (visible par l'abonné)
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
            className="w-full px-2 py-1.5 rounded border bg-transparent text-xs outline-none resize-none"
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
