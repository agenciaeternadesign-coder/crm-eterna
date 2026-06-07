-- ============================================================
-- CRM Eterna Beauty — Schema Supabase
-- Como usar: Supabase Dashboard → SQL Editor → New Query → Run
-- ============================================================

-- 1. SETTINGS (1 linha por utilizador)
CREATE TABLE IF NOT EXISTS public.settings (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name    TEXT,
  system_name     TEXT,
  segment         TEXT,
  primary_color   TEXT DEFAULT '#D4547A',
  secondary_color TEXT DEFAULT '#C9A96E',
  logo_url        TEXT,
  welcome_message TEXT,
  dark_mode       BOOLEAN DEFAULT false,
  updated_at      TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

-- 2. CLIENTS
CREATE TABLE IF NOT EXISTS public.clients (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  email      TEXT,
  phone      TEXT,
  company    TEXT,
  segment    TEXT,
  status     TEXT DEFAULT 'ativo',
  tipo       TEXT DEFAULT 'cliente',
  notes      TEXT,
  created_at DATE DEFAULT CURRENT_DATE
);

-- 3. PROJECTS (serviços)
CREATE TABLE IF NOT EXISTS public.projects (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id   UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  name        TEXT NOT NULL,
  description TEXT,
  status      TEXT DEFAULT 'a_fazer',
  tipo        TEXT DEFAULT 'servico',
  due_date    DATE,
  responsible TEXT,
  created_at  DATE DEFAULT CURRENT_DATE
);

-- 4. FINANCIAL
CREATE TABLE IF NOT EXISTS public.financial (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id   UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  type        TEXT NOT NULL DEFAULT 'entrada',
  description TEXT NOT NULL,
  category    TEXT,
  date        DATE DEFAULT CURRENT_DATE,
  amount      NUMERIC(12,2) DEFAULT 0,
  status      TEXT DEFAULT 'pendente'
);

-- 5. EVENTS (agenda)
CREATE TABLE IF NOT EXISTS public.events (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id   UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  title     TEXT NOT NULL,
  date      DATE NOT NULL,
  time      TEXT,
  type      TEXT DEFAULT 'reuniao',
  notes     TEXT
);

-- 6. PIPELINE
CREATE TABLE IF NOT EXISTS public.pipeline (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id   UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  title       TEXT NOT NULL,
  client_name TEXT,
  stage       TEXT NOT NULL DEFAULT 'c_lead',
  tipo        TEXT DEFAULT 'cliente',
  value       NUMERIC(12,2) DEFAULT 0,
  notes       TEXT,
  created_at  DATE DEFAULT CURRENT_DATE
);

-- ============================================================
-- ROW LEVEL SECURITY — cada utilizador vê SÓ os seus dados
-- ============================================================

ALTER TABLE public.settings  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pipeline  ENABLE ROW LEVEL SECURITY;

-- Apaga políticas existentes (seguro para re-executar)
DROP POLICY IF EXISTS "own_settings"  ON public.settings;
DROP POLICY IF EXISTS "own_clients"   ON public.clients;
DROP POLICY IF EXISTS "own_projects"  ON public.projects;
DROP POLICY IF EXISTS "own_financial" ON public.financial;
DROP POLICY IF EXISTS "own_events"    ON public.events;
DROP POLICY IF EXISTS "own_pipeline"  ON public.pipeline;

-- Cria políticas: utilizador só acede às suas próprias linhas
CREATE POLICY "own_settings"  ON public.settings  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own_clients"   ON public.clients   FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own_projects"  ON public.projects  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own_financial" ON public.financial FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own_events"    ON public.events    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own_pipeline"  ON public.pipeline  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
