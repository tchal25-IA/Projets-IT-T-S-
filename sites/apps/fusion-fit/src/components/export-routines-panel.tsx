import { useMemo, useState } from "react";
import { Download, FileText, Printer } from "lucide-react";
import { FF } from "@/lib/ff-colors";
import {
  buildExportHtml,
  buildExportMarkdown,
  downloadTextFile,
  exportFilename,
  openPrintableExport,
  type ExportPayload,
  type ExportProgram,
  type ExportProgramCompletion,
  type ExportScope,
  type ExportSession,
} from "@/lib/routine-export";

type Props = {
  athleteName: string;
  coachLabel?: string;
  program?: ExportProgram | null;
  sessions?: ExportSession[];
  completions?: ExportProgramCompletion[];
  todayCheckin?: ExportSession | null;
  /** Variante visuelle compacte (fiche coach) */
  compact?: boolean;
};

const SCOPES: { id: ExportScope; label: string; hint: string }[] = [
  { id: "jour", label: "Jour", hint: "Séance du jour + ressenti" },
  { id: "semaine", label: "Semaine", hint: "Programme hebdo + séances" },
  { id: "archives", label: "Archives", hint: "Historique check-ins & validations" },
];

export function ExportRoutinesPanel({
  athleteName,
  coachLabel,
  program,
  sessions = [],
  completions = [],
  todayCheckin = null,
  compact = false,
}: Props) {
  const [scope, setScope] = useState<ExportScope>("jour");

  const payload: ExportPayload = useMemo(
    () => ({
      scope,
      athleteName: athleteName || "Athlète",
      coachLabel,
      generatedAt: new Date(),
      program: program ?? null,
      sessions,
      completions,
      todayCheckin,
    }),
    [scope, athleteName, coachLabel, program, sessions, completions, todayCheckin],
  );

  function doDownload() {
    const md = buildExportMarkdown(payload);
    downloadTextFile(exportFilename(scope, athleteName), md);
  }

  function doPrintPdf() {
    openPrintableExport(buildExportHtml(payload));
  }

  return (
    <section
      className="rounded-2xl border p-4 space-y-3"
      style={{ background: FF.surface, borderColor: FF.border }}
    >
      <div>
        <p
          className="text-xs font-mono uppercase tracking-wider flex items-center gap-1"
          style={{ color: FF.cyan }}
        >
          <FileText className="h-3.5 w-3.5" /> Exporter
        </p>
        {!compact && (
          <p className="text-[11px] mt-1" style={{ color: FF.textMuted }}>
            Texte structuré maintenant · PDF illustré (images exercices) en phase 2.
          </p>
        )}
      </div>

      <div className="flex flex-wrap gap-1.5">
        {SCOPES.map((s) => {
          const active = scope === s.id;
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => setScope(s.id)}
              className="rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors"
              style={{
                borderColor: active ? FF.cyan : FF.border,
                background: active ? "oklch(0.72 0.12 200 / 12%)" : FF.surface2,
                color: active ? FF.cyan : FF.textMuted,
              }}
              title={s.hint}
            >
              {s.label}
            </button>
          );
        })}
      </div>

      <p className="text-[10px] font-mono" style={{ color: FF.textMuted }}>
        {SCOPES.find((s) => s.id === scope)?.hint}
      </p>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={doDownload}
          className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold"
          style={{ borderColor: FF.border, background: FF.surface2, color: FF.text }}
        >
          <Download className="h-3.5 w-3.5" /> Télécharger .txt
        </button>
        <button
          type="button"
          onClick={doPrintPdf}
          className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold"
          style={{ borderColor: FF.cyan, background: "oklch(0.72 0.12 200 / 15%)", color: FF.cyan }}
        >
          <Printer className="h-3.5 w-3.5" /> Imprimer / PDF
        </button>
      </div>
    </section>
  );
}

/** Mappe un check-in DB vers le format export. */
export function toExportSession(c: {
  date: string;
  energie?: number | null;
  humeur?: number | null;
  temps?: number | null;
  serenite?: number | null;
  ressenti_score?: number | null;
  ressenti_note?: string | null;
  coach_comment?: string | null;
  session_source?: string | null;
  session_duration_sec?: number | null;
  session_ended?: boolean | null;
  nb_blocs?: number | null;
  objectif_du_jour?: string | null;
  fatigue_score?: number | null;
}): ExportSession {
  return {
    date: c.date,
    energie: c.energie ?? null,
    humeur: c.humeur ?? null,
    temps: c.temps ?? null,
    serenite: c.serenite ?? null,
    ressenti_score: c.ressenti_score ?? null,
    ressenti_note: c.ressenti_note ?? null,
    coach_comment: c.coach_comment ?? null,
    session_source: c.session_source ?? null,
    session_duration_sec: c.session_duration_sec ?? null,
    session_ended: c.session_ended ?? null,
    nb_blocs: c.nb_blocs ?? null,
    objectif_du_jour: c.objectif_du_jour ?? null,
    fatigue_score: c.fatigue_score ?? null,
  };
}

export function toExportCompletion(c: {
  date: string;
  jour: string;
  titre: string;
  ressenti_score?: number | null;
  fatigue_score?: number | null;
  ressenti_note?: string | null;
  session_duration_sec?: number | null;
}): ExportProgramCompletion {
  return {
    date: c.date,
    jour: c.jour,
    titre: c.titre,
    ressenti_score: c.ressenti_score ?? null,
    fatigue_score: c.fatigue_score ?? null,
    ressenti_note: c.ressenti_note ?? null,
    session_duration_sec: c.session_duration_sec ?? null,
  };
}
