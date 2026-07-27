import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useTipStore } from "@/lib/tipStore";
import { computeSettlement, formatMoney, METHOD_LABELS } from "@/lib/tipEngine";
import { Button } from "@/components/ui/button";
import { Lock, Trash2 } from "lucide-react";

export const Route = createFileRoute("/app/historique")({
  head: () => ({
    meta: [
      { title: "Historique — TipShare" },
      { name: "description", content: "Toutes vos journées de tips passées, prêtes à être rouvertes ou imprimées." },
      { property: "og:title", content: "Historique — TipShare" },
      { property: "og:description", content: "Journées passées et répartitions archivées." },
    ],
  }),
  component: HistoryPage,
});

function HistoryPage() {
  const { days, staff, venue, removeDay } = useTipStore();
  const sorted = [...days].sort((a, b) => (a.date < b.date ? 1 : -1));

  return (
    <AppShell>
      <h1 className="brand-serif text-3xl text-primary">Historique</h1>
      <p className="text-sm text-muted-foreground">
        {sorted.length} journée{sorted.length > 1 ? "s" : ""} enregistrée{sorted.length > 1 ? "s" : ""}.
      </p>

      <div className="mt-6 space-y-3">
        {sorted.map((d) => {
          const settlement = computeSettlement(d, staff, venue.currency);
          return (
            <div key={d.id} className="rounded-xl border border-border bg-card p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="brand-serif text-xl text-primary">
                    {new Date(d.date).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {METHOD_LABELS[d.method]} · {settlement.shares.length} personne{settlement.shares.length > 1 ? "s" : ""}
                    {d.locked && <> · <Lock className="mx-1 inline h-3 w-3" />clôturée</>}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="brand-serif text-2xl text-primary">
                    {formatMoney(settlement.total, venue.currency)}
                  </div>
                  <Link to="/app">
                    <Button variant="outline" size="sm">Voir</Button>
                  </Link>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      if (confirm("Supprimer cette journée ?")) removeDay(d.id);
                    }}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2 text-xs">
                {settlement.shares.map((s) => (
                  <span key={s.staffId} className="rounded-full bg-secondary px-3 py-1">
                    {s.name} — {formatMoney(s.amount, venue.currency)}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
        {sorted.length === 0 && (
          <p className="text-sm text-muted-foreground">Aucune journée pour le moment.</p>
        )}
      </div>
    </AppShell>
  );
}
