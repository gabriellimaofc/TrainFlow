/* =================================================================
   views/student.js — Área completa do aluno
   ================================================================= */

const metodosAvancados = [
  {
    nome: 'RIR — Reps in Reserve',
    icone: 'target',
    nivel: 'Todos os níveis',
    descricao:
      'RIR indica quantas repetições você ainda conseguiria executar antes da falha muscular concêntrica. É uma escala de autorregulação mais precisa do que usar porcentagens fixas, porque acompanha fadiga, sono, estresse e recuperação do dia.',
    tabela: [
      { rir: 'RIR 4', significado: '4 reps sobrando', sensacao: 'Leve — aquecimento' },
      { rir: 'RIR 3', significado: '3 reps sobrando', sensacao: 'Moderado' },
      { rir: 'RIR 2', significado: '2 reps sobrando', sensacao: 'Pesado — ideal para hipertrofia' },
      { rir: 'RIR 1', significado: '1 rep sobrando', sensacao: 'Muito perto da falha' },
      { rir: 'RIR 0', significado: 'Falha técnica', sensacao: 'Máxima tensão' },
    ],
    estudos: [
      'Zourdos et al. (2016) — Journal of Strength and Conditioning Research',
      'Helms et al. (2016) — autoregulação aplicada à hipertrofia',
    ],
    dica:
      'A maioria dos sets de hipertrofia tende a funcionar melhor em RIR 1–2. Falhar em todas as séries costuma cobrar recuperação demais.',
    indicacao: ['Todos os exercícios', 'Periodização', 'Autorregulação'],
    videoUrl: 'https://www.youtube.com/results?search_query=RIR+reps+in+reserve+treino',
    exemplo: 'Agachamento: 3 x 8 com carga que deixe 1–2 reps sobrando em cada série.',
  },
  {
    nome: 'Drop Set',
    icone: 'layers',
    nivel: 'Intermediário/Avançado',
    descricao:
      'Você executa uma série até a falha ou perto dela, reduz a carga em 20–30% e continua sem descanso. Isso aumenta densidade e estresse metabólico em pouco tempo.',
    exemplo: 'Rosca direta: 20kg até falha → 14kg até falha → 10kg até falha.',
    estudos: [
      'Schoenfeld & Grgic (2019) — Strength & Conditioning Journal',
      'Fink et al. (2018) — Clinical Physiology and Functional Imaging',
      'Stragier et al. (2023) — sinalização anabólica em protocolos densos',
    ],
    indicacao: ['Isoladores', 'Máquinas', 'Tempo reduzido'],
    avisos: ['Evite em multiarticulares pesados quando a fadiga puder comprometer a técnica.'],
    videoUrl: 'https://www.youtube.com/results?search_query=drop+set+como+fazer',
  },
  {
    nome: 'Cluster Set',
    icone: 'grid',
    nivel: 'Intermediário/Avançado',
    descricao:
      'A série é dividida em mini-blocos com pausas curtas de 10–30 segundos. Isso preserva potência, técnica e permite manter cargas altas por mais repetições totais.',
    exemplo: 'Supino 100kg: 3 reps | 20s | 3 reps | 20s | 3 reps.',
    estudos: [
      'Tufano et al. (2016) — Journal of Strength and Conditioning Research',
      'Oliver et al. (2013) — manutenção de potência ao longo da série',
      'Latella et al. (2019) — Frontiers in Physiology',
    ],
    indicacao: ['Força máxima', 'Multiarticulares', 'Força + Hipertrofia'],
    videoUrl: 'https://www.youtube.com/results?search_query=cluster+set+musculacao',
  },
  {
    nome: 'Rest-Pause',
    icone: 'timer',
    nivel: 'Intermediário/Avançado',
    descricao:
      'Você leva a série perto da falha, descansa 10–20 segundos e continua com a mesma carga. A técnica aumenta repetições efetivas e economiza tempo de sessão.',
    exemplo: 'Leg press 150kg x 12 → 15s → +4 → 15s → +2.',
    estudos: [
      'Prestes et al. (2019) — Journal of Strength and Conditioning Research',
      'Marshall & Robbins (2021) — maior recrutamento de unidades motoras de alto limiar',
    ],
    indicacao: ['Tempo reduzido', 'Isoladores', 'Máquinas'],
    videoUrl: 'https://www.youtube.com/results?search_query=rest+pause+treino+hipertrofia',
  },
  {
    nome: 'Drop Set Mecânico',
    icone: 'refresh',
    nivel: 'Intermediário/Avançado',
    descricao:
      'A carga continua a mesma, mas você muda para uma variação mecanicamente mais favorável do exercício para continuar após a falha.',
    exemplo: 'Rosca inclinada → rosca Scott → rosca em pé, com a mesma carga.',
    estudos: [
      'Schoenfeld (2010) — Journal of Strength and Conditioning Research',
    ],
    indicacao: ['Isoladores', 'Halteres', 'Cabo'],
    videoUrl: 'https://www.youtube.com/results?search_query=drop+set+mecanico+musculacao',
  },
  {
    nome: 'Série Forçada',
    icone: 'users',
    nivel: 'Avançado',
    descricao:
      'Depois da falha concêntrica, um parceiro ajuda apenas o suficiente na subida enquanto você controla a descida lentamente, explorando o potencial excêntrico.',
    exemplo: 'Supino 80kg até falha → parceiro ajuda na subida → 3 reps extras com excêntrica lenta.',
    estudos: [
      'Schoenfeld (2002) — Strength & Conditioning Journal',
      'Walker et al. (2016) — European Journal of Applied Physiology',
    ],
    indicacao: ['Requer parceiro', 'Multiarticulares', 'Avançados'],
    videoUrl: 'https://www.youtube.com/results?search_query=série+forçada+treino',
  },
  {
    nome: 'PAP — Potenciação Pós-Ativação',
    icone: 'zap',
    nivel: 'Avançado',
    descricao:
      'Você combina um estímulo pesado com um gesto explosivo semelhante após alguns minutos de descanso, usando a potenciação neural para elevar a performance.',
    exemplo: 'Agachamento pesado → descanso de 4 minutos → salto na caixa máximo.',
    estudos: [
      'Tillin & Bishop (2009) — Sports Medicine',
      'Mitchell & Sale (2011) — janela ideal de potenciação',
    ],
    indicacao: ['Atletas', 'Força + Potência', 'Esportes'],
    videoUrl: 'https://www.youtube.com/results?search_query=PAP+post+activation+potentiation',
  },
];

const treinoQuickGuides = [
  {
    titulo: 'RIR prático',
    icone: 'target',
    texto: 'Na maior parte do bloco, termine os sets principais com cerca de 1–2 reps sobrando. Falha frequente costuma ficar melhor reservada para isoladores e momentos pontuais.',
  },
  {
    titulo: 'Progressão dupla',
    icone: 'trending-up',
    texto: 'Primeiro feche a faixa de repetições com técnica boa. Quando todas as séries alcançarem o topo da faixa, aumente a carga no treino seguinte.',
  },
  {
    titulo: 'Deload',
    icone: 'gauge',
    texto: 'Quando a fadiga acumular, reduza volume por cerca de uma semana e mantenha os movimentos limpos. Recuperar bem costuma melhorar a próxima fase.',
  },
];

const limiares = [
  {
    sigla: 'MEV',
    nome: 'Volume Mínimo Efetivo',
    cor: '#3b82f6',
    icone: 'bar-chart-3',
    descricao:
      'A menor quantidade de volume que ainda produz adaptações mensuráveis. Abaixo disso, você tende a manter mais do que construir.',
    referencia: 'Issurin (2010) — Sports Medicine',
    exemplo: 'Em geral, 4–8 séries semanais por grupo muscular.',
    gauge: 26,
  },
  {
    sigla: 'MAV',
    nome: 'Volume Máximo Adaptativo',
    cor: '#22c55e',
    icone: 'target',
    descricao:
      'A faixa ideal onde você progride com boa resposta anabólica e fadiga controlada. É a zona mais produtiva para a maioria dos blocos.',
    referencia: 'Israetel et al. (2019) — Renaissance Periodization',
    exemplo: 'Em geral, 10–20 séries semanais por grupo muscular.',
    gauge: 62,
  },
  {
    sigla: 'MRV',
    nome: 'Volume Máximo Recuperável',
    cor: '#ef4444',
    icone: 'alert-triangle',
    descricao:
      'O teto de volume que o corpo ainda consegue recuperar. Ultrapassar esse ponto costuma elevar fadiga sem produzir mais crescimento.',
    referencia: 'Schoenfeld & Grgic (2018) — Journal of Strength and Conditioning Research',
    exemplo: 'Pode passar de 20 séries semanais em avançados, mas com custo alto.',
    gauge: 92,
  },
];

const problemasVolume = [
  {
    titulo: 'Overreaching Funcional',
    icone: 'timer',
    descricao:
      'Acúmulo temporário de fadiga com queda de performance. Com deload adequado, a recuperação costuma vir em 1–2 semanas.',
    estudo: 'Meeusen et al. (2013) — European Journal of Sport Science',
  },
  {
    titulo: 'Overtraining Não-Funcional',
    icone: 'x',
    descricao:
      'Fadiga crônica com impacto em performance, humor, imunidade e rotina de treino. O retorno pode levar meses.',
    estudo: 'Kreher & Schwartz (2012) — Sports Health',
  },
  {
    titulo: 'Interferência na Síntese Proteica',
    icone: 'dna',
    descricao:
      'Depois de certo ponto, mais volume deixa de aumentar o sinal anabólico. O excedente vira mais dano do que adaptação.',
    estudo: 'Burd et al. (2010) — Journal of Physiology',
  },
  {
    titulo: 'Aumento do Cortisol',
    icone: 'alert-triangle',
    descricao:
      'Sessões muito longas e volumosas elevam o custo sistêmico do treino e podem prejudicar recuperação e qualidade da sessão seguinte.',
    estudo: 'Kraemer et al. (1995) — Journal of Applied Physiology',
  },
];

const volumePorGrupo = [
  { grupo: 'Peitoral', icone: 'shield', mev: '6 séries', mav: '10–16 séries', mrv: '22 séries' },
  { grupo: 'Costas', icone: 'layers', mev: '8 séries', mav: '14–22 séries', mrv: '25 séries' },
  { grupo: 'Quadríceps', icone: 'activity', mev: '8 séries', mav: '12–18 séries', mrv: '20 séries' },
  { grupo: 'Posterior de Coxa', icone: 'trending-down', mev: '6 séries', mav: '10–16 séries', mrv: '20 séries' },
  { grupo: 'Ombros', icone: 'trending-up', mev: '6 séries', mav: '12–20 séries', mrv: '26 séries' },
  { grupo: 'Bíceps', icone: 'dumbbell', mev: '4 séries', mav: '10–14 séries', mrv: '20 séries' },
  { grupo: 'Tríceps', icone: 'zap', mev: '4 séries', mav: '10–14 séries', mrv: '18 séries' },
  { grupo: 'Panturrilha', icone: 'footprints', mev: '6 séries', mav: '12–16 séries', mrv: '20 séries' },
  { grupo: 'Core / Abdômen', icone: 'target', mev: '4 séries', mav: '10–16 séries', mrv: '20 séries' },
];

const periodizacaoVolume = [
  {
    fase: 'Acumulação',
    duracao: '3–4 semanas',
    volume: 'Próximo ao MAV',
    intensidade: 'RIR 2–3',
    objetivo: 'Acumular volume progressivo',
    metodos: 'Cluster, séries normais',
  },
  {
    fase: 'Intensificação',
    duracao: '2–3 semanas',
    volume: 'Reduz 20–30%',
    intensidade: 'RIR 0–1',
    objetivo: 'Alta intensidade com volume controlado',
    metodos: 'Rest-Pause, Drop Set',
  },
  {
    fase: 'Pico / Realização',
    duracao: '1–2 semanas',
    volume: 'Muito baixo',
    intensidade: 'Máxima',
    objetivo: 'Expressar o máximo de força/massa',
    metodos: 'Série forçada, PAP',
  },
  {
    fase: 'Deload',
    duracao: '1 semana',
    volume: 'MEV ou abaixo',
    intensidade: 'RIR 4+',
    objetivo: 'Recuperação e supracompensação',
    metodos: 'Séries normais leves',
  },
];

const cardioQuickReferences = [
  {
    nome: 'LISS',
    icone: 'activity',
    dose: '25–45 min',
    texto: 'Cardio contínuo leve a moderado. Funciona bem para aumentar gasto calórico e condicionamento com pouca interferência na musculação.',
  },
  {
    nome: 'HIIT',
    icone: 'zap',
    dose: '10–20 min',
    texto: 'Tiros intensos com pausas ativas. É eficiente, mas costuma cobrar mais recuperação, então vale dosar perto de treinos pesados de pernas.',
  },
];

const modalidadesCardio = [
  {
    nome: 'Corrida',
    icone: 'run',
    calorias: '400–600 kcal/h',
    intensidade: '60–85% FCM',
    duracao: '20–45 min',
    beneficios: ['VO2 máx', 'Queima de gordura', 'Saúde cardiovascular'],
    dicas: ['Aqueça 5 min em ritmo leve', 'Aumente distância em até 10% por semana', 'Intercale dias leves e dias de descanso'],
    indicado: 'Todos os níveis — iniciantes podem começar com trote e caminhada.',
  },
  {
    nome: 'HIIT',
    icone: 'zap',
    calorias: '500–800 kcal/h (+ EPOC)',
    intensidade: '85–95% FCM nos tiros',
    duracao: '15–25 min',
    beneficios: ['EPOC', 'Potência anaeróbica', 'Preservação muscular'],
    dicas: ['Relação 1:2 funciona bem', 'Limite a 3x por semana', 'Evite antes de treino de força pesado'],
    estudo: 'Gibala et al. (2012) — Journal of Physiology',
    indicado: 'Intermediário/Avançado',
  },
  {
    nome: 'Bicicleta',
    icone: 'bike',
    calorias: '300–500 kcal/h',
    intensidade: '55–80% FCM',
    duracao: '30–60 min',
    beneficios: ['Baixo impacto', 'Quadríceps', 'Resistência aeróbica'],
    dicas: ['Ajuste o selim corretamente', 'Cadência entre 70–90 RPM', 'Boa opção no dia seguinte a pernas pesadas'],
    indicado: 'Todos os níveis — especialmente útil para quem sente o joelho.',
  },
  {
    nome: 'Natação',
    icone: 'swim',
    calorias: '400–700 kcal/h',
    intensidade: '60–80% FCM',
    duracao: '30–45 min',
    beneficios: ['Corpo inteiro', 'Zero impacto', 'Mobilidade'],
    dicas: ['Alterne estilos', 'Priorize técnica antes da velocidade', 'Mantenha hidratação'],
    indicado: 'Todos os níveis — excelente para reabilitação.',
  },
  {
    nome: 'Caminhada',
    icone: 'walk',
    calorias: '200–300 kcal/h',
    intensidade: '45–60% FCM',
    duracao: '30–60 min',
    beneficios: ['Recuperação ativa', 'Saúde metabólica', 'Baixíssimo impacto'],
    dicas: ['Inclinação ajuda no gasto calórico', 'Ótima como LISS pós-treino', '10 mil passos é uma boa meta prática'],
    estudo: 'Hanson & Jones (2015) — British Journal of Sports Medicine',
    indicado: 'Iniciantes, idosos e dias de recuperação.',
  },
  {
    nome: 'Corda',
    icone: 'link',
    calorias: '600–900 kcal/h',
    intensidade: '70–90% FCM',
    duracao: '10–20 min',
    beneficios: ['Coordenação', 'Panturrilha', 'Condicionamento rápido'],
    dicas: ['Comece em intervalos', 'Cotovelos perto do corpo', 'Saltos baixos e econômicos'],
    indicado: 'Intermediário — exige coordenação básica.',
  },
  {
    nome: 'Elíptico',
    icone: 'ellipse',
    calorias: '300–450 kcal/h',
    intensidade: '55–75% FCM',
    duracao: '30–50 min',
    beneficios: ['Sem impacto', 'Corpo todo', 'Recuperação ativa'],
    dicas: ['Progrida a resistência', 'Empurre e puxe as alças', 'Boa troca para a corrida em dias cansados'],
    indicado: 'Todos os níveis — útil para sobrepeso e retorno de lesão.',
  },
];

App.views = App.views || {};
App.views.student = {
  _scienceTab: 'metodos',
  _scienceOpenMethods: { 0: true },
  _scienceExerciseSearch: '',
  _scienceExerciseGroup: 'Todos',
  _cardioSearch: '',

  async renderDashboard() {
    const u = App.state.user;
    const history = await App.data.getHistory(u?.id);

    const greetingEl = document.getElementById('dashboard-greeting');
    const dateEl = document.getElementById('dashboard-date');

    if (greetingEl) greetingEl.textContent = App.utils.greeting(u?.nome);
    if (dateEl) {
      dateEl.textContent = new Date().toLocaleDateString('pt-BR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    }

    App.utils.renderIcon('stat-icon-streak', 'flame', 18, '#f59e0b');
    App.utils.renderIcon('stat-icon-week', 'calendar-check', 18, '#60a5fa');
    App.utils.renderIcon('stat-icon-total', 'trophy', 18, '#facc15');

    const streak = App.utils.calcStreak(history.map((h) => h.data || h.date));
    const weekCnt = this._countWeek(history);
    const total = history.length;
    const toDeload = Math.max(0, 20 - (total % 20));

    this._setText('stat-streak', streak);
    this._setText('stat-week', weekCnt);
    this._setText('stat-total', total);
    this._setText('stat-deload', toDeload > 0 ? toDeload : 'Agora');

    this._renderAlerts(streak, toDeload);
    await this._renderWorkoutQuick();
    this._renderRecentActivity(history);
  },

  _countWeek(history) {
    return App.utils.countThisWeek(history);
  },

  _setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  },

  _renderAlerts(streak, toDeload) {
    const zone = document.getElementById('alerts-zone');
    if (!zone) return;

    zone.innerHTML = '';

    if (toDeload === 0) {
      zone.innerHTML += `
        <div class="alert alert-warning" role="alert">
          <span>${App.icons.get('zap', 16)}</span>
          <div>
            <strong>Deload recomendado</strong> — Você completou 20 sessões.
            Reduza o volume em cerca de 40% por uma semana para recuperar melhor.
          </div>
        </div>
      `;
    }

    if (streak >= 7) {
      zone.innerHTML += `
        <div class="alert alert-success" role="alert">
          <span>${App.icons.get('flame', 16)}</span>
          <div>
            <strong>${streak} dias consecutivos!</strong>
            Sua consistência está excelente. Continue assim.
          </div>
        </div>
      `;
    }
  },

  async _renderWorkoutQuick() {
    const el = document.getElementById('dashboard-workout-quick');
    if (!el) return;

    const treino = App.state.workout || null;

    if (!treino) {
      el.innerHTML = App.utils.emptyState({
        icon: 'dumbbell',
        title: 'Nenhum treino atribuído',
        text: 'Seu treinador ainda não criou um treino para você. Enquanto isso, mantenha a rotina pronta para começar forte.',
      });
      return;
    }

    const exCount = treino.treino_exercicios?.length || 0;

    el.innerHTML = `
      <div class="workout-quick-card" role="button" tabindex="0" onclick="App.boot.navigateTo('treino')">
        <div class="wqc-left">
          <div class="wqc-icon">${App.icons.get('dumbbell', 22)}</div>
          <div>
            <div class="wqc-name">${App.utils.esc(treino.nome)}</div>
            <div class="wqc-meta">
              ${exCount} exercícios
              ${treino.descricao ? ` · ${App.utils.esc(treino.descricao)}` : ''}
            </div>
          </div>
        </div>
        <div class="wqc-arrow">${App.icons.get('chevron-right', 18)}</div>
      </div>
    `;
  },

  _renderRecentActivity(history) {
    const el = document.getElementById('recent-activity');
    if (!el) return;

    if (!history.length) {
      el.innerHTML = `<div class="empty-text with-icon">${App.icons.get('clock', 16)} Sua primeira sessão registrada vai aparecer aqui.</div>`;
      return;
    }

    const grouped = {};
    history.forEach((h) => {
      const key = `${h.data || h.date}_${h.treino_id || 'x'}`;
      if (!grouped[key]) grouped[key] = { ...h, count: 0 };
      grouped[key].count++;
    });

    el.innerHTML = Object.values(grouped)
      .slice(0, 5)
      .map(
        (s) => `
          <div class="activity-row">
            <div class="activity-dot"></div>
            <div class="activity-info">
              <div class="activity-name">${App.utils.esc(s.exercicio_nome || 'Sessão de treino')}</div>
              <div class="activity-date">${App.utils.fmtDate(s.data || s.date, { weekday: 'short' })}</div>
            </div>
            <div class="activity-count">${s.count} séries</div>
          </div>
        `
      )
      .join('');
  },

  async renderTreino() {
    const el = document.getElementById('treino-content');
    if (!el) return;

    const treino = App.state.workout;

    if (!treino) {
      el.innerHTML = `
        <div class="empty-state large">
          <div class="empty-icon">${App.icons.get('dumbbell', 48)}</div>
          <h2>Sem treino atribuído</h2>
          <p>Seu treinador ainda não criou um treino para você. Quando houver um treino ativo, ele aparecerá aqui automaticamente.</p>
        </div>
      `;
      return;
    }

    const exercicios = (treino.treino_exercicios || []).sort((a, b) => a.ordem - b.ordem);

    el.innerHTML = `
      <div class="treino-header">
        <div class="treino-title-block">
          <h2>${App.utils.esc(treino.nome)}</h2>
          ${treino.descricao ? `<p class="treino-desc">${App.utils.esc(treino.descricao)}</p>` : ''}
        </div>
        <div class="treino-meta">
          <span class="badge badge-primary">${App.icons.get('dumbbell', 13)} ${exercicios.length} exercícios</span>
          <span class="badge badge-neutral">${App.icons.get('calendar', 13)} ${App.utils.fmtDate((treino.updated_at || treino.created_at || '').split('T')[0] || (treino.updated_at || treino.created_at))}</span>
        </div>
      </div>

      <div class="exercise-list">
        ${exercicios.length ? exercicios.map((te, i) => this._buildExerciseCard(te, i)).join('') : `<p class="empty-text">Nenhum exercício adicionado ainda.</p>`}
      </div>
    `;
  },

  _buildExerciseCard(te, idx) {
    const ex = te.exercicios || {};
    const typeLabel = App.EXERCISE_TYPES[ex.tipo] || ex.tipo || '—';

    return `
      <div class="exercise-card" id="ex-card-${te.id}">
        <div class="ex-card-header" onclick="App.views.student._toggleExCard(${te.id})">
          <div class="ex-card-left">
            <span class="ex-num">${idx + 1}</span>
            <div>
              <div class="exercise-title-inline">
                <div class="ex-name">${App.utils.esc(ex.nome || 'Exercício')}</div>
                <button class="btn-video-inline" type="button" onclick='event.stopPropagation(); App.utils.openExerciseVideo(${JSON.stringify(ex.nome || 'Exercício')})'>
                  ${App.icons.get('play-circle', 13)} Ver Execução
                </button>
              </div>
              <div class="ex-meta">
                <span class="badge-sm badge-muscle">${App.utils.esc(ex.grupo_muscular || '')}</span>
                <span class="badge-sm badge-type">${App.utils.esc(typeLabel)}</span>
              </div>
            </div>
          </div>

          <div class="ex-card-right">
            <div class="ex-sets">${te.series}×${App.utils.esc(te.repeticoes)}</div>
            <span class="ex-expand-icon" id="ex-icon-${te.id}">
              ${App.icons.get('chevron-down', 16)}
            </span>
          </div>
        </div>

        <div class="ex-card-body hidden" id="ex-body-${te.id}">
          <div class="ex-details-grid">
            <div class="ex-detail-item">
              <div class="ex-detail-label">Séries</div>
              <div class="ex-detail-val">${te.series}</div>
            </div>

            <div class="ex-detail-item">
              <div class="ex-detail-label">Repetições</div>
              <div class="ex-detail-val">${App.utils.esc(te.repeticoes)}</div>
            </div>

            <div class="ex-detail-item">
              <div class="ex-detail-label">Descanso</div>
              <div class="ex-detail-val">${App.utils.esc(te.descanso || '60s')}</div>
            </div>

            ${te.observacoes ? `
              <div class="ex-detail-item ex-detail-wide">
                <div class="ex-detail-label">Observações</div>
                <div class="ex-detail-val">${App.utils.esc(te.observacoes)}</div>
              </div>
            ` : ''}
          </div>

          ${ex.execucao ? `
            <div class="ex-execucao">
              <div class="ex-execucao-label">Execução</div>
              <p>${App.utils.esc(ex.execucao)}</p>
            </div>
          ` : ''}

          ${ex.equipamento ? `
            <div class="ex-equip">
              ${App.icons.get('info', 13)}
              <span>${App.utils.esc(ex.equipamento)}</span>
            </div>
          ` : ''}
        </div>
      </div>
    `;
  },

  _toggleExCard(id) {
    const body = document.getElementById(`ex-body-${id}`);
    const icon = document.getElementById(`ex-icon-${id}`);
    if (!body || !icon) return;

    const isHidden = body.classList.contains('hidden');
    body.classList.toggle('hidden', !isHidden);
    icon.innerHTML = App.icons.get(isHidden ? 'chevron-up' : 'chevron-down', 16);
  },

  async renderProgresso() {
    const content = document.getElementById('progresso-content');
    if (!content) return;

    App.utils.renderIcon('prog-icon-streak', 'flame', 18, '#f59e0b');
    App.utils.renderIcon('prog-icon-week', 'calendar-check', 18, '#60a5fa');
    App.utils.renderIcon('prog-icon-total', 'trophy', 18, '#facc15');

    if (!App.auth.isPremium()) {
      content.innerHTML = `
        <div class="section-card">
          <div class="premium-gate">
            ${App.icons.get('activity', 36)}
            <h3>Progresso avançado</h3>
            <p>Acompanhe PRs, frequência semanal e métricas mais completas com o plano Premium.</p>
            <button class="btn btn-primary" onclick="App.utils.toast('Entre em contato com seu treinador.', 'info')">
              Upgrade
            </button>
          </div>
        </div>
      `;
      return;
    }

    const history = await App.data.getHistory(App.state.user?.id);
    const streak = App.utils.calcStreak(history.map((h) => h.data || h.date));

    this._setText('prog-streak', streak);
    this._setText('prog-total', history.length);
    this._setText('prog-week', this._countWeek(history));

    this._renderPRs(history);
  },

  _renderPRs(history) {
    const el = document.getElementById('pr-list');
    if (!el) return;

    const prs = {};

    history.forEach((h) => {
      const key = h.exercicio_nome || '';
      if (!key) return;
      if (h.carga > 0 && (!prs[key] || h.carga > prs[key].carga)) prs[key] = h;
    });

    const entries = Object.entries(prs).sort((a, b) => b[1].carga - a[1].carga);

    if (!entries.length) {
      el.innerHTML = `<p class="empty-text">Nenhum PR registrado ainda. Continue treinando para gerar recordes.</p>`;
      return;
    }

    el.innerHTML = entries
      .map(
        ([nome, h]) => `
          <div class="pr-row">
            <div>
              <div class="pr-name">${App.utils.esc(nome)}</div>
              <div class="pr-date">${App.utils.fmtDate(h.data || h.date)}</div>
            </div>
            <div class="pr-val">${h.carga} <span>kg</span></div>
          </div>
        `
      )
      .join('');
  },

  async renderPerfil() {
    const el = document.getElementById('perfil-content');
    if (!el) return;

    const [profile, detalhes, medidas, history, exercicios] = await Promise.all([
      App.data.getProfile(App.state.user?.id),
      App.data.getAlunoDetalhes(App.state.user?.id),
      App.data.getMedidas(App.state.user?.id),
      App.data.getHistory(App.state.user?.id),
      App.data.getExercicios(),
    ]);

    const p = profile || {};
    const d = detalhes || {};
    const user = { ...p, ...d };

    el.innerHTML = `
      <div class="section-card">
        <div class="section-header">
          <div>
            <div class="section-label">Conta</div>
            <h3>Dados principais</h3>
          </div>
          <button class="btn btn-secondary" onclick="App.views.student._openPerfilModal()">
            ${App.icons.get('user', 15)} Editar perfil
          </button>
        </div>

        <div class="perfil-top">
          <div class="perfil-avatar">${App.utils.initial(user.nome)}</div>
          <div class="perfil-main">
            <h2>${App.utils.esc(user.nome || 'Usuário')}</h2>
            <p>${App.utils.esc(user.email || '')}</p>
            <div class="perfil-chips">
              <span class="chip">${App.auth.isPremium() ? 'Premium' : 'Free'}</span>
              ${user.objetivo ? `<span class="chip">${App.utils.esc(App.GOALS[user.objetivo] || user.objetivo)}</span>` : ''}
            </div>
          </div>
        </div>
      </div>

      ${this._buildDadosFisicos(user)}
      ${App.auth.isPremium() ? this._buildMedidasSection(medidas) : this._buildMedidasTeaser()}
      ${this._buildEvolucaoSection(history || [], exercicios || [])}
    `;

    this._mountEvolutionCharts(history || [], exercicios || []);
  },

  _buildDadosFisicos(d) {
    return `
      <div class="section-card">
        <div class="section-header">
          <div>
            <div class="section-label">Dados físicos</div>
            <h3>Informações pessoais</h3>
          </div>
        </div>

        <div class="info-grid">
          <div class="info-item">
            <div class="info-label">Idade</div>
            <div class="info-val">${d.idade || '—'} ${d.idade ? 'anos' : ''}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Peso</div>
            <div class="info-val">${d.peso || '—'} ${d.peso ? 'kg' : ''}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Altura</div>
            <div class="info-val">${d.altura || '—'} ${d.altura ? 'cm' : ''}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Sexo</div>
            <div class="info-val">${App.SEXO[d.sexo] || '—'}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Objetivo</div>
            <div class="info-val">${App.GOALS[d.objetivo] || '—'}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Observações</div>
            <div class="info-val">${App.utils.esc(d.observacoes || '—')}</div>
          </div>
        </div>
      </div>
    `;
  },

  _buildMedidasSection(medidas) {
    const last = medidas?.[0] || {};
    const campos = [
      { k: 'braco_d', l: 'Braço D.' },
      { k: 'braco_e', l: 'Braço E.' },
      { k: 'antebraco', l: 'Antebraço' },
      { k: 'peito', l: 'Peito' },
      { k: 'cintura', l: 'Cintura' },
      { k: 'quadril', l: 'Quadril' },
      { k: 'coxa_d', l: 'Coxa D.' },
      { k: 'coxa_e', l: 'Coxa E.' },
      { k: 'panturrilha', l: 'Panturrilha' },
      { k: 'ombro', l: 'Ombro' },
      { k: 'peso_data', l: 'Peso', u: 'kg' },
    ];

    return `
      <div class="section-card">
        <div class="section-header">
          <div>
            <div class="section-label">Medidas corporais</div>
            <h3>${last.data ? `Última medição — ${App.utils.fmtDate(last.data)}` : 'Nenhuma medição registrada'}</h3>
          </div>
          <button class="btn btn-primary btn-sm" onclick="App.views.student._openMedidasModal()">
            ${App.icons.get('plus', 14)} Registrar medidas
          </button>
        </div>

        <div class="medidas-grid">
          ${campos.map((c) => {
            const val = last[c.k];
            const unit = c.u || 'cm';
            return `
              <div class="medida-card">
                <div class="medida-label">${c.l}</div>
                <div class="medida-val">
                  ${val != null ? val : '—'}
                  <span class="medida-unit">${val != null ? unit : ''}</span>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  },

  _buildMedidasTeaser() {
    return `
      <div class="section-card">
        <div class="premium-gate">
          ${App.icons.get('target', 36)}
          <h3>Medidas corporais avançadas</h3>
          <p>Desbloqueie histórico completo de medidas e acompanhamento físico com o plano Premium.</p>
          <button class="btn btn-primary" onclick="App.utils.toast('Entre em contato com seu treinador.', 'info')">
            Upgrade
          </button>
        </div>
      </div>
    `;
  },

  _buildEvolucaoSection(history, exercicios) {
    const analytics = this._computeEvolutionAnalytics(history, exercicios);

    return `
      <div class="section-card">
        <div class="section-header">
          <div>
            <div class="section-label">Minha Evolução</div>
            <h3>Resumo semanal, progressão de carga e insights automáticos</h3>
          </div>
          <span class="badge badge-primary">${analytics.summary.streakAtual} dias de streak</span>
        </div>

        <div class="evolution-shell">
          <div class="insights-grid">
            ${analytics.insights.length
              ? analytics.insights.map((item) => `
                <article class="insight-card insight-${item.tipo}">
                  <div class="insight-icon">${App.icons.get(item.icon, 16)}</div>
                  <p>${App.utils.esc(item.mensagem)}</p>
                </article>
              `).join('')
              : App.utils.emptyState({ icon: 'award', title: 'Sem alertas críticos', text: 'Seu padrão atual parece estável. Continue acumulando boas semanas.' })}
          </div>

          <div class="evolution-summary-grid">
            ${this._buildSummaryCards(analytics)}
          </div>

          <div class="evolution-grid two-col">
            <div class="section-card inner-card">
              <div class="section-header">
                <div>
                  <div class="section-label">Carga por exercício</div>
                  <h3>Evolução semanal</h3>
                </div>
                <select id="evolution-exercise-select">
                  ${analytics.exerciseOptions.map((name) => `<option value="${App.utils.esc(name)}">${App.utils.esc(name)}</option>`).join('')}
                </select>
              </div>
              <div class="chart-wrap"><canvas id="chart-exercise-progress"></canvas></div>
            </div>

            <div class="section-card inner-card">
              <div class="section-header">
                <div>
                  <div class="section-label">Equilíbrio muscular</div>
                  <h3>Radar de volume semanal</h3>
                </div>
              </div>
              <div class="chart-wrap"><canvas id="chart-radar-volume"></canvas></div>
              ${analytics.lowMuscleGroups.length ? `
                <div class="radar-alert-row">
                  ${analytics.lowMuscleGroups.map((group) => `<span class="chip chip-alert">${App.utils.esc(group)} abaixo de 4 séries</span>`).join('')}
                </div>
              ` : ''}
            </div>
          </div>

          <div class="evolution-grid two-col">
            <div class="section-card inner-card">
              <div class="section-header">
                <div>
                  <div class="section-label">PRs</div>
                  <h3>Recordes pessoais</h3>
                </div>
              </div>
              <div class="pr-card-list">
                ${analytics.prs.length
                  ? analytics.prs.map((pr) => `
                    <article class="pr-highlight-card">
                      <div class="pr-highlight-head">
                        <div>
                          <div class="pr-highlight-name">${App.utils.esc(pr.exercicio)}</div>
                          <div class="pr-highlight-date">${App.utils.esc(pr.data)}</div>
                        </div>
                        ${pr.novoPR ? `<span class="chip chip-pr-new">${App.icons.get('flame', 12)} NOVO PR</span>` : ''}
                      </div>
                      <div class="pr-highlight-value">${pr.carga} kg <span>× ${pr.reps} reps</span></div>
                    </article>
                  `).join('')
                  : App.utils.emptyState({ icon: 'trophy', title: 'Nenhum PR registrado', text: 'Quando você bater sua melhor carga, ela vai aparecer aqui.' })}
              </div>
            </div>

            <div class="section-card inner-card">
              <div class="section-header">
                <div>
                  <div class="section-label">Volume total</div>
                  <h3>Últimas 8 semanas</h3>
                </div>
              </div>
              <div class="chart-wrap"><canvas id="chart-weekly-volume"></canvas></div>
            </div>
          </div>

          <div class="section-card inner-card">
            <div class="section-header">
              <div>
                <div class="section-label">Frequência mensal</div>
                <h3>Heatmap de treinos</h3>
              </div>
            </div>
            <div class="heatmap-panels">
              ${analytics.months.map((month) => this._buildMonthHeatmap(month)).join('')}
            </div>
          </div>

          <div class="section-card inner-card">
            <div class="section-header">
              <div>
                <div class="section-label">Análise de progressão</div>
                <h3>Sugestões inteligentes por exercício</h3>
              </div>
            </div>
            <div class="progress-analysis-grid">
              ${analytics.progressCards.length
                ? analytics.progressCards.map((item) => `
                  <article class="progress-card ${item.status}">
                    <div class="progress-card-head">
                      <div>
                        <h4>${App.utils.esc(item.exercicio)}</h4>
                        <p>${App.utils.esc(item.mensagem)}</p>
                      </div>
                      <span class="chip progress-chip ${item.status}">${App.utils.esc(item.label)}</span>
                    </div>
                    <div class="progress-suggestions">
                      ${item.sugestoes.map((s) => `<p>${App.icons.get('check', 13)} ${App.utils.esc(s)}</p>`).join('')}
                    </div>
                  </article>
                `).join('')
                : App.utils.emptyState({ icon: 'activity', title: 'Sem dados suficientes', text: 'Registre mais sessões para gerar análise de progressão.' })}
            </div>
          </div>

          <div class="section-card inner-card">
            <div class="section-header">
              <div>
                <div class="section-label">Como progredir</div>
                <h3>Métodos de progressão de carga</h3>
              </div>
            </div>
            <div class="progress-methods-grid">
              ${this._progressionMethods().map((item) => `
                <article class="progress-method-card">
                  <div class="progress-method-head">
                    <span class="method-icon">${App.icons.get(item.icon, 16)}</span>
                    <div>
                      <h4>${item.nome}</h4>
                      <p>${item.descricao}</p>
                    </div>
                  </div>
                  <div class="science-example compact">
                    <div class="science-example-label">Quando usar</div>
                    <strong>${item.quando}</strong>
                  </div>
                  <div class="study-item"><em>${item.estudo}</em></div>
                </article>
              `).join('')}
            </div>
          </div>
        </div>
      </div>
    `;
  },

  _buildSummaryCards(analytics) {
    const s = analytics.summary;
    const volumeDiff = s.volumeTotal - s.volumeUltimaSemana;
    const volumeSignal = volumeDiff >= 0 ? 'trending-up' : 'trending-down';
    const volumeText = `${volumeDiff >= 0 ? '+' : ''}${this._formatNumber(volumeDiff)} kg vs semana passada`;

    return `
      <article class="summary-card">
        <div class="summary-card-head">${App.icons.get('dumbbell', 16)} Treinos realizados</div>
        <strong>${s.treinosEssaSemana} de ${s.metaSemanal} planejados</strong>
        <div class="summary-progress"><span style="width:${Math.min(100, (s.treinosEssaSemana / s.metaSemanal) * 100)}%"></span></div>
      </article>
      <article class="summary-card">
        <div class="summary-card-head">${App.icons.get('bar-chart-3', 16)} Volume total</div>
        <strong>${this._formatNumber(s.volumeTotal)} kg movimentados</strong>
        <p>${App.icons.get(volumeSignal, 13)} ${volumeText}</p>
      </article>
      <article class="summary-card">
        <div class="summary-card-head">${App.icons.get('flame', 16)} Streak atual</div>
        <strong>${s.streakAtual} dias consecutivos</strong>
        <p>${s.diasSemTreinar} dia(s) sem treinar</p>
      </article>
      <article class="summary-card">
        <div class="summary-card-head">${App.icons.get('calendar-check', 16)} Frequência</div>
        <div class="week-mini-heatmap">
          ${s.weekDays.map((day) => `
            <div class="week-day-box ${day.level}">
              <span>${day.label}</span>
            </div>
          `).join('')}
        </div>
      </article>
    `;
  },

  _computeEvolutionAnalytics(history, exercicios) {
    const now = new Date();
    const today = new Date(`${App.utils.today()}T12:00:00`);
    const exerciseMap = new Map((exercicios || []).map((ex) => [ex.id, ex]));
    const normalized = (history || [])
      .filter((entry) => entry.data || entry.date)
      .map((entry) => {
        const date = new Date(`${entry.data || entry.date}T12:00:00`);
        const exRef = exerciseMap.get(entry.exercicio_id) || (exercicios || []).find((ex) => ex.nome === entry.exercicio_nome) || {};
        const group = exRef.grupo_muscular === 'Glúteos' ? 'Pernas' : exRef.grupo_muscular || 'Core';
        const volume = (Number(entry.carga) || 0) * (Number(entry.reps) || 0) * (Number(entry.series) || 0);
        return { ...entry, date, group, volume, name: entry.exercicio_nome || exRef.nome || 'Exercício' };
      })
      .sort((a, b) => a.date - b.date);

    const currentWeek = this._weekRange(today, 0);
    const prevWeek = this._weekRange(today, -7);
    const inCurrentWeek = normalized.filter((item) => item.date >= currentWeek.start && item.date <= currentWeek.end);
    const inPrevWeek = normalized.filter((item) => item.date >= prevWeek.start && item.date <= prevWeek.end);
    const uniqueSessions = (items) => new Set(items.map((item) => `${item.treino_id || 'x'}_${this._dateKey(item.date)}`)).size;
    const topExercises = Object.entries(inCurrentWeek.reduce((acc, item) => {
      acc[item.name] = (acc[item.name] || 0) + 1;
      return acc;
    }, {})).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([name]) => name);
    const latestDate = normalized.length ? normalized[normalized.length - 1].date : today;
    const diasSemTreinar = Math.max(0, Math.floor((today - latestDate) / 86400000));
    const streakAtual = App.utils.calcStreak(normalized.map((item) => this._dateKey(item.date)));

    const weekDays = this._buildWeekHeatmap(inCurrentWeek, currentWeek.start);
    const byExercise = this._groupByExercise(normalized);
    const exerciseOptions = Object.keys(byExercise);
    const selectedExercise = exerciseOptions[0] || '';
    const prs = this._buildPrCards(byExercise, now);
    const weeklyVolumeSeries = this._buildWeeklyVolumeSeries(normalized, 8);
    const radar = this._buildRadarData(inCurrentWeek);
    const lowMuscleGroups = radar.filter((item) => item.volume < 4).map((item) => item.grupo);
    const months = [this._buildMonthData(today, normalized), this._buildMonthData(new Date(today.getFullYear(), today.getMonth() - 1, 1), normalized)];
    const progressCards = Object.entries(byExercise).slice(0, 8).map(([name, records]) => this._analisarProgressao(name, records));
    const summary = {
      treinosEssaSemana: uniqueSessions(inCurrentWeek),
      treinosUltimaSemana: uniqueSessions(inPrevWeek),
      volumeTotal: inCurrentWeek.reduce((sum, item) => sum + item.volume, 0),
      volumeUltimaSemana: inPrevWeek.reduce((sum, item) => sum + item.volume, 0),
      exerciciosMaisFeitos: topExercises,
      diasSemTreinar,
      streakAtual,
      metaSemanal: 4,
      weekDays,
    };

    const stagnant = progressCards.find((item) => item.status === 'warning');
    const newestPr = prs.find((item) => item.novoPR);
    const neglected = this._findNeglectedGroup(normalized);

    const insights = [
      diasSemTreinar > 5 ? { tipo: 'alert', icon: 'clock', mensagem: `Você não treina há ${diasSemTreinar} dias. Que tal retomar hoje?` } : null,
      neglected ? { tipo: 'warning', icon: 'pie-chart', mensagem: `Você não treina ${neglected} há alguns dias — vale revisar esse grupo.` } : null,
      newestPr ? { tipo: 'success', icon: 'trophy', mensagem: `Novo PR no ${newestPr.exercicio}: ${newestPr.carga}kg × ${newestPr.reps} reps.` } : null,
      stagnant ? { tipo: 'info', icon: 'info', mensagem: `${stagnant.exercicio} está sem progresso recente. Veja as sugestões de ajuste.` } : null,
    ].filter(Boolean);

    return {
      summary,
      exerciseOptions,
      selectedExercise,
      byExercise,
      prs,
      radar,
      lowMuscleGroups,
      months,
      progressCards,
      weeklyVolumeSeries,
      insights,
    };
  },

  _mountEvolutionCharts(history, exercicios) {
    const analytics = this._computeEvolutionAnalytics(history, exercicios);
    const select = document.getElementById('evolution-exercise-select');
    if (select) {
      select.addEventListener('change', () => this._renderExerciseProgressChart(analytics.byExercise[select.value] || []));
    }

    this._renderExerciseProgressChart(analytics.byExercise[analytics.selectedExercise] || []);
    this._renderRadarChart(analytics.radar);
    this._renderWeeklyVolumeChart(analytics.weeklyVolumeSeries);
  },

  _renderExerciseProgressChart(records) {
    const canvas = document.getElementById('chart-exercise-progress');
    if (!canvas || !window.Chart) return;
    App.utils.destroyChart('exercise-progress');

    const ctx = canvas.getContext('2d');
    App.state.charts['exercise-progress'] = new window.Chart(ctx, {
      type: 'line',
      data: {
        labels: records.map((item) => item.semana),
        datasets: [
          {
            label: 'Carga máxima',
            data: records.map((item) => item.cargaMax),
            borderColor: '#818cf8',
            backgroundColor: 'rgba(99,102,241,0.22)',
            tension: 0.32,
            yAxisID: 'y',
          },
          {
            label: 'Volume total',
            data: records.map((item) => item.volume),
            borderColor: '#22c55e',
            borderDash: [6, 4],
            tension: 0.26,
            yAxisID: 'y1',
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { labels: { color: '#c4c4cc' } },
          tooltip: {
            callbacks: {
              label: (ctx) => {
                const item = records[ctx.dataIndex];
                if (ctx.dataset.label === 'Carga máxima') return `Carga: ${item.cargaMax} kg · reps máx: ${item.repsMax}`;
                return `Volume: ${this._formatNumber(item.volume)} kg`;
              },
            },
          },
        },
        scales: {
          x: { ticks: { color: '#8b8b97' }, grid: { color: 'rgba(255,255,255,0.05)' } },
          y: { ticks: { color: '#8b8b97' }, grid: { color: 'rgba(255,255,255,0.05)' } },
          y1: { position: 'right', ticks: { color: '#8b8b97' }, grid: { drawOnChartArea: false } },
        },
      },
      plugins: [{
        id: 'prMarker',
        afterDatasetsDraw: (chart) => {
          if (!records.length) return;
          const max = Math.max(...records.map((item) => item.cargaMax));
          const index = records.findIndex((item) => item.cargaMax === max);
          const meta = chart.getDatasetMeta(0).data[index];
          if (!meta) return;
          const { ctx } = chart;
          ctx.save();
          ctx.fillStyle = '#facc15';
          ctx.font = '14px sans-serif';
          ctx.fillText('PR', meta.x - 8, meta.y - 14);
          ctx.restore();
        },
      }],
    });
  },

  _renderRadarChart(radarData) {
    const canvas = document.getElementById('chart-radar-volume');
    if (!canvas || !window.Chart) return;
    App.utils.destroyChart('radar-volume');

    App.state.charts['radar-volume'] = new window.Chart(canvas.getContext('2d'), {
      type: 'radar',
      data: {
        labels: radarData.map((item) => item.grupo),
        datasets: [{
          label: 'Séries na semana',
          data: radarData.map((item) => item.volume),
          borderColor: '#818cf8',
          backgroundColor: 'rgba(99,102,241,0.2)',
          pointBackgroundColor: radarData.map((item) => (item.volume < 4 ? '#ef4444' : '#22c55e')),
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { labels: { color: '#c4c4cc' } } },
        scales: {
          r: {
            angleLines: { color: 'rgba(255,255,255,0.08)' },
            grid: { color: 'rgba(255,255,255,0.08)' },
            pointLabels: { color: '#c4c4cc' },
            ticks: { display: false },
            suggestedMax: Math.max(8, ...radarData.map((item) => item.volume + 1)),
          },
        },
      },
    });
  },

  _renderWeeklyVolumeChart(series) {
    const canvas = document.getElementById('chart-weekly-volume');
    if (!canvas || !window.Chart) return;
    App.utils.destroyChart('weekly-volume');
    const avg = series.length ? series.reduce((sum, item) => sum + item.volume, 0) / series.length : 0;

    App.state.charts['weekly-volume'] = new window.Chart(canvas.getContext('2d'), {
      data: {
        labels: series.map((item) => item.label),
        datasets: [
          {
            type: 'bar',
            label: 'Volume semanal',
            data: series.map((item) => item.volume),
            backgroundColor: series.map((item, index) => index === series.length - 1 ? '#818cf8' : 'rgba(99,102,241,0.45)'),
            borderRadius: 10,
          },
          {
            type: 'line',
            label: 'Média',
            data: series.map(() => avg),
            borderColor: '#22c55e',
            borderDash: [6, 4],
            pointRadius: 0,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { labels: { color: '#c4c4cc' } },
          tooltip: {
            callbacks: {
              afterBody: (items) => {
                const idx = items[0].dataIndex;
                const item = series[idx];
                return [
                  `Treinos: ${item.treinos}`,
                  `Grupo foco: ${item.grupos}`,
                  `Exercício principal: ${item.topExercise}`,
                ];
              },
            },
          },
        },
        scales: {
          x: { ticks: { color: '#8b8b97' }, grid: { display: false } },
          y: { ticks: { color: '#8b8b97' }, grid: { color: 'rgba(255,255,255,0.05)' } },
        },
      },
    });
  },

  _groupByExercise(normalized) {
    return normalized.reduce((acc, item) => {
      if (!acc[item.name]) acc[item.name] = [];
      acc[item.name].push(item);
      return acc;
    }, {});
  },

  _buildPrCards(byExercise, now) {
    return Object.entries(byExercise)
      .map(([name, records]) => {
        const best = [...records].sort((a, b) => (b.carga || 0) - (a.carga || 0))[0];
        const diffDays = Math.floor((now - best.date) / 86400000);
        return {
          exercicio: name,
          carga: best.carga || 0,
          reps: best.reps || 0,
          data: best.date.toLocaleDateString('pt-BR'),
          novoPR: diffDays <= 7,
        };
      })
      .sort((a, b) => b.carga - a.carga)
      .slice(0, 6);
  },

  _buildWeeklyVolumeSeries(normalized, count) {
    const end = new Date(`${App.utils.today()}T12:00:00`);
    const weeks = [];
    for (let i = count - 1; i >= 0; i--) {
      const start = this._weekRange(end, -7 * i).start;
      const finish = this._weekRange(end, -7 * i).end;
      const items = normalized.filter((item) => item.date >= start && item.date <= finish);
      const groups = Object.entries(items.reduce((acc, item) => {
        acc[item.group] = (acc[item.group] || 0) + item.volume;
        return acc;
      }, {})).sort((a, b) => b[1] - a[1]);
      const topExercise = Object.entries(items.reduce((acc, item) => {
        acc[item.name] = (acc[item.name] || 0) + item.volume;
        return acc;
      }, {})).sort((a, b) => b[1] - a[1])[0]?.[0] || '—';

      weeks.push({
        label: `Sem ${count - i}`,
        volume: items.reduce((sum, item) => sum + item.volume, 0),
        treinos: new Set(items.map((item) => this._dateKey(item.date))).size,
        grupos: groups.slice(0, 2).map(([group]) => group).join(', ') || 'Sem foco definido',
        topExercise,
      });
    }
    return weeks;
  },

  _buildRadarData(items) {
    const order = ['Peito', 'Costas', 'Pernas', 'Ombros', 'Bíceps', 'Tríceps', 'Core'];
    const map = items.reduce((acc, item) => {
      const group = item.group === 'Ombro' ? 'Ombros' : item.group;
      acc[group] = (acc[group] || 0) + (Number(item.series) || 0);
      return acc;
    }, {});

    return order.map((grupo) => ({ grupo, volume: map[grupo] || 0 }));
  },

  _buildMonthData(baseDate, normalized) {
    const year = baseDate.getFullYear();
    const month = baseDate.getMonth();
    const first = new Date(year, month, 1);
    const last = new Date(year, month + 1, 0);
    const label = first.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    const days = [];

    for (let day = 1; day <= last.getDate(); day++) {
      const date = new Date(year, month, day, 12);
      const key = this._dateKey(date);
      const items = normalized.filter((item) => this._dateKey(item.date) === key);
      const full = items.some((item) => (Number(item.series) || 0) >= 3);
      days.push({
        day,
        level: !items.length ? 'none' : full ? 'strong' : 'light',
      });
    }

    return { label, days };
  },

  _buildMonthHeatmap(month) {
    return `
      <div class="heatmap-panel">
        <div class="heatmap-title">${month.label}</div>
        <div class="month-heatmap-grid">
          ${month.days.map((day) => `<span class="heatmap-cell ${day.level}" title="Dia ${day.day}"></span>`).join('')}
        </div>
      </div>
    `;
  },

  _weekRange(baseDate, offsetDays = 0) {
    const anchor = new Date(baseDate);
    anchor.setDate(anchor.getDate() + offsetDays);
    const day = anchor.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    const start = new Date(anchor);
    start.setDate(anchor.getDate() + diff);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  },

  _buildWeekHeatmap(items, weekStart) {
    const labels = ['S', 'T', 'Q', 'Q', 'S', 'S', 'D'];
    return labels.map((label, index) => {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + index);
      const dayItems = items.filter((item) => this._dateKey(item.date) === this._dateKey(date));
      const level = !dayItems.length ? 'none' : dayItems.some((item) => (Number(item.series) || 0) >= 3) ? 'strong' : 'light';
      return { label, level };
    });
  },

  _analisarProgressao(exercicio, records) {
    const weekly = this._aggregateWeeklyExercise(records);
    const ultimas = weekly.slice(-4);
    if (ultimas.length < 2) {
      return { exercicio, status: 'stable', label: 'Dados iniciais', mensagem: 'Ainda há poucas semanas registradas para análise robusta.', sugestoes: ['Continue registrando carga, reps e séries em todas as sessões.'] };
    }

    const first = ultimas[0].cargaMax || 0;
    const last = ultimas[ultimas.length - 1].cargaMax || 0;
    const crescimento = first > 0 ? (((last - first) / first) * 100) : 0;
    let semanasSemProgresso = 0;
    for (let i = ultimas.length - 1; i > 0; i--) {
      if (ultimas[i].cargaMax <= ultimas[i - 1].cargaMax) semanasSemProgresso++;
      else break;
    }

    if (semanasSemProgresso >= 3) {
      return {
        exercicio,
        status: 'warning',
        label: 'Estagnado',
        mensagem: 'Sem progressão há 3 semanas.',
        sugestoes: [
          'Tente adicionar 1 série extra por sessão.',
          'Reduza o RIR para 0–1 em um bloco curto.',
          'Considere um deload antes de subir a sobrecarga.',
          'Troque a variação do exercício temporariamente.',
          'Revise sono, alimentação e recuperação.',
        ],
      };
    }

    if (crescimento > 10) {
      return {
        exercicio,
        status: 'excellent',
        label: 'Evoluindo bem',
        mensagem: `+${crescimento.toFixed(1)}% de carga nas últimas 4 semanas.`,
        sugestoes: [
          'Mantenha a progressão atual enquanto a técnica estiver sólida.',
          'Garanta que a amplitude e o controle continuam estáveis.',
        ],
      };
    }

    if (crescimento < 0) {
      return {
        exercicio,
        status: 'danger',
        label: 'Regressão',
        mensagem: 'A carga máxima caiu nas últimas semanas.',
        sugestoes: [
          'Cheque fadiga acumulada e qualidade do descanso.',
          'Reduza o volume por alguns dias e reconstrua a intensidade.',
        ],
      };
    }

    return {
      exercicio,
      status: 'stable',
      label: 'Progresso estável',
      mensagem: 'A evolução está controlada e consistente.',
      sugestoes: [
        'Use dupla progressão antes de forçar novos saltos de carga.',
        'Busque reps de qualidade no topo da faixa antes de subir peso.',
      ],
    };
  },

  _aggregateWeeklyExercise(records) {
    const buckets = {};
    records.forEach((item) => {
      const { week, year } = this._weekNumber(item.date);
      const key = `${year}-${week}`;
      if (!buckets[key]) buckets[key] = { semana: `Sem ${Object.keys(buckets).length + 1}`, cargaMax: 0, volume: 0, repsMax: 0 };
      buckets[key].cargaMax = Math.max(buckets[key].cargaMax, Number(item.carga) || 0);
      buckets[key].volume += item.volume;
      buckets[key].repsMax = Math.max(buckets[key].repsMax, Number(item.reps) || 0);
    });
    return Object.values(buckets);
  },

  _weekNumber(date) {
    const target = new Date(date.valueOf());
    const dayNr = (date.getDay() + 6) % 7;
    target.setDate(target.getDate() - dayNr + 3);
    const firstThursday = new Date(target.getFullYear(), 0, 4);
    const diff = target - firstThursday;
    return { year: target.getFullYear(), week: 1 + Math.round(diff / 604800000) };
  },

  _findNeglectedGroup(normalized) {
    if (!normalized.length) return null;
    const today = new Date(`${App.utils.today()}T12:00:00`);
    const latestByGroup = {};
    normalized.forEach((item) => {
      latestByGroup[item.group] = item.date;
    });
    const sorted = Object.entries(latestByGroup)
      .map(([group, date]) => ({ group, diff: Math.floor((today - date) / 86400000) }))
      .sort((a, b) => b.diff - a.diff);
    return sorted[0]?.diff >= 10 ? sorted[0].group : null;
  },

  _progressionMethods() {
    return [
      {
        nome: 'Progressão Linear',
        icon: 'trending-up',
        descricao: 'Adicione pequenas cargas semanais enquanto a técnica continua limpa e a recuperação acompanha.',
        quando: 'Melhor fase para iniciantes.',
        estudo: 'Rhea et al. (2003) — JSCR: progressão linear é muito eficiente em iniciantes.',
      },
      {
        nome: 'Dupla Progressão',
        icon: 'refresh',
        descricao: 'Primeiro suba repetições dentro da faixa alvo; só depois aumente a carga e reinicie a faixa.',
        quando: 'Intermediários com boa constância de treino.',
        estudo: 'Schoenfeld (2017): estratégia equilibrada para hipertrofia e força.',
      },
      {
        nome: 'Progressão por Volume',
        icon: 'layers',
        descricao: 'Aumente séries ao longo das semanas antes de mexer no peso.',
        quando: 'Quando a carga para de subir, mas ainda há margem de recuperação.',
        estudo: 'Krieger (2010) — JSCR: volume progressivo é relevante para hipertrofia.',
      },
      {
        nome: 'Progressão por RIR',
        icon: 'target',
        descricao: 'Aproxime a série da falha ao longo das semanas e depois reinicie o bloco com carga maior.',
        quando: 'Avançados ou blocos com autorregulação.',
        estudo: 'Helms et al. (2018): RIR superou % fixo de 1RM em vários cenários práticos.',
      },
      {
        nome: 'Deload Estratégico',
        icon: 'refresh',
        descricao: 'Reduza volume e deixe o corpo absorver a fadiga antes do próximo bloco.',
        quando: 'A cada 4–6 semanas ou em sinais de queda de performance.',
        estudo: 'Issurin (2010) — Sports Medicine: deload melhora a adaptação do ciclo.',
      },
    ];
  },

  _dateKey(date) {
    return new Date(date).toISOString().split('T')[0];
  },

  _formatNumber(value) {
    return Math.round(value || 0).toLocaleString('pt-BR');
  },

  _openPerfilModal() {
    App.modal.open('modal-perfil', 'Editar Perfil', () => this._savePerfil());

    App.data.getProfile(App.state.user?.id).then((profile) => {
      App.data.getAlunoDetalhes(App.state.user?.id).then((detalhes) => {
        const p = profile || {};
        const d = detalhes || {};
        this._fillInput('pf-nome', p.nome || '');
        this._fillInput('pf-idade', d.idade || '');
        this._fillInput('pf-sexo', d.sexo || '');
        this._fillInput('pf-peso', d.peso || '');
        this._fillInput('pf-altura', d.altura || '');
        this._fillInput('pf-objetivo', d.objetivo || '');
        this._fillInput('pf-obs', d.observacoes || '');
      });
    });
  },

  async _savePerfil() {
    const userId = App.state.user?.id;
    if (!userId) return;

    const nome = document.getElementById('pf-nome')?.value?.trim() || '';
    const idade = Number(document.getElementById('pf-idade')?.value) || null;
    const sexo = document.getElementById('pf-sexo')?.value || null;
    const peso = Number(document.getElementById('pf-peso')?.value) || null;
    const altura = Number(document.getElementById('pf-altura')?.value) || null;
    const objetivo = document.getElementById('pf-objetivo')?.value || null;
    const observacoes = document.getElementById('pf-obs')?.value?.trim() || null;

    await App.data.updateProfile(userId, { nome });
    await App.data.upsertAlunoDetalhes(userId, { idade, sexo, peso, altura, objetivo, observacoes });

    App.state.user = { ...App.state.user, nome };
    App.boot.updateUserUI();
    App.modal.close();
    App.utils.toast('Perfil atualizado com sucesso!');
    await this.renderPerfil();
  },

  _openMedidasModal() {
    App.modal.open('modal-medidas', 'Registrar Medidas', () => this._saveMedidas());
    this._fillInput('med-data', App.utils.today());
  },

  async _saveMedidas() {
    const userId = App.state.user?.id;
    if (!userId) return;

    const fields = {
      data: document.getElementById('med-data')?.value || App.utils.today(),
      braco_d: this._num('med-braco-d'),
      braco_e: this._num('med-braco-e'),
      antebraco: this._num('med-antebraco'),
      ombro: this._num('med-ombro'),
      peito: this._num('med-peito'),
      cintura: this._num('med-cintura'),
      quadril: this._num('med-quadril'),
      panturrilha: this._num('med-panturrilha'),
      coxa_d: this._num('med-coxa-d'),
      coxa_e: this._num('med-coxa-e'),
      peso_data: this._num('med-peso'),
      notas: document.getElementById('med-notas')?.value?.trim() || null,
    };

    await App.data.saveMedida(userId, fields);
    App.modal.close();
    App.utils.toast('Medidas registradas com sucesso!');
    await this.renderPerfil();
  },

  _num(id) {
    const val = document.getElementById(id)?.value;
    if (val === '' || val == null) return null;
    const n = Number(val);
    return Number.isNaN(n) ? null : n;
  },

  _fillInput(id, value) {
    const el = document.getElementById(id);
    if (el) el.value = value ?? '';
  },

  async renderCiencia() {
    const container = document.getElementById('science-content');
    if (!container) return;

    container.innerHTML = App.utils.skeleton(5, 'skeleton-panel');
    const exercicios = await App.data.getExercicios();

    container.innerHTML = `
      <div class="science-shell">
        <div class="science-tabs">
          ${[
            ['metodos', 'Métodos Avançados de Treino', 'dna'],
            ['volume', 'Volume de Treino', 'gauge'],
            ['exercicios', 'Exercícios', 'dumbbell'],
            ['cardio', 'Cardio', 'activity'],
          ].map(([key, label, icon]) => `
            <button class="science-tab ${this._scienceTab === key ? 'active' : ''}" type="button" onclick="App.views.student.setScienceTab('${key}')">
              ${App.icons.get(icon, 16)} ${label}
            </button>
          `).join('')}
        </div>
        <div id="science-panel"></div>
      </div>
    `;

    this._renderSciencePanel(exercicios || []);
  },

  async setScienceTab(tab) {
    this._scienceTab = tab;
    await this.renderCiencia();
  },

  async _renderSciencePanel(exercicios) {
    const panel = document.getElementById('science-panel');
    if (!panel) return;

    if (this._scienceTab === 'metodos') {
      panel.innerHTML = this._renderMetodosSection();
      return;
    }

    if (this._scienceTab === 'volume') {
      panel.innerHTML = this._renderVolumeSection();
      return;
    }

    if (this._scienceTab === 'exercicios') {
      panel.innerHTML = this._renderScienceExercises(exercicios);
      const input = document.getElementById('science-exercise-search');
      if (input) {
        input.addEventListener('input', App.utils.debounce(async () => {
          this._scienceExerciseSearch = input.value || '';
          const list = App.state.exerciseList.length ? App.state.exerciseList : await App.data.getExercicios();
          this._renderSciencePanel(list);
        }, 300));
      }
      return;
    }

    panel.innerHTML = this._renderScienceCardioSummary();
  },

  _renderMetodosSection() {
    return `
      <div class="section-card">
        <div class="section-header">
          <div>
            <div class="section-label">Métodos avançados</div>
            <h3>Ferramentas para intensidade, densidade e autorregulação</h3>
          </div>
          <span class="badge badge-neutral">${metodosAvancados.length} métodos</span>
        </div>
        <div class="science-grid science-methods">
          ${metodosAvancados.map((metodo, index) => this._buildMetodoCard(metodo, index)).join('')}
        </div>
      </div>
    `;
  },

  _buildMetodoCard(metodo, index) {
    const isOpen = Boolean(this._scienceOpenMethods[index]);
    return `
      <article class="method-card ${isOpen ? 'open' : ''}">
        <button class="method-card-head" type="button" onclick="App.views.student.toggleMetodo(${index})">
          <div class="method-card-title">
            <span class="method-icon">${App.icons.get(metodo.icone, 18)}</span>
            <div>
              <h4>${App.utils.esc(metodo.nome)}</h4>
              <div class="method-card-meta">
                <span class="level-badge ${this._levelClass(metodo.nivel)}">${App.utils.esc(metodo.nivel)}</span>
                ${metodo.indicacao.map((tag) => `<span class="chip science-chip">${App.utils.esc(tag)}</span>`).join('')}
              </div>
            </div>
          </div>
          <span class="method-expand">${App.icons.get(isOpen ? 'chevron-up' : 'chevron-down', 16)}</span>
        </button>

        <div class="method-card-body ${isOpen ? '' : 'hidden'}">
          <p class="method-description">${App.utils.esc(metodo.descricao)}</p>
          <div class="science-example">
            <div class="science-example-label">Exemplo prático</div>
            <strong>${App.utils.esc(metodo.exemplo || metodo.dica || '')}</strong>
          </div>

          ${metodo.tabela ? `
            <div class="rir-table-wrap">
              <table class="rir-table">
                <thead>
                  <tr><th>Faixa</th><th>Significado</th><th>Sensação</th></tr>
                </thead>
                <tbody>
                  ${metodo.tabela.map((row) => `
                    <tr>
                      <td>${App.utils.esc(row.rir)}</td>
                      <td>${App.utils.esc(row.significado)}</td>
                      <td>${App.utils.esc(row.sensacao)}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          ` : ''}

          ${metodo.dica ? `<p class="method-tip">${App.icons.get('info', 14)} ${App.utils.esc(metodo.dica)}</p>` : ''}
          ${metodo.avisos?.length ? `<div class="science-warning">${metodo.avisos.map((item) => `<p>${App.icons.get('alert-triangle', 14)} ${App.utils.esc(item)}</p>`).join('')}</div>` : ''}

          <div class="study-list">
            ${metodo.estudos.map((estudo) => `<div class="study-item"><em>${App.utils.esc(estudo)}</em></div>`).join('')}
          </div>

          <a class="btn btn-secondary btn-sm" href="${metodo.videoUrl}" target="_blank" rel="noopener noreferrer">
            ${App.icons.get('play-circle', 15)} Ver execução
          </a>
        </div>
      </article>
    `;
  },

  toggleMetodo(index) {
    this._scienceOpenMethods[index] = !this._scienceOpenMethods[index];
    this.renderCiencia();
  },

  _levelClass(level) {
    if (/todos|iniciante/i.test(level)) return 'level-green';
    if (/intermedi/i.test(level) && !/avançado/i.test(level)) return 'level-yellow';
    if (/avançado/i.test(level) && !/intermedi/i.test(level)) return 'level-red';
    return 'level-yellow';
  },

  _renderVolumeSection() {
    return `
      <div class="science-stack">
        <div class="section-card">
          <div class="section-header">
            <div>
              <div class="section-label">Volume de treino</div>
              <h3>Entenda a dose certa para crescer</h3>
            </div>
          </div>
          <div class="science-text-block">
            <p><strong>Volume de treino = séries × repetições × carga.</strong></p>
            <p>É um dos principais motores da hipertrofia no longo prazo, mas a resposta é dose-dependente: pouco volume gera estímulo fraco, e excesso de volume cobra recuperação demais.</p>
          </div>
        </div>

        <div class="science-grid threshold-grid">
          ${limiares.map((item) => `
            <article class="threshold-card">
              <div class="threshold-header">
                <span class="threshold-icon" style="color:${item.cor}">${App.icons.get(item.icone, 18, item.cor)}</span>
                <div>
                  <div class="threshold-sigla">${item.sigla}</div>
                  <h4>${item.nome}</h4>
                </div>
              </div>
              <div class="threshold-gauge">
                <div class="threshold-gauge-fill" style="width:${item.gauge}%; background:${item.cor}"></div>
              </div>
              <p>${item.descricao}</p>
              <div class="study-item"><em>${item.referencia}</em></div>
              <div class="science-example compact">
                <div class="science-example-label">Exemplo</div>
                <strong>${item.exemplo}</strong>
              </div>
            </article>
          `).join('')}
        </div>

        <div class="section-card">
          <div class="section-header">
            <div>
              <div class="section-label">Risco de excesso</div>
              <h3>Por que volume alto pode ser ruim</h3>
            </div>
          </div>
          <div class="science-grid issue-grid">
            ${problemasVolume.map((item) => `
              <article class="issue-card">
                <div class="issue-head">
                  <span class="issue-icon">${App.icons.get(item.icone, 18)}</span>
                  <h4>${item.titulo}</h4>
                </div>
                <p>${item.descricao}</p>
                <div class="study-item"><em>${item.estudo}</em></div>
              </article>
            `).join('')}
          </div>
        </div>

        <div class="section-card">
          <div class="section-header">
            <div>
              <div class="section-label">Referência prática</div>
              <h3>Faixas semanais por grupo muscular</h3>
            </div>
            <span class="badge badge-neutral">Israetel, Hoffman & Smith (2019)</span>
          </div>
          <div class="volume-groups-grid">
            ${volumePorGrupo.map((item) => `
              <article class="volume-group-card">
                <div class="volume-group-head">
                  <span>${App.icons.get(item.icone, 16)}</span>
                  <h4>${item.grupo}</h4>
                </div>
                <div class="volume-progress">
                  <div class="volume-progress-segment mev"></div>
                  <div class="volume-progress-segment mav"></div>
                  <div class="volume-progress-segment mrv"></div>
                </div>
                <div class="volume-stats">
                  <span>MEV: ${item.mev}</span>
                  <span>MAV: ${item.mav}</span>
                  <span>MRV: ${item.mrv}</span>
                </div>
              </article>
            `).join('')}
          </div>
        </div>

        <div class="section-card">
          <div class="section-header">
            <div>
              <div class="section-label">Periodização</div>
              <h3>Como periodizar o volume</h3>
            </div>
          </div>
          <div class="science-table-wrap">
            <table class="science-table">
              <thead>
                <tr>
                  <th>Fase</th>
                  <th>Duração</th>
                  <th>Volume</th>
                  <th>Intensidade</th>
                  <th>Objetivo</th>
                  <th>Métodos</th>
                </tr>
              </thead>
              <tbody>
                ${periodizacaoVolume.map((row) => `
                  <tr>
                    <td>${row.fase}</td>
                    <td>${row.duracao}</td>
                    <td>${row.volume}</td>
                    <td>${row.intensidade}</td>
                    <td>${row.objetivo}</td>
                    <td>${row.metodos}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  },

  _renderScienceExercises(exercicios) {
    const groups = ['Todos', 'Peito', 'Costas', 'Pernas', 'Ombro', 'Bíceps', 'Tríceps', 'Core', 'Cardio'];
    const q = this._scienceExerciseSearch.trim().toLowerCase();
    const filtered = exercicios.filter((ex) => {
      const group = ex.grupo_muscular === 'Glúteos' ? 'Pernas' : ex.grupo_muscular;
      const matchQuery = !q || (ex.nome || '').toLowerCase().includes(q) || (ex.execucao || '').toLowerCase().includes(q);
      const matchGroup = this._scienceExerciseGroup === 'Todos' || group === this._scienceExerciseGroup;
      return matchQuery && matchGroup;
    });

    return `
      <div class="section-card">
        <div class="section-header">
          <div>
            <div class="section-label">Exercícios</div>
            <h3>Biblioteca prática para técnica e escolha inteligente</h3>
          </div>
          <span class="badge badge-neutral">${filtered.length} resultados</span>
        </div>
        <div class="science-toolbar">
          <div class="search-field">
            <span class="search-icon">${App.icons.get('search', 16)}</span>
            <input type="search" id="science-exercise-search" value="${App.utils.esc(this._scienceExerciseSearch)}" placeholder="Buscar exercício ou execução">
          </div>
          <div class="science-chip-row">
            ${groups.map((group) => `
              <button class="filter-chip ${this._scienceExerciseGroup === group ? 'active' : ''}" type="button" onclick="App.views.student.setScienceExerciseGroup('${group}')">
                ${group}
              </button>
            `).join('')}
          </div>
        </div>
        <div class="science-grid exercise-reference-grid">
          ${filtered.length ? filtered.slice(0, 24).map((ex) => `
            <article class="exercise-reference-card">
              <div class="exercise-reference-top">
                <span class="exercise-reference-icon">${App.icons.get(this._exerciseIcon(ex.grupo_muscular), 16)}</span>
                <span class="badge-sm badge-type">${App.utils.esc(App.EXERCISE_TYPES[ex.tipo] || ex.tipo || '—')}</span>
              </div>
              <h4>${App.utils.esc(ex.nome)}</h4>
              <div class="badge-sm badge-muscle">${App.utils.esc(ex.grupo_muscular || 'Geral')}</div>
              <p>${App.utils.esc(ex.execucao || 'Mantenha amplitude controlada, técnica consistente e proximidade adequada da falha.')}</p>
              ${ex.equipamento ? `<div class="exercise-reference-equip">${App.icons.get('info', 13)} ${App.utils.esc(ex.equipamento)}</div>` : ''}
            </article>
          `).join('') : App.utils.emptyState({ icon: 'search', title: 'Nenhum exercício encontrado', text: 'Ajuste a busca ou troque o grupo muscular para ampliar a biblioteca.' })}
        </div>
      </div>
    `;
  },

  async setScienceExerciseGroup(group) {
    this._scienceExerciseGroup = group;
    const list = App.state.exerciseList.length ? App.state.exerciseList : await App.data.getExercicios();
    this._renderSciencePanel(list);
  },

  _exerciseIcon(group) {
    const map = {
      Peito: 'shield',
      Costas: 'layers',
      Pernas: 'activity',
      Glúteos: 'activity',
      Ombro: 'trending-up',
      Bíceps: 'dumbbell',
      Tríceps: 'zap',
      Core: 'target',
      Cardio: 'heart',
    };
    return map[group] || 'dumbbell';
  },

  _renderScienceCardioSummary() {
    return `
      <div class="section-card">
        <div class="section-header">
          <div>
            <div class="section-label">Cardio</div>
            <h3>Modalidades, gasto e indicação prática</h3>
          </div>
          <button class="btn btn-secondary btn-sm" type="button" onclick="App.boot.navigateTo('cardio')">
            ${App.icons.get('activity', 15)} Abrir guia completa
          </button>
        </div>
        <div class="science-grid cardio-summary-grid">
          ${modalidadesCardio.slice(0, 4).map((item) => `
            <article class="cardio-mini-card">
              <div class="cardio-mini-head">
                <span>${App.icons.get(item.icone, 16)}</span>
                <h4>${item.nome}</h4>
              </div>
              <p>${item.indicado}</p>
              <div class="cardio-mini-meta">${item.calorias} · ${item.duracao}</div>
            </article>
          `).join('')}
        </div>
      </div>
    `;
  },

  renderCardio() {
    const container = document.getElementById('cardio-content');
    if (!container) return;

    container.innerHTML = `
      <div class="section-card">
        <div class="section-header">
          <div>
            <div class="section-label">Modalidades</div>
            <h3>Escolha o cardio pelo objetivo e pela recuperação</h3>
          </div>
          <span class="badge badge-neutral">${modalidadesCardio.length} modalidades</span>
        </div>
        <div class="science-toolbar">
          <div class="search-field">
            <span class="search-icon">${App.icons.get('search', 16)}</span>
            <input type="search" id="cardio-search" value="${App.utils.esc(this._cardioSearch)}" placeholder="Buscar modalidade, benefício ou indicação">
          </div>
        </div>
        <div id="cardio-list">${this._renderCardioList()}</div>
      </div>
    `;

    const input = document.getElementById('cardio-search');
    if (input) {
      input.addEventListener('input', App.utils.debounce(() => {
        this._cardioSearch = input.value || '';
        const list = document.getElementById('cardio-list');
        if (list) list.innerHTML = this._renderCardioList();
      }, 300));
    }
  },

  _renderCardioList() {
    const q = this._cardioSearch.trim().toLowerCase();
    const filtered = modalidadesCardio.filter((item) => {
      const hay = [
        item.nome,
        item.calorias,
        item.intensidade,
        item.duracao,
        item.indicado,
        ...(item.beneficios || []),
        ...(item.dicas || []),
      ].join(' ').toLowerCase();
      return !q || hay.includes(q);
    });

    if (!filtered.length) {
      return App.utils.emptyState({
        icon: 'search',
        title: 'Nenhuma modalidade encontrada',
        text: 'Tente buscar por objetivo, intensidade ou pelo nome do cardio.',
      });
    }

    return `
      <div class="science-grid cardio-grid">
        ${filtered.map((item) => `
          <article class="cardio-card">
            <div class="cardio-card-head">
              <div class="cardio-card-title">
                <span class="cardio-card-icon">${App.icons.get(item.icone, 18)}</span>
                <div>
                  <h4>${item.nome}</h4>
                  <p>${item.indicado}</p>
                </div>
              </div>
              <span class="badge badge-neutral">${item.duracao}</span>
            </div>
            <div class="cardio-metrics">
              <div><span>Calorias</span><strong>${item.calorias}</strong></div>
              <div><span>Intensidade</span><strong>${item.intensidade}</strong></div>
            </div>
            <div class="cardio-benefits">
              ${item.beneficios.map((beneficio) => `<span class="chip science-chip">${beneficio}</span>`).join('')}
            </div>
            <div class="cardio-tips">
              ${item.dicas.map((dica) => `<p>${App.icons.get('check', 13)} ${App.utils.esc(dica)}</p>`).join('')}
            </div>
            ${item.estudo ? `<div class="study-item"><em>${App.utils.esc(item.estudo)}</em></div>` : ''}
          </article>
        `).join('')}
      </div>
    `;
  },
};

/* -----------------------------------------------------------------
   Complementos da área do aluno para treino enriquecido e conteúdo
   prático sem quebrar a estrutura original do arquivo.
   ----------------------------------------------------------------- */
App.views.student.renderTreino = async function renderTreino() {
  const el = document.getElementById('treino-content');
  if (!el) return;

  const treino = App.state.workout;

  if (!treino) {
    el.innerHTML = `
      <div class="empty-state large">
        <div class="empty-icon">${App.icons.get('dumbbell', 48)}</div>
        <h2>Sem treino atribuído</h2>
        <p>Seu treinador ainda não criou um treino para você. Quando houver um treino ativo, ele aparecerá aqui automaticamente.</p>
      </div>
    `;
    return;
  }

  const exercicios = (treino.treino_exercicios || []).sort((a, b) => a.ordem - b.ordem);

  el.innerHTML = `
    <div class="treino-header">
      <div class="treino-title-block">
        <h2>${App.utils.esc(treino.nome)}</h2>
        ${treino.descricao ? `<p class="treino-desc">${App.utils.esc(treino.descricao)}</p>` : ''}
      </div>
      <div class="treino-meta">
        <span class="badge badge-primary">${App.icons.get('dumbbell', 13)} ${exercicios.length} exercícios</span>
        <span class="badge badge-neutral">${App.icons.get('calendar', 13)} ${App.utils.fmtDate((treino.updated_at || treino.created_at || '').split('T')[0] || (treino.updated_at || treino.created_at))}</span>
      </div>
    </div>

    <div class="exercise-quick-guide-grid">
      ${treinoQuickGuides.map((item) => `
        <article class="exercise-quick-guide">
          <div class="exercise-quick-guide-head">
            <span class="exercise-quick-guide-icon">${App.icons.get(item.icone, 16)}</span>
            <strong>${App.utils.esc(item.titulo)}</strong>
          </div>
          <p>${App.utils.esc(item.texto)}</p>
        </article>
      `).join('')}
    </div>

    <div class="exercise-list">
      ${exercicios.length ? exercicios.map((te, i) => this._buildExerciseCard(te, i)).join('') : `<p class="empty-text">Nenhum exercício adicionado ainda.</p>`}
    </div>
  `;
};

App.views.student._buildExerciseCard = function _buildExerciseCard(te, idx) {
  const ex = te.exercicios || {};
  const typeLabel = App.utils.getExerciseTypeLabel(ex.tipo);
  const normalizedGroup = App.utils.normalizeMuscleGroup(ex.grupo_muscular);
  const videoUrl = App.utils.sanitizeUrl(ex.video_url);
  const scientificNote = ex.observacao_cientifica || '';

  return `
    <div class="exercise-card" id="ex-card-${te.id}">
      <div class="ex-card-header" onclick="App.views.student._toggleExCard(${te.id})">
        <div class="ex-card-left">
          <span class="ex-num">${idx + 1}</span>
          <div>
            <div class="exercise-title-inline">
              <div class="ex-name">${App.utils.esc(ex.nome || 'Exercício')}</div>
              ${videoUrl ? `
                <a
                  class="btn-video-inline"
                  href="${App.utils.esc(videoUrl)}"
                  target="_blank"
                  rel="noopener noreferrer"
                  onclick="event.stopPropagation()"
                >
                  ${App.icons.get('play-circle', 13)} Ver execução
                </a>
              ` : ''}
            </div>
            <div class="ex-meta">
              <span class="badge-sm badge-muscle">${App.utils.esc(normalizedGroup)}</span>
              <span class="badge-sm badge-type">${App.utils.esc(typeLabel)}</span>
            </div>
          </div>
        </div>

        <div class="ex-card-right">
          <div class="ex-sets">${te.series}×${App.utils.esc(te.repeticoes)}</div>
          <span class="ex-expand-icon" id="ex-icon-${te.id}">
            ${App.icons.get('chevron-down', 16)}
          </span>
        </div>
      </div>

      <div class="ex-card-body hidden" id="ex-body-${te.id}">
        <div class="ex-details-grid">
          <div class="ex-detail-item">
            <div class="ex-detail-label">Grupo muscular</div>
            <div class="ex-detail-val">${App.utils.esc(normalizedGroup)}</div>
          </div>

          <div class="ex-detail-item">
            <div class="ex-detail-label">Tipo</div>
            <div class="ex-detail-val">${App.utils.esc(typeLabel)}</div>
          </div>

          <div class="ex-detail-item">
            <div class="ex-detail-label">Séries</div>
            <div class="ex-detail-val">${te.series}</div>
          </div>

          <div class="ex-detail-item">
            <div class="ex-detail-label">Repetições</div>
            <div class="ex-detail-val">${App.utils.esc(te.repeticoes)}</div>
          </div>

          <div class="ex-detail-item">
            <div class="ex-detail-label">Descanso</div>
            <div class="ex-detail-val">${App.utils.esc(te.descanso || '60s')}</div>
          </div>

          ${te.observacoes ? `
            <div class="ex-detail-item ex-detail-wide">
              <div class="ex-detail-label">Observações do treinador</div>
              <div class="ex-detail-val">${App.utils.esc(te.observacoes)}</div>
            </div>
          ` : ''}
        </div>

        ${ex.execucao ? `
          <div class="exercise-note-card">
            <div class="exercise-note-head">
              <span class="exercise-note-icon">${App.icons.get('activity', 14)}</span>
              <strong>Dica de execução</strong>
            </div>
            <p>${App.utils.esc(ex.execucao)}</p>
          </div>
        ` : ''}

        ${ex.equipamento ? `
          <div class="exercise-note-card">
            <div class="exercise-note-head">
              <span class="exercise-note-icon">${App.icons.get('gauge', 14)}</span>
              <strong>Equipamento</strong>
            </div>
            <p>${App.utils.esc(ex.equipamento)}</p>
          </div>
        ` : ''}

        ${scientificNote ? `
          <div class="exercise-note-card scientific">
            <div class="exercise-note-head">
              <span class="exercise-note-icon">${App.icons.get('book-open', 14)}</span>
              <strong>Observação científica</strong>
            </div>
            <p>${App.utils.esc(scientificNote)}</p>
          </div>
        ` : ''}
      </div>
    </div>
  `;
};

App.views.student._renderScienceExercises = function _renderScienceExercises(exercicios) {
  const groups = ['Todos', 'Peito', 'Costas', 'Pernas', 'Ombro', 'Bíceps', 'Tríceps', 'Core', 'Cardio'];
  const q = this._scienceExerciseSearch.trim().toLowerCase();
  const filtered = exercicios.filter((ex) => {
    const group = App.utils.normalizeMuscleGroup(ex.grupo_muscular);
    const haystack = [
      ex.nome,
      ex.execucao,
      ex.equipamento,
      ex.observacao_cientifica,
    ].join(' ').toLowerCase();
    const matchQuery = !q || haystack.includes(q);
    const matchGroup = this._scienceExerciseGroup === 'Todos' || group === this._scienceExerciseGroup;
    return matchQuery && matchGroup;
  });

  return `
    <div class="section-card">
      <div class="section-header">
        <div>
          <div class="section-label">Exercícios</div>
          <h3>Biblioteca prática para técnica e escolha inteligente</h3>
        </div>
        <span class="badge badge-neutral">${filtered.length} resultados</span>
      </div>
      <div class="science-toolbar">
        <div class="search-field">
          <span class="search-icon">${App.icons.get('search', 16)}</span>
          <input type="search" id="science-exercise-search" value="${App.utils.esc(this._scienceExerciseSearch)}" placeholder="Buscar exercício, execução ou observação">
        </div>
        <div class="science-chip-row">
          ${groups.map((group) => `
            <button class="filter-chip ${this._scienceExerciseGroup === group ? 'active' : ''}" type="button" onclick="App.views.student.setScienceExerciseGroup('${group}')">
              ${group}
            </button>
          `).join('')}
        </div>
      </div>
      <div class="science-grid exercise-reference-grid">
        ${filtered.length ? filtered.slice(0, 24).map((ex) => `
          <article class="exercise-reference-card">
            <div class="exercise-reference-top">
              <span class="exercise-reference-icon">${App.icons.get(this._exerciseIcon(ex.grupo_muscular), 16)}</span>
              <span class="badge-sm badge-type">${App.utils.esc(App.utils.getExerciseTypeLabel(ex.tipo))}</span>
            </div>
            <h4>${App.utils.esc(ex.nome)}</h4>
            <div class="exercise-reference-badges">
              <div class="badge-sm badge-muscle">${App.utils.esc(App.utils.normalizeMuscleGroup(ex.grupo_muscular))}</div>
              ${ex.video_url ? `<div class="badge-sm badge-neutral">${App.icons.get('play-circle', 12)} vídeo</div>` : ''}
            </div>
            <p>${App.utils.esc(ex.execucao || 'Mantenha amplitude controlada, técnica consistente e proximidade adequada da falha.')}</p>
            ${ex.observacao_cientifica ? `<div class="science-note-inline">${App.icons.get('book-open', 13)} ${App.utils.esc(ex.observacao_cientifica)}</div>` : ''}
            ${ex.equipamento ? `<div class="exercise-reference-equip">${App.icons.get('gauge', 13)} ${App.utils.esc(ex.equipamento)}</div>` : ''}
          </article>
        `).join('') : App.utils.emptyState({ icon: 'search', title: 'Nenhum exercício encontrado', text: 'Ajuste a busca ou troque o grupo muscular para ampliar a biblioteca.' })}
      </div>
    </div>
  `;
};

App.views.student._renderScienceCardioSummary = function _renderScienceCardioSummary() {
  return `
    <div class="science-stack">
      <div class="section-card">
        <div class="section-header">
          <div>
            <div class="section-label">Cardio</div>
            <h3>Modalidades, gasto e indicação prática</h3>
          </div>
          <button class="btn btn-secondary btn-sm" type="button" onclick="App.boot.navigateTo('cardio')">
            ${App.icons.get('activity', 15)} Abrir guia completa
          </button>
        </div>
        <div class="science-grid cardio-summary-grid">
          ${modalidadesCardio.slice(0, 4).map((item) => `
            <article class="cardio-mini-card">
              <div class="cardio-mini-head">
                <span>${App.icons.get(item.icone, 16)}</span>
                <h4>${item.nome}</h4>
              </div>
              <p>${item.indicado}</p>
              <div class="cardio-mini-meta">${item.calorias} · ${item.duracao}</div>
            </article>
          `).join('')}
        </div>
      </div>

      <div class="section-card">
        <div class="section-header">
          <div>
            <div class="section-label">Referência rápida</div>
            <h3>LISS e HIIT sem complicação</h3>
          </div>
        </div>
        <div class="science-grid cardio-summary-grid">
          ${cardioQuickReferences.map((item) => `
            <article class="cardio-mini-card">
              <div class="cardio-mini-head">
                <span>${App.icons.get(item.icone, 16)}</span>
                <h4>${item.nome}</h4>
              </div>
              <div class="badge badge-neutral">${item.dose}</div>
              <p>${item.texto}</p>
            </article>
          `).join('')}
        </div>
      </div>
    </div>
  `;
};
