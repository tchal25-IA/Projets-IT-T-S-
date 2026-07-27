# Migration : Table financial_events

Exécute ce SQL dans ton dashboard Supabase (SQL Editor) :

```sql
-- Table pour stocker les événements financiers futurs
CREATE TABLE IF NOT EXISTS public.financial_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('wedding', 'house', 'car', 'travel', 'baby', 'education', 'renovation', 'inheritance', 'sale', 'bonus', 'other')),
  label TEXT NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  target_date DATE NOT NULL,
  is_expense BOOLEAN NOT NULL DEFAULT true,
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),
  linked_project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  notes TEXT,
  currency TEXT NOT NULL DEFAULT 'EUR',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index pour les requêtes par utilisateur
CREATE INDEX IF NOT EXISTS idx_financial_events_user_id ON public.financial_events(user_id);
CREATE INDEX IF NOT EXISTS idx_financial_events_target_date ON public.financial_events(target_date);

-- RLS (Row Level Security)
ALTER TABLE public.financial_events ENABLE ROW LEVEL SECURITY;

-- Politique : les utilisateurs ne voient que leurs propres événements
CREATE POLICY "Users can view own financial_events"
  ON public.financial_events FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own financial_events"
  ON public.financial_events FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own financial_events"
  ON public.financial_events FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own financial_events"
  ON public.financial_events FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger pour updated_at
CREATE OR REPLACE FUNCTION update_financial_events_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_financial_events_updated_at
  BEFORE UPDATE ON public.financial_events
  FOR EACH ROW
  EXECUTE FUNCTION update_financial_events_updated_at();
```

## Types d'événements supportés :
- `wedding` : Mariage
- `house` : Achat immobilier
- `car` : Achat véhicule
- `travel` : Voyage
- `baby` : Naissance
- `education` : Études / Formation
- `renovation` : Travaux
- `inheritance` : Héritage (entrée d'argent)
- `sale` : Vente (entrée d'argent)
- `bonus` : Prime / Bonus (entrée d'argent)
- `other` : Autre
