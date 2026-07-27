import { describe, it, expect } from 'vitest';
import { frIncomeTax, frFlatTax, chThirdPillarTaxSaving } from '../taxCalculations';

describe('frIncomeTax', () => {
  it('returns 0 tax for income below first bracket', () => {
    const result = frIncomeTax(10000, 1, 0);
    expect(result.tax).toBe(0);
    expect(result.tmi).toBe(0);
  });

  it('calculates correct tax for 35000€, 1 part', () => {
    const result = frIncomeTax(35000, 1, 3500);
    expect(result.tax).toBeGreaterThan(0);
    expect(result.effectiveRate).toBeGreaterThan(0);
  });

  it('reduces tax with more parts (family quotient)', () => {
    const single = frIncomeTax(60000, 1, 6000);
    const couple = frIncomeTax(60000, 2, 6000);
    expect(couple.tax).toBeLessThan(single.tax);
  });
});

describe('frFlatTax', () => {
  it('applies 30% PFU', () => {
    const result = frFlatTax(10000, 0, 0);
    expect(result.pfuTax).toBe(3000);
  });

  it('splits social charges and income tax', () => {
    const result = frFlatTax(10000, 0, 0);
    expect(result.socialCharges + result.incomeTax).toBe(result.pfuTax);
  });
});

describe('chThirdPillarTaxSaving', () => {
  it('returns positive saving for contribution', () => {
    const result = chThirdPillarTaxSaving(5000, 'GE', 80000);
    expect(result).toBeGreaterThan(0);
  });
});
