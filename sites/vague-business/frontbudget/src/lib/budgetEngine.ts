import type { AppState, Currency, Transaction } from "./types";

export function convert(amount: number, from: Currency, to: Currency, fxChfToEur: number): number {
  if (from === to) return amount;
  if (from === "CHF" && to === "EUR") return amount * fxChfToEur;
  if (from === "EUR" && to === "CHF") return amount / fxChfToEur;
  return amount;
}

export function fmt(amount: number, currency: Currency): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function monthKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function txMonth(tx: Transaction) {
  return tx.date.slice(0, 7);
}

export interface MonthSummary {
  revenus: number;
  depenses: number;
  reste: number;
  tauxEpargne: number; // 0..1
  salaireCHF: number;
  salaireEUR: number;
  currency: Currency;
}

export function getMonthSummary(state: AppState, month = monthKey()): MonthSummary {
  const { settings } = state;
  const display = settings.displayCurrency;
  const fx = settings.fxChfToEur;
  const txs = state.transactions.filter((t) => txMonth(t) === month);

  let revenus = 0;
  let depenses = 0;
  let salaireCHF = 0;
  let salaireEUR = 0;

  for (const t of txs) {
    const inDisplay = convert(t.amount, t.currency, display, fx);
    if (t.type === "revenu") revenus += inDisplay;
    else if (t.type === "dépense") depenses += inDisplay;
    if (t.category === "Salaire" && t.type === "revenu") {
      salaireCHF += convert(t.amount, t.currency, "CHF", fx);
      salaireEUR += convert(t.amount, t.currency, "EUR", fx);
    }
  }
  const reste = revenus - depenses;
  const tauxEpargne = revenus > 0 ? reste / revenus : 0;
  return { revenus, depenses, reste, tauxEpargne, salaireCHF, salaireEUR, currency: display };
}

export interface CategorySpend {
  category: string;
  spent: number;
  limit: number;
  pct: number; // 0..>1
  alert: boolean;
  currency: Currency;
}

export function getCategoryBreakdown(state: AppState, month = monthKey()): CategorySpend[] {
  const { settings } = state;
  const display = settings.displayCurrency;
  const fx = settings.fxChfToEur;
  const budgets = state.budgets.filter((b) => b.month === month);
  const txs = state.transactions.filter((t) => txMonth(t) === month && t.type === "dépense");

  const spentMap = new Map<string, number>();
  for (const t of txs) {
    const v = convert(t.amount, t.currency, display, fx);
    spentMap.set(t.category, (spentMap.get(t.category) ?? 0) + v);
  }

  const cats = new Set<string>([
    ...budgets.map((b) => b.category),
    ...Array.from(spentMap.keys()),
  ]);
  const rows: CategorySpend[] = [];
  for (const c of cats) {
    const spent = spentMap.get(c) ?? 0;
    const budget = budgets.find((b) => b.category === c);
    const limit = budget?.limit ?? 0;
    const pct = limit > 0 ? spent / limit : 0;
    rows.push({
      category: c,
      spent,
      limit,
      pct,
      alert: limit > 0 && pct >= 0.9,
      currency: display,
    });
  }
  return rows.sort((a, b) => b.spent - a.spent);
}

export function accountBalanceInDisplay(state: AppState) {
  const { settings, accounts } = state;
  return accounts.reduce(
    (sum, a) => sum + convert(a.balance, a.currency, settings.displayCurrency, settings.fxChfToEur),
    0
  );
}
