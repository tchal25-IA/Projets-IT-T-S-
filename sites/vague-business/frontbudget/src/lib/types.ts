export type Currency = "CHF" | "EUR";
export type AccountType = "salaire" | "courant" | "épargne" | "espèces";
export type TxType = "revenu" | "dépense" | "transfert";

export interface Account {
  id: string;
  name: string;
  currency: Currency;
  type: AccountType;
  balance: number;
}

export interface Transaction {
  id: string;
  accountId: string;
  date: string; // ISO yyyy-mm-dd
  amount: number; // positive; type gives sign
  currency: Currency;
  category: string;
  note?: string;
  type: TxType;
}

export interface Budget {
  id: string;
  category: string;
  limit: number; // in preferred display currency
  month: string; // YYYY-MM
}

export interface Settings {
  fxChfToEur: number; // 1 CHF = X EUR
  salaryDay: number; // day of month
  displayCurrency: Currency;
  emailGateSeen?: boolean;
}

export interface AppState {
  settings: Settings;
  accounts: Account[];
  transactions: Transaction[];
  budgets: Budget[];
}

export const CATEGORIES = [
  "Salaire",
  "Transport",
  "Loyer",
  "Courses",
  "Assurances",
  "Loisirs",
  "Impôts/charges",
  "Transfert change",
  "Autre",
] as const;
