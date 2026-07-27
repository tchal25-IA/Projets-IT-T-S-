import { useAuth } from '@/contexts/AuthContext';

export type PlanTier = 'free' | 'premium' | 'beta';

const PREMIUM_FEATURES = {
  simulateursAvances: ['fire', 'impot-revenu', 'flat-tax', 'cashflow', 'amortissement', 'comparateur'],
  academyLevels: [2, 3],
  finzybotUnlimited: true,
  watchlist: true,
  projections: true,
  exportData: true,
  guidesBonus: true,
  immoBundle: true,
} as const;

export function usePlan() {
  const { profile } = useAuth();
  const plan = (profile?.plan ?? 'free') as PlanTier;

  // Trial check: if premium_type is 'trial' and trial has expired, treat as free
  const trialExpired =
    plan === 'premium' &&
    profile?.premium_type === 'trial' &&
    profile?.premium_trial_ends_at != null &&
    new Date(profile.premium_trial_ends_at) < new Date();

  const isPremium = (plan === 'premium' || plan === 'beta') && !trialExpired;
  const isLifetime = plan === 'premium' && profile?.premium_type === 'lifetime';

  return {
    plan,
    isPremium,
    isLifetime,
    premiumType: profile?.premium_type ?? null,
    trialEndsAt: profile?.premium_trial_ends_at ?? null,
    isAdmin: profile?.is_admin ?? false,
    canAccess: (_feature: keyof typeof PREMIUM_FEATURES) => isPremium,
    PREMIUM_FEATURES,
  };
}
