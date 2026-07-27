-- Watchlist: symbols suivis par l'utilisateur
CREATE TABLE IF NOT EXISTS public.watchlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  symbol TEXT NOT NULL,
  name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, symbol)
);
ALTER TABLE public.watchlist ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users own watchlist" ON public.watchlist;
CREATE POLICY "Users own watchlist" ON public.watchlist FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Portfolio positions: achats/ventes pour calcul PRU et P&L
CREATE TABLE IF NOT EXISTS public.portfolio_positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  symbol TEXT NOT NULL,
  name TEXT,
  quantity NUMERIC NOT NULL,
  price_per_unit NUMERIC NOT NULL,
  currency TEXT NOT NULL DEFAULT 'EUR',
  type TEXT NOT NULL DEFAULT 'buy' CHECK (type IN ('buy', 'sell')),
  trade_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.portfolio_positions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users own portfolio" ON public.portfolio_positions;
CREATE POLICY "Users own portfolio" ON public.portfolio_positions FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
