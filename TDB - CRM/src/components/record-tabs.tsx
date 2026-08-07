"use client";

import { useEffect, useMemo, useState } from "react";
import {
  RECORD_TABS,
  isTabUnlocked,
  pathProgress,
  type RecordTabId,
} from "@/lib/record-path";
import { STATUS_LABELS, cn } from "@/lib/utils";
import type { LeadStatus } from "@/generated/prisma/client";
import { Lock } from "lucide-react";

export function SalesPath({ status }: { status: LeadStatus }) {
  const { steps, percent } = pathProgress(status);
  return (
    <div className="rounded-lg border border-stone-200 bg-white p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">
          Parcours commercial
        </p>
        <p className="text-xs text-stone-500">
          {status === "PERDU" ? "Perdu" : `${percent}% · ${STATUS_LABELS[status]}`}
        </p>
      </div>
      <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-stone-100">
        <div
          className={cn(
            "h-full transition-all",
            status === "PERDU" ? "bg-red-600" : "bg-teal-700"
          )}
          style={{ width: `${status === "PERDU" ? 100 : percent}%` }}
        />
      </div>
      <div className="flex flex-wrap gap-1.5">
        {steps.map((step) => (
          <span
            key={step.status}
            className={cn(
              "rounded px-2 py-1 text-[11px] font-medium",
              step.state === "done" && "bg-teal-800 text-white",
              step.state === "current" && "bg-teal-100 text-teal-900 ring-1 ring-teal-700",
              step.state === "todo" && "bg-stone-100 text-stone-400",
              step.state === "lost" && "bg-red-50 text-red-700"
            )}
          >
            {STATUS_LABELS[step.status]}
          </span>
        ))}
      </div>
    </div>
  );
}

export function RecordTabs({
  leadStatus,
  hasClient,
  defaultTab = "resume",
  panels,
  visibleTabs,
}: {
  leadStatus: LeadStatus;
  hasClient: boolean;
  defaultTab?: RecordTabId;
  panels: Partial<Record<RecordTabId, React.ReactNode>>;
  /** Filtrer les onglets visibles selon le rôle (ex. apporteur sans facturation). */
  visibleTabs?: RecordTabId[];
}) {
  const tabs = useMemo(() => {
    const list = visibleTabs
      ? RECORD_TABS.filter((t) => visibleTabs.includes(t.id))
      : RECORD_TABS;
    return list.map((tab) => ({
      ...tab,
      unlocked: isTabUnlocked(tab, leadStatus, hasClient),
    }));
  }, [leadStatus, hasClient, visibleTabs]);

  const firstUnlocked =
    tabs.find((t) => t.unlocked && panels[t.id])?.id ?? defaultTab;
  const [active, setActive] = useState<RecordTabId>(firstUnlocked);

  useEffect(() => {
    const stillOk = tabs.some((t) => t.id === active && t.unlocked && panels[t.id]);
    if (!stillOk) setActive(firstUnlocked);
  }, [leadStatus, hasClient, tabs, active, firstUnlocked, panels]);

  const current = tabs.find((t) => t.id === active) ?? tabs[0];
  const panel = current?.unlocked ? panels[current.id] : null;

  return (
    <div className="overflow-hidden rounded-xl border border-stone-200 bg-white">
      <div className="flex gap-1 overflow-x-auto border-b border-stone-200 bg-stone-50 px-2 pt-2">
        {tabs.map((tab) => {
          const isActive = tab.id === active;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActive(tab.id)}
              className={cn(
                "relative flex shrink-0 items-center gap-1.5 rounded-t-md px-3 py-2.5 text-sm font-medium transition",
                isActive && tab.unlocked
                  ? "bg-white text-teal-900 shadow-[0_-1px_0_0_#fff]"
                  : tab.unlocked
                    ? "text-stone-600 hover:bg-white/70 hover:text-stone-900"
                    : "cursor-pointer text-stone-400"
              )}
              title={
                tab.unlocked
                  ? tab.description
                  : `Verrouillé jusqu'à « ${
                      tab.unlockAt === "CLIENT"
                        ? "Client"
                        : STATUS_LABELS[tab.unlockAt as LeadStatus]
                    } »`
              }
            >
              {!tab.unlocked ? <Lock size={12} /> : null}
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="p-5">
        {!current?.unlocked ? (
          <div className="rounded-lg border border-dashed border-stone-300 bg-stone-50 px-6 py-10 text-center">
            <Lock className="mx-auto mb-3 text-stone-400" size={28} />
            <p className="font-medium text-stone-800">Onglet verrouillé</p>
            <p className="mt-2 text-sm text-stone-500">
              « {current?.label} » se débloque au statut{" "}
              <strong>
                {current?.unlockAt === "CLIENT"
                  ? "Closé / Client"
                  : STATUS_LABELS[current!.unlockAt as LeadStatus]}
              </strong>
              . Faites progresser le lead dans le parcours pour y accéder.
            </p>
          </div>
        ) : (
          panel ?? (
            <p className="text-sm text-stone-500">Aucun contenu pour cet onglet.</p>
          )
        )}
      </div>
    </div>
  );
}
