import type { Quote, QuoteLine, Currency } from "./types";

export function nextQuoteNumber(existing: Quote[]): string {
  const year = new Date().getFullYear();
  const prefix = `AP-${year}-`;
  const nums = existing
    .map((q) => q.number)
    .filter((n) => n.startsWith(prefix))
    .map((n) => parseInt(n.slice(prefix.length), 10))
    .filter((n) => !isNaN(n));
  const next = (nums.length ? Math.max(...nums) : 0) + 1;
  return `${prefix}${String(next).padStart(4, "0")}`;
}

export interface QuoteTotals {
  ht: number;
  tva: number;
  ttc: number;
  byTva: Record<string, { ht: number; tva: number }>;
}

export function computeTotals(lines: QuoteLine[]): QuoteTotals {
  const totals: QuoteTotals = { ht: 0, tva: 0, ttc: 0, byTva: {} };
  for (const l of lines) {
    const ht = (l.qty || 0) * (l.unitPrice || 0);
    const tva = ht * ((l.tva || 0) / 100);
    totals.ht += ht;
    totals.tva += tva;
    const key = String(l.tva);
    if (!totals.byTva[key]) totals.byTva[key] = { ht: 0, tva: 0 };
    totals.byTva[key].ht += ht;
    totals.byTva[key].tva += tva;
  }
  totals.ttc = totals.ht + totals.tva;
  return totals;
}

export function formatMoney(n: number, currency: Currency = "CHF"): string {
  const locale = currency === "CHF" ? "fr-CH" : "fr-FR";
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(n || 0);
}

export function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("fr-CH", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

export const TVA_PRESETS = [
  { label: "CH · 8.1%", value: 8.1 },
  { label: "CH · 2.6% (réduit)", value: 2.6 },
  { label: "CH · 0%", value: 0 },
  { label: "FR · 20%", value: 20 },
  { label: "FR · 10%", value: 10 },
  { label: "FR · 5.5%", value: 5.5 },
];
