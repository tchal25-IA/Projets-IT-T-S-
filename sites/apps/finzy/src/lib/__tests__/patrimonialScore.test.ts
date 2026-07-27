import { describe, it, expect } from 'vitest';
import { calculateScore } from '../patrimonialScore';

describe('calculateScore', () => {
  it('returns total between 0 and 100', () => {
    const { total } = calculateScore({
      savingsRate: 20,
      emergencyFund: 3,
      diversification: 2,
      academyProgress: 50,
      budgetControl: 50,
      debtRatio: 20,
    });
    expect(total).toBeGreaterThanOrEqual(0);
    expect(total).toBeLessThanOrEqual(100);
  });

  it('gives higher score for better metrics', () => {
    const low = calculateScore({
      savingsRate: 5,
      emergencyFund: 0,
      diversification: 1,
      academyProgress: 0,
      budgetControl: 20,
      debtRatio: 80,
    });
    const high = calculateScore({
      savingsRate: 30,
      emergencyFund: 6,
      diversification: 5,
      academyProgress: 100,
      budgetControl: 80,
      debtRatio: 10,
    });
    expect(high.total).toBeGreaterThan(low.total);
  });
});
