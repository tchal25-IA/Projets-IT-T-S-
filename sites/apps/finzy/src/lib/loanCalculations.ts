import type { AmortizationRow } from '@/types';

export function monthlyPayment(capital: number, annualRate: number, months: number): number {
  const r = annualRate / 100 / 12;
  if (r === 0) return capital / months;
  return (capital * r) / (1 - Math.pow(1 + r, -months));
}

export function amortizationTable(capital: number, annualRate: number, months: number, insuranceRate = 0): AmortizationRow[] {
  const r = annualRate / 100 / 12;
  const payment = monthlyPayment(capital, annualRate, months);
  const monthlyInsurance = (capital * (insuranceRate / 100)) / 12;
  const rows: AmortizationRow[] = [];
  let remaining = capital;

  for (let i = 1; i <= Math.min(months, 360); i++) {
    const interest = remaining * r;
    const principal = payment - interest;
    remaining = Math.max(0, remaining - principal);
    rows.push({ month: i, payment: payment + monthlyInsurance, principal, interest, insurance: monthlyInsurance, remaining });
  }
  return rows;
}

export function totalCreditCost(capital: number, annualRate: number, months: number, insuranceRate = 0) {
  const payment = monthlyPayment(capital, annualRate, months);
  const totalPayments = payment * months;
  const totalInsurance = (capital * (insuranceRate / 100) / 12) * months;
  return { totalPayments, totalInterest: totalPayments - capital, totalInsurance, totalCost: totalPayments + totalInsurance - capital };
}
