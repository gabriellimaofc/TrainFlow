-- =========================================================
-- TrainFlow v2 — schema.sql
-- Execute no SQL Editor do Supabase (Project → SQL Editor)
-- =========================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ENUMS
DO $$ BEGIN
  CREATE TYPE user_role  AS ENUM ('aluno', 'treinador');
  CREATE TYPE plan_type  AS ENUM ('free', 'premium');
  CREATE TYPE goal_type  AS ENUM ('emagrecimento','hipertrofia','definicao','saude','performance','reabilitacao');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 1. PROFILES (base para todos os usuários)
CREATE TABLE IF NOT EXISTS public.profiles (
  id           UUID       REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  nome         TEXT       NOT NULL,
  role         user_role  NOT NULL DEFAULT 'aluno',
  plan_type    plan_type  NOT NULL DEFAULT 'free',
  avatar_url   TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- 2. PERFIL DO ALUNO (dados físicos)
CREATE TABLE IF NOT EXISTS public.aluno_perfil (
  id           BIGSERIAL   PRIMARY KEY,
  user_id      UUID        REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
  idade        SMALLINT    CHECK (idade BETWEEN 10 AND 120),
  peso         NUMERIC(5,2) CHECK (peso BETWEEN 20 AND 400),
  altura       SMALLINT    CHECK (altura BETWEEN 100 AND 250),
  sexo         TEXT        CHECK (sexo IN ('M','F','NB','ND')),
  objetivo     goal_type,
  observacoes  TEXT,
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- 3. MEDIDAS CORPORAIS (histórico — append only, nunca sobrescreve)
CREATE TABLE IF NOT EXISTS public.medidas (
  id           BIGSERIAL   PRIMARY KEY,
  user_id      UUID        REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  data         DATE        DEFAULT CURRENT_DATE,
  braco_d      NUMERIC(5,1),
  braco_e      NUMERIC(5,1),
  peito        NUMERIC(5,1),
  cintura      NUMERIC(5,1),
  quadril      NUMERIC(5,1),
  coxa_d       NUMERIC(5,1),
  coxa_e       NUMERIC(5,1),
  panturrilha  NUMERIC(5,1),
  peso_data    NUMERIC(5,2),
  notas        TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- 4. RELAÇÃO TREINADOR ↔ ALUNO
CREATE TABLE IF NOT EXISTS public.treinador_aluno (
  id           BIGSERIAL PRIMARY KEY,
  treinador_id UUID      REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  aluno_id     UUID      REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  ativo        BOOLEAN   DEFAULT true,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(treinador_id, aluno_id)
);

-- 5. NOTAS DO TREINADOR SOBRE O ALUNO
CREATE TABLE IF NOT EXISTS public.notas_treinador (
  id           BIGSERIAL PRIMARY KEY,
  treinador_id UUID      REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  aluno_id     UUID      REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  conteudo     TEXT      NOT NULL,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- 6. TREINOS CUSTOMIZADOS (criados pelo treinador)
CREATE TABLE IF NOT EXISTS public.treinos_custom (
  id           BIGSERIAL PRIMARY KEY,
  treinador_id UUID      REFERENCES public.profiles(id) ON DELETE SET NULL,
  aluno_id     UUID      REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  nome         TEXT      NOT NULL,
  descricao    TEXT,
  ativo        BOOLEAN   DEFAULT true,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- 7. EXERCÍCIOS DOS TREINOS CUSTOMIZADOS
CREATE TABLE IF NOT EXISTS public.exercicios_custom (
  id           BIGSERIAL PRIMARY KEY,
  treino_id    BIGINT    REFERENCES public.treinos_custom(id) ON DELETE CASCADE NOT NULL,
  nome         TEXT      NOT NULL,
  grupo        TEXT,
  series       SMALLINT  DEFAULT 3,
  reps         TEXT      DEFAULT '10-12',
  descanso     TEXT      DEFAULT '90s',
  rpe          TEXT      DEFAULT 'RPE 8',
  observacoes  TEXT,
  dicas        TEXT,
  ordem        SMALLINT  DEFAULT 0
);

-- 8. HISTÓRICO DE TREINOS
CREATE TABLE IF NOT EXISTS public.historico (
  id            BIGSERIAL   PRIMARY KEY,
  user_id       UUID        REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  exercise_id   INTEGER,
  exercise_name TEXT,
  day_id        TEXT,
  carga         NUMERIC(6,2) DEFAULT 0,
  reps          SMALLINT     DEFAULT 0,
  series        SMALLINT     DEFAULT 0,
  notas         TEXT,
  data          DATE         DEFAULT CURRENT_DATE,
  created_at    TIMESTAMPTZ  DEFAULT NOW()
);

-- ÍNDICES
CREATE INDEX IF NOT EXISTS idx_hist_user_data     ON public.historico(user_id, data DESC);
CREATE INDEX IF NOT EXISTS idx_hist_user_ex       ON public.historico(user_id, exercise_id);
CREATE INDEX IF NOT EXISTS idx_medidas_user       ON public.medidas(user_id, data DESC);
CREATE INDEX IF NOT EXISTS idx_ta_trainer         ON public.treinador_aluno(treinador_id) WHERE ativo=true;
CREATE INDEX IF NOT EXISTS idx_ta_aluno           ON public.treinador_aluno(aluno_id) WHERE ativo=true;

-- ROW LEVEL SECURITY
ALTER TABLE public.profiles          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aluno_perfil      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medidas           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.treinador_aluno   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notas_treinador   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.treinos_custom    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercicios_custom ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.historico         ENABLE ROW LEVEL SECURITY;

-- POLICIES: profiles
CREATE POLICY "profiles: own read"    ON public.profiles FOR SELECT USING (auth.uid()=id);
CREATE POLICY "profiles: trainer reads students" ON public.profiles FOR SELECT USING (
  EXISTS(SELECT 1 FROM public.treinador_aluno WHERE treinador_id=auth.uid() AND aluno_id=id AND ativo=true));
CREATE POLICY "profiles: own insert"  ON public.profiles FOR INSERT WITH CHECK (auth.uid()=id);
CREATE POLICY "profiles: own update"  ON public.profiles FOR UPDATE USING (auth.uid()=id);

-- POLICIES: aluno_perfil
CREATE POLICY "ap: own all"      ON public.aluno_perfil FOR ALL    USING (auth.uid()=user_id);
CREATE POLICY "ap: trainer read" ON public.aluno_perfil FOR SELECT USING (
  EXISTS(SELECT 1 FROM public.treinador_aluno WHERE treinador_id=auth.uid() AND aluno_id=user_id AND ativo=true));

-- POLICIES: medidas
CREATE POLICY "med: own all"      ON public.medidas FOR ALL    USING (auth.uid()=user_id);
CREATE POLICY "med: trainer read" ON public.medidas FOR SELECT USING (
  EXISTS(SELECT 1 FROM public.treinador_aluno WHERE treinador_id=auth.uid() AND aluno_id=user_id AND ativo=true));

-- POLICIES: treinador_aluno
CREATE POLICY "ta: trainer all"  ON public.treinador_aluno FOR ALL    USING (auth.uid()=treinador_id);
CREATE POLICY "ta: aluno read"   ON public.treinador_aluno FOR SELECT USING (auth.uid()=aluno_id);

-- POLICIES: notas
CREATE POLICY "notas: trainer all" ON public.notas_treinador FOR ALL    USING (auth.uid()=treinador_id);
CREATE POLICY "notas: aluno read"  ON public.notas_treinador FOR SELECT USING (auth.uid()=aluno_id);

-- POLICIES: historico
CREATE POLICY "hist: own all"      ON public.historico FOR ALL    USING (auth.uid()=user_id);
CREATE POLICY "hist: trainer read" ON public.historico FOR SELECT USING (
  EXISTS(SELECT 1 FROM public.treinador_aluno WHERE treinador_id=auth.uid() AND aluno_id=user_id AND ativo=true));

-- POLICIES: treinos_custom / exercicios_custom
CREATE POLICY "tc: trainer manage" ON public.treinos_custom FOR ALL    USING (auth.uid()=treinador_id);
CREATE POLICY "tc: aluno read"     ON public.treinos_custom FOR SELECT USING (auth.uid()=aluno_id);
CREATE POLICY "ec: via treino"     ON public.exercicios_custom FOR ALL USING (
  EXISTS(SELECT 1 FROM public.treinos_custom tc WHERE tc.id=treino_id
    AND (tc.treinador_id=auth.uid() OR tc.aluno_id=auth.uid())));

-- TRIGGER: auto-criar profile ao signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.profiles (id, nome, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome', split_part(NEW.email,'@',1)),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'aluno')
  ) ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- TRIGGER: updated_at automático
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$;

CREATE TRIGGER profiles_upd    BEFORE UPDATE ON public.profiles    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER ap_upd          BEFORE UPDATE ON public.aluno_perfil FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER tc_upd          BEFORE UPDATE ON public.treinos_custom FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- VIEWS ANALÍTICAS
CREATE OR REPLACE VIEW public.v_prs AS
SELECT user_id, exercise_id, exercise_name,
       MAX(carga) AS carga_max, COUNT(*) AS total_logs, MAX(data) AS ultimo_registro
FROM public.historico GROUP BY user_id, exercise_id, exercise_name;

CREATE OR REPLACE VIEW public.v_frequencia_semanal AS
SELECT user_id, DATE_TRUNC('week', data)::DATE AS semana,
       COUNT(DISTINCT day_id) AS treinos
FROM public.historico GROUP BY user_id, DATE_TRUNC('week', data)::DATE ORDER BY semana DESC;
