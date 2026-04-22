/* ============================================================
   TrainFlow v2 — js/config.js
   Configurações globais, dados do programa e constantes.
   Carregado primeiro — define o namespace global TF.
   ============================================================ */

// ── Namespace global da aplicação ──────────────────────────
window.TF = window.TF || {};

// ── Configuração do Supabase ────────────────────────────────
// Substitua com seus valores reais do Supabase Dashboard.
TF.SUPABASE_URL = 'YOUR_SUPABASE_URL';
TF.SUPABASE_KEY = 'YOUR_SUPABASE_ANON_KEY';
TF.USE_SUPABASE  = TF.SUPABASE_URL !== 'YOUR_SUPABASE_URL';

// ── Configuração de Planos ──────────────────────────────────
TF.PLANS = {
  free: {
    label: 'Free',
    features: ['Programa de treino', 'Registrar séries (30 dias)', 'Dashboard básico'],
    locked:   ['Gráficos de evolução', 'PRs completos', 'Histórico ilimitado', 'Acesso ao treinador', 'Medidas corporais'],
  },
  premium: {
    label: 'Premium',
    features: ['Tudo do Free', 'Histórico ilimitado', 'Gráficos de evolução', 'PRs', 'Medidas corporais', 'Acesso ao treinador'],
    locked: [],
  },
};

// ── Objetivos (labels amigáveis) ────────────────────────────
TF.GOALS = {
  emagrecimento: 'Emagrecimento',
  hipertrofia:   'Hipertrofia',
  definicao:     'Definição',
  saude:         'Saúde Geral',
  performance:   'Performance',
  reabilitacao:  'Reabilitação',
};

// ── Sexo (neutro) ───────────────────────────────────────────
TF.SEXO = { M:'Masculino', F:'Feminino', NB:'Não-binário', ND:'Prefiro não dizer' };

// ── Grupos musculares (para seleção ao criar exercício) ────
TF.GRUPOS = [
  'Glúteo','Isquiotibiais','Quadríceps','Adutores','Abdutores',
  'Panturrilha','Peitoral','Costas','Deltoides','Bíceps','Tríceps',
  'Core','Corpo Todo',
];

// ── Programa padrão (5 dias) ────────────────────────────────
// Gênero-neutro. Pode ser sobrescrito por treino custom do treinador.
TF.PROGRAM = [
  {
    id:'segunda', dia:'Seg', nome:'Lower A',
    foco:'Glúteos + Isquiotibiais', num:'01', intensidade:'Alta',
    cardio:{ text:'Bicicleta LISS — 20–25 min', sub:'Zona 2 (55–65% FC máx) · Após treino', icon:'🚴' },
    exercicios:[
      { id:1,  nome:'Hip Thrust (Elevação Pélvica)',     grupo:'Glúteo',                series:4, reps:'6–10',      descanso:'2–3 min', rpe:'RPE 8–9', obs:'Exercício principal — progrida carga toda semana',        dicas:'Pés na largura do quadril. Barra, máquina ou halteres.' },
      { id:2,  nome:'Stiff / Terra Romeno',              grupo:'Isquiotibiais + Glúteo', series:3, reps:'8–12',      descanso:'2 min',   rpe:'RPE 8',   obs:'Movimento de dobradiça do quadril',                      dicas:'Manter coluna neutra. Não arredondar a lombar.' },
      { id:3,  nome:'Mesa Flexora Sentada',              grupo:'Isquiotibiais',          series:3, reps:'10–12',     descanso:'90s',     rpe:'RPE 8',   obs:'Preferir sentada — maior ativação do bíceps femoral',    dicas:'Schoenfeld (2021): treinamento no alongamento = maior hipertrofia.' },
      { id:4,  nome:'Agachamento Búlgaro',               grupo:'Glúteo + Quadríceps',    series:3, reps:'10–12/perna',descanso:'2 min',  rpe:'RPE 8',   obs:'Tronco levemente inclinado = mais glúteo',               dicas:'Smith ou halteres. Amplitude completa.' },
      { id:5,  nome:'Abdutora na Máquina',               grupo:'Glúteo Médio',           series:3, reps:'15–20',     descanso:'60–90s',  rpe:'RPE 7–8', obs:'Glúteo médio e mínimo — vital para estética lateral',    dicas:'Contrair no pico. Sem momentum.' },
      { id:6,  nome:'Panturrilha Sentada (Sóleo)',       grupo:'Panturrilha',            series:3, reps:'15–20',     descanso:'60s',     rpe:'RPE 8',   obs:'Joelho flexionado = sóleo',                              dicas:'Amplitude completa — calcanhar abaixo da plataforma.' },
    ],
  },
  {
    id:'terca', dia:'Ter', nome:'Upper Push',
    foco:'Peitoral + Ombros + Tríceps', num:'02', intensidade:'Moderada-Alta',
    cardio:{ text:'HIIT — 15–18 min', sub:'30s forte / 60–90s leve · 6–8 rounds', icon:'⚡' },
    exercicios:[
      { id:7,  nome:'Supino com Halteres (plano)',       grupo:'Peitoral',               series:4, reps:'8–12',      descanso:'2 min',   rpe:'RPE 8–9', obs:'Exercício principal de peito — obrigatório',             dicas:'Cotovelos a 45° do tronco. Descida controlada.' },
      { id:8,  nome:'Supino Inclinado com Halteres',     grupo:'Peitoral Superior',      series:3, reps:'10–12',     descanso:'90s',     rpe:'RPE 8',   obs:'~30° — feixe clavicular do peitoral',                    dicas:'Define o decote. Cotovelos fora a 45°.' },
      { id:9,  nome:'Desenvolvimento com Halteres',      grupo:'Deltoides',              series:3, reps:'8–10',      descanso:'2 min',   rpe:'RPE 8',   obs:'Banco vertical ou sem apoio',                            dicas:'Desce até nível das orelhas para range completo.' },
      { id:10, nome:'Elevação Lateral',                  grupo:'Deltoide Lateral',       series:3, reps:'12–15',     descanso:'60–90s',  rpe:'RPE 8',   obs:'Halteres ou polia — polia = mais tensão no encurtamento',dicas:'Cotovelos levemente flexionados.' },
      { id:11, nome:'Tríceps na Corda (polia alta)',     grupo:'Tríceps',                series:3, reps:'12–15',     descanso:'60–90s',  rpe:'RPE 8',   obs:'Abrir as pontas ao final = cabeça lateral',              dicas:'Cotovelos fixos ao lado do corpo.' },
      { id:12, nome:'Crossover no Cabo (ou Fly)',        grupo:'Peitoral',               series:3, reps:'12–15',     descanso:'60s',     rpe:'RPE 7–8', obs:'Finalizador — isolamento de peito',                      dicas:'Foco na contração máxima no centro.' },
    ],
  },
  {
    id:'quarta', dia:'Qua', nome:'Lower B',
    foco:'Quadríceps + Glúteos', num:'03', intensidade:'Alta',
    cardio:{ text:'Esteira Inclinada LISS — 15–20 min', sub:'8–12% inclinação · Sem segurar o corrimão', icon:'🏃' },
    exercicios:[
      { id:13, nome:'Agachamento Livre ou Hack Squat',   grupo:'Quadríceps + Glúteo',    series:4, reps:'6–10',      descanso:'2–3 min', rpe:'RPE 8–9', obs:'Exercício principal de quadríceps',                       dicas:'Hack = menos técnica. Descer até paralelo ou abaixo.' },
      { id:14, nome:'Leg Press 45°',                     grupo:'Quadríceps + Glúteo',    series:3, reps:'10–12',     descanso:'2 min',   rpe:'RPE 8',   obs:'Pés baixos = mais quad · Pés altos = mais glúteo',       dicas:'Varie posição dos pés entre semanas.' },
      { id:15, nome:'Hip Thrust com Pausa (2s no topo)', grupo:'Glúteo',                 series:3, reps:'10–15',     descanso:'90s',     rpe:'RPE 7–8', obs:'~70% da carga da segunda — evita adaptação',             dicas:'Variação para manter o estímulo fresco.' },
      { id:16, nome:'Cadeira Extensora',                 grupo:'Quadríceps',             series:3, reps:'12–15',     descanso:'60–90s',  rpe:'RPE 8',   obs:'Único isolamento de quad da semana',                     dicas:'Pé em dorsiflexão no topo. Foco no VMO.' },
      { id:17, nome:'Adutora na Máquina',                grupo:'Adutores',               series:3, reps:'15–20',     descanso:'60s',     rpe:'RPE 7',   obs:'Adutores compõem a curvatura interna da coxa',           dicas:'Amplitude completa. Sem momentum.' },
      { id:18, nome:'Panturrilha em Pé',                 grupo:'Panturrilha',            series:3, reps:'12–15',     descanso:'60s',     rpe:'RPE 8',   obs:'Joelho estendido = gastrocnêmio',                        dicas:'Calcanhar bem abaixo da plataforma.' },
    ],
  },
  {
    id:'quinta', dia:'Qui', nome:'Upper Pull',
    foco:'Costas + Bíceps + Deltoide Post.', num:'04', intensidade:'Moderada-Alta',
    cardio:{ text:'HIIT Bicicleta — 15–18 min', sub:'40s forte / 80s leve · 6–7 rounds', icon:'⚡' },
    exercicios:[
      { id:19, nome:'Puxada Pronada (pegada aberta)',    grupo:'Dorsais + Bíceps',       series:4, reps:'6–10',      descanso:'2 min',   rpe:'RPE 8–9', obs:'Ou assistida se necessário',                             dicas:'Escápulas em depressão antes de puxar.' },
      { id:20, nome:'Remada no Cabo (triângulo)',        grupo:'Dorsais + Romboides',    series:3, reps:'10–12',     descanso:'2 min',   rpe:'RPE 8',   obs:'Retração total da escápula no final',                    dicas:'Cotovelos colados ao corpo. Não arredondar lombar.' },
      { id:21, nome:'Remada Unilateral com Halter',     grupo:'Dorsais',                series:3, reps:'10–12/braço',descanso:'90s',    rpe:'RPE 8',   obs:'Corrige assimetrias',                                    dicas:'Cotovelo alto. Joelho e mão de apoio no banco.' },
      { id:22, nome:'Crucifixo Inverso (máquina)',      grupo:'Deltoide Post.',         series:3, reps:'12–15',     descanso:'60–90s',  rpe:'RPE 8',   obs:'Essencial para postura e equilíbrio push/pull',          dicas:'Cotovelos levemente flexionados.' },
      { id:23, nome:'Face Pull (cabo + corda)',          grupo:'Deltoide Post. + Manguito',series:2,reps:'15–20',   descanso:'60s',     rpe:'RPE 7',   obs:'Saúde do ombro + deltoide posterior',                   dicas:'Puxar até as orelhas. Cotovelos para trás e para cima.' },
      { id:24, nome:'Rosca Alternada com Halteres',     grupo:'Bíceps',                 series:3, reps:'10–12',     descanso:'60–90s',  rpe:'RPE 8',   obs:'Supinação ao final = máxima contração',                  dicas:'Bíceps já estimulado nas remadas.' },
      { id:25, nome:'Rosca Scott ou Martelo',           grupo:'Bíceps + Braquial',      series:2, reps:'10–12',     descanso:'60s',     rpe:'RPE 8',   obs:'Scott = cabeça curta · Martelo = braquial',             dicas:'Varie entre semanas.' },
    ],
  },
  {
    id:'sexta', dia:'Sex', nome:'Lower C',
    foco:'Glúteos Focus — Volume Moderado', num:'05', intensidade:'Moderada',
    cardio:{ text:'Caminhada ou Bicicleta Leve — 25–35 min', sub:'Muito leve · Fecha a semana sem estresse extra', icon:'🚶' },
    exercicios:[
      { id:26, nome:'Hip Thrust Moderado (pausa 1–2s)', grupo:'Glúteo',                 series:4, reps:'12–15',     descanso:'90s',     rpe:'RPE 7',   obs:'~70–75% da carga da segunda — volume, não intensidade', dicas:'Foco em conexão mente-músculo.' },
      { id:27, nome:'Coice na Polia',                   grupo:'Glúteo',                 series:3, reps:'12–15/perna',descanso:'60s',    rpe:'RPE 7–8', obs:'Joelho levemente flexionado',                            dicas:'Não arquear a lombar. Contração no pico.' },
      { id:28, nome:'Avanço com Halteres (longo)',      grupo:'Glúteo + Quadríceps',    series:3, reps:'12–15/perna',descanso:'90s',    rpe:'RPE 7',   obs:'Única variação de lunge da semana',                      dicas:'Passada longa = mais glúteo, curta = mais quad.' },
      { id:29, nome:'Abdução na Polia (em pé)',         grupo:'Glúteo Médio',           series:3, reps:'15–20/perna',descanso:'60s',    rpe:'RPE 7',   obs:'Varia da abdutora na máquina da segunda',               dicas:'Controlar na descida excêntrica.' },
      { id:30, nome:'Mesa Flexora Leve',                grupo:'Isquiotibiais',          series:2, reps:'15',         descanso:'60s',     rpe:'RPE 6–7', obs:'Fechamento de volume da semana',                         dicas:'Carga leve. Foco em amplitude e qualidade.' },
      { id:31, nome:'Adutora Leve',                     grupo:'Adutores',               series:2, reps:'20',         descanso:'60s',     rpe:'RPE 6',   obs:'Finalização suave',                                      dicas:'Amplitude completa. Sem forçar.' },
    ],
  },
];

// Helper: busca exercício pelo ID em todo o programa
TF.getExerciseById = (id) =>
  TF.PROGRAM.flatMap(d => d.exercicios).find(e => e.id === id) || null;

// Helper: busca dia pelo ID
TF.getDayById = (id) => TF.PROGRAM.find(d => d.id === id) || null;
