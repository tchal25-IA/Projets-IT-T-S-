import { createFileRoute, Link } from "@tanstack/react-router";
import { useFactuFront, useHydrated } from "@/lib/factufront-store";
import { computeTotals, formatCurrency, formatDate } from "@/lib/invoiceEngine";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Plus, Users } from "lucide-react";
import type { InvoiceStatus } from "@/lib/factufront-types";

export const Route = createFileRoute("/app/")({
  component: Dashboard,
});

const STATUS_STYLES: Record<InvoiceStatus, string> = {
  brouillon: "bg-muted text-muted-foreground",
  envoyée: "bg-sage/20 text-sage-foreground",
  payée: "bg-emerald-600/15 text-emerald-700",
};

function Dashboard() {
  const hydrated = useHydrated();
  const { state } = useFactuFront();

  if (!hydrated) {
    return <div className="p-8 text-sm text-muted-foreground">Chargement…</div>;
  }

  const now = new Date();
  const thisMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  let unpaid = 0;
  let thisMonth = 0;
  const perInvoice = state.invoices.map((inv) => {
    const totals = computeTotals(inv.lines);
    if (inv.status !== "payée") unpaid += totals.totalTTC;
    if (inv.issueDate.startsWith(thisMonthKey)) thisMonth += totals.totalTTC;
    return { inv, totals };
  });

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-brand text-3xl tracking-tight">Tableau de bord</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Vos factures et clients en un coup d'œil.
          </p>
        </div>
        <Link to="/app/factures/nouvelle">
          <Button>
            <Plus className="mr-2 h-4 w-4" /> Nouvelle facture
          </Button>
        </Link>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <StatCard label="Impayées" value={formatMixedCurrency(unpaid, state.profile.defaultCurrency)} />
        <StatCard label="Émis ce mois" value={formatMixedCurrency(thisMonth, state.profile.defaultCurrency)} />
        <StatCard label="Factures" value={String(state.invoices.length)} sub={`${state.clients.length} clients`} />
      </div>

      <div className="mt-10">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Factures récentes</h2>
          <Link to="/app/clients" className="text-sm text-muted-foreground hover:text-foreground">
            <Users className="mr-1 inline h-4 w-4" /> Gérer les clients
          </Link>
        </div>

        {perInvoice.length === 0 ? (
          <EmptyState />
        ) : (
          <Card className="mt-4 overflow-hidden p-0">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 text-left">Numéro</th>
                  <th className="px-4 py-3 text-left">Client</th>
                  <th className="px-4 py-3 text-left">Émise le</th>
                  <th className="px-4 py-3 text-right">Total TTC</th>
                  <th className="px-4 py-3 text-left">Statut</th>
                </tr>
              </thead>
              <tbody>
                {perInvoice.map(({ inv, totals }) => {
                  const client = state.clients.find((c) => c.id === inv.clientId);
                  return (
                    <tr key={inv.id} className="border-t border-border/60 hover:bg-muted/30">
                      <td className="px-4 py-3 font-medium">
                        <Link to="/app/factures/$id" params={{ id: inv.id }} className="hover:underline">
                          {inv.number}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{client?.name ?? "—"}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {formatDate(inv.issueDate, state.profile.country)}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        {formatCurrency(totals.totalTTC, inv.currency)}
                      </td>
                      <td className="px-4 py-3">
                        <Badge className={STATUS_STYLES[inv.status] + " border-0 capitalize"}>
                          {inv.status}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Card>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <Card className="p-5">
      <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="font-brand mt-2 text-3xl tabular-nums">{value}</div>
      {sub && <div className="mt-1 text-xs text-muted-foreground">{sub}</div>}
    </Card>
  );
}

function EmptyState() {
  return (
    <Card className="mt-4 flex flex-col items-center gap-3 p-10 text-center">
      <div className="rounded-full bg-accent p-3">
        <FileText className="h-6 w-6 text-sage" />
      </div>
      <div className="font-brand text-xl">Aucune facture pour l'instant</div>
      <p className="max-w-sm text-sm text-muted-foreground">
        Créez votre première facture en moins de 2 minutes. Un client de démo est déjà en place.
      </p>
      <Link to="/app/factures/nouvelle" className="mt-2">
        <Button>
          <Plus className="mr-2 h-4 w-4" /> Nouvelle facture
        </Button>
      </Link>
    </Card>
  );
}

function formatMixedCurrency(n: number, cur: "CHF" | "EUR") {
  return formatCurrency(n, cur);
}
