import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useApp } from "@/lib/useApp";
import { fmt, getCategoryBreakdown, getMonthSummary, accountBalanceInDisplay } from "@/lib/budgetEngine";
import { QuickAdd } from "@/components/QuickAdd";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Printer } from "lucide-react";

export const Route = createFileRoute("/app/")({
  component: Dashboard,
});

function Dashboard() {
  const { state, addTransaction, setSettings } = useApp();
  const [email, setEmail] = useState("");

  if (!state) return <div className="text-muted-foreground">Chargement…</div>;

  const summary = getMonthSummary(state);
  const breakdown = getCategoryBreakdown(state);
  const totalBalance = accountBalanceInDisplay(state);
  const monthLabel = new Date().toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
  const showEmailGate = !state.settings.emailGateSeen && state.transactions.length > 5;

  return (
    <>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <div className="text-xs uppercase tracking-wide text-muted-foreground">{monthLabel}</div>
          <h1 className="text-3xl font-semibold sm:text-4xl">Votre mois</h1>
        </div>
        <Button variant="outline" size="sm" onClick={() => window.print()} className="rounded-full">
          <Printer className="mr-2 h-4 w-4" /> Imprimer
        </Button>
      </div>

      {/* KPIs */}
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <Kpi label="Revenus" value={fmt(summary.revenus, summary.currency)} tone="mint" />
        <Kpi label="Dépenses" value={fmt(summary.depenses, summary.currency)} />
        <Kpi
          label="Reste à vivre"
          value={fmt(summary.reste, summary.currency)}
          sub={`Taux d'épargne ${Math.round(summary.tauxEpargne * 100)} %`}
          tone={summary.reste >= 0 ? "mint" : "danger"}
        />
      </div>

      {/* Effet change */}
      <div className="paper-card mt-4 flex flex-wrap items-center justify-between gap-3 p-5">
        <div>
          <div className="text-xs uppercase tracking-wide text-muted-foreground">Effet change</div>
          <div className="mt-1 text-lg">
            Salaire <span className="font-semibold">{fmt(summary.salaireCHF, "CHF")}</span>{" "}
            <span className="text-muted-foreground">≈</span>{" "}
            <span className="font-semibold">{fmt(summary.salaireEUR, "EUR")}</span>
          </div>
        </div>
        <div className="text-sm text-muted-foreground">
          Taux : 1 CHF = {state.settings.fxChfToEur} EUR
        </div>
      </div>

      {/* Catégories */}
      <section className="mt-8">
        <h2 className="text-xl font-semibold">Par catégorie</h2>
        {breakdown.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">Pas encore de dépenses ce mois-ci.</p>
        ) : (
          <div className="paper-card mt-3 divide-y divide-border">
            {breakdown.map((c) => {
              const pct = Math.min(100, c.limit > 0 ? c.pct * 100 : 0);
              return (
                <div key={c.category} className="p-4">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{c.category}</span>
                    <span className="text-muted-foreground">
                      {fmt(c.spent, c.currency)}
                      {c.limit > 0 && <> / {fmt(c.limit, c.currency)}</>}
                    </span>
                  </div>
                  {c.limit > 0 ? (
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${pct}%`,
                          backgroundColor: c.alert ? "var(--warning)" : "var(--mint)",
                        }}
                      />
                    </div>
                  ) : (
                    <div className="mt-2 text-xs text-muted-foreground">Pas de budget défini</div>
                  )}
                  {c.alert && (
                    <div className="mt-2 text-xs text-warning" style={{ color: "var(--warning)" }}>
                      ⚠ Plus de 90 % du budget consommé
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Solde total */}
      <section className="mt-8">
        <div className="paper-card flex items-center justify-between p-5">
          <div>
            <div className="text-xs uppercase tracking-wide text-muted-foreground">Solde global</div>
            <div className="mt-1 text-2xl font-semibold">{fmt(totalBalance, state.settings.displayCurrency)}</div>
          </div>
          <div className="text-sm text-muted-foreground">
            {state.accounts.length} compte{state.accounts.length > 1 ? "s" : ""}
          </div>
        </div>
      </section>

      <QuickAdd accounts={state.accounts} onAdd={addTransaction} />

      <Dialog open={showEmailGate} onOpenChange={(o) => !o && setSettings({ emailGateSeen: true })}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Alertes budget WhatsApp — bientôt</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Recevez une alerte dès qu'une catégorie dépasse 90 %. On vous prévient quand ça sort.
          </p>
          <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="vous@example.com" type="email" />
          <DialogFooter className="gap-2 sm:gap-2">
            <Button variant="ghost" onClick={() => setSettings({ emailGateSeen: true })}>Plus tard</Button>
            <Button
              onClick={() => {
                if (email.includes("@")) toast.success("Merci, on vous prévient !");
                setSettings({ emailGateSeen: true });
              }}
            >
              Me prévenir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function Kpi({ label, value, sub, tone }: { label: string; value: string; sub?: string; tone?: "mint" | "danger" }) {
  return (
    <div className="paper-card p-5">
      <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
      <div
        className="mt-2 text-3xl font-semibold tracking-tight"
        style={{
          color: tone === "mint" ? "var(--primary)" : tone === "danger" ? "var(--destructive)" : undefined,
        }}
      >
        {value}
      </div>
      {sub && <div className="mt-1 text-xs text-muted-foreground">{sub}</div>}
    </div>
  );
}
