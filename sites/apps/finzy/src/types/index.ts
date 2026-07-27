// === Finzy Core Types ===

export type Market = 'FR' | 'CH';
export type Currency = 'EUR' | 'CHF' | 'USD';
export type ProfileType = 'curieux' | 'organise' | 'investisseur' | 'stratege';
export type PlanType = 'free' | 'premium' | 'beta';
export type TransactionType = 'income' | 'expense';

export interface User {
  id: string;
  username: string;
  email?: string;
  xp_total: number;
  level: number;
  plan: PlanType;
  market: Market;
  currency: Currency;
  profile_type: ProfileType;
  onboarding_completed: boolean;
  referral_code?: string;
  created_at: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  amount: number;
  currency: Currency;
  category: string;
  type: TransactionType;
  date: string;
  note?: string;
  project_id?: string;
}

export interface Project {
  id: string;
  user_id: string;
  title: string;
  target_amount: number;
  current_amount: number;
  currency: Currency;
  deadline: string;
  status: 'active' | 'completed' | 'paused' | 'abandoned';
  icon: string;
}

export interface Goal {
  id: string;
  user_id: string;
  type: 'income' | 'expense' | 'wealth' | 'investment' | 'savings_rate' | 'custom';
  target_value: number;
  current_value: number;
  currency: Currency;
  label: string;
  deadline?: string;
}

export interface PatrimoineEntry {
  id: string;
  user_id: string;
  envelope_type: string;
  label: string;
  amount: number;
  currency: Currency;
  date: string;
  market: Market;
}

export interface AcademyArticle {
  id: string;
  title: string;
  slug: string;
  content_md: string;
  level_required: number;
  xp_reward: number;
  read_time_min: number;
  market: Market | 'BOTH';
  quiz_json?: string;
}

export interface AcademyPath {
  id: string;
  title: string;
  description: string;
  market: Market | 'BOTH';
  level_required: number;
  article_ids: string[];
}

export interface Badge {
  id: string;
  key: string;
  label: string;
  description: string;
  icon: string;
  xp_reward: number;
  earned: boolean;
}

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body: string;
  read: boolean;
  created_at: string;
}

export interface ScoreDetail {
  label: string;
  value: number;
  max: number;
  weight: number;
}

export interface AmortizationRow {
  month: number;
  payment: number;
  principal: number;
  interest: number;
  insurance: number;
  remaining: number;
}
