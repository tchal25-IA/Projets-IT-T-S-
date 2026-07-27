import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  questionsByCategory,
  type Answer,
  type Answers,
} from "@/lib/complianceEngine";
import { loadAudit, saveAudit, setDemoFlag } from "@/lib/auditStorage";

export const Route = createFileRoute("/audit")({
  head: () => ({
    meta: [
      { title: "Audit RGPD & nLPD — Conformia" },
      {
        name: "description",
        content: "Questionnaire guidé RGPD/nLPD, ~15 minutes. Reprise automatique.",
      },
      { property: "og:title", content: "Audit RGPD & nLPD — Conformia" },
      { property: "og:description", content: "Questionnaire guidé, ~15 minutes." },
    ],
  }),
  component: AuditPage,
});

const answerOptions: { value: Answer; label: string; hint: string }[] = [
  { value: "oui", label: "Oui", hint: "Mis en place et documenté" },
  { value: "partiel", label: "Partiellement", hint: "Compte pour 50 %" },
  { value: "non", label: "Non", hint: "À traiter" },
  { value: "na", label: "N/A", hint: "Non applicable — exclu du score" },
];

function AuditPage() {
  const groups = useMemo(() => questionsByCategory(), []);
  const navigate = useNavigate();
  const [answers, setAnswers] = useState<Answers>({});
  const [step, setStep] = useState(0);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const stored = loadAudit();
    if (stored) {
      setAnswers(stored.answers);
      setStep(Math.min(stored.currentStep, groups.length - 1));
    }
    setDemoFlag(false);
    setHydrated(true);
  }, [groups.length]);

  useEffect(() => {
    if (!hydrated) return;
    saveAudit({ answers, currentStep: step, updatedAt: new Date().toISOString() });
  }, [answers, step, hydrated]);

  const current = groups[step];
  const totalQuestions = groups.reduce((n, g) => n + g.items.length, 0);
  const answeredCount = Object.keys(answers).length;
  const progress = Math.round((answeredCount / totalQuestions) * 100);

  const currentAnswered = current.items.every((q) => answers[q.id]);

  function setAnswer(qid: string, v: Answer) {
    setAnswers((prev) => ({ ...prev, [qid]: v }));
  }

  function next() {
    if (step < groups.length - 1) {
      setStep(step + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      navigate({ to: "/resultat" });
    }
  }
  function prev() {
    if (step > 0) {
      setStep(step - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  return (
    <div className="container-tight py-12">
      <div className="mb-8">
        <div className="flex items-baseline justify-between">
          <h1 className="brand text-3xl text-primary md:text-4xl">Votre audit</h1>
          <span className="text-sm text-muted-foreground">
            Étape {step + 1} / {groups.length}
          </span>
        </div>
        <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-secondary">
          <div
            className="h-full bg-accent transition-all"
            style={{ width: `${progress}%` }}
            aria-label={`Progression ${progress}%`}
          />
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          {answeredCount} / {totalQuestions} réponses · reprise automatique via ce navigateur
        </p>
      </div>

      {/* Stepper */}
      <div className="mb-8 flex flex-wrap gap-2">
        {groups.map((g, i) => {
          const done = g.items.every((q) => answers[q.id]);
          const active = i === step;
          return (
            <button
              key={g.category.id}
              onClick={() => setStep(i)}
              className={
                "rounded-full border px-3 py-1 text-xs transition " +
                (active
                  ? "border-primary bg-primary text-primary-foreground"
                  : done
                  ? "border-accent/60 bg-accent/10 text-accent-foreground/90"
                  : "border-border bg-background text-muted-foreground hover:bg-secondary")
              }
            >
              {i + 1}. {g.category.short}
            </button>
          );
        })}
      </div>

      <section className="rounded-xl border border-border bg-card p-6 md:p-8">
        <div className="mb-6">
          <div className="text-xs uppercase tracking-widest text-accent">
            Catégorie {step + 1}
          </div>
          <h2 className="mt-1 brand text-2xl text-primary">{current.category.label}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{current.category.description}</p>
        </div>

        <ol className="space-y-8">
          {current.items.map((q, idx) => (
            <li key={q.id} className="border-b border-border pb-6 last:border-b-0 last:pb-0">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 rounded-full bg-secondary px-2 py-0.5 text-xs font-semibold text-primary">
                  {idx + 1}
                </span>
                <div className="flex-1">
                  <div className="flex flex-wrap items-baseline gap-2">
                    <p className="text-base font-medium text-foreground">{q.text}</p>
                    <span
                      title={`Pondération ${q.weight} / 3`}
                      className="rounded border border-border px-1.5 py-0.5 text-[10px] uppercase tracking-widest text-muted-foreground"
                    >
                      poids {q.weight}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{q.help}</p>
                  <div className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-4">
                    {answerOptions.map((opt) => {
                      const selected = answers[q.id] === opt.value;
                      return (
                        <button
                          key={opt.value}
                          onClick={() => setAnswer(q.id, opt.value)}
                          className={
                            "rounded-md border px-3 py-2 text-left text-sm transition " +
                            (selected
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-border bg-background hover:border-primary/50 hover:bg-secondary")
                          }
                        >
                          <div className="font-medium">{opt.label}</div>
                          <div
                            className={
                              "text-[11px] " +
                              (selected ? "text-primary-foreground/80" : "text-muted-foreground")
                            }
                          >
                            {opt.hint}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ol>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={prev}
            disabled={step === 0}
            className="rounded-md border border-border bg-background px-4 py-2 text-sm text-foreground hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-40"
          >
            ← Précédent
          </button>
          <div className="text-xs text-muted-foreground">
            {currentAnswered ? "Catégorie complète" : "Répondez à toutes les questions pour continuer"}
          </div>
          <button
            onClick={next}
            disabled={!currentAnswered}
            className="rounded-md bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {step === groups.length - 1 ? "Voir mon résultat →" : "Suivant →"}
          </button>
        </div>
      </section>
    </div>
  );
}
