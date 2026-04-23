-- =================================================================
-- TrainFlow — schema.sql
-- Execute no SQL Editor do Supabase
-- =================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

DO $$ BEGIN CREATE TYPE user_role  AS ENUM ('aluno', 'treinador');         EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE plan_type  AS ENUM ('free', 'premium');            EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE goal_type  AS ENUM ('emagrecimento','hipertrofia','definicao','saude','performance','reabilitacao'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE exercise_type AS ENUM ('livre','maquina','funcional','cardio'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE muscle_group  AS ENUM ('Peito','Costas','Pernas','Glúteos','Ombro','Bíceps','Tríceps','Core','Cardio'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE workout_status AS ENUM ('ativo','inativo','arquivado'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- PROFILES
CREATE TABLE IF NOT EXISTS public.profiles (
  id             UUID       PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome           TEXT       NOT NULL DEFAULT '',
  email          TEXT       NOT NULL DEFAULT '',
  role           user_role  NOT NULL DEFAULT 'aluno',
  plan_type      plan_type  NOT NULL DEFAULT 'free',
  avatar_url     TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ALUNOS_DETALHES
CREATE TABLE IF NOT EXISTS public.alunos_detalhes (
  id           BIGSERIAL    PRIMARY KEY,
  user_id      UUID         NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  idade        SMALLINT     CHECK (idade BETWEEN 10 AND 120),
  peso         NUMERIC(5,2) CHECK (peso BETWEEN 20 AND 400),
  altura       SMALLINT     CHECK (altura BETWEEN 100 AND 250),
  sexo         TEXT         CHECK (sexo IN ('M','F','NB','ND')),
  objetivo     goal_type,
  observacoes  TEXT,
  updated_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- MEDIDAS
CREATE TABLE IF NOT EXISTS public.medidas (
  id           BIGSERIAL    PRIMARY KEY,
  user_id      UUID         NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  data         DATE         NOT NULL DEFAULT CURRENT_DATE,
  braco_d      NUMERIC(5,1), braco_e     NUMERIC(5,1), antebraco   NUMERIC(5,1),
  peito        NUMERIC(5,1), cintura     NUMERIC(5,1), quadril     NUMERIC(5,1),
  coxa_d       NUMERIC(5,1), coxa_e      NUMERIC(5,1), panturrilha NUMERIC(5,1),
  ombro        NUMERIC(5,1), peso_data   NUMERIC(5,2),
  notas        TEXT,
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- EXERCICIOS (biblioteca global)
CREATE TABLE IF NOT EXISTS public.exercicios (
  id              BIGSERIAL     PRIMARY KEY,
  nome            TEXT          NOT NULL,
  grupo_muscular  muscle_group  NOT NULL,
  tipo            exercise_type NOT NULL DEFAULT 'livre',
  execucao        TEXT,
  equipamento     TEXT,
  ativo           BOOLEAN       NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- TREINADOR_ALUNO
CREATE TABLE IF NOT EXISTS public.treinador_aluno (
  id            BIGSERIAL   PRIMARY KEY,
  treinador_id  UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  aluno_id      UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  ativo         BOOLEAN     NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (treinador_id, aluno_id)
);

-- TREINOS
CREATE TABLE IF NOT EXISTS public.treinos (
  id            BIGSERIAL      PRIMARY KEY,
  treinador_id  UUID           NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  aluno_id      UUID           NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  nome          TEXT           NOT NULL,
  descricao     TEXT,
  status        workout_status NOT NULL DEFAULT 'ativo',
  created_at    TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

-- TREINO_EXERCICIOS
CREATE TABLE IF NOT EXISTS public.treino_exercicios (
  id            BIGSERIAL   PRIMARY KEY,
  treino_id     BIGINT      NOT NULL REFERENCES public.treinos(id) ON DELETE CASCADE,
  exercicio_id  BIGINT      NOT NULL REFERENCES public.exercicios(id) ON DELETE RESTRICT,
  series        SMALLINT    NOT NULL DEFAULT 3,
  repeticoes    TEXT        NOT NULL DEFAULT '10-12',
  descanso      TEXT        NOT NULL DEFAULT '60s',
  rpe           TEXT,
  observacoes   TEXT,
  ordem         SMALLINT    NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- OBSERVACOES_TREINADOR
CREATE TABLE IF NOT EXISTS public.observacoes_treinador (
  id            BIGSERIAL   PRIMARY KEY,
  treinador_id  UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  aluno_id      UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  conteudo      TEXT        NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- HISTORICO_TREINO
CREATE TABLE IF NOT EXISTS public.historico_treino (
  id              BIGSERIAL    PRIMARY KEY,
  user_id         UUID         NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  treino_id       BIGINT       REFERENCES public.treinos(id) ON DELETE SET NULL,
  exercicio_id    BIGINT       REFERENCES public.exercicios(id) ON DELETE SET NULL,
  exercicio_nome  TEXT,
  carga           NUMERIC(6,2) DEFAULT 0,
  reps            SMALLINT     DEFAULT 0,
  series          SMALLINT     DEFAULT 0,
  data            DATE         NOT NULL DEFAULT CURRENT_DATE,
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ÍNDICES
CREATE INDEX IF NOT EXISTS idx_treinos_aluno     ON public.treinos (aluno_id) WHERE status='ativo';
CREATE INDEX IF NOT EXISTS idx_treinos_treinador ON public.treinos (treinador_id);
CREATE INDEX IF NOT EXISTS idx_te_treino         ON public.treino_exercicios (treino_id, ordem);
CREATE INDEX IF NOT EXISTS idx_hist_user_data    ON public.historico_treino (user_id, data DESC);
CREATE INDEX IF NOT EXISTS idx_hist_exercicio    ON public.historico_treino (user_id, exercicio_id);
CREATE INDEX IF NOT EXISTS idx_medidas_user      ON public.medidas (user_id, data DESC);
CREATE INDEX IF NOT EXISTS idx_ta_treinador      ON public.treinador_aluno (treinador_id) WHERE ativo=true;
CREATE INDEX IF NOT EXISTS idx_exercicios_grupo  ON public.exercicios (grupo_muscular) WHERE ativo=true;

-- RLS
ALTER TABLE public.profiles              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alunos_detalhes       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medidas               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercicios            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.treinador_aluno       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.treinos               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.treino_exercicios     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.observacoes_treinador ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.historico_treino      ENABLE ROW LEVEL SECURITY;

-- POLICIES: profiles
CREATE POLICY "profiles_own"           ON public.profiles FOR SELECT USING (auth.uid()=id);
CREATE POLICY "profiles_trainer_reads" ON public.profiles FOR SELECT USING (EXISTS(SELECT 1 FROM public.treinador_aluno ta WHERE ta.treinador_id=auth.uid() AND ta.aluno_id=profiles.id AND ta.ativo=true));
CREATE POLICY "profiles_insert"        ON public.profiles FOR INSERT WITH CHECK (auth.uid()=id);
CREATE POLICY "profiles_update"        ON public.profiles FOR UPDATE USING (auth.uid()=id);

-- POLICIES: alunos_detalhes
CREATE POLICY "ad_own"            ON public.alunos_detalhes FOR ALL    USING (auth.uid()=user_id) WITH CHECK (auth.uid()=user_id);
CREATE POLICY "ad_trainer_reads"  ON public.alunos_detalhes FOR SELECT USING (EXISTS(SELECT 1 FROM public.treinador_aluno ta WHERE ta.treinador_id=auth.uid() AND ta.aluno_id=alunos_detalhes.user_id AND ta.ativo=true));

-- POLICIES: medidas
CREATE POLICY "medidas_own"           ON public.medidas FOR ALL    USING (auth.uid()=user_id) WITH CHECK (auth.uid()=user_id);
CREATE POLICY "medidas_trainer_reads" ON public.medidas FOR SELECT USING (EXISTS(SELECT 1 FROM public.treinador_aluno ta WHERE ta.treinador_id=auth.uid() AND ta.aluno_id=medidas.user_id AND ta.ativo=true));

-- POLICIES: exercicios (leitura para todos autenticados)
CREATE POLICY "exercicios_read" ON public.exercicios FOR SELECT USING (auth.uid() IS NOT NULL);

-- POLICIES: treinador_aluno
CREATE POLICY "ta_trainer" ON public.treinador_aluno FOR ALL    USING (auth.uid()=treinador_id) WITH CHECK (auth.uid()=treinador_id);
CREATE POLICY "ta_aluno"   ON public.treinador_aluno FOR SELECT USING (auth.uid()=aluno_id);

-- POLICIES: treinos
CREATE POLICY "treinos_trainer"      ON public.treinos FOR ALL    USING (auth.uid()=treinador_id) WITH CHECK (auth.uid()=treinador_id);
CREATE POLICY "treinos_aluno_reads"  ON public.treinos FOR SELECT USING (auth.uid()=aluno_id);

-- POLICIES: treino_exercicios
CREATE POLICY "te_trainer" ON public.treino_exercicios FOR ALL    USING (EXISTS(SELECT 1 FROM public.treinos t WHERE t.id=treino_exercicios.treino_id AND t.treinador_id=auth.uid()));
CREATE POLICY "te_aluno"   ON public.treino_exercicios FOR SELECT USING (EXISTS(SELECT 1 FROM public.treinos t WHERE t.id=treino_exercicios.treino_id AND t.aluno_id=auth.uid()));

-- POLICIES: observacoes
CREATE POLICY "obs_trainer" ON public.observacoes_treinador FOR ALL    USING (auth.uid()=treinador_id) WITH CHECK (auth.uid()=treinador_id);
CREATE POLICY "obs_aluno"   ON public.observacoes_treinador FOR SELECT USING (auth.uid()=aluno_id);

-- POLICIES: historico
CREATE POLICY "hist_own"           ON public.historico_treino FOR ALL    USING (auth.uid()=user_id) WITH CHECK (auth.uid()=user_id);
CREATE POLICY "hist_trainer_reads" ON public.historico_treino FOR SELECT USING (EXISTS(SELECT 1 FROM public.treinador_aluno ta WHERE ta.treinador_id=auth.uid() AND ta.aluno_id=historico_treino.user_id AND ta.ativo=true));

-- TRIGGER: auto-criar profile no signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_role user_role;
BEGIN
  BEGIN v_role := (NEW.raw_user_meta_data->>'role')::user_role;
  EXCEPTION WHEN OTHERS THEN v_role := 'aluno'; END;
  INSERT INTO public.profiles (id, nome, email, role) VALUES (
    NEW.id,
    COALESCE(NULLIF(NEW.raw_user_meta_data->>'nome',''), split_part(NEW.email,'@',1)),
    NEW.email,
    COALESCE(v_role, 'aluno')
  ) ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- TRIGGER: updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at() RETURNS TRIGGER LANGUAGE plpgsql AS $$ BEGIN NEW.updated_at=NOW(); RETURN NEW; END; $$;
CREATE TRIGGER trg_profiles_upd  BEFORE UPDATE ON public.profiles         FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_ad_upd        BEFORE UPDATE ON public.alunos_detalhes  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_treinos_upd   BEFORE UPDATE ON public.treinos          FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =================================================================
-- SEED: BIBLIOTECA DE EXERCÍCIOS (80+ exercícios)
-- =================================================================
INSERT INTO public.exercicios (nome, grupo_muscular, tipo, execucao, equipamento) VALUES
-- PEITO
('Supino Reto com Barra',        'Peito','livre',   'Retrai as escápulas, desça a barra até o peito em 2s, empurre explosivamente. Cotovelos a 75°.',           'Banco plano, barra, anilhas'),
('Supino Reto com Halteres',     'Peito','livre',   'Cotovelos a 45°. Desça controlado até sentir o alongamento e empurre até a extensão completa.',            'Banco plano, halteres'),
('Supino Inclinado com Barra',   'Peito','livre',   'Banco a 30-45°. Foco no peitoral superior. Não arqueie excessivamente a lombar.',                          'Banco inclinado, barra'),
('Supino Inclinado com Halteres','Peito','livre',   'Banco a 30-45°. Desça com cotovelos abertos, empurre convergindo os halteres. Maior amplitude.',           'Banco inclinado, halteres'),
('Supino Declinado com Barra',   'Peito','livre',   'Banco declinado. Foco no peitoral inferior. Use trava de segurança nos pés.',                              'Banco declinado, barra'),
('Crucifixo com Halteres',       'Peito','livre',   'Cotovelos levemente flexionados. Abra em arco, sinta o alongamento, retorne contraindo.',                  'Banco plano, halteres'),
('Fly na Máquina (Peck Deck)',   'Peito','maquina', 'Costas retas, aproxime os braços na frente. Espreme o peitoral no ponto de contração. Excêntrico lento.',  'Máquina Peck Deck'),
('Crossover no Cabo (alto)',     'Peito','maquina', 'Puxos das polias altas em direção ao umbigo. Tensão constante. Enfatiza peitoral inferior.',               'Polia dupla'),
('Crossover no Cabo (baixo)',    'Peito','maquina', 'Puxos das polias baixas em direção ao esterno. Enfatiza peitoral superior.',                               'Polia dupla'),
('Flexão de Braço',              'Peito','funcional','Mãos na largura dos ombros, corpo reto. Desça o peito até quase tocar o chão.',                           'Sem equipamento'),
('Pullover com Halter',          'Peito','livre',   'Deitado transversalmente no banco, abaixe o halter atrás da cabeça em arco. Trabalha peito e dorsal.',     'Banco plano, halter'),
-- COSTAS
('Puxada Frontal (Lat Pulldown)','Costas','maquina','Pegada pronada larga. Puxe até o queixo retraindo as escápulas. Não balance o tronco.',                    'Máquina de puxada'),
('Barra Fixa Pronada (Pull-up)', 'Costas','funcional','Pegada larga. Puxe até o queixo acima da barra. Desça controlado. O melhor para dorsais.',               'Barra de pull-up'),
('Barra Fixa Supinada (Chin-up)','Costas','funcional','Pegada supinada. Maior ativação de bíceps. Ótimo para quem está progredindo para pull-up.',              'Barra de pull-up'),
('Remada Curvada com Barra',     'Costas','livre',  'Tronco a 45°, costas retas. Puxe até o abdômen retraindo as escápulas. Core ativado.',                    'Barra, anilhas'),
('Remada Unilateral com Halter', 'Costas','livre',  'Apoio de joelho e mão no banco. Puxe o halter até o quadril, cotovelo alto. Corrija assimetrias.',         'Banco, halter'),
('Remada no Cabo Baixo',         'Costas','maquina','Sente com costas retas, puxe o triângulo até o abdômen. Retração total das escápulas no fim.',             'Cabo baixo, triângulo'),
('Remada Cavalinho (T-bar)',      'Costas','livre',  'Inclinado na máquina. Puxe ao abdômen. Grande ativação de trapézio e romboides.',                         'Máquina T-bar'),
('Terra Convencional (Deadlift)','Costas','livre',  'Pés na largura dos quadris. Quadril baixo, costas retas. Empurre o chão ao subir.',                        'Barra, anilhas'),
('Terra Romeno',                 'Costas','livre',  'Joelhos levemente flexionados. Desça a barra deslizando pelas coxas. Foco em ísquios e glúteos.',          'Barra ou halteres'),
('Pulldown com Triângulo',       'Costas','maquina','Pegada neutra. Puxe até o peito com cotovelos para baixo e para trás.',                                    'Cabo alto, triângulo'),
-- PERNAS
('Agachamento Livre',            'Pernas','livre',  'Pés na largura dos ombros. Desça até abaixo do paralelo. Costas retas, core ativado.',                     'Barra, rack'),
('Agachamento Hack',             'Pernas','maquina','Costas na plataforma. Desça até 90°. Menos carga na lombar vs livre.',                                     'Máquina Hack Squat'),
('Leg Press 45°',                'Pernas','maquina','Pés na largura dos quadris. Desça até 90° sem arrancar o glúteo do banco.',                                'Máquina Leg Press 45°'),
('Leg Press Horizontal',         'Pernas','maquina','Similar ao 45°. Pés altos = mais glúteo. Pés baixos = mais quadríceps.',                                   'Máquina Leg Press horizontal'),
('Cadeira Extensora',            'Pernas','maquina','Estenda completamente o joelho, segure 1s no topo. Isolamento de quadríceps. Use após compostos.',          'Cadeira extensora'),
('Mesa Flexora Deitada',         'Pernas','maquina','Deite de bruços. Contraia os ísquios trazendo os calcanhares ao glúteo. Pausa no topo.',                   'Mesa flexora deitada'),
('Mesa Flexora Sentada',         'Pernas','maquina','Ísquios em posição alongada = maior ativação. Melhor para hipertrofia vs deitada.',                        'Mesa flexora sentada'),
('Afundo com Halteres',          'Pernas','livre',  'Passo largo, desça até o joelho traseiro quase tocar o chão. Alterne as pernas.',                          'Halteres'),
('Afundo Búlgaro',               'Pernas','livre',  'Pé traseiro no banco. Desça até coxa paralela. Tronco inclinado = mais glúteo.',                           'Banco, halteres'),
('Panturrilha em Pé',            'Pernas','maquina','Amplitude completa. Calcanhar abaixo da plataforma. Pausa de 1s no topo. Ritmo 1-1-2.',                    'Máquina panturrilha'),
('Panturrilha Sentada',          'Pernas','maquina','Joelho a 90°. Trabalha sóleo (joelho flexionado). Complementa a panturrilha em pé.',                       'Máquina panturrilha sentada'),
-- GLÚTEOS
('Hip Thrust com Barra',         'Glúteos','livre', 'Espaldar no banco, barra sobre o quadril. Empurre para cima, pausa de 1-2s, contraia glúteos.',            'Banco, barra, amortecedor'),
('Hip Thrust na Máquina',        'Glúteos','maquina','Mesmo movimento. Mais seguro para iniciantes. Ótimo para alto volume.',                                   'Máquina Hip Thrust'),
('Coice na Polia',               'Glúteos','maquina','De quatro apoios. Empurre a perna para trás e para cima. Não arquear a lombar.',                          'Polia baixa, acessório'),
('Abdução na Máquina',           'Glúteos','maquina','Pernas unidas, empurre lateralmente. Movimento lento. Essencial para glúteo médio.',                      'Máquina abdução'),
('Agachamento Sumô',             'Glúteos','livre', 'Pés bem abertos. Maior ênfase em adutores e glúteos. Ponteiras voltadas para fora.',                       'Barra ou halter'),
('Step-up com Halter',           'Glúteos','livre', 'Suba no banco com um pé, empurre com o calcanhar. Excelente para assimetrias.',                            'Banco, halteres'),
('Abdução na Polia (em pé)',     'Glúteos','maquina','Polia baixa, tornozelo preso. Afaste a perna lateralmente sem inclinar o tronco.',                        'Polia baixa, acessório'),
('Elevação Pélvica no Chão',     'Glúteos','funcional','Deitado. Eleve o quadril contraindo glúteos. Versão acessível. Pode usar elástico.',                   'Elástico (opcional)'),
-- OMBRO
('Desenvolvimento com Barra',    'Ombro','livre',   'Empurre acima da cabeça até extensão completa. Não arqueie a lombar.',                                     'Barra, rack'),
('Desenvolvimento com Halteres', 'Ombro','livre',   'Halteres alinhados às orelhas. Empurre acima convergindo. Maior amplitude que barra.',                     'Banco com encosto, halteres'),
('Desenvolvimento na Máquina',   'Ombro','maquina', 'Sente e ajuste o assento. Mais seguro para a articulação. Cotovelos a 90° no início.',                     'Máquina desenvolvimento'),
('Elevação Lateral com Halteres','Ombro','livre',   '5-10° à frente do plano do corpo. Até a altura dos ombros. Controle a descida em 2-3s.',                   'Halteres'),
('Elevação Lateral na Polia',    'Ombro','maquina', 'Tensão constante ao longo do movimento. Polia baixa do lado oposto.',                                      'Polia baixa'),
('Elevação Frontal com Barra',   'Ombro','livre',   'Pegada pronada. Levante até a altura dos ombros. Trabalha deltoide anterior.',                             'Barra ou halteres'),
('Crucifixo Invertido',          'Ombro','livre',   'Inclinado. Levante os halteres para trás. Deltoide posterior e romboides. Essencial para postura.',        'Halteres ou cabos'),
('Face Pull',                    'Ombro','maquina', 'Polia alta, corda. Puxe até o rosto abrindo os cotovelos. Fundamental para saúde do ombro.',               'Polia alta, corda'),
('Encolhimento de Ombros',       'Ombro','livre',   'Eleve os ombros em direção às orelhas. Pausa no topo. Não gire os ombros. Trapézio superior.',             'Barra ou halteres'),
('Arnold Press',                 'Ombro','livre',   'Comece com palmas voltadas para você. Pressione girando as palmas para fora. Trabalha todas as cabeças.',  'Banco com encosto, halteres'),
-- BÍCEPS
('Rosca Direta com Barra',       'Bíceps','livre',  'Cotovelos fixos ao lado do corpo. Suba contraindo, desça até o alongamento completo.',                     'Barra reta ou EZ'),
('Rosca Alternada com Halteres', 'Bíceps','livre',  'Alterne os braços, supine o antebraço ao subir. Permite maior amplitude que a barra.',                     'Halteres'),
('Rosca Scott',                  'Bíceps','maquina','Cotovelos no banco inclinado. Maior ativação da cabeça curta. Não estenda totalmente no fundo.',            'Banco Scott, barra EZ'),
('Rosca Concentrada',            'Bíceps','livre',  'Cotovelo na coxa interna. Isolamento máximo. Use após compostos.',                                          'Halter, banco'),
('Rosca Martelo',                'Bíceps','livre',  'Pegada neutra. Trabalha braquiorradial e bíceps. Permite cargas maiores.',                                  'Halteres'),
('Rosca no Cabo',                'Bíceps','maquina','Tensão constante — vantagem sobre halteres. Cotovelos fixos.',                                              'Polia baixa, barra EZ'),
('Rosca 21s',                    'Bíceps','livre',  '7 reps inferiores + 7 superiores + 7 completas. Alta intensidade. Carga ~40% abaixo do normal.',            'Barra reta ou EZ'),
('Rosca Inclinada',              'Bíceps','livre',  'Banco inclinado a 45°. Pré-estira o bíceps. Grande amplitude. Movimento lento.',                           'Banco inclinado, halteres'),
-- TRÍCEPS
('Tríceps Testa com Barra EZ',   'Tríceps','livre', 'Barra desce em direção à testa dobrando os cotovelos. Os cotovelos não se movem. Cabeça longa.',           'Banco plano, barra EZ'),
('Tríceps Testa com Halteres',   'Tríceps','livre', 'Maior liberdade de movimento. Corrija assimetrias. Leve além da cabeça para mais amplitude.',              'Banco plano, halteres'),
('Tríceps na Polia (corda)',      'Tríceps','maquina','No final, abra as pontas para fora. Ativa cabeça lateral. Cotovelos fixos ao lado do corpo.',             'Polia alta, corda'),
('Tríceps na Polia (barra reta)', 'Tríceps','maquina','Empurre para baixo até extensão completa. Controle a subida. Alta tensão constante.',                    'Polia alta, barra reta'),
('Dips (Mergulho)',               'Tríceps','funcional','Nas paralelas. Tronco ereto = mais tríceps. Inclinado = mais peito. Cotovelos a 90° na descida.',       'Paralelas ou banco'),
('Tríceps Coice',                 'Tríceps','livre', 'Inclinado, cotovelo dobrado. Estenda completamente para trás. Cabeça lateral. Cargas baixas.',             'Halter'),
('Supino Fechado',                'Tríceps','livre', 'Pegada estreita (25-30cm). O composto mais eficiente para tríceps.',                                       'Barra, banco plano'),
('Tríceps Francês',               'Tríceps','livre', 'Acima da cabeça. Dobre os cotovelos abaixando atrás da cabeça. Máximo alongamento da cabeça longa.',      'Halter ou barra EZ'),
-- CORE
('Prancha Isométrica',           'Core','funcional', 'Corpo reto do calcanhar à cabeça. Contraia abdômen, glúteos e quadríceps. Respire normalmente.',           'Sem equipamento'),
('Abdominal Crunch',             'Core','funcional', 'Eleve apenas as escápulas. Não puxe o pescoço. Pequena amplitude com contração intensa.',                  'Sem equipamento'),
('Abdominal Oblíquo',            'Core','funcional', 'Crunch com rotação. Leve o cotovelo ao joelho oposto. Trabalha oblíquos.',                                 'Sem equipamento'),
('Elevação de Pernas',           'Core','funcional', 'Deitado, eleve até 90°. Controle a descida. Trabalha reto abdominal inferior.',                            'Sem equipamento ou barra'),
('Russian Twist',                'Core','funcional', 'Tronco inclinado a 45°, pés elevados. Rotacione de lado a lado. Com peso aumenta dificuldade.',            'Disco ou medicine ball'),
('Abdominal com Roda',           'Core','funcional', 'Empurre a roda à frente quase estendendo o tronco, retorne contraindo. Exercício avançado.',               'Roda abdominal'),
('Dead Bug',                     'Core','funcional', 'Abaixe braço e perna opostos mantendo lombar colada ao chão. Estabilidade lombar.',                        'Sem equipamento'),
('Prancha Lateral',              'Core','funcional', 'Apoio no antebraço lateral. Corpo em linha reta. Oblíquos e quadrado lombar.',                             'Sem equipamento'),
('Flexão Lateral com Halter',    'Core','funcional', 'Incline lateralmente. Oblíquos e quadrado lombar. Cargas moderadas.',                                      'Halter'),
('Vacum Abdominal',              'Core','funcional', 'Expire todo o ar e puxe o umbigo para a coluna. Segure 10-20s. Transverso abdominal.',                     'Sem equipamento')

ON CONFLICT DO NOTHING;

-- VIEWS ANALÍTICAS
CREATE OR REPLACE VIEW public.v_prs AS
SELECT user_id, exercicio_id, exercicio_nome, MAX(carga) AS carga_max, COUNT(*) AS total_sessoes, MAX(data) AS ultimo_registro
FROM public.historico_treino WHERE carga > 0 GROUP BY user_id, exercicio_id, exercicio_nome;

CREATE OR REPLACE VIEW public.v_frequencia_semanal AS
SELECT user_id, DATE_TRUNC('week', data)::DATE AS semana, COUNT(DISTINCT treino_id) AS sessoes
FROM public.historico_treino GROUP BY user_id, DATE_TRUNC('week',data)::DATE ORDER BY semana DESC;
