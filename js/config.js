/* =================================================================
   config.js — Configuração global, namespace, constantes
   Carregado PRIMEIRO. Define window.App.
   ================================================================= */

window.App = window.App || {};

/* ── Supabase ────────────────────────────────────────────────────
   Substitua com seus valores do Supabase Dashboard:
   Project Settings → API
   ─────────────────────────────────────────────────────────────── */
App.SUPABASE_URL = 'https://wmwfntlbkdsfscceavpa.supabase.co';
App.SUPABASE_KEY = 'sb_publishable_8lOVmR3mPkFrkpblr7FNSA_VmND0ajf';
App.USE_SUPABASE  = App.SUPABASE_URL !== 'https://wmwfntlbkdsfscceavpa.supabase.co';

/* ── Planos ──────────────────────────────────────────────────── */
App.PLANS = {
  free: {
    id: 'free', label: 'Free',
    features: ['Visualizar treino atribuído', 'Registrar até 30 sessões', 'Perfil básico'],
    locked:   ['Histórico completo', 'Gráficos de evolução', 'PRs detalhados', 'Acesso ao treinador', 'Medidas corporais avançadas'],
  },
  premium: {
    id: 'premium', label: 'Premium',
    features: ['Tudo do Free', 'Histórico ilimitado', 'Gráficos de evolução', 'PRs e recordes', 'Medidas corporais', 'Acesso ao treinador', 'Suporte prioritário'],
    locked: [],
  },
};

/* ── Objetivos ────────────────────────────────────────────────── */
App.GOALS = {
  emagrecimento: 'Emagrecimento',
  hipertrofia:   'Hipertrofia',
  definicao:     'Definição Muscular',
  saude:         'Saúde Geral',
  performance:   'Performance Atlética',
  reabilitacao:  'Reabilitação',
};

/* ── Sexo (neutro) ────────────────────────────────────────────── */
App.SEXO = { M: 'Masculino', F: 'Feminino', NB: 'Não-binário', ND: 'Prefiro não informar' };

/* ── Grupos musculares (ordem de exibição) ──────────────────── */
App.MUSCLE_GROUPS = ['Peito','Costas','Pernas','Glúteos','Ombro','Bíceps','Tríceps','Core'];

/* ── Tipos de exercício ────────────────────────────────────────── */
App.EXERCISE_TYPES = { livre: 'Livre', maquina: 'Máquina', funcional: 'Funcional', cardio: 'Cardio' };

/* ── Tempo de descanso padrão por série ─────────────────────── */
App.REST_OPTIONS = ['30s','45s','60s','75s','90s','2 min','3 min'];

/* ── Estado global da SPA ────────────────────────────────────── */
App.state = {
  user:          null,   // { id, nome, email, role, plan_type }
  currentView:   null,
  sb:            null,   // cliente Supabase
  workout:       null,   // treino ativo do aluno
  selectedAluno: null,   // aluno selecionado pelo treinador
  exerciseList:  [],     // biblioteca de exercícios carregada do Supabase
  workoutDraft:  [],     // rascunho do treino sendo montado pelo treinador
};

/* ── localStorage helpers (namespace 'tf_') ───────────────── */
App.ls = function(key, val) {
  const k = 'tf_' + key;
  if (val !== undefined) { localStorage.setItem(k, JSON.stringify(val)); return val; }
  try { return JSON.parse(localStorage.getItem(k)); } catch { return null; }
};
