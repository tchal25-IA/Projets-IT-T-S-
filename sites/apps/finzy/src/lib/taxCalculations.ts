// Barème IR France 2026
const FR_TAX_BRACKETS = [
  { limit: 11497, rate: 0 },
  { limit: 29315, rate: 0.11 },
  { limit: 83823, rate: 0.30 },
  { limit: 180294, rate: 0.41 },
  { limit: Infinity, rate: 0.45 },
] as const;

export function frIncomeTax(grossIncome: number, parts: number, deductions: number) {
  const taxableIncome = Math.max(0, grossIncome - deductions);
  const perPart = taxableIncome / parts;
  let taxPerPart = 0;
  let tmi = 0;
  let prev = 0;

  for (const bracket of FR_TAX_BRACKETS) {
    if (perPart <= prev) break;
    const taxable = Math.min(perPart, bracket.limit) - prev;
    taxPerPart += taxable * bracket.rate;
    if (perPart > prev) tmi = bracket.rate * 100;
    prev = bracket.limit;
  }

  const tax = Math.round(taxPerPart * parts);
  const effectiveRate = taxableIncome > 0 ? (tax / taxableIncome) * 100 : 0;
  return { tmi, tax, effectiveRate: Math.round(effectiveRate * 10) / 10 };
}

export function frFlatTax(capitalGains: number, dividends: number, interests: number) {
  const total = capitalGains + dividends + interests;
  const pfuTax = Math.round(total * 0.30);
  return { pfuTax, socialCharges: Math.round(total * 0.172), incomeTax: Math.round(total * 0.128), total };
}

export const CANTONAL_RATES: Record<string, number> = {
  ZG: 0.22, SZ: 0.24, NW: 0.26, UR: 0.28, OW: 0.28, GL: 0.30, AI: 0.30,
  TG: 0.32, LU: 0.33, SO: 0.34, AG: 0.34, SG: 0.35, AR: 0.35, SH: 0.35,
  GR: 0.35, BL: 0.36, FR: 0.36, BE: 0.37, NE: 0.38, VS: 0.38, TI: 0.38,
  JU: 0.39, BS: 0.39, VD: 0.41, ZH: 0.38, GE: 0.45,
};

export function chThirdPillarTaxSaving(contribution: number, canton: string, _income: number): number {
  const rate = CANTONAL_RATES[canton] ?? 0.35;
  return Math.round(contribution * rate);
}
