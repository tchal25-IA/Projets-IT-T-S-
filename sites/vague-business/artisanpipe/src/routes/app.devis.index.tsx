import { createFileRoute, Link } from "@tanstack/react-router";
import { useLeads, useQuotes, useProfile } from "@/lib/useStore";
import { computeTotals, formatMoney, formatDate } from "@/lib/quoteEngine";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import type { QuoteStatus } from "@/lib/types";

export const Route = createFileRoute("/app/devis/")({
  component: DevisList,
});

const statusColor: Record<QuoteStatus, string> = {
  brouillon: "bg-muted text-muted-foreground",
  envoyé: "bg-primary/15 text-primary",
  accepté: "bg-green-600/15 text-green-700 dark:text-green-400",
  refusé: "bg-destructive/15 text-destructive",
};

function DevisList() {
  const { quotes } = useQuotes();
  const { leads } = useLeads();
  const { profile } = useProfile();
  const sorted = [...quotes].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold uppercase">Devis</h1>
          <p className="text-sm text-muted-foreground">
            {quotes.length} devis au total.
          </p>
        </div>
        <Button asChild>
          <Link to="/app/devis/nouveau">
            <Plus className="mr-1 h-4 w-4" /> Nouveau devis
          </Link>
        </Button>
      </div>

      <div className="grid gap-3">
        {sorted.length === 0 && (
          <Card className="p-8 text-center text-muted-foreground">
            Aucun devis. Créez-en un depuis un prospect ou directement.
          </Card>
        )}
        {sorted.map((q) => {
          const lead = leads.find((l) => l.id === q.leadId);
          const totals = computeTotals(q.lines);
          return (
            <Link key={q.id} to="/app/devis/$id" params={{ id: q.id }}>
              <Card className="p-4 transition-colors hover:border-primary">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-display text-lg font-bold">{q.number}</span>
                      <Badge className={statusColor[q.status]}>{q.status}</Badge>
                    </div>
                    <div className="mt-1 text-sm text-muted-foreground">
                      {lead?.name ?? "Prospect supprimé"} · Créé le {formatDate(q.createdAt)} · Valide jusqu'au {formatDate(q.validUntil)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-display text-xl font-bold">
                      {formatMoney(totals.ttc, profile.currency)}
                    </div>
                    <div className="text-xs text-muted-foreground">TTC</div>
                  </div>
                </div>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
