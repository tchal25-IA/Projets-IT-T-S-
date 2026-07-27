import type { ScoreDetail } from '@/types';

interface ScoreInputs {
  savingsRate: number;      // % d'épargne mensuel
  emergencyFund: number;    // mois de dépenses couverts
  diversification: number;  // nombre de classes d'actifs
  academyProgress: number;  // % articles lus
  budgetControl: number;    // % mois respectés
  debtRatio: number;        // ratio endettement %
}

export function calculateScore(inputs: ScoreInputs): { total: number; details: ScoreDetail[] } {
  const details: ScoreDetail[] = [
    { label: 'Taux d\'épargne', value: Math.min(inputs.savingsRate, 30), max: 30, weight: 25 },
    { label: 'Fonds d\'urgence', value: Math.min(inputs.emergencyFund, 6) * (20 / 6), max: 20, weight: 20 },
    { label: 'Diversification', value: Math.min(inputs.diversification, 5) * 4, max: 20, weight: 20 },
    { label: 'Academy', value: inputs.academyProgress * 0.15, max: 15, weight: 15 },
    { label: 'Budget', value: inputs.budgetControl * 0.10, max: 10, weight: 10 },
    { label: 'Endettement', value: inputs.debtRatio < 33 ? 10 : Math.max(0, 10 - (inputs.debtRatio - 33) / 3), max: 10, weight: 10 },
  ];

  const total = Math.round(Math.min(100, details.reduce((sum, d) => sum + d.value, 0)));
  return { total, details };
}
