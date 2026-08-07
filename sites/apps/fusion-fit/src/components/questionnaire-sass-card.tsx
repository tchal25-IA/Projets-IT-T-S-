import { ClipboardList } from "lucide-react";
import { SASS_QUESTIONS, formatSassValue, type SassAnswers } from "@/lib/questionnaire-sass";

/** Affiche les réponses du questionnaire Sass (athlète + coach). */
export function QuestionnaireSassCard({
  answers,
  compact = false,
}: {
  answers: SassAnswers | null | undefined;
  compact?: boolean;
}) {
  if (!answers || Object.keys(answers).length === 0) return null;

  const items = SASS_QUESTIONS.map((q) => ({
    q,
    value: formatSassValue(answers[q.id] as string | string[] | number | null | undefined),
  })).filter((x) => x.value !== "—");

  if (items.length === 0) return null;

  return (
    <section
      className="rounded-2xl border p-4 space-y-3"
      style={{ background: "var(--ff-surface)", borderColor: "var(--ff-border)" }}
    >
      <p
        className="text-xs font-mono uppercase tracking-wider flex items-center gap-1"
        style={{ color: "var(--ff-cyan)" }}
      >
        <ClipboardList className="h-3.5 w-3.5" /> Questionnaire Sass
      </p>
      <div className={compact ? "space-y-2 max-h-72 overflow-y-auto pr-1" : "space-y-3"}>
        {items.map(({ q, value }) => (
          <div key={q.id}>
            <p className="text-[10px] font-mono uppercase" style={{ color: "var(--ff-text-muted)" }}>
              Q{q.n} · {q.titre}
            </p>
            <p className="text-sm whitespace-pre-line mt-0.5">{value}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
