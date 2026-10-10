-- ============================================================
-- FusionFit Atelier v1 — Bibliothèque (11 modules) + séances
-- Instant search (tsvector + pg_trgm) · Template vs Instance
-- Médias V2 anticipés (diagramme anatomique + micro-vidéo)
-- ============================================================

CREATE EXTENSION IF NOT EXISTS unaccent;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Helper: normalisation recherche (minuscules, sans accents)
CREATE OR REPLACE FUNCTION public.ff_unaccent_lower(t text)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT lower(public.unaccent(coalesce(t, '')));
$$;

-- ── Catalogue éditorial (source : JSON modules) ─────────────
CREATE TABLE IF NOT EXISTS public.library_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,                    -- FF-001, WOD-001, HYX-STD-001…
  module text NOT NULL,                        -- module1, module3_crossfit, …
  item_type text NOT NULL CHECK (item_type IN ('exercise', 'wod', 'knowledge')),
  nom_fr text NOT NULL,
  nom_en text,
  categorie text,
  mots_cles text[] NOT NULL DEFAULT '{}',
  materiel text[] NOT NULL DEFAULT '{}',
  muscles_principaux text[] NOT NULL DEFAULT '{}',
  muscles_secondaires text[] NOT NULL DEFAULT '{}',
  respiration text,
  niveau_1 text,
  niveau_2 text,
  niveau_3 text,
  coach_tip text,
  -- Champs hétérogènes normalisés (WOD / knowledge / running)
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  -- Médias V2 (raccourcis ; détail aussi dans library_media)
  media_thumbnail_url text,
  media_diagram_url text,                       -- schématique anatomique
  media_video_url text,                         -- micro-vidéo 5–7 s en boucle
  search_text text,                             -- dénormalisé pour index
  search_vector tsvector,
  revision integer NOT NULL DEFAULT 1,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS library_items_module_idx ON public.library_items(module);
CREATE INDEX IF NOT EXISTS library_items_type_idx ON public.library_items(item_type);
CREATE INDEX IF NOT EXISTS library_items_categorie_idx ON public.library_items(categorie);
CREATE INDEX IF NOT EXISTS library_items_mots_cles_gin ON public.library_items USING gin (mots_cles);
CREATE INDEX IF NOT EXISTS library_items_search_gin ON public.library_items USING gin (search_vector);
CREATE INDEX IF NOT EXISTS library_items_trgm_idx ON public.library_items USING gin (search_text gin_trgm_ops);
CREATE INDEX IF NOT EXISTS library_items_nom_fr_trgm ON public.library_items USING gin (nom_fr gin_trgm_ops);

-- Médias liés (V2) — résolution à la lecture, non snapshotés dans les instances
CREATE TABLE IF NOT EXISTS public.library_media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  library_item_id uuid NOT NULL REFERENCES public.library_items(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('thumbnail', 'diagram', 'video_loop')),
  url text NOT NULL,
  alt_text text,
  duration_sec numeric,                         -- pour video_loop (~5–7)
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (library_item_id, kind, url)
);

CREATE INDEX IF NOT EXISTS library_media_item_idx ON public.library_media(library_item_id);

-- Synonymes éditables (pompe = push_up, gainage = planche…)
CREATE TABLE IF NOT EXISTS public.library_synonyms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  term text NOT NULL,
  synonyms text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (term)
);

-- Rebuild search_vector / search_text
CREATE OR REPLACE FUNCTION public.library_items_refresh_search()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  blob text;
BEGIN
  blob := concat_ws(' ',
    NEW.code,
    NEW.nom_fr,
    NEW.nom_en,
    NEW.categorie,
    array_to_string(NEW.mots_cles, ' '),
    array_to_string(NEW.materiel, ' '),
    array_to_string(NEW.muscles_principaux, ' '),
    array_to_string(NEW.muscles_secondaires, ' '),
    NEW.coach_tip,
    NEW.niveau_1, NEW.niveau_2, NEW.niveau_3,
    coalesce(NEW.payload::text, '')
  );
  NEW.search_text := public.ff_unaccent_lower(blob);
  NEW.search_vector :=
      setweight(to_tsvector('french', public.ff_unaccent_lower(coalesce(array_to_string(NEW.mots_cles, ' '), ''))), 'A')
    || setweight(to_tsvector('french', public.ff_unaccent_lower(coalesce(NEW.nom_fr, '') || ' ' || coalesce(NEW.nom_en, ''))), 'A')
    || setweight(to_tsvector('simple', public.ff_unaccent_lower(coalesce(NEW.code, ''))), 'A')
    || setweight(to_tsvector('french', public.ff_unaccent_lower(coalesce(array_to_string(NEW.muscles_principaux, ' '), ''))), 'B')
    || setweight(to_tsvector('french', public.ff_unaccent_lower(coalesce(NEW.categorie, '') || ' ' || coalesce(array_to_string(NEW.materiel, ' '), ''))), 'C')
    || setweight(to_tsvector('french', public.ff_unaccent_lower(coalesce(NEW.coach_tip, '') || ' ' || coalesce(NEW.niveau_1, ''))), 'D');
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS library_items_search_trg ON public.library_items;
CREATE TRIGGER library_items_search_trg
  BEFORE INSERT OR UPDATE ON public.library_items
  FOR EACH ROW EXECUTE FUNCTION public.library_items_refresh_search();

-- Recherche instantanée (MVP sans Meilisearch)
CREATE OR REPLACE FUNCTION public.search_library_items(
  q text,
  p_modules text[] DEFAULT NULL,
  p_types text[] DEFAULT NULL,
  p_limit integer DEFAULT 20
)
RETURNS TABLE (
  id uuid,
  code text,
  module text,
  item_type text,
  nom_fr text,
  nom_en text,
  categorie text,
  mots_cles text[],
  materiel text[],
  muscles_principaux text[],
  media_thumbnail_url text,
  media_diagram_url text,
  media_video_url text,
  has_video boolean,
  has_diagram boolean,
  rank real
)
LANGUAGE sql
STABLE
AS $$
  WITH qn AS (
    SELECT nullif(trim(q), '') AS raw,
           public.ff_unaccent_lower(trim(coalesce(q, ''))) AS norm
  )
  SELECT
    i.id, i.code, i.module, i.item_type, i.nom_fr, i.nom_en, i.categorie,
    i.mots_cles, i.materiel, i.muscles_principaux,
    i.media_thumbnail_url, i.media_diagram_url, i.media_video_url,
    (i.media_video_url IS NOT NULL AND i.media_video_url <> '') AS has_video,
    (i.media_diagram_url IS NOT NULL AND i.media_diagram_url <> '') AS has_diagram,
    CASE
      WHEN (SELECT raw FROM qn) IS NULL THEN 0::real
      WHEN public.ff_unaccent_lower(i.code) = (SELECT norm FROM qn) THEN 1000::real
      ELSE (
        coalesce(ts_rank(i.search_vector, plainto_tsquery('french', (SELECT norm FROM qn))), 0) * 10
        + similarity(i.search_text, (SELECT norm FROM qn)) * 5
        + CASE WHEN i.search_text LIKE (SELECT norm FROM qn) || '%' THEN 2 ELSE 0 END
      )::real
    END AS rank
  FROM public.library_items i, qn
  WHERE i.is_active
    AND (p_modules IS NULL OR i.module = ANY(p_modules))
    AND (p_types IS NULL OR i.item_type = ANY(p_types))
    AND (
      qn.raw IS NULL
      OR i.search_vector @@ plainto_tsquery('french', qn.norm)
      OR i.search_text % qn.norm
      OR i.search_text LIKE qn.norm || '%'
      OR public.ff_unaccent_lower(i.code) = qn.norm
    )
  ORDER BY rank DESC, i.nom_fr ASC
  LIMIT greatest(1, least(coalesce(p_limit, 20), 100));
$$;

GRANT EXECUTE ON FUNCTION public.search_library_items(text, text[], text[], integer) TO authenticated, anon, service_role;

-- ── Atelier : modèle vs instance (copie profonde à l'attribution) ──
CREATE TABLE IF NOT EXISTS public.atelier_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('template', 'instance')),
  athlete_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  source_session_id uuid REFERENCES public.atelier_sessions(id) ON DELETE SET NULL,
  source_version integer,
  batch_id uuid,                                -- attribution groupe
  title text NOT NULL,
  objectif text,
  scheduled_for date,
  status text NOT NULL DEFAULT 'draft',
  customized boolean NOT NULL DEFAULT false,
  version integer NOT NULL DEFAULT 1,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT atelier_sessions_kind_athlete CHECK (
    (kind = 'template' AND athlete_id IS NULL)
    OR (kind = 'instance' AND athlete_id IS NOT NULL)
  )
);

CREATE INDEX IF NOT EXISTS atelier_sessions_coach_idx ON public.atelier_sessions(coach_id);
CREATE INDEX IF NOT EXISTS atelier_sessions_athlete_idx ON public.atelier_sessions(athlete_id);
CREATE INDEX IF NOT EXISTS atelier_sessions_source_idx ON public.atelier_sessions(source_session_id);
CREATE INDEX IF NOT EXISTS atelier_sessions_batch_idx ON public.atelier_sessions(batch_id);

CREATE TABLE IF NOT EXISTS public.atelier_session_blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.atelier_sessions(id) ON DELETE CASCADE,
  phase text NOT NULL CHECK (phase IN ('warm_up', 'main', 'cool_down')),
  block_type text NOT NULL DEFAULT 'single'
    CHECK (block_type IN ('single', 'superset', 'circuit', 'amrap', 'emom', 'tabata', 'chipper', 'rest')),
  position text NOT NULL DEFAULT 'a0',          -- fractional indexing
  config jsonb NOT NULL DEFAULT '{}'::jsonb,    -- durée AMRAP, tours circuit…
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS atelier_blocks_session_idx ON public.atelier_session_blocks(session_id);

CREATE TABLE IF NOT EXISTS public.atelier_session_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  block_id uuid NOT NULL REFERENCES public.atelier_session_blocks(id) ON DELETE CASCADE,
  library_item_id uuid REFERENCES public.library_items(id) ON DELETE SET NULL,
  library_item_revision integer,
  -- Snapshot texte (indépendance éditoriale) — médias résolus via library_item_id
  exercise_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  position text NOT NULL DEFAULT 'a0',
  level integer CHECK (level IS NULL OR level BETWEEN 1 AND 3),
  sets integer,
  reps integer,
  duration_s integer,
  load text,
  tempo text,
  rest_s integer,
  rpe integer CHECK (rpe IS NULL OR rpe BETWEEN 1 AND 10),
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS atelier_items_block_idx ON public.atelier_session_items(block_id);
CREATE INDEX IF NOT EXISTS atelier_items_library_idx ON public.atelier_session_items(library_item_id);

-- Idempotence attribution
CREATE TABLE IF NOT EXISTS public.atelier_assignment_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  template_id uuid NOT NULL REFERENCES public.atelier_sessions(id) ON DELETE CASCADE,
  idempotency_key text NOT NULL,
  athlete_ids uuid[] NOT NULL,
  batch_id uuid NOT NULL,
  result jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (coach_id, idempotency_key)
);

CREATE TABLE IF NOT EXISTS public.atelier_session_audits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.atelier_sessions(id) ON DELETE CASCADE,
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action text NOT NULL,
  detail jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS atelier_audits_session_idx ON public.atelier_session_audits(session_id);

-- ── RLS ─────────────────────────────────────────────────────
ALTER TABLE public.library_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.library_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.library_synonyms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.atelier_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.atelier_session_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.atelier_session_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.atelier_assignment_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.atelier_session_audits ENABLE ROW LEVEL SECURITY;

-- Catalogue : lecture authentifiée (référentiel partagé)
DROP POLICY IF EXISTS "library_items_read" ON public.library_items;
CREATE POLICY "library_items_read" ON public.library_items
  FOR SELECT TO authenticated USING (is_active = true);

DROP POLICY IF EXISTS "library_media_read" ON public.library_media;
CREATE POLICY "library_media_read" ON public.library_media
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "library_synonyms_read" ON public.library_synonyms;
CREATE POLICY "library_synonyms_read" ON public.library_synonyms
  FOR SELECT TO authenticated USING (true);

-- Écriture catalogue : service_role uniquement (import) — pas de policy insert pour authenticated

-- Atelier sessions
DROP POLICY IF EXISTS "atelier_sessions_coach" ON public.atelier_sessions;
CREATE POLICY "atelier_sessions_coach" ON public.atelier_sessions
  FOR ALL TO authenticated
  USING (auth.uid() = coach_id)
  WITH CHECK (auth.uid() = coach_id AND public.has_role(auth.uid(), 'coach'));

DROP POLICY IF EXISTS "atelier_sessions_athlete_read" ON public.atelier_sessions;
CREATE POLICY "atelier_sessions_athlete_read" ON public.atelier_sessions
  FOR SELECT TO authenticated
  USING (kind = 'instance' AND athlete_id = auth.uid());

DROP POLICY IF EXISTS "atelier_blocks_access" ON public.atelier_session_blocks;
CREATE POLICY "atelier_blocks_access" ON public.atelier_session_blocks
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.atelier_sessions s
      WHERE s.id = session_id
        AND (s.coach_id = auth.uid() OR (s.kind = 'instance' AND s.athlete_id = auth.uid()))
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.atelier_sessions s
      WHERE s.id = session_id AND s.coach_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "atelier_items_access" ON public.atelier_session_items;
CREATE POLICY "atelier_items_access" ON public.atelier_session_items
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.atelier_session_blocks b
      JOIN public.atelier_sessions s ON s.id = b.session_id
      WHERE b.id = block_id
        AND (s.coach_id = auth.uid() OR (s.kind = 'instance' AND s.athlete_id = auth.uid()))
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.atelier_session_blocks b
      JOIN public.atelier_sessions s ON s.id = b.session_id
      WHERE b.id = block_id AND s.coach_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "atelier_assign_coach" ON public.atelier_assignment_requests;
CREATE POLICY "atelier_assign_coach" ON public.atelier_assignment_requests
  FOR ALL TO authenticated
  USING (auth.uid() = coach_id)
  WITH CHECK (auth.uid() = coach_id AND public.has_role(auth.uid(), 'coach'));

DROP POLICY IF EXISTS "atelier_audits_access" ON public.atelier_session_audits;
CREATE POLICY "atelier_audits_access" ON public.atelier_session_audits
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.atelier_sessions s
      WHERE s.id = session_id
        AND (s.coach_id = auth.uid() OR s.athlete_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "atelier_audits_insert_coach" ON public.atelier_session_audits;
CREATE POLICY "atelier_audits_insert_coach" ON public.atelier_session_audits
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.atelier_sessions s
      WHERE s.id = session_id AND s.coach_id = auth.uid()
    )
  );

-- Synonymes de base
INSERT INTO public.library_synonyms (term, synonyms) VALUES
  ('pompe', ARRAY['pompes', 'push_up', 'push-up', 'pushups']),
  ('gainage', ARRAY['planche', 'plank', 'planks']),
  ('kettlebell', ARRAY['kb', 'kettle_bell']),
  ('souleve_de_terre', ARRAY['deadlift', 'dead_lift', 'sdl']),
  ('squat', ARRAY['air_squat', 'air_squats', 'squats'])
ON CONFLICT (term) DO NOTHING;

COMMENT ON TABLE public.library_items IS 'Catalogue FusionFit (11 modules JSON) — recherche instantanée';
COMMENT ON TABLE public.library_media IS 'Médias V2 : diagramme anatomique + micro-vidéo boucle';
COMMENT ON TABLE public.atelier_sessions IS 'Modèles (template) et instances athlète (copie profonde à l''attribution)';
COMMENT ON COLUMN public.atelier_session_items.exercise_snapshot IS 'Snapshot texte à l''attribution ; médias non inclus (résolus via library_item_id)';
