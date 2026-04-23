/* =================================================================
   core.js — Camada central do sistema
   -----------------------------------------------------------------
   Responsabilidades deste arquivo:
   1) Utilitários globais
   2) Camada de dados (Supabase + cache local)
   3) Autenticação
   4) Regras de negócio comuns do produto
   -----------------------------------------------------------------
   Observações:
   - Mantém a arquitetura atual baseada em namespace global App.*
   - Evita quebrar o restante do projeto
   - Centraliza regras para facilitar escala e manutenção
   ================================================================= */

/* =================================================================
   UTILITÁRIOS GERAIS
   ================================================================= */
App.utils = {
  EXERCISE_VIDEO_QUERIES: {
    'supino reto com barra': 'supino reto com barra execucao correta',
    'supino reto': 'supino reto com barra execucao correta',
    'supino reto com halteres': 'supino reto com halteres execucao correta',
    'supino inclinado com halteres': 'supino inclinado com halteres execucao correta',
    'crucifixo com halteres': 'crucifixo com halteres execucao correta',
    'peck deck': 'peck deck execucao correta',
    'puxada frontal': 'puxada frontal pulley execucao correta',
    'remada curvada com barra': 'remada curvada com barra execucao correta',
    'remada unilateral com halter': 'remada unilateral com halter execucao correta',
    'remada baixa no cabo': 'remada baixa no cabo execucao correta',
    'barra fixa': 'barra fixa execucao correta',
    'agachamento livre': 'agachamento livre execucao correta',
    'leg press 45': 'leg press 45 execucao correta',
    'cadeira extensora': 'cadeira extensora execucao correta',
    'mesa flexora': 'mesa flexora execucao correta',
    'afundo com halteres': 'afundo com halteres execucao correta',
    'hip thrust': 'hip thrust execucao correta',
    'glute bridge': 'glute bridge execucao correta',
    'coice na polia': 'coice na polia execucao correta',
    'abducao na maquina': 'abducao na maquina execucao correta',
    'desenvolvimento com halteres': 'desenvolvimento com halteres execucao correta',
    'elevacao lateral': 'elevacao lateral execucao correta',
    'elevacao frontal': 'elevacao frontal execucao correta',
    'face pull': 'face pull execucao correta',
    'rosca direta': 'rosca direta execucao correta',
    'rosca alternada': 'rosca alternada execucao correta',
    'rosca martelo': 'rosca martelo execucao correta',
    'triceps corda': 'triceps corda execucao correta',
    'triceps barra': 'triceps barra execucao correta',
    'triceps frances': 'triceps frances execucao correta',
    'prancha': 'prancha abdominal execucao correta',
    'abdominal crunch': 'abdominal crunch execucao correta',
    'elevacao de pernas': 'elevacao de pernas abdominal execucao correta',
    'dead bug': 'dead bug exercicio execucao correta',
    'esteira caminhada': 'esteira caminhada postura correta',
    'bike ergonometrica': 'bike ergonometrica regulagem e execucao correta',
    'eliptico': 'eliptico execucao correta',
    'hiit na bike': 'hiit na bike como fazer',
  },

  /* Retorna a data atual no formato YYYY-MM-DD */
  today() {
    return new Date().toISOString().split('T')[0];
  },

  /* Formata uma data simples para pt-BR */
  fmtDate(str, opts = {}) {
    if (!str) return '—';
    return new Date(`${str}T12:00:00`).toLocaleDateString('pt-BR', {
      day: 'numeric',
      month: 'short',
      ...opts,
    });
  },

  /* Saudação contextual baseada na hora */
  greeting(nome) {
    const h = new Date().getHours();
    const saudacao = h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite';
    return `${saudacao}, ${(nome || '').split(' ')[0] || 'Usuário'}`;
  },

  /* Retorna a inicial do nome */
  initial(nome) {
    return (nome || 'U')[0].toUpperCase();
  },

  /* Escapa texto para evitar HTML indevido na interface */
  esc(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  },

  /* Mostra ou esconde estado de loading em botões */
  setBtnLoading(id, loading, original) {
    const btn = document.getElementById(id);
    if (!btn) return;

    btn.disabled = loading;

    if (loading) {
      btn.dataset.original = btn.innerHTML;
      btn.innerHTML = `<span class="spinner"></span> Aguarde...`;
    } else {
      btn.innerHTML = btn.dataset.original || original || btn.innerHTML;
    }
  },

  /* Toast visual padrão */
  toast(msg, type = 'success', duration = 4000) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const icons = {
      success: 'check-circle',
      error: 'alert-triangle',
      warn: 'info',
      info: 'info',
    };

    const colors = {
      success: 'var(--success)',
      error: 'var(--error)',
      warn: 'var(--warning)',
      info: 'var(--primary)',
    };

    const el = document.createElement('div');
    el.className = `toast toast-${type}`;
    el.innerHTML = `
      <span class="toast-icon" style="color:${colors[type]}">
        ${App.icons.get(icons[type] || 'info', 16)}
      </span>
      <span class="toast-msg">${this.esc(msg)}</span>
    `;

    container.appendChild(el);

    requestAnimationFrame(() => el.classList.add('toast-visible'));

    setTimeout(() => {
      el.classList.remove('toast-visible');
      setTimeout(() => el.remove(), 400);
    }, duration);
  },

  /* Calcula streak de dias consecutivos */
  calcStreak(dates) {
    if (!dates?.length) return 0;

    const sorted = [...new Set(dates)].sort((a, b) => (b > a ? 1 : -1));
    let streak = 0;
    let prev = this.today();

    for (const d of sorted) {
      const diff =
        (new Date(`${prev}T12:00:00`) - new Date(`${d}T12:00:00`)) / 86400000;

      if (diff <= 1) {
        streak++;
        prev = d;
      } else {
        break;
      }
    }

    return streak;
  },

  /* Conta quantidade de sessões únicas na semana atual */
  countThisWeek(history) {
    const start = new Date();
    start.setDate(start.getDate() - start.getDay());
    start.setHours(0, 0, 0, 0);

    return new Set(
      (history || [])
        .filter((h) => new Date(`${h.data || h.date}T12:00:00`) >= start)
        .map((h) => `${h.data || h.date}_${h.treino_id || ''}`)
    ).size;
  },

  /* Validação básica de email */
  isEmail(v) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  },

  /* Debounce padrão para buscas */
  debounce(fn, ms = 300) {
    let t;
    return (...args) => {
      clearTimeout(t);
      t = setTimeout(() => fn(...args), ms);
    };
  },

  renderIcon(id, icon, size = 18, color = 'currentColor') {
    const el = document.getElementById(id);
    if (el) el.innerHTML = App.icons.get(icon, size, color);
  },

  skeleton(lines = 3, className = '') {
    return `
      <div class="skeleton-block ${className}">
        ${Array.from({ length: lines }, (_, i) => `<div class="skeleton-line skeleton-line-${i + 1}"></div>`).join('')}
      </div>
    `;
  },

  emptyState({ icon = 'info', title = 'Nada por aqui ainda', text = 'Assim que houver dados, eles aparecerão aqui.' } = {}) {
    return `
      <div class="empty-state">
        <div class="empty-icon">${App.icons.get(icon, 40)}</div>
        <h3>${this.esc(title)}</h3>
        <p>${this.esc(text)}</p>
      </div>
    `;
  },

  confirm({
    title = 'Confirmar ação',
    message = 'Tem certeza de que deseja continuar?',
    confirmText = 'Confirmar',
    confirmClass = 'btn-primary',
    onConfirm = null,
  } = {}) {
    const content = document.getElementById('modal-confirm-content');
    const actionBtn = document.getElementById('modal-confirm-action');

    if (content) {
      content.innerHTML = `
        <div class="confirm-copy">
          <div class="confirm-icon">${App.icons.get('alert-triangle', 22, 'var(--warning)')}</div>
          <div>
            <p class="confirm-title">${this.esc(title)}</p>
            <p class="confirm-text">${this.esc(message)}</p>
          </div>
        </div>
      `;
    }

    if (actionBtn) {
      actionBtn.textContent = confirmText;
      actionBtn.className = `btn ${confirmClass}`;
    }

    App.modal.open('modal-confirm', title, () => {
      App.modal.close();
      if (typeof onConfirm === 'function') onConfirm();
    });
  },

  youtubeEmbedUrl(query) {
    const normalized = this.normalizeSearchTerm(query);
    const term = encodeURIComponent(normalized);
    return `https://www.youtube.com/embed/videoseries?listType=search&list=${term}`;
  },

  youtubeSearchUrl(query) {
    const normalized = this.normalizeSearchTerm(query);
    return `https://www.youtube.com/results?search_query=${encodeURIComponent(normalized)}`;
  },

  normalizeSearchTerm(value) {
    return String(value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^\w\s-]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase();
  },

  /* Normaliza grupos para filtros e agrupamentos sem quebrar o cadastro atual. */
  normalizeMuscleGroup(group) {
    if (!group) return 'Geral';
    if (group === 'Glúteos') return 'Pernas';
    return group;
  },

  /* Centraliza o label do tipo para manter student e trainer consistentes. */
  getExerciseTypeLabel(type) {
    return App.EXERCISE_TYPES[type] || type || '—';
  },

  /* Ordena os blocos semanais na UI de forma previsível. */
  workoutDayOrder(day) {
    const index = App.WORKOUT_DAY_OPTIONS.indexOf(day);
    return index === -1 ? 999 : index;
  },

  workoutBlockLabel(day, block) {
    if (day && block) return `${day} • ${block}`;
    return day || block || 'Treino principal';
  },

  /* Protege links externos antes de renderizar ou abrir em nova aba. */
  sanitizeUrl(url) {
    const value = String(url || '').trim();
    if (!value) return '';
    return /^https?:\/\//i.test(value) ? value : '';
  },

  resolveExerciseVideoQuery(exerciseName) {
    const normalized = this.normalizeSearchTerm(exerciseName);
    const direct = this.EXERCISE_VIDEO_QUERIES[normalized];
    if (direct) return direct;

    const partial = Object.entries(this.EXERCISE_VIDEO_QUERIES).find(([key]) =>
      normalized.includes(key) || key.includes(normalized)
    );
    if (partial) return partial[1];

    if (normalized.includes('supino')) return 'supino musculacao execucao correta';
    if (normalized.includes('agachamento')) return 'agachamento livre execucao correta';
    if (normalized.includes('remada')) return 'remada musculacao execucao correta';
    if (normalized.includes('rosca')) return 'rosca biceps execucao correta';
    if (normalized.includes('triceps')) return 'triceps musculacao execucao correta';
    if (normalized.includes('elevacao')) return 'elevacao ombro execucao correta';
    if (normalized.includes('cardio') || normalized.includes('bike') || normalized.includes('esteira')) {
      return `${normalized} como fazer corretamente`;
    }

    return `${normalized} execucao correta musculacao`;
  },

  /* Resolve a URL do vídeo com prioridade para o valor salvo no banco. */
  resolveExerciseVideoUrl(exercise) {
    if (typeof exercise === 'object' && exercise) {
      const directUrl = this.sanitizeUrl(exercise.video_url);
      if (directUrl) return directUrl;
      return this.youtubeSearchUrl(this.resolveExerciseVideoQuery(exercise.nome));
    }

    const directUrl = this.sanitizeUrl(exercise);
    if (directUrl) return directUrl;
    return this.youtubeSearchUrl(this.resolveExerciseVideoQuery(exercise));
  },

  openExerciseVideo(exercise) {
    const targetUrl = this.resolveExerciseVideoUrl(exercise);
    if (!targetUrl) return;
    window.open(targetUrl, '_blank', 'noopener,noreferrer');
  },

  destroyChart(key) {
    const chart = App.state.charts?.[key];
    if (chart) {
      chart.destroy();
      delete App.state.charts[key];
    }
  },
};

/* =================================================================
   CAMADA DE DADOS
   -----------------------------------------------------------------
   Tudo que conversa com Supabase passa por aqui.
   Isso evita espalhar query pelo projeto inteiro.
   ================================================================= */
App.data = {
  /* ===============================================================
     PERFIL
     =============================================================== */

  async getProfile(userId) {
    if (App.USE_SUPABASE && App.state.sb) {
      const { data, error } = await App.state.sb
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (!error && data) {
        App.ls('profile', data);
        return data;
      }
    }

    return App.ls('profile');
  },

  async updateProfile(userId, fields) {
    /* Atualiza cache local */
    App.ls('profile', { ...(App.ls('profile') || {}), ...fields });

    if (App.USE_SUPABASE && App.state.sb) {
      const { error } = await App.state.sb
        .from('profiles')
        .update(fields)
        .eq('id', userId);

      if (error) {
        console.error('Erro ao atualizar profile:', error);
        App.utils.toast('Erro ao atualizar perfil.', 'error');
      }
    }
  },

  /* ===============================================================
     DETALHES DO ALUNO
     =============================================================== */

  async getAlunoDetalhes(userId) {
    if (App.USE_SUPABASE && App.state.sb) {
      const { data, error } = await App.state.sb
        .from('alunos_detalhes')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (!error && data) {
        App.ls(`aluno_${userId}`, data);
        return data;
      }
    }

    return App.ls(`aluno_${userId}`) || null;
  },

  async upsertAlunoDetalhes(userId, fields) {
    const row = { user_id: userId, ...fields };

    App.ls(`aluno_${userId}`, row);

    if (App.USE_SUPABASE && App.state.sb) {
      const { error } = await App.state.sb
        .from('alunos_detalhes')
        .upsert(row, { onConflict: 'user_id' });

      if (error) {
        console.error('Erro ao salvar detalhes do aluno:', error);
        App.utils.toast('Erro ao salvar detalhes do aluno.', 'error');
      }
    }
  },

  /* ===============================================================
     MEDIDAS
     =============================================================== */

  async getMedidas(userId) {
    if (App.USE_SUPABASE && App.state.sb) {
      const { data, error } = await App.state.sb
        .from('medidas')
        .select('*')
        .eq('user_id', userId)
        .order('data', { ascending: false });

      if (!error && data) {
        App.ls(`medidas_${userId}`, data);
        return data;
      }
    }

    return App.ls(`medidas_${userId}`) || [];
  },

  async saveMedida(userId, fields) {
    const row = {
      user_id: userId,
      data: App.utils.today(),
      ...fields,
    };

    /* Atualiza cache local para UX rápida */
    const arr = App.ls(`medidas_${userId}`) || [];
    arr.unshift(row);
    App.ls(`medidas_${userId}`, arr);

    if (App.USE_SUPABASE && App.state.sb) {
      const { error } = await App.state.sb.from('medidas').insert(row);

      if (error) {
        console.error('Erro ao salvar medida:', error);
        App.utils.toast('Erro ao salvar medidas.', 'error');
      }
    }
  },

  /* ===============================================================
     HISTÓRICO
     =============================================================== */

  async saveSession(entry) {
    const uid = App.state.user?.id;
    const row = { ...entry, user_id: uid };

    /* Cache local */
    const cache = App.ls(`history_${uid}`) || App.ls('history') || [];
    cache.unshift(row);
    App.ls(`history_${uid}`, cache.slice(0, 500));

    if (App.USE_SUPABASE && App.state.sb) {
      const { error } = await App.state.sb.from('historico_treino').insert({
        user_id: uid,
        treino_id: entry.treino_id || null,
        exercicio_id: entry.exercicio_id || null,
        exercicio_nome: entry.exercicio_nome,
        dia_semana: entry.dia_semana || null,
        bloco_nome: entry.bloco_nome || null,
        carga: entry.carga || 0,
        reps: entry.reps || 0,
        series: entry.series || 0,
        data: entry.data || App.utils.today(),
      });

      if (error) {
        console.error('Erro ao salvar histórico:', error);
        App.utils.toast('Erro ao salvar treino no histórico.', 'error');
      }
    }
  },

  async getHistory(userId) {
    if (App.USE_SUPABASE && App.state.sb) {
      const { data, error } = await App.state.sb
        .from('historico_treino')
        .select('*')
        .eq('user_id', userId)
        .order('data', { ascending: false })
        .limit(200);

      if (!error && data) {
        App.ls(`history_${userId}`, data);
        return data;
      }
    }

    return App.ls(`history_${userId}`) || App.ls('history') || [];
  },

  /* ===============================================================
     OBSERVAÇÕES DO TREINADOR
     =============================================================== */

  async getObservacoes(alunoId) {
    if (!App.USE_SUPABASE || !App.state.sb) return [];

    const { data, error } = await App.state.sb
      .from('observacoes_treinador')
      .select('*')
      .eq('aluno_id', alunoId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao buscar observações:', error);
      return [];
    }

    return data || [];
  },

  async saveObservacao(treinadorId, alunoId, conteudo) {
    if (!App.USE_SUPABASE || !App.state.sb) return null;

    const { data, error } = await App.state.sb
      .from('observacoes_treinador')
      .insert({
        treinador_id: treinadorId,
        aluno_id: alunoId,
        conteudo,
      })
      .select()
      .single();

    if (error) {
      console.error('Erro ao salvar observação:', error);
      App.utils.toast('Erro ao salvar observação.', 'error');
      return null;
    }

    return data;
  },

  /* ===============================================================
     EXERCÍCIOS
     =============================================================== */

  async getExercicios() {
    if (App.state.exerciseList.length) return App.state.exerciseList;

    if (App.USE_SUPABASE && App.state.sb) {
      const { data, error } = await App.state.sb
        .from('exercicios')
        .select('*')
        .eq('ativo', true)
        .order('grupo_muscular')
        .order('nome');

      if (!error && data?.length) {
        App.state.exerciseList = data;
        App.ls('exercicios', data);
        return data;
      }

      if (error) {
        console.error('Erro ao buscar exercícios:', error);
      }
    }

    const cached = App.ls('exercicios');
    if (cached) {
      App.state.exerciseList = cached;
      return cached;
    }

    return [];
  },

  /* ===============================================================
     TREINOS
     =============================================================== */

  /* Regra de produto:
     o treino do aluno só deve aparecer se houver treino criado por treinador.
     Nada de demo ou treino automático.
  */
  async getTreinoAtivo(alunoId) {
    if (App.USE_SUPABASE && App.state.sb) {
      const { data, error } = await App.state.sb
        .from('treinos')
        .select(`
          *,
          treino_exercicios(
            *,
            exercicios(*)
          )
        `)
        .eq('aluno_id', alunoId)
        .eq('status', 'ativo')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!error && data) {
        App.ls(`treino_${alunoId}`, data);
        return data;
      }

      if (error) {
        console.error('Erro ao buscar treino ativo:', error);
      }

      return null;
    }

    return App.ls(`treino_${alunoId}`) || null;
  },

  async getTreinosDoTreinador(treinadorId) {
    if (!App.USE_SUPABASE || !App.state.sb) return [];

    const { data, error } = await App.state.sb
      .from('treinos')
      .select(`
        *,
        profiles!treinos_aluno_id_fkey(
          id,
          nome,
          email,
          plan_type
        )
      `)
      .eq('treinador_id', treinadorId)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Erro ao buscar treinos do treinador:', error);
      return [];
    }

    return data || [];
  },

  async criarTreino(treinadorId, alunoId, nome, descricao, exercicios) {
    if (!App.USE_SUPABASE || !App.state.sb) {
      App.utils.toast('Supabase não configurado.', 'error');
      return null;
    }

    /* Cria o treino principal */
    const { data: treino, error } = await App.state.sb
      .from('treinos')
      .insert({
        treinador_id: treinadorId,
        aluno_id: alunoId,
        nome,
        descricao,
        status: 'ativo',
      })
      .select()
      .single();

    if (error || !treino) {
      console.error('Erro ao criar treino:', error);
      App.utils.toast('Erro ao criar treino.', 'error');
      return null;
    }

    /* Insere os exercícios do treino */
    const rows = exercicios.map((ex, i) => ({
      treino_id: treino.id,
      exercicio_id: ex.exercicio_id,
      dia_semana: ex.dia_semana || null,
      bloco_nome: ex.bloco_nome || null,
      series: Number(ex.series) || 3,
      repeticoes: ex.repeticoes || '10-12',
      descanso: ex.descanso || '60s',
      observacoes: ex.observacoes || null,
      ordem: i,
    }));

    const { error: exError } = await App.state.sb
      .from('treino_exercicios')
      .insert(rows);

    if (exError) {
      console.error('Erro ao inserir exercícios do treino:', exError);
      App.utils.toast('Treino criado, mas houve erro ao adicionar exercícios.', 'error');
      return treino;
    }

    return treino;
  },

  /* ===============================================================
     RELACIONAMENTO TREINADOR ↔ ALUNO
     =============================================================== */

  async getAlunosDoTreinador(treinadorId) {
    if (!App.USE_SUPABASE || !App.state.sb) return [];

    const { data, error } = await App.state.sb
      .from('treinador_aluno')
      .select(`
        *,
        aluno:aluno_id(
          id,
          nome,
          email,
          role,
          plan_type,
          created_at
        )
      `)
      .eq('treinador_id', treinadorId)
      .eq('ativo', true);

    if (error) {
      console.error('Erro ao buscar alunos do treinador:', error);
      return [];
    }

    return data || [];
  },

  async vincularAluno(treinadorId, alunoEmail) {
    if (!App.USE_SUPABASE || !App.state.sb) {
      return { error: 'Supabase não configurado.' };
    }

    const email = alunoEmail.trim().toLowerCase();

    /* Busca o perfil pelo email */
    const { data: profile, error } = await App.state.sb
      .from('profiles')
      .select('id, nome, email, role, plan_type')
      .eq('email', email)
      .maybeSingle();

    if (error) {
      console.error('Erro ao buscar aluno por email:', error);
      return { error: 'Erro ao buscar aluno.' };
    }

    if (!profile) {
      return { error: 'Nenhum aluno encontrado com esse email.' };
    }

    if (profile.id === treinadorId) {
      return { error: 'Não é possível se vincular a si mesmo.' };
    }

    if (profile.role !== 'aluno') {
      return { error: 'Esse email pertence a um treinador, não a um aluno.' };
    }

    const { error: linkError } = await App.state.sb
      .from('treinador_aluno')
      .upsert(
        {
          treinador_id: treinadorId,
          aluno_id: profile.id,
          ativo: true,
        },
        { onConflict: 'treinador_id,aluno_id' }
      );

    if (linkError) {
      console.error('Erro ao criar vínculo treinador_aluno:', linkError);
      return { error: 'Erro ao criar vínculo entre treinador e aluno.' };
    }

    return { ok: true, aluno: profile };
  },

  getPremiumOverrides() {
    return App.ls('premium_overrides') || {};
  },

  isAlunoPremium(alunoId, fallbackPlan = 'free') {
    const overrides = this.getPremiumOverrides();
    return Boolean(overrides[alunoId]) || fallbackPlan === 'premium';
  },

  setAlunoPremium(alunoId, enabled) {
    const overrides = this.getPremiumOverrides();

    if (enabled) {
      overrides[alunoId] = true;
    } else {
      delete overrides[alunoId];
    }

    App.ls('premium_overrides', overrides);

    return enabled ? 'premium' : 'free';
  },
};

/* =================================================================
   AUTENTICAÇÃO
   ================================================================= */
App.auth = {
  _role: 'aluno',

  init() {
    this._bindRoleTabs();
    this._bindPasswordToggles();
  },

  _bindRoleTabs() {
    document.querySelectorAll('.role-tab').forEach((tab) => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.role-tab').forEach((t) => {
          t.classList.remove('active');
          t.setAttribute('aria-checked', 'false');
        });

        tab.classList.add('active');
        tab.setAttribute('aria-checked', 'true');
        this._role = tab.dataset.role || 'aluno';
      });
    });
  },

  _bindPasswordToggles() {
    document.querySelectorAll('[data-toggle-password]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-toggle-password');
        const input = document.getElementById(id);
        if (!input) return;

        input.type = input.type === 'password' ? 'text' : 'password';
        btn.innerHTML = App.icons.get(
          input.type === 'password' ? 'eye' : 'eye-off',
          18
        );
      });
    });
  },

  _showError(type, msg) {
    const box = document.getElementById(`${type}-error`);
    const text = document.getElementById(`${type}-error-msg`);
    if (text) text.textContent = msg;
    if (box) box.classList.remove('hidden');
  },

  _hideError(type) {
    const box = document.getElementById(`${type}-error`);
    if (box) box.classList.add('hidden');
  },

  /* LOGIN */
  async login() {
    const email = document.getElementById('login-email')?.value.trim().toLowerCase();
    const pass = document.getElementById('login-password')?.value;

    this._hideError('login');

    if (!email || !pass) {
      this._showError('login', 'Informe email e senha.');
      return;
    }

    try {
      App.utils.setBtnLoading('btn-login', true);

      if (!App.state.sb) {
        this._showError('login', 'Conexão com Supabase não inicializada.');
        return;
      }

      const { data, error } = await App.state.sb.auth.signInWithPassword({
        email,
        password: pass,
      });

      if (error) {
        this._showError('login', error.message);
        return;
      }

      const user = data?.user;
      if (!user) {
        this._showError('login', 'Não foi possível iniciar sessão.');
        return;
      }

      if (!user.email_confirmed_at) {
        this._showError('login', 'Confirme seu email antes de entrar.');
        return;
      }

      const profile = await App.data.getProfile(user.id);
      if (!profile) {
        this._showError('login', 'Perfil do usuário não encontrado.');
        return;
      }

      App.state.user = { ...user, ...profile };
      App.boot.enterApp();
    } catch (err) {
      console.error('Erro no login:', err);
      this._showError('login', err?.message || 'Erro inesperado ao entrar.');
    } finally {
      App.utils.setBtnLoading('btn-login', false);
    }
  },

  /* CADASTRO */
  async register() {
    const nome = document.getElementById('reg-nome')?.value.trim();
    const email = document.getElementById('reg-email')?.value.trim().toLowerCase();
    const pass = document.getElementById('reg-password')?.value;
    const role = this._role;

    this._hideError('register');

    if (!nome || !email || !pass) {
      this._showError('register', 'Preencha todos os campos.');
      return;
    }

    if (!App.utils.isEmail(email)) {
      this._showError('register', 'Email inválido.');
      return;
    }

    if (pass.length < 6) {
      this._showError('register', 'Senha deve ter no mínimo 6 caracteres.');
      return;
    }

    try {
      App.utils.setBtnLoading('btn-register', true);

      if (!App.state.sb) {
        this._showError('register', 'Conexão com Supabase não inicializada.');
        return;
      }

      const { error } = await App.state.sb.auth.signUp({
        email,
        password: pass,
        options: {
          data: { nome, role },
          emailRedirectTo: `${window.location.origin}/`,
        },
      });

      if (error) {
        this._showError('register', error.message);
        return;
      }

      document.getElementById('register-form')?.classList.add('hidden');
      document.getElementById('register-success')?.classList.remove('hidden');
    } catch (err) {
      console.error('Erro no cadastro:', err);
      this._showError('register', err?.message || 'Erro inesperado no cadastro.');
    } finally {
      App.utils.setBtnLoading('btn-register', false);
    }
  },

  /* ESQUECI MINHA SENHA */
  async forgotPassword() {
    const email = document.getElementById('forgot-email')?.value.trim().toLowerCase();

    this._hideError('forgot');

    if (!email) {
      this._showError('forgot', 'Informe seu email.');
      return;
    }

    if (!App.utils.isEmail(email)) {
      this._showError('forgot', 'Email inválido.');
      return;
    }

    try {
      App.utils.setBtnLoading('btn-forgot', true);

      if (!App.state.sb) {
        this._showError('forgot', 'Conexão com Supabase não inicializada.');
        return;
      }

      const { error } = await App.state.sb.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/`,
      });

      if (error) {
        this._showError('forgot', error.message);
        return;
      }

      document.getElementById('forgot-form')?.classList.add('hidden');
      document.getElementById('forgot-success')?.classList.remove('hidden');
    } catch (err) {
      console.error('Erro em forgotPassword:', err);
      this._showError('forgot', err?.message || 'Erro inesperado ao enviar recuperação.');
    } finally {
      App.utils.setBtnLoading('btn-forgot', false);
    }
  },

  /* NOVA SENHA */
  async updatePassword() {
    const pass = document.getElementById('newpass-password')?.value;
    const confirm = document.getElementById('newpass-confirm')?.value;

    this._hideError('newpass');

    if (!pass || pass.length < 6) {
      this._showError('newpass', 'Senha deve ter no mínimo 6 caracteres.');
      return;
    }

    if (pass !== confirm) {
      this._showError('newpass', 'As senhas não coincidem.');
      return;
    }

    try {
      App.utils.setBtnLoading('btn-newpass', true);

      if (!App.state.sb) {
        this._showError('newpass', 'Conexão com Supabase não inicializada.');
        return;
      }

      const { error } = await App.state.sb.auth.updateUser({
        password: pass,
      });

      if (error) {
        this._showError('newpass', error.message);
        return;
      }

      App.utils.toast('Senha atualizada com sucesso!');
      App.boot.enterAuth('login');
    } catch (err) {
      console.error('Erro em updatePassword:', err);
      this._showError('newpass', err?.message || 'Erro inesperado ao atualizar senha.');
    } finally {
      App.utils.setBtnLoading('btn-newpass', false);
    }
  },

  /* REENVIAR EMAIL DE CONFIRMAÇÃO */
  async resendConfirmationEmail() {
    const email =
      document.getElementById('reg-email')?.value.trim().toLowerCase() ||
      document.getElementById('login-email')?.value.trim().toLowerCase();

    this._hideError('register');

    if (!email) {
      this._showError('register', 'Informe o email.');
      return;
    }

    try {
      if (!App.state.sb) {
        this._showError('register', 'Conexão com Supabase não inicializada.');
        return;
      }

      const { error } = await App.state.sb.auth.resend({
        type: 'signup',
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
        },
      });

      if (error) {
        this._showError('register', error.message);
        return;
      }

      App.utils.toast('Email de confirmação reenviado.');
    } catch (err) {
      console.error('Erro em resendConfirmationEmail:', err);
      this._showError('register', err?.message || 'Erro inesperado ao reenviar email.');
    }
  },

  async logout() {
    try {
      if (App.USE_SUPABASE && App.state.sb) {
        await App.state.sb.auth.signOut();
      }
    } catch (err) {
      console.error('Erro no logout:', err);
    }

    App.ls('current_user', null);
    App.ls('history', null);
    App.state.user = null;
    App.state.workout = null;
    App.boot.enterAuth('login');
  },

  isPremium() {
    return App.data.isAlunoPremium(App.state.user?.id, App.state.user?.plan_type);
  },

  isTrainer() {
    return App.state.user?.role === 'treinador';
  },
};
