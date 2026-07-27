-- Add avatar column to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar TEXT DEFAULT '😎';

-- Add referral_used_by to prevent double-spend
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS referral_used_by UUID REFERENCES public.profiles(id);
