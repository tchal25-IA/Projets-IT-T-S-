
-- Lot 1: Recurring transactions
CREATE TABLE public.recurring_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  category TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'expense',
  note TEXT,
  currency TEXT NOT NULL DEFAULT 'EUR',
  frequency TEXT NOT NULL DEFAULT 'monthly', -- monthly, weekly, yearly
  next_date DATE NOT NULL DEFAULT CURRENT_DATE,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.recurring_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own recurring_transactions" ON public.recurring_transactions FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Lot 1: Budget ceilings per category
CREATE TABLE public.budget_ceilings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  ceiling_amount NUMERIC NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'EUR',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, category)
);
ALTER TABLE public.budget_ceilings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own budget_ceilings" ON public.budget_ceilings FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Lot 2: Liabilities (debts) for net worth
CREATE TABLE public.patrimoine_liabilities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  liability_type TEXT NOT NULL DEFAULT 'Crédit immobilier',
  amount NUMERIC NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'EUR',
  market TEXT NOT NULL DEFAULT 'FR',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.patrimoine_liabilities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own liabilities" ON public.patrimoine_liabilities FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Lot 2: Saved simulations
CREATE TABLE public.saved_simulations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  simulator_type TEXT NOT NULL,
  label TEXT NOT NULL,
  params_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  result_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.saved_simulations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own saved_simulations" ON public.saved_simulations FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
