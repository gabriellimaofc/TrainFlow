-- =================================================================
-- TrainFlow — schema.sql
-- -----------------------------------------------------------------
-- Objetivo:
-- Estrutura principal do banco para o SaaS fitness.
-- Compatível com o frontend atual baseado em:
-- - profiles
-- - alunos_detalhes
-- - medidas
-- - exercicios
-- - treinador_aluno
-- - treinos
-- - treino_exercicios
-- - observacoes_treinador
-- - historico_treino
-- -----------------------------------------------------------------
-- Como usar:
-- 1) Crie um projeto no Supabase
-- 2) Abra SQL Editor
-- 3) Cole este arquivo inteiro
-- 4) Clique em Run
-- =================================================================

-- ================================================================
-- EXTENSÕES
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
-- ----------------------------------------------------------------
-- Guarda dados base do usuário autenticado.
-- É criada automaticamente pelo trigger após signup.
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

-- Índices úteis para busca e validação
create index if not exists idx_profiles_email on public.profiles (email);
create index if not exists idx_profiles_role on public.profiles (role);
create index if not exists idx_profiles_plan on public.profiles (plan_type);

-- ================================================================
-- TABELA: ALUNOS_DETALHES
-- ----------------------------------------------------------------
-- Perfil físico/complementar do aluno.
-- Separada de profiles para manter organização de domínio.
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
-- ----------------------------------------------------------------
-- Histórico de medidas corporais.
-- Uma linha por coleta/registro.
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
-- Biblioteca global de exercícios do sistema.
-- Treinador escolhe da lista; não digita exercício manual.
-- ================================================================
create table if not exists public.exercicios (
  id              bigserial primary key,
  nome            text not null,
  grupo_muscular  muscle_group not null,
  tipo            exercise_type not null default 'livre',
  execucao        text,
  equipamento     text,
  ativo           boolean not null default true,
  created_at      timestamptz not null default now()
);

create index if not exists idx_exercicios_grupo_ativo
  on public.exercicios (grupo_muscular)
  where ativo = true;

create index if not exists idx_exercicios_nome
  on public.exercicios (nome);

-- ================================================================
-- TABELA: TREINADOR_ALUNO
-- ----------------------------------------------------------------
-- Relação entre treinador e aluno.
-- Um aluno pode ser vinculado para receber treino.
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
-- ----------------------------------------------------------------
-- Cabeçalho do treino criado pelo treinador para um aluno.
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
-- ----------------------------------------------------------------
-- Itens do treino. Cada linha é um exercício dentro do treino.
-- ================================================================
create table if not exists public.treino_exercicios (
  id            bigserial primary key,
  treino_id     bigint not null references public.treinos(id) on delete cascade,
  exercicio_id  bigint not null references public.exercicios(id) on delete restrict,
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

-- ================================================================
-- TABELA: OBSERVACOES_TREINADOR
-- ----------------------------------------------------------------
-- Observações textuais do treinador sobre o aluno.
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
-- ----------------------------------------------------------------
-- Histórico de logs/sessões registradas pelo aluno.
-- ================================================================
create table if not exists public.historico_treino (
  id              bigserial primary key,
  user_id         uuid not null references public.profiles(id) on delete cascade,
  treino_id       bigint references public.treinos(id) on delete set null,
  exercicio_id    bigint references public.exercicios(id) on delete set null,
  exercicio_nome  text,
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
-- ----------------------------------------------------------------
-- Leitura:
-- - usuário lê o próprio perfil
-- - treinador lê perfis já vinculados
-- - usuário autenticado pode ler perfis para permitir vínculo por email
--   sem quebrar o fluxo do produto
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
-- ----------------------------------------------------------------
-- Biblioteca global legível para todo usuário autenticado.
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

-- Trigger de updated_at
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
-- ----------------------------------------------------------------
-- Usa raw_user_meta_data para salvar nome e role.
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
-- SEED: BIBLIOTECA DE EXERCÍCIOS
-- ----------------------------------------------------------------
-- Mantém biblioteca inicial para o treinador montar treino
-- sem digitar exercícios manualmente.
-- ================================================================
insert into public.exercicios (nome, grupo_muscular, tipo, execucao, equipamento) values
('Supino Reto com Barra',         'Peito',   'livre',   'Retraia as escápulas, controle a descida e empurre mantendo estabilidade.',               'Banco reto, barra, anilhas'),
('Supino Reto com Halteres',      'Peito',   'livre',   'Desça com controle, mantenha amplitude segura e suba sem perder a linha dos ombros.',    'Banco reto, halteres'),
('Supino Inclinado com Halteres', 'Peito',   'livre',   'Banco entre 30 e 45 graus. Controle a descida e mantenha peito aberto.',                 'Banco inclinado, halteres'),
('Crucifixo com Halteres',        'Peito',   'livre',   'Cotovelos levemente flexionados, abra em arco e retorne contraindo o peitoral.',         'Banco reto, halteres'),
('Peck Deck',                     'Peito',   'maquina', 'Aproxime os braços com controle, sem projetar os ombros para frente.',                   'Máquina peck deck'),

('Puxada Frontal',                'Costas',  'maquina', 'Puxe trazendo os cotovelos para baixo, focando na contração das dorsais.',               'Máquina puxada alta'),
('Remada Curvada com Barra',      'Costas',  'livre',   'Tronco firme, abdômen ativo e barra puxando em direção ao abdômen.',                     'Barra, anilhas'),
('Remada Unilateral com Halter',  'Costas',  'livre',   'Apoie bem o corpo e puxe o halter com o cotovelo para trás.',                           'Banco, halter'),
('Remada Baixa no Cabo',          'Costas',  'maquina', 'Mantenha o tronco estável e finalize com escápulas retraídas.',                          'Polia baixa'),
('Barra Fixa',                    'Costas',  'funcional','Suba com controle e evite balanço excessivo do corpo.',                                'Barra fixa'),

('Agachamento Livre',             'Pernas',  'livre',   'Desça com controle, mantenha tronco firme e joelhos alinhados.',                        'Barra, rack'),
('Leg Press 45',                  'Pernas',  'maquina', 'Controle a fase excêntrica e não retire o quadril do banco.',                           'Leg press'),
('Cadeira Extensora',             'Pernas',  'maquina', 'Estenda os joelhos com controle e evite impulso.',                                      'Cadeira extensora'),
('Mesa Flexora',                  'Pernas',  'maquina', 'Flexione os joelhos mantendo quadril estável e ritmo controlado.',                      'Mesa flexora'),
('Afundo com Halteres',           'Pernas',  'livre',   'Dê um passo firme, mantenha tronco estável e controle a descida.',                      'Halteres'),

('Hip Thrust',                    'Glúteos', 'livre',   'Empurre com os calcanhares e finalize com contração máxima dos glúteos.',               'Banco, barra'),
('Glute Bridge',                  'Glúteos', 'funcional','Eleve o quadril sem arquear excessivamente a lombar.',                                 'Peso corporal'),
('Coice na Polia',                'Glúteos', 'maquina', 'Estenda o quadril com controle, sem compensar na lombar.',                              'Polia baixa'),
('Abdução na Máquina',            'Glúteos', 'maquina', 'Abra as pernas com controle, mantendo o quadril estável.',                              'Máquina abdutora'),

('Desenvolvimento com Halteres',  'Ombro',   'livre',   'Empurre acima da cabeça sem colapsar a lombar.',                                        'Banco, halteres'),
('Elevação Lateral',              'Ombro',   'livre',   'Suba os braços até a linha dos ombros com controle.',                                   'Halteres'),
('Elevação Frontal',              'Ombro',   'livre',   'Mantenha o tronco estável e controle a amplitude.',                                     'Halteres'),
('Face Pull',                     'Ombro',   'maquina', 'Puxe em direção ao rosto com cotovelos altos e escápulas controladas.',                 'Polia, corda'),

('Rosca Direta',                  'Bíceps',  'livre',   'Cotovelos fixos ao lado do corpo e controle a descida.',                                'Barra W ou reta'),
('Rosca Alternada',               'Bíceps',  'livre',   'Supine o antebraço ao subir e evite balanço do tronco.',                                'Halteres'),
('Rosca Martelo',                 'Bíceps',  'livre',   'Mantenha pegada neutra durante toda a execução.',                                       'Halteres'),

('Tríceps Corda',                 'Tríceps', 'maquina', 'Empurre a corda para baixo e afaste no final da extensão.',                             'Polia alta, corda'),
('Tríceps Barra',                 'Tríceps', 'maquina', 'Cotovelos fixos e controle total da fase excêntrica.',                                  'Polia alta, barra'),
('Tríceps Francês',               'Tríceps', 'livre',   'Alongue bem atrás da cabeça e suba com controle.',                                      'Halter'),

('Prancha',                       'Core',    'funcional','Mantenha coluna neutra e abdômen ativo.',                                              'Peso corporal'),
('Abdominal Crunch',              'Core',    'funcional','Suba controlando o abdômen, sem puxar o pescoço.',                                    'Peso corporal'),
('Elevação de Pernas',            'Core',    'funcional','Eleve as pernas mantendo a lombar controlada.',                                       'Peso corporal'),
('Dead Bug',                      'Core',    'funcional','Coordene braço e perna opostos sem perder estabilidade.',                              'Peso corporal'),

('Esteira Caminhada',             'Cardio',  'cardio',  'Mantenha passada confortável e ritmo constante.',                                       'Esteira'),
('Bike Ergométrica',              'Cardio',  'cardio',  'Ajuste a carga para manter constância e técnica.',                                      'Bicicleta ergométrica'),
('Elíptico',                      'Cardio',  'cardio',  'Mantenha cadência contínua e postura estável.',                                         'Elíptico'),
('HIIT na Bike',                  'Cardio',  'cardio',  'Alterne tiros intensos com pausas ativas bem controladas.',                            'Bicicleta')
on conflict do nothing;

-- ================================================================
-- VIEWS ANALÍTICAS
-- ----------------------------------------------------------------
-- Úteis para dashboards futuros e expansão do produto.
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
