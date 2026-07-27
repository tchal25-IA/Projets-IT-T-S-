export interface ProjectionInputs {
  birthYear: number;
  familyStatus: string;
  professionalStatus: string;
  knowledgeLevel: string;
  pastInvestments: string[];
  investmentHorizon: string;
  objectives: string[];
  riskTolerance: string;
  withdrawalPlan: string;
  monthlyIncome: number;
  monthlyExpenses: number;
  recurringDebts: string;
  emergencyFund: string;
  market?: string;
  patrimoine: {
    livrets: number;
    assuranceVie: number;
    bourse: number;
    immoPapier: number;
    immoPhysique: number;
    alternatifs: number;
    epargneRetraite: number;
  };
}

export interface ScenarioYear {
  year: number;
  pessimiste: number;
  modere: number;
  optimiste: number;
}

export interface ProjectionResult {
  riskProfile: 'prudent' | 'equilibre' | 'dynamique' | 'offensif';
  monthlySavings: number;
  totalPatrimoine: number;
  scenarios: ScenarioYear[];
  allocation: { label: string; pct: number; color: string }[];
  age: number;
  market: string;
}

// Types pour les événements financiers
export interface FinancialEvent {
  id: string;
  user_id?: string;
  type: 'wedding' | 'house' | 'car' | 'travel' | 'baby' | 'education' | 'renovation' | 'inheritance' | 'sale' | 'bonus' | 'other';
  label: string;
  amount: number;
  target_date: string;
  is_expense: boolean;
  priority: 'high' | 'medium' | 'low';
  linked_project_id?: string | null;
  notes?: string;
  currency?: string;
}

export const EVENT_TYPES = {
  wedding: { label: 'Mariage', emoji: '💒', isExpense: true },
  house: { label: 'Achat immobilier', emoji: '🏠', isExpense: true },
  car: { label: 'Véhicule', emoji: '🚗', isExpense: true },
  travel: { label: 'Voyage', emoji: '✈️', isExpense: true },
  baby: { label: 'Naissance', emoji: '👶', isExpense: true },
  education: { label: 'Études / Formation', emoji: '🎓', isExpense: true },
  renovation: { label: 'Travaux', emoji: '🔨', isExpense: true },
  inheritance: { label: 'Héritage', emoji: '📜', isExpense: false },
  sale: { label: 'Vente', emoji: '💰', isExpense: false },
  bonus: { label: 'Prime / Bonus', emoji: '🎁', isExpense: false },
  other: { label: 'Autre', emoji: '📌', isExpense: true },
} as const;

// Types pour les recommandations d'allocation
export interface AllocationRecommendation {
  envelope: string;
  envelopeKey: 'livrets' | 'pea' | 'assurance_vie' | 'cto' | 'scpi' | 'or' | 'crypto' | 'per';
  monthlyAmount: number;
  percentage: number;
  rationale: string;
  color: string;
}

export interface AllocationContext {
  monthlySavings: number;
  hasEmergencyFund: boolean;
  emergencyFundMonths: number;
  monthlyExpenses: number;
  riskProfile: ProjectionResult['riskProfile'];
  hasShortTermProject: boolean;
  shortTermProjectAmount?: number;
  shortTermProjectMonths?: number;
  market: string;
}

// Résultat de projection enrichi
export interface EnhancedProjectionResult extends ProjectionResult {
  events: FinancialEvent[];
  scenariosWithEvents: ScenarioYear[];
  allocationRecommendation: AllocationRecommendation[];
  warnings: string[];
  feasibilityScore: number;
}

function getRiskProfile(inputs: ProjectionInputs): ProjectionResult['riskProfile'] {
  let score = 0;
  if (inputs.knowledgeLevel === 'intermediaire') score += 1;
  if (inputs.knowledgeLevel === 'avance') score += 2;
  if (inputs.investmentHorizon === 'long') score += 1;
  if (inputs.investmentHorizon === 'tres_long') score += 2;
  if (inputs.riskTolerance === '5') score += 1;
  if (inputs.riskTolerance === '10') score += 2;
  if (inputs.riskTolerance === '20') score += 3;
  if (inputs.riskTolerance === '>20') score += 4;
  if (inputs.withdrawalPlan === 'non') score += 1;
  if (inputs.withdrawalPlan === '<2ans') score -= 1;

  if (score <= 2) return 'prudent';
  if (score <= 4) return 'equilibre';
  if (score <= 6) return 'dynamique';
  return 'offensif';
}

function getAllocation(profile: ProjectionResult['riskProfile'], market: string) {
  if (market === 'CH') {
    switch (profile) {
      case 'prudent':
        return [
          { label: 'Épargne / Comptes', pct: 40, color: 'hsl(var(--chart-1))' },
          { label: 'Obligations', pct: 30, color: 'hsl(var(--chart-2))' },
          { label: 'Actions / ETF', pct: 15, color: 'hsl(var(--chart-3))' },
          { label: '3e pilier A', pct: 10, color: 'hsl(var(--chart-4))' },
          { label: 'Immobilier', pct: 5, color: 'hsl(var(--chart-5))' },
        ];
      case 'equilibre':
        return [
          { label: 'Épargne / Comptes', pct: 15, color: 'hsl(var(--chart-1))' },
          { label: 'Obligations', pct: 15, color: 'hsl(var(--chart-2))' },
          { label: 'Actions / ETF', pct: 40, color: 'hsl(var(--chart-3))' },
          { label: '3e pilier A', pct: 15, color: 'hsl(var(--chart-4))' },
          { label: 'Immobilier', pct: 10, color: 'hsl(var(--chart-5))' },
          { label: 'Or', pct: 5, color: 'hsl(45 93% 47%)' },
        ];
      case 'dynamique':
        return [
          { label: 'Épargne / Comptes', pct: 10, color: 'hsl(var(--chart-1))' },
          { label: 'Actions / ETF', pct: 45, color: 'hsl(var(--chart-3))' },
          { label: '3e pilier A', pct: 15, color: 'hsl(var(--chart-4))' },
          { label: 'Immobilier', pct: 5, color: 'hsl(var(--chart-5))' },
          { label: 'Or', pct: 5, color: 'hsl(45 93% 47%)' },
          { label: 'Crypto', pct: 10, color: 'hsl(280 70% 50%)' },
          { label: 'Private Equity', pct: 10, color: 'hsl(340 70% 50%)' },
        ];
      case 'offensif':
        return [
          { label: 'Épargne / Comptes', pct: 5, color: 'hsl(var(--chart-1))' },
          { label: 'Actions / ETF', pct: 40, color: 'hsl(var(--chart-3))' },
          { label: '3e pilier A', pct: 10, color: 'hsl(var(--chart-4))' },
          { label: 'Immobilier', pct: 5, color: 'hsl(var(--chart-5))' },
          { label: 'Or', pct: 5, color: 'hsl(45 93% 47%)' },
          { label: 'Crypto', pct: 15, color: 'hsl(280 70% 50%)' },
          { label: 'Private Equity', pct: 20, color: 'hsl(340 70% 50%)' },
        ];
    }
  }
  switch (profile) {
    case 'prudent':
      return [
        { label: 'Fonds euros / Livrets', pct: 50, color: 'hsl(var(--chart-1))' },
        { label: 'Obligations', pct: 30, color: 'hsl(var(--chart-2))' },
        { label: 'Actions / ETF', pct: 15, color: 'hsl(var(--chart-3))' },
        { label: 'Immobilier', pct: 5, color: 'hsl(var(--chart-4))' },
      ];
    case 'equilibre':
      return [
        { label: 'Fonds euros / Livrets', pct: 20, color: 'hsl(var(--chart-1))' },
        { label: 'Obligations', pct: 15, color: 'hsl(var(--chart-2))' },
        { label: 'Actions / ETF', pct: 40, color: 'hsl(var(--chart-3))' },
        { label: 'Immobilier', pct: 20, color: 'hsl(var(--chart-4))' },
        { label: 'Or', pct: 5, color: 'hsl(45 93% 47%)' },
      ];
    case 'dynamique':
      return [
        { label: 'Fonds euros / Livrets', pct: 10, color: 'hsl(var(--chart-1))' },
        { label: 'Actions / ETF', pct: 50, color: 'hsl(var(--chart-3))' },
        { label: 'Immobilier', pct: 15, color: 'hsl(var(--chart-4))' },
        { label: 'Or', pct: 5, color: 'hsl(45 93% 47%)' },
        { label: 'Crypto', pct: 10, color: 'hsl(280 70% 50%)' },
        { label: 'Private Equity', pct: 10, color: 'hsl(340 70% 50%)' },
      ];
    case 'offensif':
      return [
        { label: 'Fonds euros / Livrets', pct: 5, color: 'hsl(var(--chart-1))' },
        { label: 'Actions / ETF', pct: 45, color: 'hsl(var(--chart-3))' },
        { label: 'Immobilier', pct: 10, color: 'hsl(var(--chart-4))' },
        { label: 'Or', pct: 5, color: 'hsl(45 93% 47%)' },
        { label: 'Crypto', pct: 15, color: 'hsl(280 70% 50%)' },
        { label: 'Private Equity', pct: 20, color: 'hsl(340 70% 50%)' },
      ];
  }
}

function getAnnualRates(profile: ProjectionResult['riskProfile']) {
  switch (profile) {
    case 'prudent': return { pessimiste: 0.01, modere: 0.025, optimiste: 0.04 };
    case 'equilibre': return { pessimiste: 0.02, modere: 0.05, optimiste: 0.08 };
    case 'dynamique': return { pessimiste: 0.03, modere: 0.07, optimiste: 0.10 };
    case 'offensif': return { pessimiste: 0.02, modere: 0.08, optimiste: 0.12 };
  }
}

export function calculateProjection(inputs: ProjectionInputs, years: number = 10): ProjectionResult {
  const currentYear = new Date().getFullYear();
  const age = currentYear - inputs.birthYear;
  const monthlySavings = Math.max(0, inputs.monthlyIncome - inputs.monthlyExpenses);
  const p = inputs.patrimoine;
  const totalPatrimoine = p.livrets + p.assuranceVie + p.bourse + p.immoPapier + p.immoPhysique + p.alternatifs + p.epargneRetraite;
  const market = inputs.market ?? 'FR';

  const riskProfile = getRiskProfile(inputs);
  const rates = getAnnualRates(riskProfile);
  const allocation = getAllocation(riskProfile, market);

  const scenarios: ScenarioYear[] = [];
  let valP = totalPatrimoine;
  let valM = totalPatrimoine;
  let valO = totalPatrimoine;
  const annualSavings = monthlySavings * 12;

  for (let y = 0; y <= years; y++) {
    scenarios.push({
      year: currentYear + y,
      pessimiste: Math.round(valP),
      modere: Math.round(valM),
      optimiste: Math.round(valO),
    });
    valP = (valP + annualSavings) * (1 + rates.pessimiste);
    valM = (valM + annualSavings) * (1 + rates.modere);
    valO = (valO + annualSavings) * (1 + rates.optimiste);
  }

  return { riskProfile, monthlySavings, totalPatrimoine, scenarios, allocation, age, market };
}

// Calcul de projection avec événements
export function calculateProjectionWithEvents(
  inputs: ProjectionInputs,
  events: FinancialEvent[],
  years: number = 10
): EnhancedProjectionResult {
  const baseResult = calculateProjection(inputs, years);
  const currentYear = new Date().getFullYear();
  const rates = getAnnualRates(baseResult.riskProfile);
  const annualSavings = baseResult.monthlySavings * 12;

  // Créer une map des événements par année
  const eventsByYear = new Map<number, number>();
  events.forEach(event => {
    const eventYear = new Date(event.target_date).getFullYear();
    const impact = event.is_expense ? -event.amount : event.amount;
    eventsByYear.set(eventYear, (eventsByYear.get(eventYear) ?? 0) + impact);
  });

  // Calculer les scénarios avec événements
  const scenariosWithEvents: ScenarioYear[] = [];
  let valP = baseResult.totalPatrimoine;
  let valM = baseResult.totalPatrimoine;
  let valO = baseResult.totalPatrimoine;

  for (let y = 0; y <= years; y++) {
    const year = currentYear + y;
    const eventImpact = eventsByYear.get(year) ?? 0;

    scenariosWithEvents.push({
      year,
      pessimiste: Math.round(valP),
      modere: Math.round(valM),
      optimiste: Math.round(valO),
    });

    valP = (valP + annualSavings + eventImpact) * (1 + rates.pessimiste);
    valM = (valM + annualSavings + eventImpact) * (1 + rates.modere);
    valO = (valO + annualSavings + eventImpact) * (1 + rates.optimiste);
  }

  // Calculer les recommandations d'allocation
  const context: AllocationContext = {
    monthlySavings: baseResult.monthlySavings,
    hasEmergencyFund: inputs.emergencyFund === '3-6mois',
    emergencyFundMonths: inputs.emergencyFund === '3-6mois' ? 6 : inputs.emergencyFund === '<3mois' ? 2 : 0,
    monthlyExpenses: inputs.monthlyExpenses,
    riskProfile: baseResult.riskProfile,
    hasShortTermProject: events.some(e => {
      const monthsUntil = getMonthsUntil(e.target_date);
      return e.is_expense && monthsUntil <= 24;
    }),
    market: baseResult.market,
  };

  const shortTermEvent = events.find(e => {
    const monthsUntil = getMonthsUntil(e.target_date);
    return e.is_expense && monthsUntil <= 24;
  });

  if (shortTermEvent) {
    context.shortTermProjectAmount = shortTermEvent.amount;
    context.shortTermProjectMonths = getMonthsUntil(shortTermEvent.target_date);
  }

  const allocationRecommendation = calculateAllocationRecommendation(context);
  const warnings = generateWarnings(context, events, baseResult.monthlySavings);
  const feasibilityScore = calculateFeasibilityScore(events, baseResult.monthlySavings);

  return {
    ...baseResult,
    events,
    scenariosWithEvents,
    allocationRecommendation,
    warnings,
    feasibilityScore,
  };
}

function getMonthsUntil(dateStr: string): number {
  const target = new Date(dateStr);
  const now = new Date();
  return (target.getFullYear() - now.getFullYear()) * 12 + (target.getMonth() - now.getMonth());
}

// Calcul des recommandations d'allocation personnalisées
export function calculateAllocationRecommendation(context: AllocationContext): AllocationRecommendation[] {
  const { monthlySavings, hasEmergencyFund, monthlyExpenses, riskProfile, hasShortTermProject, market } = context;

  if (monthlySavings <= 0) return [];

  const recommendations: AllocationRecommendation[] = [];

  // Priorité 1 : Fonds d'urgence si pas suffisant
  if (!hasEmergencyFund) {
    const emergencyTarget = monthlyExpenses * 6;
    const monthlyForEmergency = Math.min(monthlySavings, emergencyTarget / 12);
    recommendations.push({
      envelope: market === 'CH' ? 'Compte épargne' : 'Livret A / LDDS',
      envelopeKey: 'livrets',
      monthlyAmount: Math.round(monthlyForEmergency),
      percentage: Math.round((monthlyForEmergency / monthlySavings) * 100),
      rationale: 'Priorité : constituer 6 mois de dépenses en épargne de précaution',
      color: '#10B981',
    });
    
    if (monthlyForEmergency >= monthlySavings) return recommendations;
  }

  const remainingAfterEmergency = hasEmergencyFund ? monthlySavings : monthlySavings * 0.5;

  // Priorité 2 : Projet court terme
  if (hasShortTermProject && context.shortTermProjectAmount && context.shortTermProjectMonths) {
    const monthlyForProject = Math.min(
      remainingAfterEmergency * 0.7,
      context.shortTermProjectAmount / context.shortTermProjectMonths
    );
    recommendations.push({
      envelope: market === 'CH' ? 'Compte épargne dédié' : 'Livrets réglementés',
      envelopeKey: 'livrets',
      monthlyAmount: Math.round(monthlyForProject),
      percentage: Math.round((monthlyForProject / monthlySavings) * 100),
      rationale: `Pour ton projet à ${context.shortTermProjectMonths} mois`,
      color: '#3B82F6',
    });
  }

  // Allocation du reste selon le profil
  const remainingForInvest = hasShortTermProject 
    ? remainingAfterEmergency * 0.3 
    : remainingAfterEmergency;

  if (remainingForInvest > 0) {
    const allocations = getAllocationByProfile(riskProfile, market, remainingForInvest, monthlySavings);
    recommendations.push(...allocations);
  }

  return recommendations;
}

function getAllocationByProfile(
  profile: ProjectionResult['riskProfile'],
  market: string,
  amount: number,
  totalSavings: number
): AllocationRecommendation[] {
  const allocations: AllocationRecommendation[] = [];

  if (market === 'CH') {
    switch (profile) {
      case 'prudent':
        allocations.push(
          { envelope: 'Compte épargne', envelopeKey: 'livrets', monthlyAmount: Math.round(amount * 0.4), percentage: Math.round((amount * 0.4 / totalSavings) * 100), rationale: 'Sécurité et liquidité', color: '#10B981' },
          { envelope: '3e Pilier A', envelopeKey: 'per', monthlyAmount: Math.round(amount * 0.35), percentage: Math.round((amount * 0.35 / totalSavings) * 100), rationale: 'Avantage fiscal et retraite', color: '#8B5CF6' },
          { envelope: 'ETF / Actions', envelopeKey: 'pea', monthlyAmount: Math.round(amount * 0.25), percentage: Math.round((amount * 0.25 / totalSavings) * 100), rationale: 'Croissance modérée', color: '#F59E0B' }
        );
        break;
      case 'equilibre':
        allocations.push(
          { envelope: 'Compte épargne', envelopeKey: 'livrets', monthlyAmount: Math.round(amount * 0.2), percentage: Math.round((amount * 0.2 / totalSavings) * 100), rationale: 'Liquidité', color: '#10B981' },
          { envelope: '3e Pilier A', envelopeKey: 'per', monthlyAmount: Math.round(amount * 0.25), percentage: Math.round((amount * 0.25 / totalSavings) * 100), rationale: 'Avantage fiscal', color: '#8B5CF6' },
          { envelope: 'ETF / Actions', envelopeKey: 'pea', monthlyAmount: Math.round(amount * 0.35), percentage: Math.round((amount * 0.35 / totalSavings) * 100), rationale: 'Croissance long terme', color: '#F59E0B' },
          { envelope: 'Immobilier (fonds)', envelopeKey: 'scpi', monthlyAmount: Math.round(amount * 0.2), percentage: Math.round((amount * 0.2 / totalSavings) * 100), rationale: 'Diversification', color: '#EC4899' }
        );
        break;
      case 'dynamique':
      case 'offensif':
        allocations.push(
          { envelope: 'Compte épargne', envelopeKey: 'livrets', monthlyAmount: Math.round(amount * 0.1), percentage: Math.round((amount * 0.1 / totalSavings) * 100), rationale: 'Minimum de sécurité', color: '#10B981' },
          { envelope: '3e Pilier A', envelopeKey: 'per', monthlyAmount: Math.round(amount * 0.2), percentage: Math.round((amount * 0.2 / totalSavings) * 100), rationale: 'Avantage fiscal', color: '#8B5CF6' },
          { envelope: 'ETF / Actions', envelopeKey: 'pea', monthlyAmount: Math.round(amount * 0.45), percentage: Math.round((amount * 0.45 / totalSavings) * 100), rationale: 'Performance long terme', color: '#F59E0B' },
          { envelope: 'Crypto / Alternatifs', envelopeKey: 'crypto', monthlyAmount: Math.round(amount * 0.15), percentage: Math.round((amount * 0.15 / totalSavings) * 100), rationale: 'Diversification agressive', color: '#F97316' },
          { envelope: 'Immobilier (fonds)', envelopeKey: 'scpi', monthlyAmount: Math.round(amount * 0.1), percentage: Math.round((amount * 0.1 / totalSavings) * 100), rationale: 'Pierre papier', color: '#EC4899' }
        );
        break;
    }
  } else {
    // France
    switch (profile) {
      case 'prudent':
        allocations.push(
          { envelope: 'Livret A / LDDS', envelopeKey: 'livrets', monthlyAmount: Math.round(amount * 0.35), percentage: Math.round((amount * 0.35 / totalSavings) * 100), rationale: 'Sécurité et disponibilité', color: '#10B981' },
          { envelope: 'Assurance-vie (fonds €)', envelopeKey: 'assurance_vie', monthlyAmount: Math.round(amount * 0.4), percentage: Math.round((amount * 0.4 / totalSavings) * 100), rationale: 'Capital garanti + fiscalité avantageuse', color: '#3B82F6' },
          { envelope: 'PEA (ETF World)', envelopeKey: 'pea', monthlyAmount: Math.round(amount * 0.25), percentage: Math.round((amount * 0.25 / totalSavings) * 100), rationale: 'Croissance modérée', color: '#F59E0B' }
        );
        break;
      case 'equilibre':
        allocations.push(
          { envelope: 'Livret A / LDDS', envelopeKey: 'livrets', monthlyAmount: Math.round(amount * 0.15), percentage: Math.round((amount * 0.15 / totalSavings) * 100), rationale: 'Liquidité', color: '#10B981' },
          { envelope: 'Assurance-vie', envelopeKey: 'assurance_vie', monthlyAmount: Math.round(amount * 0.25), percentage: Math.round((amount * 0.25 / totalSavings) * 100), rationale: 'Diversification + fiscalité', color: '#3B82F6' },
          { envelope: 'PEA (ETF)', envelopeKey: 'pea', monthlyAmount: Math.round(amount * 0.4), percentage: Math.round((amount * 0.4 / totalSavings) * 100), rationale: 'Croissance long terme', color: '#F59E0B' },
          { envelope: 'SCPI', envelopeKey: 'scpi', monthlyAmount: Math.round(amount * 0.2), percentage: Math.round((amount * 0.2 / totalSavings) * 100), rationale: 'Revenus passifs', color: '#EC4899' }
        );
        break;
      case 'dynamique':
        allocations.push(
          { envelope: 'Livrets', envelopeKey: 'livrets', monthlyAmount: Math.round(amount * 0.1), percentage: Math.round((amount * 0.1 / totalSavings) * 100), rationale: 'Minimum de sécurité', color: '#10B981' },
          { envelope: 'Assurance-vie UC', envelopeKey: 'assurance_vie', monthlyAmount: Math.round(amount * 0.15), percentage: Math.round((amount * 0.15 / totalSavings) * 100), rationale: 'Diversification', color: '#3B82F6' },
          { envelope: 'PEA (ETF)', envelopeKey: 'pea', monthlyAmount: Math.round(amount * 0.45), percentage: Math.round((amount * 0.45 / totalSavings) * 100), rationale: 'Performance long terme', color: '#F59E0B' },
          { envelope: 'SCPI', envelopeKey: 'scpi', monthlyAmount: Math.round(amount * 0.15), percentage: Math.round((amount * 0.15 / totalSavings) * 100), rationale: 'Immobilier papier', color: '#EC4899' },
          { envelope: 'Or / Crypto', envelopeKey: 'or', monthlyAmount: Math.round(amount * 0.15), percentage: Math.round((amount * 0.15 / totalSavings) * 100), rationale: 'Diversification alternative', color: '#F97316' }
        );
        break;
      case 'offensif':
        allocations.push(
          { envelope: 'Livrets', envelopeKey: 'livrets', monthlyAmount: Math.round(amount * 0.05), percentage: Math.round((amount * 0.05 / totalSavings) * 100), rationale: 'Minimum vital', color: '#10B981' },
          { envelope: 'PEA (ETF/Actions)', envelopeKey: 'pea', monthlyAmount: Math.round(amount * 0.5), percentage: Math.round((amount * 0.5 / totalSavings) * 100), rationale: 'Performance maximale', color: '#F59E0B' },
          { envelope: 'CTO (Actions US)', envelopeKey: 'cto', monthlyAmount: Math.round(amount * 0.15), percentage: Math.round((amount * 0.15 / totalSavings) * 100), rationale: 'Diversification géographique', color: '#8B5CF6' },
          { envelope: 'SCPI', envelopeKey: 'scpi', monthlyAmount: Math.round(amount * 0.1), percentage: Math.round((amount * 0.1 / totalSavings) * 100), rationale: 'Revenus immobiliers', color: '#EC4899' },
          { envelope: 'Crypto / PE', envelopeKey: 'crypto', monthlyAmount: Math.round(amount * 0.2), percentage: Math.round((amount * 0.2 / totalSavings) * 100), rationale: 'Diversification agressive', color: '#F97316' }
        );
        break;
    }
  }

  return allocations;
}

function generateWarnings(
  context: AllocationContext,
  events: FinancialEvent[],
  monthlySavings: number
): string[] {
  const warnings: string[] = [];

  if (!context.hasEmergencyFund) {
    warnings.push('⚠️ Priorité : constituer une épargne de précaution de 3 à 6 mois de dépenses');
  }

  // Vérifier la faisabilité des projets
  events.filter(e => e.is_expense).forEach(event => {
    const monthsUntil = getMonthsUntil(event.target_date);
    if (monthsUntil > 0) {
      const requiredMonthly = event.amount / monthsUntil;
      if (requiredMonthly > monthlySavings * 0.8) {
        warnings.push(`⚠️ Projet "${event.label}" : épargne nécessaire (${Math.round(requiredMonthly)}€/mois) dépasse ta capacité`);
      } else if (requiredMonthly > monthlySavings * 0.5) {
        warnings.push(`💡 Projet "${event.label}" : mobilisera plus de 50% de ton épargne mensuelle`);
      }
    }
  });

  // Vérifier les conflits de timing
  const highPriorityEvents = events.filter(e => e.priority === 'high' && e.is_expense);
  if (highPriorityEvents.length > 1) {
    const totalHighPriority = highPriorityEvents.reduce((sum, e) => sum + e.amount, 0);
    const avgMonths = highPriorityEvents.reduce((sum, e) => sum + getMonthsUntil(e.target_date), 0) / highPriorityEvents.length;
    if (avgMonths > 0 && totalHighPriority / avgMonths > monthlySavings) {
      warnings.push('⚠️ Plusieurs projets prioritaires en parallèle : envisage de décaler certaines échéances');
    }
  }

  return warnings;
}

function calculateFeasibilityScore(events: FinancialEvent[], monthlySavings: number): number {
  if (events.length === 0) return 100;

  let feasibleCount = 0;
  const expenseEvents = events.filter(e => e.is_expense);

  expenseEvents.forEach(event => {
    const monthsUntil = getMonthsUntil(event.target_date);
    if (monthsUntil > 0) {
      const requiredMonthly = event.amount / monthsUntil;
      if (requiredMonthly <= monthlySavings * 0.8) {
        feasibleCount++;
      }
    }
  });

  return expenseEvents.length > 0 ? Math.round((feasibleCount / expenseEvents.length) * 100) : 100;
}
