import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { useLeads, useQuotes, useReminders, useProfile } from "@/lib/useStore";
import { computeTotals, formatMoney, formatDate } from "@/lib/quoteEngine";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, BellRing, TrendingUp, Users, Plus } from "lucide-react";
import type { LeadStatus } from "@/lib/types";

export const Route = createFileRoute("/app/")({
  component: Pipeline,
});

const COLUMNS: { key: LeadStatus; label: string }[] = [
  { key: "nouveau", label: "Nouveau" },
  { key: "contacté", label: "Contacté" },
  { key: "devis_envoyé", label: "Devis envoyé" },
  { key: "gagné", label: "Gagné" },
  { key: "perdu", label: "Perdu" },
];

function Pipeline() {
  const { leads } = useLeads();
  const { quotes } = useQuotes();
  const { reminders } = useReminders();
  const { profile } = useProfile();

  const openQuotes = quotes.filter((q) => q.status === "envoyé" || q.status === "brouillon");
  const dueReminders = reminders.filter(
    (r) => !r.done && new Date(r.dueDate).getTime() <= Date.now(),
  );
  const wonThisYear = quotes.filter((q) => q.status === "accepté");
  const wonAmount = useMemo(
    () => wonThisYear.reduce((sum, q) => sum + computeTotals(q.lines).ttc, 0),
    [wonThisYear],
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold uppercase">Pipeline</h1>
          <p className="text-sm text-muted-foreground">
            Vue d'ensemble de vos prospects, devis et relances.
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link to="/app/leads">
              <Plus className="mr-1 h-4 w-4" /> Prospect
            </Link>
          </Button>
          <Button asChild>
            <Link to="/app/devis/nouveau">
              <Plus className="mr-1 h-4 w-4" /> Nouveau devis
            </Link>
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi
          icon={<Users className="h-5 w-5" />}
          label="Prospects"
          value={leads.length.toString()}
        />
        <Kpi
          icon={<FileText className="h-5 w-5" />}
          label="Devis ouverts"
          value={openQuotes.length.toString()}
        />
        <Kpi
          icon={<BellRing className="h-5 w-5" />}
          label="À relancer"
          value={dueReminders.length.toString()}
          highlight={dueReminders.length > 0}
        />
        <Kpi
          icon={<TrendingUp className="h-5 w-5" />}
          label="Gagné"
          value={formatMoney(wonAmount, profile.currency)}
        />
      </div>

      {/* Kanban */}
      <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-5">
        {COLUMNS.map((col) => {
          const items = leads.filter((l) => l.status === col.key);
          return (
            <div key={col.key} className="rounded-md border border-border bg-card">
              <div className="flex items-center justify-between border-b border-border px-3 py-2">
                <div className="font-display text-sm font-bold uppercase tracking-wide">
                  {col.label}
                </div>
                <Badge variant="secondary" className="rounded-full">
                  {items.length}
                </Badge>
              </div>
              <div className="space-y-2 p-2">
                {items.length === 0 && (
                  <p className="p-2 text-xs text-muted-foreground">Vide.</p>
                )}
                {items.map((l) => (
                  <Link
                    key={l.id}
                    to="/app/leads"
                    className="block rounded border border-border bg-background p-2 text-sm hover:border-primary"
                  >
                    <div className="font-medium">{l.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {l.city} · {formatDate(l.createdAt)}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Overdue reminders quick view */}
      {dueReminders.length > 0 && (
        <Card className="border-primary/40 p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-lg font-bold uppercase">Relances en retard</h2>
            <Button asChild size="sm" variant="outline">
              <Link to="/app/relances">Tout voir</Link>
            </Button>
          </div>
          <ul className="space-y-2 text-sm">
            {dueReminders.slice(0, 3).map((r) => {
              const q = quotes.find((qq) => qq.id === r.quoteId);
              const lead = q ? leads.find((l) => l.id === q.leadId) : undefined;
              return (
                <li key={r.id} className="flex items-center justify-between border-b border-border pb-2 last:border-0">
                  <div>
                    <div className="font-medium">
                      {lead?.name ?? "?"} — {q?.number ?? "?"}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Prévue le {formatDate(r.dueDate)} · {r.channel}
                    </div>
                  </div>
                  <Badge variant="destructive">Retard</Badge>
                </li>
              );
            })}
          </ul>
        </Card>
      )}
    </div>
  );
}

function Kpi({
  icon,
  label,
  value,
  highlight,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <Card className={`p-4 ${highlight ? "border-primary bg-primary/5" : ""}`}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">{label}</span>
        <span className={highlight ? "text-primary" : "text-concrete"}>{icon}</span>
      </div>
      <div className="mt-2 font-display text-3xl font-bold">{value}</div>
    </Card>
  );
}
