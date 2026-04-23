/* =================================================================
   config.js — Configuração global do projeto
   -----------------------------------------------------------------
   Este arquivo deve ser carregado antes dos demais.
   Ele define:
   - namespace global App
   - conexão com Supabase
   - constantes de domínio
   - estado global inicial da SPA
   ================================================================= */

window.App = window.App || {};

/* ================================================================
   SUPABASE
   ----------------------------------------------------------------
   Substitua apenas se mudar de projeto no Supabase.
   ================================================================ */
App.SUPABASE_URL = 'https://ujghosvklwjemjpkftvc.supabase.co';
App.SUPABASE_KEY = 'sb_publishable_89z7CN77BgFF9WEl5MxqCA_m4Mxd1V-';
App.USE_SUPABASE = true;

/* ================================================================
   PLANOS DO PRODUTO
   ================================================================ */
App.PLANS = {
  free: {
    id: 'free',
    label: 'Free',
    features: [
      'Visualizar treino atribuído',
      'Registrar sessões básicas',
      'Perfil básico'
    ],
    locked: [
      'Histórico completo',
      'Métricas avançadas',
      'PRs detalhados',
      'Acesso ao treinador',
      'Medidas corporais completas'
    ],
  },

  premium: {
    id: 'premium',
    label: 'Premium',
    features: [
      'Tudo do plano Free',
      'Histórico ilimitado',
      'Métricas avançadas',
      'PRs e recordes',
      'Medidas corporais',
      'Acesso ao treinador'
    ],
    locked: [],
  },
};

/* ================================================================
   DOMÍNIO DO APP
   ================================================================ */
App.GOALS = {
  emagrecimento: 'Emagrecimento',
  hipertrofia: 'Hipertrofia',
  definicao: 'Definição Muscular',
  saude: 'Saúde Geral',
  performance: 'Performance Atlética',
  reabilitacao: 'Reabilitação',
};

App.SEXO = {
  M: 'Masculino',
  F: 'Feminino',
  NB: 'Não-binário',
  ND: 'Prefiro não informar',
};

App.MUSCLE_GROUPS = [
  'Peito',
  'Costas',
  'Pernas',
  'Glúteos',
  'Ombro',
  'Bíceps',
  'Tríceps',
  'Core',
];

App.EXERCISE_TYPES = {
  livre: 'Livre',
  maquina: 'Máquina',
  funcional: 'Funcional',
  cardio: 'Cardio',
};

App.REST_OPTIONS = ['30s', '45s', '60s', '75s', '90s', '2 min', '3 min'];
App.WORKOUT_DAY_OPTIONS = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];
App.WORKOUT_BLOCK_OPTIONS = ['Lower A', 'Upper Push', 'Lower B', 'Upper Pull', 'Lower C', 'Extra', 'Cardio'];

/* ================================================================
   ESTADO GLOBAL DA SPA
   ================================================================ */
App.state = {
  user: null,
  currentView: null,
  sb: null,
  workout: null,
  selectedAluno: null,
  exerciseList: [],
  workoutDraft: [],
  workoutSession: null,
  charts: {},
};

/* ================================================================
   LOCAL STORAGE
   ----------------------------------------------------------------
   Centraliza leitura/escrita com namespace tf_
   ================================================================ */
App.ls = function (key, val) {
  const storageKey = `tf_${key}`;

  if (typeof val === 'undefined') {
    try {
      return JSON.parse(localStorage.getItem(storageKey));
    } catch {
      return null;
    }
  }

  if (val === null) {
    localStorage.removeItem(storageKey);
    return null;
  }

  localStorage.setItem(storageKey, JSON.stringify(val));
  return val;
};
