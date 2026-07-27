-- Add stripe_customer_id to profiles for subscription management
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;

-- Index for quick lookup by stripe customer id (used by webhook)
CREATE INDEX IF NOT EXISTS profiles_stripe_customer_id_idx ON public.profiles (stripe_customer_id);
