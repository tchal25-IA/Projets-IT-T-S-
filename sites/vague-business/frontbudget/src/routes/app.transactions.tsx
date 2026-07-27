import { useState, useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useApp } from "@/lib/useApp";
import { QuickAdd } from "@/components/QuickAdd";
import { fmt } from "@/lib/budgetEngine";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CATEGORIES } from "@/lib/types";
import { Trash2 } from "lucide-react";

export const Route = createFileRoute("/app/transactions")({
  component: TxPage,
});

function TxPage() {
  const { state, addTransaction, removeTransaction } = useApp();
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState<string>("all");

  const filtered = useMemo(() => {
    if (!state) return [];
    return state.transactions
      .filter((t) => (cat === "all" ? true : t.category === cat))
      .filter((t) =>
        query
          ? (t.note?.toLowerCase().includes(query.toLowerCase()) ||
             t.category.toLowerCase().includes(query.toLowerCase()))
          : true,
      )
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [state, query, cat]);

  if (!state) return null;

  return (
    <>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="text-3xl font-semibold">Transactions</h1>
        <span className="text-sm text-muted-foreground">{filtered.length} entrées</span>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <Input placeholder="Rechercher…" value={query} onChange={(e) => setQuery(e.target.value)} />
        <Select value={cat} onValueChange={setCat}>
          <SelectTrigger className="sm:w-56"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes les catégories</SelectItem>
            {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="paper-card mt-4 divide-y divide-border">
        {filtered.length === 0 && (
          <div className="p-8 text-center text-sm text-muted-foreground">Aucune transaction.</div>
        )}
        {filtered.map((t) => {
          const acc = state.accounts.find((a) => a.id === t.accountId);
          const sign = t.type === "dépense" ? "-" : t.type === "revenu" ? "+" : "";
          const color = t.type === "dépense" ? "var(--destructive)" : t.type === "revenu" ? "var(--primary)" : undefined;
          return (
            <div key={t.id} className="flex items-center justify-between gap-3 p-4">
              <div className="min-w-0">
                <div className="truncate font-medium">{t.note || t.category}</div>
                <div className="text-xs text-muted-foreground">
                  {new Date(t.date).toLocaleDateString("fr-FR")} · {t.category} · {acc?.name}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="font-semibold" style={{ color }}>
                  {sign}{fmt(t.amount, t.currency)}
                </div>
                <Button size="icon" variant="ghost" onClick={() => removeTransaction(t.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      <QuickAdd accounts={state.accounts} onAdd={addTransaction} />
    </>
  );
}
