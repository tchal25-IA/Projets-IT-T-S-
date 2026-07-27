export function compoundInterest(initial: number, monthly: number, annualRate: number, years: number): number {
  const r = annualRate / 100 / 12;
  const n = years * 12;
  if (r === 0) return initial + monthly * n;
  return initial * Math.pow(1 + r, n) + monthly * ((Math.pow(1 + r, n) - 1) / r);
}

export function requiredMonthlySavings(target: number, annualRate: number, years: number): number {
  const r = annualRate / 100 / 12;
  const n = years * 12;
  if (r === 0) return target / n;
  return (target * r) / (Math.pow(1 + r, n) - 1);
}

export function fireNumber(monthlyExpenses: number, withdrawalRate: number): number {
  return (monthlyExpenses * 12) / (withdrawalRate / 100);
}
