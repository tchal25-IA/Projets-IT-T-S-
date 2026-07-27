import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import {
  computeResult,
  demoAnswers,
  type Answers,
  type AuditResult,
} from "@/lib/complianceEngine";
import { getEmail, loadAudit, saveEmail, setDemoFlag } from "@/lib/auditStorage";

const searchSchema = z.object({ demo: z.coerce.number().optional() });

export const Route = createFileRoute("/resultat")({
  validateSearch: (s) => searchSchema.parse(s),
  head: () => ({
    meta: [
      { title: "Résultat de votre audit — Conformia" },
      { name: "description", content: "Score, notation A–E et plan d'actions prioritaires." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Résultat — Conformia" },
      { property: "og:description", content: "Votre score RGPD/nLPD et le top des actions à mener." },
    ],
  }),
  component: ResultPage,
});

function ResultPage() {
  const { demo } = Route.useSearch();
  const [answers, setAnswers] = useState<Answers | null>(null);
  const [email, setEmail] = useState("");
  const [unlocked, setUnlocked] = useState(false);

  useEffect(() => {
    if (demo) {
      setDemoFlag(true);
      setAnswers(demoAnswers());
      setUnlocked(true);
      return;
    }
    const stored = loadAudit();
    if (stored) setAnswers(stored.answers);
    const savedEmail = getEmail();
    if (savedEmail) {
      setEmail(savedEmail);
      setUnlocked(true);
    }
  }, [demo]);

  const result: AuditResult | null = useMemo(
    () => (answers ? computeResult(answers) : null),
    [answers],
  );

  if (!answers) {
    return (
      <div className="container-tight py-20 text-center">
        <h1 className="brand text-3xl text-primary">Aucun audit trouvé</h1>
        <p className="mt-3 text-muted-foreground">
          Lancez le questionnaire pour obtenir votre score.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Link
            to="/audit"
            className="rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Faire l'audit
          </Link>
          <Link
            to="/resultat"
            search={{ demo: 1 }}
            className="rounded-md border border-border bg-background px-5 py-2.5 text-sm text-foreground hover:bg-secondary"
          >
            Voir un exemple
          </Link>
        </div>
      </div>
    );
  }

  if (!result) return null;

  const { score, grade, categories: cats, actions } = result;
  const topActions = actions.slice(0, 5);
  const remainingActions = actions.slice(5);

  return (
    <div className="container-tight py-12">
      <div className="no-print mb-4 flex flex-wrap items-center justify-between gap-2">
        <Link to="/audit" className="text-sm text-muted-foreground hover:text-foreground">
          ← Modifier mes réponses
        </Link>
        <button
          onClick={() => window.print()}
          className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:opacity-90"
        >
          Imprimer / Exporter en PDF
        </button>
      </div>

      {demo ? (
        <div className="no-print mb-6 rounded-md border border-accent/40 bg-accent/10 px-4 py-3 text-sm text-foreground">
          Vous consultez un <strong>exemple</strong> de résultat.{" "}
          <Link to="/audit" className="underline">Lancez votre propre audit</Link>.
        </div>
      ) : null}

      {/* HEADER SCORE */}
      <section className="print-block grid gap-6 rounded-xl border border-border bg-card p-6 md:grid-cols-[auto_1fr] md:p-10">
        <ScoreGauge score={score} grade={grade} />
        <div>
          <div className="text-xs uppercase tracking-widest text-accent">Votre conformité</div>
          <h1 className="brand text-3xl text-primary md:text-4xl">
            Score : {score} / 100 · Note {grade}
          </h1>
          <p className="mt-3 text-muted-foreground">
            {gradeMessage(grade)}
          </p>
          <p className="mt-3 text-xs text-muted-foreground">
            Basé sur {result.answeredCount} réponses sur {result.totalQuestions} questions. Les
            réponses « Partiel » comptent pour 50 %. Les « N/A » sont exclues.
          </p>
        </div>
      </section>

      {/* CATEGORIES BREAKDOWN */}
      <section className="print-block mt-8 rounded-xl border border-border bg-card p-6 md:p-8">
        <h2 className="brand text-2xl text-primary">Détail par catégorie</h2>
        <ul className="mt-6 space-y-4">
          {cats.map((c) => (
            <li key={c.id}>
              <div className="mb-1 flex items-baseline justify-between text-sm">
                <span className="font-medium text-foreground">{c.label}</span>
                <span className="tabular-nums text-muted-foreground">
                  {c.answered === 0 ? "Non évalué" : `${c.score} / 100`}
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                <div
                  className={"h-full " + barColor(c.score, c.answered === 0)}
                  style={{ width: `${c.answered === 0 ? 0 : c.score}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* PRIORITY ACTIONS */}
      <section className="print-block mt-8 rounded-xl border border-border bg-card p-6 md:p-8">
        <h2 className="brand text-2xl text-primary">Vos 5 actions prioritaires</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Classées par gravité (« Non » avant « Partiel ») puis par pondération.
        </p>

        {topActions.length === 0 ? (
          <p className="mt-6 rounded-md border border-accent/40 bg-accent/10 px-4 py-3 text-sm">
            Aucune action prioritaire — bravo, vos réponses ne signalent aucun écart majeur.
          </p>
        ) : (
          <ol className="mt-6 space-y-4">
            {topActions.map((a, i) => (
              <li key={a.questionId} className="rounded-lg border border-border bg-background p-4">
                <div className="flex items-baseline gap-3">
                  <span className="brand text-2xl text-accent">{i + 1}</span>
                  <div className="flex-1">
                    <div className="flex flex-wrap items-baseline gap-2 text-xs uppercase tracking-widest text-muted-foreground">
                      <span>{a.categoryLabel}</span>
                      <span
                        className={
                          "rounded px-1.5 py-0.5 " +
                          (a.status === "non"
                            ? "bg-destructive/15 text-destructive"
                            : "bg-accent/15 text-accent-foreground")
                        }
                      >
                        {a.status === "non" ? "Non" : "Partiel"}
                      </span>
                    </div>
                    <p className="mt-1 font-medium text-foreground">{a.text}</p>
                    <p className="mt-2 text-sm text-muted-foreground">
                      <strong className="text-foreground">Action :</strong> {a.action}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ol>
        )}
      </section>

      {/* EMAIL GATE + FULL PLAN */}
      {remainingActions.length > 0 ? (
        unlocked ? (
          <section className="print-block print-page-break mt-8 rounded-xl border border-border bg-card p-6 md:p-8">
            <h2 className="brand text-2xl text-primary">Plan d'actions complet</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {actions.length} points d'amélioration au total.
            </p>
            <ol className="mt-6 space-y-3">
              {actions.map((a, i) => (
                <li key={a.questionId} className="rounded-md border border-border bg-background p-4">
                  <div className="text-xs uppercase tracking-widest text-muted-foreground">
                    {i + 1}. {a.categoryLabel} · {a.status === "non" ? "Non" : "Partiel"} · poids{" "}
                    {a.weight}
                  </div>
                  <p className="mt-1 font-medium text-foreground">{a.text}</p>
                  <p className="mt-1 text-sm text-muted-foreground">→ {a.action}</p>
                </li>
              ))}
            </ol>
          </section>
        ) : (
          <section className="no-print mt-8 rounded-xl border border-dashed border-primary/40 bg-secondary/40 p-6 md:p-8">
            <h2 className="brand text-2xl text-primary">
              Débloquer le plan d'actions complet ({actions.length} points)
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Renseignez votre email pour afficher toutes les actions et générer le rapport PDF complet.
              Aucun spam.
            </p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!email.includes("@")) return;
                saveEmail(email);
                setUnlocked(true);
              }}
              className="mt-4 flex flex-col gap-2 sm:flex-row"
            >
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="vous@entreprise.fr"
                className="flex-1 rounded-md border border-input bg-background px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
              <button
                type="submit"
                className="rounded-md bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                Débloquer
              </button>
            </form>
          </section>
        )
      ) : null}

      {/* DISCLAIMER */}
      <section className="print-block mt-8 rounded-md border border-border bg-secondary/50 p-4 text-xs text-muted-foreground">
        <strong className="text-foreground">Rappel :</strong> ce rapport est un auto-diagnostic
        pédagogique. Il ne constitue ni un conseil juridique, ni un audit certifiant. Pour un dossier
        sensible (DPIA, contentieux, sanction CNIL/PFPDT), consultez un professionnel qualifié.
      </section>
    </div>
  );
}

function ScoreGauge({ score, grade }: { score: number; grade: string }) {
  const size = 180;
  const stroke = 14;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (score / 100) * c;
  const color =
    score >= 70 ? "var(--color-accent)" : score >= 40 ? "oklch(0.75 0.15 75)" : "var(--color-destructive)";
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          strokeWidth={stroke}
          className="fill-none stroke-secondary"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          style={{ stroke: color }}
          className="fill-none transition-all"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="brand text-5xl text-primary">{grade}</div>
        <div className="text-sm tabular-nums text-muted-foreground">{score}/100</div>
      </div>
    </div>
  );
}

function barColor(score: number, empty: boolean): string {
  if (empty) return "bg-border";
  if (score >= 70) return "bg-accent";
  if (score >= 40) return "bg-chart-3";
  return "bg-destructive";
}

function gradeMessage(grade: string): string {
  switch (grade) {
    case "A":
      return "Excellent niveau de conformité. Maintenez la documentation à jour et refaites une passe tous les 6 mois.";
    case "B":
      return "Bonne base. Quelques points à consolider — priorisez les actions ci-dessous.";
    case "C":
      return "Niveau intermédiaire. Des risques concrets existent : traitez d'abord les points de poids 3.";
    case "D":
      return "Conformité insuffisante. Un incident de sécurité ou un contrôle exposerait des manquements notables.";
    default:
      return "Conformité très faible. Une mise en conformité rapide est nécessaire pour limiter les risques.";
  }
}
