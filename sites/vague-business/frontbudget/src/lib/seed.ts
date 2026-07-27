import type { AppState } from "./types";

export function seedState(): AppState {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = (day: number) => `${y}-${m}-${String(day).padStart(2, "0")}`;
  const month = `${y}-${m}`;

  const chfAcc = { id: "acc_chf", name: "Salaire CHF (UBS)", currency: "CHF" as const, type: "salaire" as const, balance: 6800 };
  const eurAcc = { id: "acc_eur", name: "Courant EUR (BNP)", currency: "EUR" as const, type: "courant" as const, balance: 1450 };

  return {
    settings: {
      fxChfToEur: 1.04,
      salaryDay: 25,
      displayCurrency: "EUR",
    },
    accounts: [chfAcc, eurAcc],
    transactions: [
      { id: "t1", accountId: "acc_chf", date: d(25), amount: 6800, currency: "CHF", category: "Salaire", type: "revenu", note: "Salaire mensuel" },
      { id: "t2", accountId: "acc_eur", date: d(2), amount: 1250, currency: "EUR", category: "Loyer", type: "dépense", note: "Loyer Annemasse" },
      { id: "t3", accountId: "acc_eur", date: d(5), amount: 128, currency: "EUR", category: "Transport", type: "dépense", note: "Abo Léman Express" },
      { id: "t4", accountId: "acc_eur", date: d(8), amount: 342, currency: "EUR", category: "Courses", type: "dépense", note: "Carrefour + marché" },
      { id: "t5", accountId: "acc_eur", date: d(12), amount: 189, currency: "EUR", category: "Assurances", type: "dépense", note: "Mutuelle + auto" },
      { id: "t6", accountId: "acc_eur", date: d(15), amount: 96, currency: "EUR", category: "Loisirs", type: "dépense", note: "Restos + ciné" },
      { id: "t7", accountId: "acc_chf", date: d(18), amount: 210, currency: "CHF", category: "Courses", type: "dépense", note: "Migros" },
    ],
    budgets: [
      { id: "b1", category: "Loyer", limit: 1300, month },
      { id: "b2", category: "Courses", limit: 600, month },
      { id: "b3", category: "Transport", limit: 200, month },
      { id: "b4", category: "Loisirs", limit: 250, month },
    ],
  };
}
