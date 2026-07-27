import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useApp } from "@/lib/useApp";
import { fmt, getCategoryBreakdown, monthKey } from "@/lib/budgetEngine";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CATEGORIES } from "@/lib/types";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/app/budgets")({
  component: Budgets,
});

function Budgets() {
  const { state, upsertBudget, removeBudget } = useApp();
  const [category, setCategory] = useState<string>("Courses");
  const [limit, setLimit] = useState("");

  if (!state) return null;
  const month = monthKey();
  const currency = state.settings.displayCurrency;
  const breakdown = getCategoryBreakdown(state);
  const monthBudgets = state.budgets.filter((b) => b.month === month);

  return (
    <>
      <h1 className="text-3xl font-semibold">Budgets</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Fixez une limite mensuelle par catégorie, en {currency}.
      </p>

      <div className="paper-card mt-6 p-5">
        <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
          <div className="grid gap-2">
            <Label>Catégorie</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {CATEGORIES.filter((c) => c !== "Salaire").map((c) =>
                  <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label>Limite ({currency})</Label>
            <Input inputMode="decimal" value={limit} onChange={(e) => setLimit(e.target.value)} placeholder="ex : 400" />
          </div>
          <Button onClick={() => {
            const v = parseFloat(limit.replace(",", "."));
            if (!v || v <= 0) return toast.error("Limite invalide");
            upsertBudget({ category, limit: v, month });
            toast.success("Budget enregistré");
            setLimit("");
          }}>Enregistrer</Button>
        </div>
      </div>

      <div className="paper-card mt-6 divide-y divide-border">
        {monthBudgets.length === 0 && (
          <div className="p-8 text-center text-sm text-muted-foreground">Aucun budget ce mois.</div>
        )}
        {monthBudgets.map((b) => {
          const row = breakdown.find((r) => r.category === b.category);
          const spent = row?.spent ?? 0;
          const pct = Math.min(100, (spent / b.limit) * 100);
          const alert = pct >= 90;
          return (
            <div key={b.id} className="p-4">
              <div className="flex items-center justify-between gap-2">
                <div className="font-medium">{b.category}</div>
                <div className="flex items-center gap-2">
                  <div className="text-sm text-muted-foreground">
                    {fmt(spent, currency)} / {fmt(b.limit, currency)}
                  </div>
                  <Button size="icon" variant="ghost" onClick={() => removeBudget(b.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: alert ? "var(--warning)" : "var(--mint)" }} />
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
