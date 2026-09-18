/**
 * Export routines FusionFit — phase 1 (texte + HTML imprimable → PDF navigateur).
 * Phase 2 (plus tard) : banque d'images par mots-clés + PDF illustré.
 */

import { JOURS_FR, blocsForJour, todayJourFr, todayISO } from "@/lib/dates";
import { generateRoutine } from "@/lib/routine-generator";

export type ExportBloc = { jour: string; titre: string; details: string };

export type ExportProgram = {
  titre: string;
  objectif?: string | null;
  blocs: ExportBloc[];
};

export type ExportSession = {
  date: string;
  energie?: number | null;
  humeur?: number | null;
  temps?: number | null;
  serenite?: number | null;
  ressenti_score?: number | null;
  ressenti_note?: string | null;
  fatigue_score?: number | null;
  coach_comment?: string | null;
  session_source?: string | null;
  session_duration_sec?: number | null;
  session_ended?: boolean | null;
  nb_blocs?: number | null;
  objectif_du_jour?: string | null;
};

export type ExportProgramCompletion = {
  date: string;
  jour: string;
  titre: string;
  ressenti_score?: number | null;
  fatigue_score?: number | null;
  ressenti_note?: string | null;
  session_duration_sec?: number | null;
};

export type ExportScope = "jour" | "semaine" | "archives";

export type ExportPayload = {
  scope: ExportScope;
  athleteName: string;
  coachLabel?: string;
  generatedAt: Date;
  program?: ExportProgram | null;
  sessions?: ExportSession[];
  completions?: ExportProgramCompletion[];
  /** Check-in du jour pour reconstruire une routine IA éventuelle */
  todayCheckin?: ExportSession | null;
};

const RPE = ["", "Très dur", "Dur", "Correct", "Facile", "Très facile"];
const FATIGUE = ["", "Épuisé", "Fatigué", "OK", "Frais", "En pleine forme"];
const TEMPS = ["", "15 min", "30 min", "60 min+"];

function fmtDate(iso: string): string {
  try {
    return new Date(iso.length === 10 ? iso + "T12:00:00" : iso).toLocaleDateString("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

function fmtDuration(sec: number | null | undefined): string {
  if (sec == null || sec <= 0) return "—";
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return m > 0 ? `${m} min ${String(s).padStart(2, "0")}s` : `${s}s`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function scopeTitle(scope: ExportScope): string {
  if (scope === "jour") return "Routine du jour";
  if (scope === "semaine") return "Programme de la semaine";
  return "Archives des séances";
}

function filterWeekSessions(sessions: ExportSession[]): ExportSession[] {
  const now = new Date();
  const day = (now.getDay() + 6) % 7; // 0=Lundi
  const monday = new Date(now);
  monday.setHours(0, 0, 0, 0);
  monday.setDate(now.getDate() - day);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);
  const a = monday.toISOString().slice(0, 10);
  const b = sunday.toISOString().slice(0, 10);
  return sessions.filter((s) => s.date >= a && s.date <= b);
}

function buildDayMarkdown(p: ExportPayload): string {
  const lines: string[] = [];
  const today = todayJourFr();
  const iso = todayISO();
  lines.push(`# FusionFit — ${scopeTitle("jour")}`);
  lines.push(`Athlète : ${p.athleteName}`);
  if (p.coachLabel) lines.push(`Coach : ${p.coachLabel}`);
  lines.push(`Date : ${fmtDate(iso)} (${today})`);
  lines.push(`Généré le : ${p.generatedAt.toLocaleString("fr-FR")}`);
  lines.push("");

  const blocs = blocsForJour(p.program?.blocs, today);
  if (p.program && blocs.length > 0) {
    lines.push(`## Programme · ${p.program.titre}`);
    if (p.program.objectif) lines.push(`Objectif : ${p.program.objectif}`);
    lines.push("");
    for (const b of blocs) {
      lines.push(`### ${b.titre}`);
      if (b.details?.trim()) lines.push(b.details.trim());
      lines.push("");
    }
  } else if (p.todayCheckin?.energie && p.todayCheckin?.humeur && p.todayCheckin?.temps) {
    lines.push("## Routine générée (check-in)");
    lines.push(
      `Énergie ${p.todayCheckin.energie}/5 · Humeur ${p.todayCheckin.humeur}/5 · Temps ${TEMPS[p.todayCheckin.temps] ?? "—"}`,
    );
    if (p.todayCheckin.objectif_du_jour) {
      lines.push(`Objectif du jour : ${p.todayCheckin.objectif_du_jour}`);
    }
    lines.push("");
    const routine = generateRoutine({
      temps: p.todayCheckin.temps,
      energie: p.todayCheckin.energie,
      humeur: p.todayCheckin.humeur,
      objectif_du_jour: p.todayCheckin.objectif_du_jour ?? null,
    });
    for (const block of routine) {
      lines.push(`### ${block.pilier} · ${block.titre} (${block.duree})`);
      for (const ex of block.exercises) lines.push(`- ${ex}`);
      lines.push("");
    }
  } else {
    lines.push("_Aucune séance de programme ni check-in complet pour aujourd'hui._");
    lines.push("");
  }

  const todaySession = (p.sessions ?? []).find((s) => s.date === iso) ?? p.todayCheckin;
  const todayComp = (p.completions ?? []).find((c) => c.date === iso);
  if (todaySession || todayComp) {
    lines.push("## Ressenti / validation");
    if (todaySession) {
      if (todaySession.ressenti_score != null) {
        lines.push(`RPE : ${todaySession.ressenti_score}/5 (${RPE[todaySession.ressenti_score]})`);
      }
      if (todaySession.ressenti_note) lines.push(`Remarques : ${todaySession.ressenti_note}`);
      if (todaySession.coach_comment) lines.push(`Commentaire coach : ${todaySession.coach_comment}`);
      if (todaySession.serenite != null) lines.push(`Sérénité : ${todaySession.serenite}%`);
      lines.push(`Durée : ${fmtDuration(todaySession.session_duration_sec)}`);
    }
    if (todayComp) {
      lines.push(`Validation programme : ${todayComp.titre}`);
      if (todayComp.ressenti_score != null) {
        lines.push(`RPE programme : ${todayComp.ressenti_score}/5 (${RPE[todayComp.ressenti_score]})`);
      }
      if (todayComp.fatigue_score != null) {
        lines.push(`Fatigue : ${todayComp.fatigue_score}/5 (${FATIGUE[todayComp.fatigue_score]})`);
      }
      if (todayComp.ressenti_note) lines.push(`Note : ${todayComp.ressenti_note}`);
    }
    lines.push("");
  }

  lines.push("---");
  lines.push("FusionFit Initiative · Export phase 1 (texte)");
  return lines.join("\n");
}

function buildWeekMarkdown(p: ExportPayload): string {
  const lines: string[] = [];
  lines.push(`# FusionFit — ${scopeTitle("semaine")}`);
  lines.push(`Athlète : ${p.athleteName}`);
  if (p.coachLabel) lines.push(`Coach : ${p.coachLabel}`);
  lines.push(`Généré le : ${p.generatedAt.toLocaleString("fr-FR")}`);
  lines.push("");

  if (!p.program || !(p.program.blocs?.length > 0)) {
    lines.push("_Aucun programme hebdomadaire attribué._");
  } else {
    lines.push(`## ${p.program.titre}`);
    if (p.program.objectif) lines.push(`Objectif : ${p.program.objectif}`);
    lines.push("");
    for (const jour of JOURS_FR) {
      const blocs = blocsForJour(p.program.blocs, jour);
      lines.push(`### ${jour}`);
      if (blocs.length === 0) {
        lines.push("_Repos / hors programme_");
      } else {
        for (const b of blocs) {
          lines.push(`**${b.titre}**`);
          if (b.details?.trim()) lines.push(b.details.trim());
        }
      }
      lines.push("");
    }
  }

  const weekSessions = filterWeekSessions(p.sessions ?? []);
  if (weekSessions.length) {
    lines.push("## Séances réalisées cette semaine");
    for (const s of weekSessions) {
      lines.push(
        `- ${fmtDate(s.date)} · sérénité ${s.serenite ?? "—"}% · RPE ${s.ressenti_score ?? "—"}/5 · ${fmtDuration(s.session_duration_sec)}`,
      );
      if (s.ressenti_note) lines.push(`  Remarque : ${s.ressenti_note}`);
    }
    lines.push("");
  }

  lines.push("---");
  lines.push("FusionFit Initiative · Export phase 1 (texte)");
  return lines.join("\n");
}

function buildArchivesMarkdown(p: ExportPayload): string {
  const lines: string[] = [];
  lines.push(`# FusionFit — ${scopeTitle("archives")}`);
  lines.push(`Athlète : ${p.athleteName}`);
  if (p.coachLabel) lines.push(`Coach : ${p.coachLabel}`);
  lines.push(`Généré le : ${p.generatedAt.toLocaleString("fr-FR")}`);
  lines.push("");

  const sessions = [...(p.sessions ?? [])].sort((a, b) => b.date.localeCompare(a.date));
  const completions = [...(p.completions ?? [])].sort((a, b) => b.date.localeCompare(a.date));

  if (sessions.length === 0 && completions.length === 0) {
    lines.push("_Aucune archive disponible._");
    lines.push("");
  }

  if (sessions.length) {
    lines.push("## Check-ins & routines");
    lines.push("");
    for (const s of sessions) {
      lines.push(`### ${fmtDate(s.date)}`);
      lines.push(
        `Énergie ${s.energie ?? "—"}/5 · Humeur ${s.humeur ?? "—"}/5 · Temps ${s.temps != null ? TEMPS[s.temps] : "—"}`,
      );
      if (s.objectif_du_jour) lines.push(`Objectif : ${s.objectif_du_jour}`);
      lines.push(
        `Sérénité ${s.serenite ?? "—"}% · Source ${s.session_source ?? "base"} · Durée ${fmtDuration(s.session_duration_sec)}`,
      );
      if (s.ressenti_score != null) {
        lines.push(`RPE : ${s.ressenti_score}/5 (${RPE[s.ressenti_score]})`);
      }
      if (s.ressenti_note) lines.push(`Remarques : ${s.ressenti_note}`);
      if (s.coach_comment) lines.push(`Coach : ${s.coach_comment}`);
      lines.push("");
    }
  }

  if (completions.length) {
    lines.push("## Validations programme");
    lines.push("");
    for (const c of completions) {
      lines.push(`### ${fmtDate(c.date)} · ${c.jour}`);
      lines.push(c.titre);
      if (c.ressenti_score != null) lines.push(`RPE : ${c.ressenti_score}/5 (${RPE[c.ressenti_score]})`);
      if (c.fatigue_score != null) {
        lines.push(`Fatigue : ${c.fatigue_score}/5 (${FATIGUE[c.fatigue_score]})`);
      }
      if (c.ressenti_note) lines.push(`Note : ${c.ressenti_note}`);
      lines.push(`Durée : ${fmtDuration(c.session_duration_sec)}`);
      lines.push("");
    }
  }

  lines.push("---");
  lines.push("FusionFit Initiative · Export phase 1 (texte)");
  return lines.join("\n");
}

export function buildExportMarkdown(p: ExportPayload): string {
  if (p.scope === "jour") return buildDayMarkdown(p);
  if (p.scope === "semaine") return buildWeekMarkdown(p);
  return buildArchivesMarkdown(p);
}

/** HTML imprimable (l'utilisateur peut « Enregistrer en PDF » depuis le dialogue d'impression). */
export function buildExportHtml(p: ExportPayload): string {
  const md = buildExportMarkdown(p);
  const body = md
    .split("\n")
    .map((line) => {
      if (line.startsWith("# ")) return `<h1>${escapeHtml(line.slice(2))}</h1>`;
      if (line.startsWith("## ")) return `<h2>${escapeHtml(line.slice(3))}</h2>`;
      if (line.startsWith("### ")) return `<h3>${escapeHtml(line.slice(4))}</h3>`;
      if (line.startsWith("- ")) return `<li>${escapeHtml(line.slice(2))}</li>`;
      if (line.startsWith("---")) return `<hr/>`;
      if (line.startsWith("_") && line.endsWith("_")) {
        return `<p class="muted"><em>${escapeHtml(line.slice(1, -1))}</em></p>`;
      }
      if (line.startsWith("**") && line.includes("**")) {
        return `<p><strong>${escapeHtml(line.replace(/\*\*/g, ""))}</strong></p>`;
      }
      if (!line.trim()) return "";
      return `<p>${escapeHtml(line)}</p>`;
    })
    .join("\n");

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8"/>
  <title>${escapeHtml(scopeTitle(p.scope))} — ${escapeHtml(p.athleteName)}</title>
  <style>
    :root { color-scheme: light; }
    body { font-family: "Segoe UI", system-ui, sans-serif; max-width: 720px; margin: 2rem auto; padding: 0 1.25rem; color: #111; line-height: 1.5; }
    h1 { font-size: 1.5rem; border-bottom: 2px solid #0ea5b7; padding-bottom: .4rem; }
    h2 { font-size: 1.15rem; margin-top: 1.5rem; color: #0b7285; }
    h3 { font-size: 1rem; margin-top: 1rem; }
    p, li { font-size: .95rem; }
    .muted { color: #666; }
    hr { border: none; border-top: 1px solid #ddd; margin: 2rem 0; }
    @media print {
      body { margin: 0; }
      h2 { page-break-after: avoid; }
    }
  </style>
</head>
<body>
${body}
<script>window.onload = function(){ setTimeout(function(){ window.print(); }, 250); }</script>
</body>
</html>`;
}

export function downloadTextFile(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function openPrintableExport(html: string) {
  const w = window.open("", "_blank");
  if (!w) {
    alert("Autorise les pop-ups pour ouvrir l'export imprimable (PDF).");
    return;
  }
  w.document.open();
  w.document.write(html);
  w.document.close();
}

export function slugifyName(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "athlete";
}

export function exportFilename(scope: ExportScope, athleteName: string): string {
  const d = todayISO();
  return `fusionfit-${scope}-${slugifyName(athleteName)}-${d}.txt`;
}
