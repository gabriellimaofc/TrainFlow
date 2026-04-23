-- =================================================================
-- TrainFlow - schema.sql
-- -----------------------------------------------------------------
-- Estrutura principal do banco com foco em:
-- 1) compatibilidade com a SPA atual
-- 2) segurança para ambientes já existentes
-- 3) biblioteca de exercícios mais rica para aluno e treinador
-- =================================================================

-- ================================================================
-- EXTENSOES
-- ================================================================
create extension if not exists "uuid-ossp";

-- ================================================================
-- TIPOS ENUM
-- ================================================================
do $$ begin
  create type user_role as enum ('aluno', 'treinador');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type plan_type as enum ('free', 'premium');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type goal_type as enum (
    'emagrecimento',
    'hipertrofia',
    'definicao',
    'saude',
    'performance',
    'reabilitacao'
  );
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type exercise_type as enum ('livre', 'maquina', 'funcional', 'cardio');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type muscle_group as enum (
    'Peito',
    'Costas',
    'Pernas',
    'Glúteos',
    'Ombro',
    'Bíceps',
    'Tríceps',
    'Core',
    'Cardio'
  );
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type workout_status as enum ('ativo', 'inativo', 'arquivado');
exception
  when duplicate_object then null;
end $$;

-- ================================================================
-- TABELA: PROFILES
-- ================================================================
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  nome        text not null default '',
  email       text not null default '',
  role        user_role not null default 'aluno',
  plan_type   plan_type not null default 'free',
  avatar_url  text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists idx_profiles_email on public.profiles (email);
create index if not exists idx_profiles_role on public.profiles (role);
create index if not exists idx_profiles_plan on public.profiles (plan_type);

-- ================================================================
-- TABELA: ALUNOS_DETALHES
-- ================================================================
create table if not exists public.alunos_detalhes (
  id           bigserial primary key,
  user_id      uuid not null unique references public.profiles(id) on delete cascade,
  idade        smallint check (idade between 10 and 120),
  peso         numeric(5,2) check (peso between 20 and 400),
  altura       smallint check (altura between 100 and 250),
  sexo         text check (sexo in ('M','F','NB','ND')),
  objetivo     goal_type,
  observacoes  text,
  updated_at   timestamptz not null default now()
);

create index if not exists idx_alunos_detalhes_user_id on public.alunos_detalhes (user_id);

-- ================================================================
-- TABELA: MEDIDAS
-- ================================================================
create table if not exists public.medidas (
  id            bigserial primary key,
  user_id       uuid not null references public.profiles(id) on delete cascade,
  data          date not null default current_date,
  braco_d       numeric(5,1),
  braco_e       numeric(5,1),
  antebraco     numeric(5,1),
  peito         numeric(5,1),
  cintura       numeric(5,1),
  quadril       numeric(5,1),
  coxa_d        numeric(5,1),
  coxa_e        numeric(5,1),
  panturrilha   numeric(5,1),
  ombro         numeric(5,1),
  peso_data     numeric(5,2),
  notas         text,
  created_at    timestamptz not null default now()
);

create index if not exists idx_medidas_user_data
  on public.medidas (user_id, data desc);

-- ================================================================
-- TABELA: EXERCICIOS
-- ----------------------------------------------------------------
-- Novos campos:
-- - video_url
-- - observacao_cientifica
-- Mantem compatibilidade com a estrutura ja usada pelo app.
-- ================================================================
create table if not exists public.exercicios (
  id                     bigserial primary key,
  nome                   text not null,
  grupo_muscular         muscle_group not null,
  tipo                   exercise_type not null default 'livre',
  execucao               text,
  equipamento            text,
  video_url              text,
  observacao_cientifica  text,
  ativo                  boolean not null default true,
  created_at             timestamptz not null default now()
);

alter table public.exercicios add column if not exists execucao text;
alter table public.exercicios add column if not exists equipamento text;
alter table public.exercicios add column if not exists video_url text;
alter table public.exercicios add column if not exists observacao_cientifica text;
alter table public.exercicios add column if not exists ativo boolean not null default true;
alter table public.exercicios add column if not exists created_at timestamptz not null default now();

create index if not exists idx_exercicios_grupo_ativo
  on public.exercicios (grupo_muscular)
  where ativo = true;

create index if not exists idx_exercicios_nome
  on public.exercicios (nome);

-- ================================================================
-- TABELA: TREINADOR_ALUNO
-- ================================================================
create table if not exists public.treinador_aluno (
  id            bigserial primary key,
  treinador_id  uuid not null references public.profiles(id) on delete cascade,
  aluno_id      uuid not null references public.profiles(id) on delete cascade,
  ativo         boolean not null default true,
  created_at    timestamptz not null default now(),
  unique (treinador_id, aluno_id)
);

create index if not exists idx_ta_treinador_ativo
  on public.treinador_aluno (treinador_id)
  where ativo = true;

create index if not exists idx_ta_aluno_ativo
  on public.treinador_aluno (aluno_id)
  where ativo = true;

-- ================================================================
-- TABELA: TREINOS
-- ================================================================
create table if not exists public.treinos (
  id            bigserial primary key,
  treinador_id  uuid not null references public.profiles(id) on delete cascade,
  aluno_id      uuid not null references public.profiles(id) on delete cascade,
  nome          text not null,
  descricao     text,
  status        workout_status not null default 'ativo',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists idx_treinos_aluno_status
  on public.treinos (aluno_id)
  where status = 'ativo';

create index if not exists idx_treinos_treinador
  on public.treinos (treinador_id);

-- ================================================================
-- TABELA: TREINO_EXERCICIOS
-- ================================================================
create table if not exists public.treino_exercicios (
  id            bigserial primary key,
  treino_id     bigint not null references public.treinos(id) on delete cascade,
  exercicio_id  bigint not null references public.exercicios(id) on delete restrict,
  dia_semana    text,
  bloco_nome    text,
  series        smallint not null default 3,
  repeticoes    text not null default '10-12',
  descanso      text not null default '60s',
  rpe           text,
  observacoes   text,
  ordem         smallint not null default 0,
  created_at    timestamptz not null default now()
);

create index if not exists idx_treino_exercicios_treino_ordem
  on public.treino_exercicios (treino_id, ordem);

alter table public.treino_exercicios add column if not exists dia_semana text;
alter table public.treino_exercicios add column if not exists bloco_nome text;

-- ================================================================
-- TABELA: OBSERVACOES_TREINADOR
-- ================================================================
create table if not exists public.observacoes_treinador (
  id            bigserial primary key,
  treinador_id  uuid not null references public.profiles(id) on delete cascade,
  aluno_id      uuid not null references public.profiles(id) on delete cascade,
  conteudo      text not null,
  created_at    timestamptz not null default now()
);

create index if not exists idx_observacoes_aluno
  on public.observacoes_treinador (aluno_id, created_at desc);

-- ================================================================
-- TABELA: HISTORICO_TREINO
-- ================================================================
create table if not exists public.historico_treino (
  id              bigserial primary key,
  user_id         uuid not null references public.profiles(id) on delete cascade,
  treino_id       bigint references public.treinos(id) on delete set null,
  exercicio_id    bigint references public.exercicios(id) on delete set null,
  exercicio_nome  text,
  dia_semana      text,
  bloco_nome      text,
  carga           numeric(6,2) default 0,
  reps            smallint default 0,
  series          smallint default 0,
  data            date not null default current_date,
  created_at      timestamptz not null default now()
);

create index if not exists idx_hist_user_data
  on public.historico_treino (user_id, data desc);

create index if not exists idx_hist_user_exercicio
  on public.historico_treino (user_id, exercicio_id);

alter table public.historico_treino add column if not exists dia_semana text;
alter table public.historico_treino add column if not exists bloco_nome text;

-- ================================================================
-- RLS
-- ================================================================
alter table public.profiles              enable row level security;
alter table public.alunos_detalhes       enable row level security;
alter table public.medidas               enable row level security;
alter table public.exercicios            enable row level security;
alter table public.treinador_aluno       enable row level security;
alter table public.treinos               enable row level security;
alter table public.treino_exercicios     enable row level security;
alter table public.observacoes_treinador enable row level security;
alter table public.historico_treino      enable row level security;

-- ================================================================
-- POLICIES: PROFILES
-- ================================================================
drop policy if exists "profiles_own" on public.profiles;
create policy "profiles_own"
on public.profiles
for select
using (auth.uid() = id);

drop policy if exists "profiles_trainer_reads" on public.profiles;
create policy "profiles_trainer_reads"
on public.profiles
for select
using (
  exists (
    select 1
    from public.treinador_aluno ta
    where ta.treinador_id = auth.uid()
      and ta.aluno_id = profiles.id
      and ta.ativo = true
  )
);

drop policy if exists "profiles_auth_reads_for_linking" on public.profiles;
create policy "profiles_auth_reads_for_linking"
on public.profiles
for select
using (auth.uid() is not null);

drop policy if exists "profiles_insert" on public.profiles;
create policy "profiles_insert"
on public.profiles
for insert
with check (auth.uid() = id);

drop policy if exists "profiles_update" on public.profiles;
create policy "profiles_update"
on public.profiles
for update
using (auth.uid() = id);

-- ================================================================
-- POLICIES: ALUNOS_DETALHES
-- ================================================================
drop policy if exists "ad_own" on public.alunos_detalhes;
create policy "ad_own"
on public.alunos_detalhes
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "ad_trainer_reads" on public.alunos_detalhes;
create policy "ad_trainer_reads"
on public.alunos_detalhes
for select
using (
  exists (
    select 1
    from public.treinador_aluno ta
    where ta.treinador_id = auth.uid()
      and ta.aluno_id = alunos_detalhes.user_id
      and ta.ativo = true
  )
);

-- ================================================================
-- POLICIES: MEDIDAS
-- ================================================================
drop policy if exists "medidas_own" on public.medidas;
create policy "medidas_own"
on public.medidas
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "medidas_trainer_reads" on public.medidas;
create policy "medidas_trainer_reads"
on public.medidas
for select
using (
  exists (
    select 1
    from public.treinador_aluno ta
    where ta.treinador_id = auth.uid()
      and ta.aluno_id = medidas.user_id
      and ta.ativo = true
  )
);

-- ================================================================
-- POLICIES: EXERCICIOS
-- ================================================================
drop policy if exists "exercicios_read" on public.exercicios;
create policy "exercicios_read"
on public.exercicios
for select
using (auth.uid() is not null);

-- ================================================================
-- POLICIES: TREINADOR_ALUNO
-- ================================================================
drop policy if exists "ta_trainer" on public.treinador_aluno;
create policy "ta_trainer"
on public.treinador_aluno
for all
using (auth.uid() = treinador_id)
with check (auth.uid() = treinador_id);

drop policy if exists "ta_aluno" on public.treinador_aluno;
create policy "ta_aluno"
on public.treinador_aluno
for select
using (auth.uid() = aluno_id);

-- ================================================================
-- POLICIES: TREINOS
-- ================================================================
drop policy if exists "treinos_trainer" on public.treinos;
create policy "treinos_trainer"
on public.treinos
for all
using (auth.uid() = treinador_id)
with check (auth.uid() = treinador_id);

drop policy if exists "treinos_aluno_reads" on public.treinos;
create policy "treinos_aluno_reads"
on public.treinos
for select
using (auth.uid() = aluno_id);

-- ================================================================
-- POLICIES: TREINO_EXERCICIOS
-- ================================================================
drop policy if exists "te_trainer" on public.treino_exercicios;
create policy "te_trainer"
on public.treino_exercicios
for all
using (
  exists (
    select 1
    from public.treinos t
    where t.id = treino_exercicios.treino_id
      and t.treinador_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.treinos t
    where t.id = treino_exercicios.treino_id
      and t.treinador_id = auth.uid()
  )
);

drop policy if exists "te_aluno" on public.treino_exercicios;
create policy "te_aluno"
on public.treino_exercicios
for select
using (
  exists (
    select 1
    from public.treinos t
    where t.id = treino_exercicios.treino_id
      and t.aluno_id = auth.uid()
  )
);

-- ================================================================
-- POLICIES: OBSERVACOES
-- ================================================================
drop policy if exists "obs_trainer" on public.observacoes_treinador;
create policy "obs_trainer"
on public.observacoes_treinador
for all
using (auth.uid() = treinador_id)
with check (auth.uid() = treinador_id);

drop policy if exists "obs_aluno" on public.observacoes_treinador;
create policy "obs_aluno"
on public.observacoes_treinador
for select
using (auth.uid() = aluno_id);

-- ================================================================
-- POLICIES: HISTORICO
-- ================================================================
drop policy if exists "hist_own" on public.historico_treino;
create policy "hist_own"
on public.historico_treino
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "hist_trainer_reads" on public.historico_treino;
create policy "hist_trainer_reads"
on public.historico_treino
for select
using (
  exists (
    select 1
    from public.treinador_aluno ta
    where ta.treinador_id = auth.uid()
      and ta.aluno_id = historico_treino.user_id
      and ta.ativo = true
  )
);

-- ================================================================
-- TRIGGERS AUXILIARES
-- ================================================================
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_profiles_upd on public.profiles;
create trigger trg_profiles_upd
before update on public.profiles
for each row
execute function public.set_updated_at();

drop trigger if exists trg_alunos_detalhes_upd on public.alunos_detalhes;
create trigger trg_alunos_detalhes_upd
before update on public.alunos_detalhes
for each row
execute function public.set_updated_at();

drop trigger if exists trg_treinos_upd on public.treinos;
create trigger trg_treinos_upd
before update on public.treinos
for each row
execute function public.set_updated_at();

-- ================================================================
-- TRIGGER: AUTO-CRIAR PROFILE NO SIGNUP
-- ================================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role user_role;
begin
  begin
    v_role := (new.raw_user_meta_data->>'role')::user_role;
  exception
    when others then
      v_role := 'aluno';
  end;

  insert into public.profiles (
    id,
    nome,
    email,
    role,
    plan_type
  )
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data->>'nome', ''), split_part(new.email, '@', 1)),
    lower(new.email),
    coalesce(v_role, 'aluno'),
    'free'
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user();

-- ================================================================
-- SEED: BIBLIOTECA DE EXERCICIOS
-- ----------------------------------------------------------------
-- Estrutura idempotente:
-- - aproveita nomes padronizados
-- - nao duplica se ja existir um nome equivalente
-- - adiciona observacoes e videos quando disponiveis
-- ================================================================
with seed_exercicios (
  nome,
  grupo_muscular,
  tipo,
  execucao,
  equipamento,
  observacao_cientifica,
  video_url
) as (
  values
    ('Hip Thrust', 'Glúteos', 'livre', 'Apoie bem as escápulas no banco, mantenha o queixo recolhido e finalize com retroversão pélvica leve, sem hiperestender a lombar.', 'Banco, barra, anilhas', 'Excelente para alta tensão em glúteos com boa estabilidade. Pausas no pico costumam aumentar percepção de contração sem exigir tantas cargas extras.', 'https://www.youtube.com/results?search_query=hip+thrust+execucao+certa'),
    ('Hip Thrust com Pausa', 'Glúteos', 'livre', 'Segure 1–2 segundos no topo, empurre pelos calcanhares e desça sem perder controle da pelve.', 'Banco, barra, anilhas', 'A pausa no topo eleva tempo sob tensão na posição de maior encurtamento e reduz o impulso mecânico entre repetições.', 'https://www.youtube.com/results?search_query=hip+thrust+com+pausa+execucao'),
    ('Hip Thrust Moderado', 'Glúteos', 'livre', 'Use carga moderada, reps controladas e foque em ritmo estável do início ao fim da série.', 'Banco, barra, anilhas', 'Versões moderadas ajudam a acumular volume útil com menor custo articular, especialmente em semanas mais carregadas.', 'https://www.youtube.com/results?search_query=hip+thrust+execucao+certa'),
    ('Stiff / Terra Romeno', 'Pernas', 'livre', 'Desça empurrando o quadril para trás, mantenha a barra próxima ao corpo e preserve a coluna neutra durante toda a amplitude.', 'Barra, anilhas', 'Padrão dominante de quadril muito eficiente para posteriores quando a descida é controlada e a amplitude respeita mobilidade individual.', 'https://www.youtube.com/results?search_query=stiff+terra+romeno+execucao'),
    ('Levantamento Terra Convencional', 'Pernas', 'livre', 'Crie pressão no tronco, aproxime a barra da canela e inicie o movimento empurrando o chão, sem perder rigidez axial.', 'Barra, anilhas', 'Exercício de alta demanda sistêmica. Costuma exigir mais descanso e melhor gestão de fadiga dentro da semana.', 'https://www.youtube.com/results?search_query=levantamento+terra+convencional+execucao'),
    ('Mesa Flexora Sentada', 'Pernas', 'maquina', 'Ajuste o encosto, mantenha quadril estável e flexione os joelhos sem tirar o quadril do assento.', 'Mesa flexora sentada', 'A posição sentada tende a colocar posteriores em maior alongamento no quadril, o que pode favorecer estímulo mecânico.', 'https://www.youtube.com/results?search_query=mesa+flexora+sentada+execucao'),
    ('Mesa Flexora', 'Pernas', 'maquina', 'Flexione os joelhos com ritmo controlado e evite tirar o quadril do apoio no final das reps.', 'Mesa flexora', 'Boa opção para complementar padrões de quadril com estímulo mais localizado em flexão de joelhos.', 'https://www.youtube.com/results?search_query=mesa+flexora+execucao'),
    ('Mesa Flexora Leve', 'Pernas', 'maquina', 'Use carga confortável, tempo controlado e amplitude limpa para acumular volume com baixa fadiga.', 'Mesa flexora', 'Versões leves funcionam bem para recuperação ativa, acabamento ou semanas com ênfase maior em compostos.', 'https://www.youtube.com/results?search_query=mesa+flexora+execucao'),
    ('Agachamento Búlgaro', 'Pernas', 'livre', 'Desça em linha reta, mantenha o tronco firme e distribua a carga principalmente na perna da frente.', 'Banco, halteres', 'Unilateral valioso para estabilidade, glúteos e quadríceps, além de ajudar a equalizar assimetrias.', 'https://www.youtube.com/results?search_query=agachamento+bulgaro+execucao'),
    ('Avanço com Halteres', 'Pernas', 'livre', 'Dê passos controlados, mantenha a passada estável e evite usar o impulso para sair do fundo.', 'Halteres', 'Ótimo para combinar estímulo de quadríceps e glúteos com demanda moderada de estabilidade.', 'https://www.youtube.com/results?search_query=avanco+com+halteres+execucao'),
    ('Agachamento Livre', 'Pernas', 'livre', 'Inspire antes de descer, mantenha o tronco organizado e procure amplitude consistente sem perder alinhamento dos joelhos.', 'Barra, rack', 'Base clássica para quadríceps e glúteos. Responde bem a progressão gradual, frequência regular e controle de fadiga.', 'https://www.youtube.com/results?search_query=agachamento+livre+execucao'),
    ('Hack Squat', 'Pernas', 'maquina', 'Apoie bem o quadril, desça com controle e pressione a plataforma sem travar os joelhos no topo.', 'Máquina hack', 'Permite alta estabilidade e proximidade da falha com menor exigência técnica que o agachamento livre.', 'https://www.youtube.com/results?search_query=hack+squat+execucao'),
    ('Leg Press 45°', 'Pernas', 'maquina', 'Desça até a amplitude que preserve quadril apoiado, controle a excêntrica e empurre com o pé inteiro na plataforma.', 'Leg press 45°', 'Muito útil para acumular volume pesado em quadríceps com estabilidade alta e boa margem de segurança.', 'https://www.youtube.com/results?search_query=leg+press+45+execucao'),
    ('Cadeira Extensora', 'Pernas', 'maquina', 'Ajuste o eixo do joelho, estenda sem impulso e controle a volta até quase a flexão total.', 'Cadeira extensora', 'Boa para pré-ativação e para elevar volume local de quadríceps com baixa complexidade técnica.', 'https://www.youtube.com/results?search_query=cadeira+extensora+execucao'),
    ('Extensora (Ativação)', 'Pernas', 'maquina', 'Use carga leve a moderada, foco em conexão com quadríceps e reps fluidas antes dos compostos.', 'Cadeira extensora', 'Pré-ativação pode melhorar percepção muscular e aquecimento específico antes de agachar ou pressionar.', 'https://www.youtube.com/results?search_query=cadeira+extensora+execucao'),
    ('Adutora na Máquina', 'Pernas', 'maquina', 'Mantenha o quadril estável no assento e feche as pernas sem perder o controle da fase de retorno.', 'Máquina adutora', 'Adutores também contribuem para estabilidade pélvica e desempenho em padrões de agachamento.', 'https://www.youtube.com/results?search_query=adutora+na+maquina+execucao'),
    ('Adutora Leve', 'Pernas', 'maquina', 'Use ritmo constante e foco em amplitude confortável para adicionar volume com baixo custo de fadiga.', 'Máquina adutora', 'Versões leves servem bem como complemento em semanas com alto volume de pernas.', 'https://www.youtube.com/results?search_query=adutora+na+maquina+execucao'),
    ('Abdutora na Máquina', 'Glúteos', 'maquina', 'Mantenha a pelve apoiada e abra as pernas sem compensar com balanço do tronco.', 'Máquina abdutora', 'Boa para glúteo médio e estabilidade de quadril, especialmente em blocos com bastante trabalho unilateral.', 'https://www.youtube.com/results?search_query=abdutora+na+maquina+execucao'),
    ('Abdução na Polia', 'Glúteos', 'maquina', 'Afaste a perna com controle, segurando o tronco firme e sem inclinar excessivamente o corpo.', 'Polia baixa, caneleira', 'Ótima para glúteo médio com curva de resistência contínua e fácil ajuste fino de carga.', 'https://www.youtube.com/results?search_query=abducao+na+polia+execucao'),
    ('Coice na Polia', 'Glúteos', 'maquina', 'Estenda o quadril com o pé ativo e sem jogar a lombar para trás durante o final do movimento.', 'Polia baixa, caneleira', 'Funciona bem como acessório para glúteos em faixas moderadas a altas de repetições.', 'https://www.youtube.com/results?search_query=coice+na+polia+execucao'),
    ('Panturrilha em Pé', 'Pernas', 'maquina', 'Faça pausa curta no alongamento e suba o máximo possível sem quicar na base.', 'Máquina de panturrilha em pé', 'Tende a enfatizar gastrocnêmio e responde bem a amplitude completa e pausas breves no alongamento.', 'https://www.youtube.com/results?search_query=panturrilha+em+pe+execucao'),
    ('Panturrilha Sentada', 'Pernas', 'maquina', 'Desça com controle total e suba até a contração máxima, mantendo o joelho estável.', 'Máquina de panturrilha sentada', 'Com o joelho flexionado, a versão sentada aumenta a participação do sóleo.', 'https://www.youtube.com/results?search_query=panturrilha+sentada+execucao'),
    ('Panturrilha Sentada (Sóleo)', 'Pernas', 'maquina', 'Mantenha o tornozelo livre, pause no alongamento e controle o pico de contração no topo.', 'Máquina de panturrilha sentada', 'Excelente para enfatizar sóleo, importante para volume de panturrilhas e tolerância a trabalho repetido.', 'https://www.youtube.com/results?search_query=panturrilha+sentada+soleo+execucao'),

    ('Supino Reto com Halteres', 'Peito', 'livre', 'Desça com os cotovelos levemente abaixo da linha do banco, mantenha escápulas estáveis e suba sem perder o arco natural.', 'Banco reto, halteres', 'Halteres oferecem liberdade articular e boa amplitude, úteis para hipertrofia com controle fino de trajetória.', 'https://www.youtube.com/results?search_query=supino+reto+halter+execucao'),
    ('Supino Inclinado com Halteres', 'Peito', 'livre', 'Use inclinação moderada, peito alto e trajetória estável até próximo da linha superior do peitoral.', 'Banco inclinado, halteres', 'Inclinações moderadas tendem a distribuir melhor o estímulo para peitoral superior sem roubar demais para deltoide anterior.', 'https://www.youtube.com/results?search_query=supino+inclinado+halter+execucao'),
    ('Supino Inclinado com Barra', 'Peito', 'livre', 'Mantenha escápulas retraídas, desça ao alto do peito e controle o caminho da barra durante toda a série.', 'Banco inclinado, barra, anilhas', 'Boa opção pesada para peitoral clavicular, geralmente pedindo atenção extra à inclinação do banco e à fadiga de ombros.', 'https://www.youtube.com/results?search_query=supino+inclinado+barra+execucao'),
    ('Supino Reto com Barra', 'Peito', 'livre', 'Plante os pés, gere estabilidade no tronco e toque a barra com consistência sem perder o posicionamento das escápulas.', 'Banco reto, barra, anilhas', 'Compósito clássico para força e hipertrofia, com boa transferência para progressão de carga ao longo do bloco.', 'https://www.youtube.com/results?search_query=supino+reto+barra+execucao'),
    ('Crossover no Cabo', 'Peito', 'maquina', 'Aproxime as mãos em arco, mantenha peitoral ativo e evite transformar o exercício em movimento de ombro.', 'Polia alta ou média', 'Cabos mantêm tensão contínua e permitem enfatizar a fase final de adução horizontal.', 'https://www.youtube.com/results?search_query=crossover+no+cabo+execucao'),
    ('Crossover Polia Alta', 'Peito', 'maquina', 'Puxe em arco de cima para baixo, mantendo peito aberto e cotovelos levemente flexionados.', 'Polia alta', 'Variação útil para enfatizar fibras esternais e parte inferior do peitoral com tensão contínua.', 'https://www.youtube.com/results?search_query=crossover+polia+alta+execucao'),
    ('Crucifixo Máquina (Pec Deck)', 'Peito', 'maquina', 'Ajuste a máquina para alinhar ombros e cotovelos, feche os braços com controle e segure brevemente a contração.', 'Máquina pec deck', 'Alta estabilidade e boa proximidade da falha fazem desta opção uma boa ferramenta para volume de peitoral.', 'https://www.youtube.com/results?search_query=pec+deck+execucao'),
    ('Paralelas (Peito)', 'Peito', 'funcional', 'Incline levemente o tronco à frente, desça até amplitude segura e suba sem perder depressão das escápulas.', 'Barras paralelas', 'Quando bem executadas, podem gerar alto estímulo para peitoral inferior e tríceps, mas exigem boa tolerância de ombros.', 'https://www.youtube.com/results?search_query=paralelas+peito+execucao'),

    ('Desenvolvimento com Halteres', 'Ombro', 'livre', 'Empurre acima da cabeça sem colapsar a lombar, mantendo antebraços verticais e ritmo controlado.', 'Banco, halteres', 'Movimento base para deltoides com liberdade articular e bom potencial de progressão.', 'https://www.youtube.com/results?search_query=desenvolvimento+com+halteres+execucao'),
    ('Desenvolvimento Militar com Barra', 'Ombro', 'livre', 'Crie rigidez no tronco, leve a barra em linha eficiente e evite compensar inclinando o corpo para trás.', 'Barra, anilhas', 'Versão mais estável para progressão de carga, mas sensível à fadiga de tronco e mobilidade de ombros.', 'https://www.youtube.com/results?search_query=desenvolvimento+militar+barra+execucao'),
    ('Elevação Lateral', 'Ombro', 'livre', 'Suba os braços até perto da linha do ombro com cotovelos soltos e sem embalar o corpo.', 'Halteres', 'Altas repetições e controle fino costumam funcionar muito bem para deltoide lateral.', 'https://www.youtube.com/results?search_query=elevacao+lateral+halter+execucao'),
    ('Elevação Lateral no Cabo', 'Ombro', 'maquina', 'Mantenha tensão contínua desde a base, subindo de forma suave e controlada até a linha do ombro.', 'Polia baixa', 'O cabo melhora a tensão no início da curva e é excelente para aumentar estímulo sem usar muito impulso.', 'https://www.youtube.com/results?search_query=elevacao+lateral+cabo+execucao'),
    ('Crucifixo Inverso', 'Ombro', 'livre', 'Abra os braços sem estender demais a lombar e conduza o movimento pelos cotovelos.', 'Halteres ou banco inclinado', 'Aumenta o trabalho de deltoide posterior e ajuda a equilibrar padrões dominantes de empurrar.', 'https://www.youtube.com/results?search_query=crucifixo+inverso+execucao'),
    ('Crucifixo Inverso Máquina', 'Ombro', 'maquina', 'Ajuste o peito no apoio, abra com cotovelos guiando o movimento e evite trapézio alto dominar a fase final.', 'Máquina reverse pec deck', 'Excelente para deltoide posterior com alta estabilidade e fácil progressão por repetições.', 'https://www.youtube.com/results?search_query=crucifixo+inverso+maquina+execucao'),
    ('Face Pull', 'Ombro', 'maquina', 'Puxe a corda em direção ao rosto com cotovelos altos e rotação externa no final do gesto.', 'Polia alta, corda', 'Boa escolha para deltoide posterior, trapézio médio e saúde escapular dentro de blocos com muito supino.', 'https://www.youtube.com/results?search_query=face+pull+execucao'),
    ('Face Pull Corda (Polia Alta)', 'Ombro', 'maquina', 'Mantenha a corda alta, abra as mãos no final e finalize com escápulas controladas.', 'Polia alta, corda', 'Útil para estabilidade escapular e para complementar volume de ombro posterior e manguito.', 'https://www.youtube.com/results?search_query=face+pull+corda+execucao'),

    ('Puxada Pronada', 'Costas', 'maquina', 'Inicie deprimindo as escápulas e puxe levando os cotovelos para baixo, sem transformar em remada.', 'Polia alta', 'Boa variação vertical para dorsais e grande dorsal, especialmente quando a barra fixa ainda limita o volume total.', 'https://www.youtube.com/results?search_query=puxada+pronada+execucao'),
    ('Pulldown Pronado', 'Costas', 'maquina', 'Puxe em direção à parte alta do peito com tronco estável e amplitude controlada.', 'Polia alta', 'Ajuda a acumular volume em dorsais com menos instabilidade que a barra fixa.', 'https://www.youtube.com/results?search_query=pulldown+pronado+execucao'),
    ('Pulldown Supinado', 'Costas', 'maquina', 'Mantenha peito alto e cotovelos próximos ao corpo, puxando com foco em dorsais e flexores do cotovelo.', 'Polia alta', 'Pegada supinada pode melhorar sensação de dorsais para algumas pessoas e variar a distribuição do esforço.', 'https://www.youtube.com/results?search_query=pulldown+supinado+execucao'),
    ('Barra Fixa Pronada', 'Costas', 'funcional', 'Suba com o tronco estável, iniciando pela depressão escapular, e evite balanço nas pernas.', 'Barra fixa', 'Excelente para força relativa e dorsais, mas costuma exigir boa gestão de fadiga quando usada pesada.', 'https://www.youtube.com/results?search_query=barra+fixa+pronada+execucao'),
    ('Remada no Cabo', 'Costas', 'maquina', 'Puxe com o cotovelo, estabilize o tronco e finalize trazendo as escápulas para trás sem exagero de balanço.', 'Polia baixa', 'Boa ferramenta para densidade de costas, com fácil ajuste de carga e alto controle técnico.', 'https://www.youtube.com/results?search_query=remada+no+cabo+execucao'),
    ('Remada Baixa (Cabo Sentado)', 'Costas', 'maquina', 'Mantenha o tronco firme e conduza o puxador até a linha do abdômen sem usar impulso excessivo.', 'Cabo sentado', 'Variação estável para acumular volume de dorsais e romboides com boa repetibilidade.', 'https://www.youtube.com/results?search_query=remada+baixa+cabo+sentado+execucao'),
    ('Remada Unilateral com Halter', 'Costas', 'livre', 'Apoie o corpo com firmeza, puxe o halter próximo ao quadril e controle a descida.', 'Banco, halter', 'Muito útil para corrigir assimetrias e aumentar amplitude com foco unilateral.', 'https://www.youtube.com/results?search_query=remada+unilateral+halter+execucao'),
    ('Remada Curvada com Barra', 'Costas', 'livre', 'Incline o tronco com estabilidade, mantenha abdômen ativo e puxe a barra sem arredondar a coluna.', 'Barra, anilhas', 'Compósito importante para espessura de costas, porém mais custoso em fadiga lombar.', 'https://www.youtube.com/results?search_query=remada+curvada+barra+execucao'),
    ('T-Bar / Cavalinho', 'Costas', 'livre', 'Mantenha quadril fixo, peito aberto e traga a carga em direção à base do peito ou abdômen alto.', 'Barra T ou máquina cavalinho', 'Permite sobrecarga alta com apoio relativo melhor que a remada curvada tradicional.', 'https://www.youtube.com/results?search_query=remada+cavalinho+tbar+execucao'),
    ('Encolhimento com Halteres', 'Costas', 'livre', 'Eleve os ombros verticalmente, segure breve no topo e evite girar o pescoço durante a execução.', 'Halteres', 'Trabalho complementar para trapézio superior, geralmente melhor em cadência controlada do que com carga excessiva.', 'https://www.youtube.com/results?search_query=encolhimento+halter+execucao'),

    ('Rosca Alternada', 'Bíceps', 'livre', 'Suba supinando o antebraço, mantenha o cotovelo relativamente fixo e evite embalar o tronco.', 'Halteres', 'Boa para amplitude, coordenação bilateral e ajuste fino de trajetória.', 'https://www.youtube.com/results?search_query=rosca+alternada+execucao'),
    ('Rosca Direta com Barra', 'Bíceps', 'livre', 'Mantenha o braço próximo ao corpo, suba sem jogar o quadril e desça controlando até quase extensão total.', 'Barra reta ou EZ', 'Ótima para sobrecarga progressiva em bíceps, pedindo atenção a impulso e sobrecarga de punhos.', 'https://www.youtube.com/results?search_query=rosca+direta+barra+execucao'),
    ('Rosca Scott', 'Bíceps', 'maquina', 'Apoie bem o braço no banco Scott e controle a excêntrica sem relaxar no final da descida.', 'Banco Scott, barra ou máquina', 'Alta estabilidade e alongamento consistente fazem desta uma boa opção para volume localizado.', 'https://www.youtube.com/results?search_query=rosca+scott+execucao'),
    ('Rosca Martelo', 'Bíceps', 'livre', 'Use pegada neutra, cotovelos próximos ao corpo e subida limpa sem balanço.', 'Halteres', 'Variação útil para braquial e braquiorradial, ajudando no volume total de flexores do cotovelo.', 'https://www.youtube.com/results?search_query=rosca+martelo+execucao'),
    ('Rosca Inclinada com Halteres', 'Bíceps', 'livre', 'Mantenha os ombros para trás no banco inclinado e faça a subida sem deslocar o cotovelo para frente.', 'Banco inclinado, halteres', 'A posição alongada tende a gerar alta tensão em bíceps, excelente para complementar roscas mais pesadas.', 'https://www.youtube.com/results?search_query=rosca+inclinada+halter+execucao'),

    ('Tríceps Corda', 'Tríceps', 'maquina', 'Mantenha os cotovelos estáveis, empurre a corda para baixo e abra as mãos no final do movimento.', 'Polia alta, corda', 'Muito eficiente para volume de tríceps com baixa demanda técnica e boa tolerância a repetições moderadas e altas.', 'https://www.youtube.com/results?search_query=triceps+corda+execucao'),
    ('Tríceps Testa Barra EZ', 'Tríceps', 'livre', 'Desça a barra em direção à testa ou atrás dela com cotovelos estáveis e suba sem abrir demais os braços.', 'Barra EZ, banco', 'A posição alongada pode aumentar o estímulo na cabeça longa do tríceps, mas pede controle técnico para poupar cotovelos.', 'https://www.youtube.com/results?search_query=triceps+testa+barra+ez+execucao'),
    ('Tríceps Francês com Halter', 'Tríceps', 'livre', 'Alongue atrás da cabeça com controle e estenda o cotovelo sem deixar o braço abrir demais.', 'Halter', 'Boa opção para cabeça longa por trabalhar o tríceps em posição alongada do ombro.', 'https://www.youtube.com/results?search_query=triceps+frances+halter+execucao')
)
insert into public.exercicios (
  nome,
  grupo_muscular,
  tipo,
  execucao,
  equipamento,
  observacao_cientifica,
  video_url
)
select
  s.nome,
  s.grupo_muscular::muscle_group,
  s.tipo::exercise_type,
  s.execucao,
  s.equipamento,
  s.observacao_cientifica,
  s.video_url
from seed_exercicios s
where not exists (
  select 1
  from public.exercicios e
  where lower(trim(e.nome)) = lower(trim(s.nome))
);

-- ================================================================
-- VIEWS ANALITICAS
-- ================================================================
create or replace view public.v_prs as
select
  user_id,
  exercicio_id,
  exercicio_nome,
  max(carga) as carga_max,
  count(*) as total_sessoes,
  max(data) as ultimo_registro
from public.historico_treino
where carga > 0
group by user_id, exercicio_id, exercicio_nome;

create or replace view public.v_frequencia_semanal as
select
  user_id,
  date_trunc('week', data)::date as semana,
  count(distinct treino_id) as sessoes
from public.historico_treino
group by user_id, date_trunc('week', data)::date
order by semana desc;
