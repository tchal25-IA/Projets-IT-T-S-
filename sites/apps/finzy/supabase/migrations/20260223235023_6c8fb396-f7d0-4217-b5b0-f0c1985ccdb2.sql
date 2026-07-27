-- Create project_transactions table for deposit/withdrawal history
CREATE TABLE public.project_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  type TEXT NOT NULL DEFAULT 'deposit',
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.project_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users own project_transactions"
  ON public.project_transactions
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_project_transactions_project ON public.project_transactions(project_id);
CREATE INDEX idx_project_transactions_user ON public.project_transactions(user_id);