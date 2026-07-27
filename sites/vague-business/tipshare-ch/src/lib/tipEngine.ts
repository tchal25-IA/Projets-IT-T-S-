export type Role = "serveur" | "bar" | "cuisine" | "accueil" | "manager" | "autre";
export type Method = "equal" | "hours" | "role_weight";
export type Currency = "CHF" | "EUR";

export interface Staff {
  id: string;
  name: string;
  role: Role;
  weight: number;
  active: boolean;
}

export interface Presence {
  staffId: string;
  hours: number;
}

export interface DayEntry {
  id: string;
  date: string; // ISO YYYY-MM-DD
  method: Method;
  tipsCash: number;
  tipsCard: number;
  tipsOther: number;
  presences: Presence[];
  notes?: string;
  locked?: boolean;
}

export interface Share {
  staffId: string;
  name: string;
  role: Role;
  amount: number;
  percent: number;
  basis: number; // e.g. hours or weight
}

export interface Settlement {
  total: number;
  method: Method;
  currency: Currency;
  shares: Share[];
}

/** Round to nearest 0.05 CHF or 0.01 EUR. */
export function roundTip(amount: number, currency: Currency): number {
  if (currency === "CHF") return Math.round(amount * 20) / 20;
  return Math.round(amount * 100) / 100;
}

export function computeSettlement(
  day: DayEntry,
  staff: Staff[],
  currency: Currency,
): Settlement {
  const total = (day.tipsCash || 0) + (day.tipsCard || 0) + (day.tipsOther || 0);
  const present = day.presences
    .map((p) => {
      const s = staff.find((x) => x.id === p.staffId);
      return s ? { staff: s, hours: p.hours } : null;
    })
    .filter((x): x is { staff: Staff; hours: number } => !!x);

  if (present.length === 0 || total <= 0) {
    return { total, method: day.method, currency, shares: [] };
  }

  let basis: number[] = [];
  if (day.method === "equal") {
    basis = present.map(() => 1);
  } else if (day.method === "hours") {
    basis = present.map((p) => Math.max(0, p.hours));
  } else {
    basis = present.map((p) => Math.max(0, p.hours) * (p.staff.weight || 1));
  }

  const sum = basis.reduce((a, b) => a + b, 0);
  if (sum <= 0) {
    return { total, method: day.method, currency, shares: [] };
  }

  const raw = basis.map((b) => (b / sum) * total);
  const rounded = raw.map((a) => roundTip(a, currency));

  // Balance rounding delta on the largest share.
  const diff = roundTip(total - rounded.reduce((a, b) => a + b, 0), currency);
  if (Math.abs(diff) >= (currency === "CHF" ? 0.05 : 0.01) - 1e-9) {
    let idx = 0;
    rounded.forEach((v, i) => { if (v > rounded[idx]) idx = i; });
    rounded[idx] = roundTip(rounded[idx] + diff, currency);
  }

  const shares: Share[] = present.map((p, i) => ({
    staffId: p.staff.id,
    name: p.staff.name,
    role: p.staff.role,
    amount: rounded[i],
    percent: total > 0 ? (rounded[i] / total) * 100 : 0,
    basis: basis[i],
  }));

  return { total, method: day.method, currency, shares };
}

export function formatMoney(amount: number, currency: Currency): string {
  return new Intl.NumberFormat(currency === "CHF" ? "fr-CH" : "fr-FR", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

export const ROLE_LABELS: Record<Role, string> = {
  serveur: "Serveur·se",
  bar: "Bar",
  cuisine: "Cuisine",
  accueil: "Accueil",
  manager: "Manager",
  autre: "Autre",
};

export const METHOD_LABELS: Record<Method, string> = {
  equal: "Égale",
  hours: "Au prorata des heures",
  role_weight: "Heures × poids rôle",
};
