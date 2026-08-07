import Link from "next/link";
import { Badge } from "@/components/ui";
import { BILLING_LABELS, formatDateTime, formatEuro } from "@/lib/utils";
import type { BillingStatus, TaskPriority } from "@/generated/prisma/client";

type Line = {
  id: string;
  label: string;
  amountHt: number;
  billingStatus: BillingStatus;
};

type Commission = {
  id: string;
  label: string;
  amountHt: number;
  user: { fullName: string };
};

type TaskRow = {
  id: string;
  title: string;
  dueAt: Date | null;
  doneAt: Date | null;
  priority: TaskPriority;
};

export function RelatedRail({
  dealLines,
  commissions,
  tasks,
  nextCallAt,
  score,
  interests,
}: {
  dealLines: Line[];
  commissions: Commission[];
  tasks: TaskRow[];
  nextCallAt: Date | null;
  score: number;
  interests: string[];
}) {
  return (
    <aside className="space-y-4">
      <section className="rounded-lg border border-stone-200 bg-white p-3">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase text-stone-500">Score</h3>
          <Badge tone={score >= 70 ? "success" : score >= 45 ? "warning" : "neutral"}>
            {score}/100
          </Badge>
        </div>
        {interests.length > 0 ? (
          <p className="text-xs text-stone-600">
            Intérêts : {interests.join(" · ")}
          </p>
        ) : (
          <p className="text-xs text-stone-400">Aucun intérêt multi-produit</p>
        )}
        {nextCallAt ? (
          <p className="mt-2 text-xs text-stone-600">
            Prochain rappel : {formatDateTime(nextCallAt)}
          </p>
        ) : null}
      </section>

      <section className="rounded-lg border border-stone-200 bg-white p-3">
        <h3 className="mb-2 text-xs font-semibold uppercase text-stone-500">
          Prestations ({dealLines.length})
        </h3>
        <ul className="space-y-2">
          {dealLines.slice(0, 5).map((l) => (
            <li key={l.id} className="text-sm">
              <div className="flex justify-between gap-2">
                <span className="truncate">{l.label}</span>
                <span className="shrink-0 text-stone-600">
                  {formatEuro(l.amountHt)}
                </span>
              </div>
              <span className="text-[11px] text-stone-400">
                {BILLING_LABELS[l.billingStatus]}
              </span>
            </li>
          ))}
          {dealLines.length === 0 ? (
            <li className="text-xs text-stone-400">Aucune ligne</li>
          ) : null}
        </ul>
      </section>

      <section className="rounded-lg border border-stone-200 bg-white p-3">
        <h3 className="mb-2 text-xs font-semibold uppercase text-stone-500">
          Commissions ({commissions.length})
        </h3>
        <ul className="space-y-2">
          {commissions.slice(0, 4).map((c) => (
            <li key={c.id} className="flex justify-between text-sm">
              <span className="truncate">{c.user.fullName}</span>
              <span>{formatEuro(c.amountHt)}</span>
            </li>
          ))}
          {commissions.length === 0 ? (
            <li className="text-xs text-stone-400">Après close</li>
          ) : null}
        </ul>
      </section>

      <section className="rounded-lg border border-stone-200 bg-white p-3">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase text-stone-500">
            Tâches
          </h3>
          <Link href="/taches" className="text-[11px] text-teal-800 hover:underline">
            Agenda
          </Link>
        </div>
        <ul className="space-y-2">
          {tasks.filter((t) => !t.doneAt).slice(0, 5).map((t) => (
            <li key={t.id} className="text-sm">
              <p className="leading-snug">{t.title}</p>
              <p className="text-[11px] text-stone-400">
                {t.dueAt ? formatDateTime(t.dueAt) : "Sans échéance"} · {t.priority}
              </p>
            </li>
          ))}
          {tasks.filter((t) => !t.doneAt).length === 0 ? (
            <li className="text-xs text-stone-400">Aucune tâche ouverte</li>
          ) : null}
        </ul>
      </section>
    </aside>
  );
}
