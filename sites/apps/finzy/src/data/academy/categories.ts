export interface AcademyCategory {
  id: string;
  title: string;
  emoji: string;
  description: string;
  color: string;
}

export const academyCategories: AcademyCategory[] = [
  { id: 'fondamentaux', title: 'Fondamentaux', emoji: '📚', description: 'Les bases de la gestion financière', color: 'emerald' },
  { id: 'vie-quotidienne', title: 'Vie quotidienne', emoji: '🏠', description: 'Gérer les moments clés de la vie', color: 'blue' },
  { id: 'epargne', title: 'Épargne', emoji: '🐷', description: 'Constituer et faire fructifier son épargne', color: 'violet' },
  { id: 'enveloppes', title: 'Enveloppes fiscales', emoji: '📦', description: 'PEA, Assurance-vie, PER, CTO...', color: 'amber' },
  { id: 'investissement', title: 'Investissement', emoji: '📈', description: 'Bourse, ETF, actions, analyse', color: 'green' },
  { id: 'immobilier', title: 'Immobilier', emoji: '🏗️', description: 'Achat, locatif, SCPI, fiscalité', color: 'orange' },
  { id: 'crypto', title: 'Crypto-actifs', emoji: '₿', description: 'Bitcoin, altcoins, DeFi', color: 'yellow' },
  { id: 'fiscalite', title: 'Fiscalité', emoji: '📋', description: 'Impôts, optimisation, déclarations', color: 'red' },
  { id: 'avance', title: 'Stratégies avancées', emoji: '🎯', description: 'Private equity, holding, montages', color: 'purple' },
  { id: 'economie', title: 'Économie', emoji: '🌍', description: 'Macro, inflation, cycles économiques', color: 'cyan' },
];

export const levelInfo = {
  1: { name: 'Débutant', description: 'Les fondamentaux pour bien démarrer', color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30' },
  2: { name: 'Intermédiaire', description: 'Approfondir ses connaissances', color: 'bg-blue-500/10 text-blue-600 border-blue-500/30' },
  3: { name: 'Avancé', description: 'Stratégies et optimisations complexes', color: 'bg-violet-500/10 text-violet-600 border-violet-500/30' },
};
