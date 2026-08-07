import { useState } from "react";
import { Smile } from "lucide-react";
import { FF } from "@/lib/ff-colors";
import { formatDuration, RESSENTI_LABELS } from "@/lib/routine-utils";

export function Section({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
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

export function ScaleSelector({ value, labels, color, onChange }: {
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

export function RessentiQuiz({
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
