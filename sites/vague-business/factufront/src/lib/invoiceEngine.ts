import type { Country, Currency, Invoice, InvoiceLine } from "./factufront-types";

export const VAT_PRESETS: Record<Country, { rate: number; label: string }[]> = {
  CH: [
    { rate: 8.1, label: "8.1% (normal)" },
    { rate: 2.6, label: "2.6% (réduit)" },
    { rate: 3.8, label: "3.8% (hébergement)" },
    { rate: 0, label: "0% (exonéré)" },
  ],
  FR: [
    { rate: 20, label: "20% (normal)" },
    { rate: 10, label: "10% (intermédiaire)" },
    { rate: 5.5, label: "5.5% (réduit)" },
    { rate: 2.1, label: "2.1% (super réduit)" },
    { rate: 0, label: "0% (exonéré / auto-entrepreneur)" },
  ],
};

export function generateInvoiceNumber(existing: Invoice[], year = new Date().getFullYear()): string {
  const prefix = `FF-${year}-`;
  const nums = existing
    .map((i) => i.number)
    .filter((n) => n.startsWith(prefix))
    .map((n) => parseInt(n.slice(prefix.length), 10))
    .filter((n) => !isNaN(n));
  const next = (nums.length ? Math.max(...nums) : 0) + 1;
  return `${prefix}${String(next).padStart(4, "0")}`;
}

export interface InvoiceTotals {
  subtotalHT: number;
  vatByRate: { rate: number; base: number; amount: number }[];
  totalVat: number;
  totalTTC: number;
}

export function computeTotals(lines: InvoiceLine[]): InvoiceTotals {
  const byRate = new Map<number, { base: number; amount: number }>();
  let subtotal = 0;
  for (const l of lines) {
    const ht = (Number(l.quantity) || 0) * (Number(l.unitPrice) || 0);
    subtotal += ht;
    const rate = Number(l.vatRate) || 0;
    const cur = byRate.get(rate) ?? { base: 0, amount: 0 };
    cur.base += ht;
    cur.amount += ht * (rate / 100);
    byRate.set(rate, cur);
  }
  const vatByRate = Array.from(byRate.entries())
    .map(([rate, v]) => ({ rate, base: v.base, amount: v.amount }))
    .sort((a, b) => b.rate - a.rate);
  const totalVat = vatByRate.reduce((s, v) => s + v.amount, 0);
  return {
    subtotalHT: round2(subtotal),
    vatByRate: vatByRate.map((v) => ({ rate: v.rate, base: round2(v.base), amount: round2(v.amount) })),
    totalVat: round2(totalVat),
    totalTTC: round2(subtotal + totalVat),
  };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function formatCurrency(amount: number, currency: Currency): string {
  const locale = currency === "CHF" ? "fr-CH" : "fr-FR";
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(iso: string, country: Country = "FR"): string {
  const locale = country === "CH" ? "fr-CH" : "fr-FR";
  try {
    return new Date(iso).toLocaleDateString(locale, {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export function addDaysISO(iso: string, days: number): string {
  const d = new Date(iso);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}
