ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS avatar text,
  ADD COLUMN IF NOT EXISTS is_admin boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS premium_type text,
  ADD COLUMN IF NOT EXISTS premium_trial_ends_at timestamptz,
  ADD COLUMN IF NOT EXISTS referral_used_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL;