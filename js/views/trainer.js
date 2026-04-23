/* =================================================================
   views/trainer.js — Área completa do treinador
   ================================================================= */

App.views = App.views || {};
App.views.trainer = {
  _alunosCache: [],
  _treinosCache: [],
  _exerciseSearch: '',
  _exerciseGroup: '',
  _alunoSearch: '',

  async renderDashboard() {
    const user = App.state.user;
    const greetEl = document.getElementById('trainer-greeting');
    const statAlunosEl = document.getElementById('trainer-stat-alunos');
    const statTreinosEl = document.getElementById('trainer-stat-treinos');
    const quickEl = document.getElementById('trainer-alunos-quick');

    if (greetEl) greetEl.textContent = App.utils.greeting(user?.nome);
    if (quickEl) quickEl.innerHTML = App.utils.skeleton(4, 'skeleton-list');

    const [alunos, treinos] = await Promise.all([
      App.data.getAlunosDoTreinador(user?.id),
      App.data.getTreinosDoTreinador(user?.id),
    ]);

    this._alunosCache = alunos || [];
    this._treinosCache = treinos || [];

    if (statAlunosEl) statAlunosEl.textContent = this._alunosCache.length;
    if (statTreinosEl) statTreinosEl.textContent = this._treinosCache.length;

    this._renderAlunosQuickList(this._alunosCache);
  },

  _renderAlunosQuickList(alunos) {
    const el = document.getElementById('trainer-alunos-quick');
    if (!el) return;

    if (!alunos.length) {
      el.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">${App.icons.get('users', 40)}</div>
          <h3>Nenhum aluno vinculado</h3>
          <p>Vincule seus primeiros alunos para começar a entregar treinos personalizados.</p>
          <button class="btn btn-primary" onclick="App.views.trainer._openVincularModal()">
            ${App.icons.get('user-plus', 15)} Vincular aluno
          </button>
        </div>
      `;
      return;
    }

    el.innerHTML = alunos
      .slice(0, 5)
      .map((row) => this._buildAlunoRow(row.aluno || row))
      .join('');
  },

  async renderAlunos() {
    const el = document.getElementById('trainer-alunos-list');
    if (!el) return;

    el.innerHTML = `
      <div class="list-toolbar">
        <div class="search-field">
          <span class="search-icon">${App.icons.get('search', 16)}</span>
          <input type="search" id="aluno-search" placeholder="Buscar por nome ou email..." aria-label="Buscar aluno">
        </div>
        <button class="btn btn-primary btn-sm" onclick="App.views.trainer._openVincularModal()">
          ${App.icons.get('user-plus', 15)} Vincular aluno
        </button>
      </div>
      <div id="alunos-results">${App.utils.skeleton(5, 'skeleton-list')}</div>
    `;

    const alunos = await App.data.getAlunosDoTreinador(App.state.user?.id);
    this._alunosCache = alunos || [];

    const input = document.getElementById('aluno-search');
    if (input) {
      input.value = this._alunoSearch;
      input.addEventListener('input', App.utils.debounce(() => {
        this._alunoSearch = input.value || '';
        this._filterAlunos(this._alunoSearch);
      }, 300));
    }

    this._filterAlunos(this._alunoSearch);
  },

  _filterAlunos(query) {
    const q = (query || '').trim().toLowerCase();

    const filtered = this._alunosCache.filter((row) => {
      const aluno = row.aluno || row;
      return !q || (aluno.nome || '').toLowerCase().includes(q) || (aluno.email || '').toLowerCase().includes(q);
    });

    const el = document.getElementById('alunos-results');
    if (!el) return;

    if (!filtered.length) {
      el.innerHTML = App.utils.emptyState({
        icon: 'search',
        title: 'Nenhum aluno encontrado',
        text: 'Tente outro nome ou email. Sua lista continua pronta para receber novos vínculos.',
      });
      return;
    }

    el.innerHTML = filtered.map((row) => this._buildAlunoRow(row.aluno || row, true)).join('');
  },

  _effectivePlan(aluno) {
    return App.data.isAlunoPremium(aluno?.id, aluno?.plan_type) ? 'premium' : 'free';
  },

  _buildAlunoRow(aluno, showActions = false) {
    const ini = App.utils.initial(aluno?.nome);
    const plan = this._effectivePlan(aluno);

    return `
      <div class="aluno-row" role="listitem">
        <div class="aluno-avatar">${ini}</div>

        <div class="aluno-info">
          <div class="aluno-name">${App.utils.esc(aluno?.nome || 'Aluno')}</div>
          <div class="aluno-email">${App.utils.esc(aluno?.email || '')}</div>
        </div>

        <div class="aluno-plan-stack">
          <span class="chip chip-plan ${plan}">
            ${plan === 'premium' ? `${App.icons.get('crown', 12)} PREMIUM` : 'Free'}
          </span>
          ${plan !== 'premium' ? `
            <button class="btn btn-secondary btn-sm btn-premium" type="button" onclick="App.views.trainer.confirmTogglePremium('${aluno?.id}', true)">
              ${App.icons.get('crown', 14)} Tornar Premium
            </button>
          ` : `
            <button class="btn btn-ghost btn-sm btn-premium-remove" type="button" onclick="App.views.trainer.confirmTogglePremium('${aluno?.id}', false)">
              Remover Premium
            </button>
          `}
        </div>

        ${showActions ? `
          <div class="aluno-actions">
            <button class="btn btn-secondary btn-sm" onclick="App.views.trainer.openAlunoDetail('${aluno?.id}')">
              ${App.icons.get('eye', 15)} Detalhes
            </button>
            <button class="btn btn-primary btn-sm" onclick="App.boot.navigateTo('criar-treino','${aluno?.id}')">
              ${App.icons.get('plus', 15)} Treino
            </button>
          </div>
        ` : ''}
      </div>
    `;
  },

  confirmTogglePremium(alunoId, makePremium) {
    const aluno = this._findAluno(alunoId);
    App.utils.confirm({
      title: makePremium ? 'Ativar Premium' : 'Remover Premium',
      message: makePremium
        ? `Deseja liberar todos os recursos premium para ${aluno?.nome || 'este aluno'}?`
        : `Deseja remover o acesso premium de ${aluno?.nome || 'este aluno'}?`,
      confirmText: makePremium ? 'Confirmar Premium' : 'Remover acesso',
      confirmClass: makePremium ? 'btn-primary' : 'btn-danger',
      onConfirm: async () => {
        App.data.setAlunoPremium(alunoId, makePremium);
        App.utils.toast(makePremium ? 'Aluno liberado como Premium.' : 'Acesso Premium removido.', 'success');
        if (App.state.currentView === 'trainer-dashboard') this._renderAlunosQuickList(this._alunosCache);
        if (App.state.currentView === 'trainer-alunos') this._filterAlunos(this._alunoSearch);
        if (App.state.selectedAluno === alunoId) await this.openAlunoDetail(alunoId);
      },
    });
  },

  _findAluno(alunoId) {
    return this._alunosCache.find((row) => (row.aluno || row)?.id === alunoId)?.aluno ||
      this._alunosCache.find((row) => (row.aluno || row)?.id === alunoId) ||
      null;
  },

  async openAlunoDetail(alunoId) {
    App.state.selectedAluno = alunoId;
    const content = document.getElementById('modal-aluno-content');
    if (content) content.innerHTML = App.utils.skeleton(5, 'skeleton-panel');

    const [history, observacoes] = await Promise.all([
      App.data.getHistory(alunoId),
      App.data.getObservacoes(alunoId),
    ]);

    const aluno = this._findAluno(alunoId) || {};
    const plan = this._effectivePlan(aluno);

    if (!content) return;

    content.innerHTML = `
      <div class="aluno-detail-header">
        <div class="aluno-avatar lg">${App.utils.initial(aluno?.nome)}</div>
        <div>
          <div class="detail-badges">
            <h3>${App.utils.esc(aluno?.nome || 'Aluno')}</h3>
            ${plan === 'premium' ? `<span class="chip chip-plan premium">${App.icons.get('crown', 12)} PREMIUM</span>` : ''}
          </div>
          <p>${App.utils.esc(aluno?.email || '')}</p>
        </div>
      </div>

      <div class="aluno-stats-row">
        <div class="mini-stat">
          <div class="mini-stat-val">${history.length}</div>
          <div class="mini-stat-lbl">Sessões</div>
        </div>
        <div class="mini-stat">
          <div class="mini-stat-val">${App.utils.calcStreak(history.map((h) => h.data || h.date))}</div>
          <div class="mini-stat-lbl">Streak</div>
        </div>
        <div class="mini-stat">
          <div class="mini-stat-val">${App.utils.countThisWeek(history)}</div>
          <div class="mini-stat-lbl">Esta semana</div>
        </div>
      </div>

      <div class="trainer-premium-panel">
        <div>
          <div class="obs-label">Plano atual</div>
          <p class="c-muted">${plan === 'premium' ? 'Acesso completo liberado neste navegador.' : 'Aluno com acesso Free no momento.'}</p>
        </div>
        ${plan !== 'premium' ? `
          <button class="btn btn-secondary btn-sm" type="button" onclick="App.views.trainer.confirmTogglePremium('${alunoId}', true)">
            ${App.icons.get('crown', 14)} Tornar Premium
          </button>
        ` : `
          <button class="btn btn-ghost btn-sm" type="button" onclick="App.views.trainer.confirmTogglePremium('${alunoId}', false)">
            Remover Premium
          </button>
        `}
      </div>

      <div class="obs-section">
        <div class="obs-label">Nova observação</div>
        <textarea id="nova-obs" rows="3" placeholder="Anotações, feedback, ajustes ou recomendações..."></textarea>
        <button class="btn btn-primary btn-sm mt-8" onclick="App.views.trainer._saveObs('${alunoId}')">
          ${App.icons.get('check', 15)} Salvar observação
        </button>
      </div>

      ${observacoes?.length ? `
        <div class="obs-history">
          <div class="obs-label">Observações anteriores</div>
          ${observacoes.slice(0, 5).map((o) => `
            <div class="obs-item">
              <div class="obs-date">${App.utils.fmtDate((o.created_at || '').split('T')[0])}</div>
              <p>${App.utils.esc(o.conteudo || '')}</p>
            </div>
          `).join('')}
        </div>
      ` : App.utils.emptyState({ icon: 'note', title: 'Sem observações ainda', text: 'Adicione feedbacks rápidos para acompanhar a evolução com mais contexto.' })}

      <div class="aluno-actions-footer">
        <button class="btn btn-primary" onclick="App.boot.navigateTo('criar-treino','${alunoId}'); App.modal.close();">
          ${App.icons.get('dumbbell', 15)} Criar treino para este aluno
        </button>
      </div>
    `;

    App.modal.open('modal-aluno', `Aluno: ${App.utils.esc(aluno?.nome || '')}`, null, { wide: true });
  },

  async _saveObs(alunoId) {
    const txt = document.getElementById('nova-obs')?.value?.trim();

    if (!txt) {
      App.utils.toast('Digite uma observação.', 'warn');
      return;
    }

    const saved = await App.data.saveObservacao(App.state.user.id, alunoId, txt);
    if (!saved) {
      App.utils.toast('Não foi possível salvar a observação.', 'error');
      return;
    }

    App.utils.toast('Observação salva com sucesso!');
    await this.openAlunoDetail(alunoId);
  },

  _openVincularModal() {
    const resultBox = document.getElementById('vincular-result');
    if (resultBox) resultBox.innerHTML = '';

    const emailInput = document.getElementById('vincular-email');
    if (emailInput) emailInput.value = '';

    App.modal.open('modal-vincular', 'Vincular Aluno', () => this._doVincular());
  },

  async _doVincular() {
    const email = document.getElementById('vincular-email')?.value?.trim().toLowerCase();
    const resultEl = document.getElementById('vincular-result');

    if (!email) {
      if (resultEl) resultEl.innerHTML = `<div class="auth-error">Informe o email do aluno.</div>`;
      return;
    }

    if (!App.utils.isEmail(email)) {
      if (resultEl) resultEl.innerHTML = `<div class="auth-error">Email inválido.</div>`;
      return;
    }

    if (resultEl) resultEl.innerHTML = `<div class="auth-success">Buscando aluno...</div>`;
    const result = await App.data.vincularAluno(App.state.user.id, email);

    if (result.error) {
      if (resultEl) resultEl.innerHTML = `<div class="auth-error">${App.utils.esc(result.error)}</div>`;
      return;
    }

    App.utils.toast(`${result.aluno?.nome || 'Aluno'} vinculado com sucesso!`);
    App.modal.close();
    await this.renderDashboard();
    await this.renderAlunos();
  },

  async renderCriarTreino(alunoId) {
    App.state.selectedAluno = alunoId || null;
    App.state.workoutDraft = [];
    this._exerciseSearch = '';
    this._exerciseGroup = '';

    const alunos = this._alunosCache.length ? this._alunosCache : await App.data.getAlunosDoTreinador(App.state.user?.id);
    this._alunosCache = alunos || [];

    const alunoSelect = document.getElementById('treino-aluno-select');
    if (alunoSelect) {
      alunoSelect.innerHTML =
        `<option value="">Selecione o aluno...</option>` +
        this._alunosCache
          .map((row) => {
            const al = row.aluno || row;
            return `<option value="${al.id}" ${al.id === alunoId ? 'selected' : ''}>${App.utils.esc(al.nome)}</option>`;
          })
          .join('');
    }

    const lib = document.getElementById('exercise-library');
    if (lib) {
      lib.innerHTML = `
        <div class="exercise-selector-shell">
          <div class="exercise-selector-toolbar">
            <div class="search-field">
              <span class="search-icon">${App.icons.get('search', 16)}</span>
              <input type="search" id="exercise-search" placeholder="Buscar exercício..." aria-label="Buscar exercício">
            </div>
            <div class="science-chip-row compact" id="exercise-group-chips">
              ${['Todos', 'Peito', 'Costas', 'Pernas', 'Ombro', 'Bíceps', 'Tríceps', 'Core', 'Cardio']
                .map((group) => `<button class="filter-chip ${group === 'Todos' ? 'active' : ''}" type="button" onclick="App.views.trainer.setExerciseGroup('${group}')">${group}</button>`)
                .join('')}
            </div>
          </div>
          <div id="exercise-selection-bar"></div>
          <div id="exercise-library-results">${App.utils.skeleton(6, 'skeleton-grid')}</div>
        </div>
      `;
    }

    const draft = document.getElementById('treino-draft');
    if (draft) draft.innerHTML = App.utils.emptyState({ icon: 'plus', title: 'Nenhum exercício selecionado', text: 'Escolha exercícios na biblioteca para começar a montar o treino.' });

    const exercicios = await App.data.getExercicios();
    this._bindExerciseSearch(exercicios);
    this._renderExerciseLibrary(exercicios);
    this.renderDraft();
  },

  _bindExerciseSearch(exercicios) {
    const searchInput = document.getElementById('exercise-search');
    if (!searchInput) return;

    searchInput.addEventListener('input', App.utils.debounce(() => {
      this._exerciseSearch = searchInput.value || '';
      this._renderExerciseLibrary(exercicios);
    }, 300));
  },

  setExerciseGroup(group) {
    this._exerciseGroup = group === 'Todos' ? '' : group;
    document.querySelectorAll('#exercise-group-chips .filter-chip').forEach((chip) => {
      chip.classList.toggle('active', chip.textContent === group);
    });
    this._renderExerciseLibrary(App.state.exerciseList || []);
  },

  _renderExerciseLibrary(exercicios) {
    const resultsEl = document.getElementById('exercise-library-results');
    if (!resultsEl) return;

    const q = (this._exerciseSearch || '').trim().toLowerCase();
    const group = this._exerciseGroup || '';

    const filtered = (exercicios || []).filter((ex) => {
      const normalizedGroup = ex.grupo_muscular === 'Glúteos' ? 'Pernas' : ex.grupo_muscular;
      const matchQuery = !q || (ex.nome || '').toLowerCase().includes(q) || (ex.grupo_muscular || '').toLowerCase().includes(q);
      const matchGroup = !group || normalizedGroup === group;
      return matchQuery && matchGroup;
    });

    this._renderSelectionBar();

    if (!filtered.length) {
      resultsEl.innerHTML = App.utils.emptyState({
        icon: 'search',
        title: 'Nenhum exercício encontrado',
        text: 'Ajuste a busca ou troque o grupo muscular para explorar novas opções.',
      });
      return;
    }

    resultsEl.innerHTML = `<div class="exercise-card-grid">${filtered.map((ex) => this._buildExerciseGridCard(ex)).join('')}</div>`;
  },

  _buildExerciseGridCard(ex) {
    const selected = App.state.workoutDraft.some((item) => item.exercicio_id === ex.id);
    const group = ex.grupo_muscular === 'Glúteos' ? 'Pernas' : ex.grupo_muscular;

    return `
      <button class="exercise-grid-card ${selected ? 'selected' : ''}" type="button" onclick="App.views.trainer.addExerciseToDraft(${ex.id})">
        <span class="exercise-grid-check">${selected ? App.icons.get('check-circle', 16) : ''}</span>
        <div class="exercise-grid-top">
          <span class="exercise-grid-icon">${App.icons.get(this._iconForGroup(group), 16)}</span>
          <span class="badge-sm badge-type">${App.utils.esc(App.EXERCISE_TYPES[ex.tipo] || ex.tipo || '—')}</span>
        </div>
        <div class="exercise-grid-name">${App.utils.esc(ex.nome)}</div>
        <div class="exercise-grid-group">${App.utils.esc(group || 'Geral')}</div>
        <p class="exercise-grid-tip">${App.utils.esc(ex.execucao || 'Execução guiada e amplitude controlada.')}</p>
      </button>
    `;
  },

  _iconForGroup(group) {
    const map = {
      Peito: 'shield',
      Costas: 'layers',
      Pernas: 'activity',
      Ombro: 'trending-up',
      Bíceps: 'dumbbell',
      Tríceps: 'zap',
      Core: 'target',
      Cardio: 'heart',
      Glúteos: 'activity',
    };
    return map[group] || 'dumbbell';
  },

  _renderSelectionBar() {
    const bar = document.getElementById('exercise-selection-bar');
    if (!bar) return;

    const count = App.state.workoutDraft.length;
    bar.innerHTML = `
      <div class="selection-bar">
        <div class="selection-bar-copy">
          <strong>${count} exercícios selecionados</strong>
          <span>${count ? 'Seu rascunho está pronto para ajustes finos.' : 'Selecione exercícios para começar o treino.'}</span>
        </div>
        <button class="btn btn-primary btn-sm" type="button" onclick="App.views.trainer.scrollToDraft()" ${count ? '' : 'disabled'}>
          Continuar
        </button>
      </div>
    `;
  },

  scrollToDraft() {
    document.getElementById('treino-draft')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  },

  addExerciseToDraft(exercicioId) {
    const ex = (App.state.exerciseList || []).find((item) => item.id === exercicioId);
    if (!ex) return;

    App.state.workoutDraft.push({
      exercicio_id: ex.id,
      nome: ex.nome,
      grupo_muscular: ex.grupo_muscular,
      tipo: ex.tipo,
      series: 3,
      repeticoes: '10-12',
      descanso: '60s',
      observacoes: '',
    });

    this.renderDraft();
    this._renderExerciseLibrary(App.state.exerciseList || []);
    App.utils.toast(`${ex.nome} adicionado ao treino.`, 'success', 1800);
  },

  removeExerciseFromDraft(index) {
    App.utils.confirm({
      title: 'Remover exercício',
      message: 'Deseja remover este exercício do rascunho atual?',
      confirmText: 'Remover',
      confirmClass: 'btn-danger',
      onConfirm: () => {
        App.state.workoutDraft.splice(index, 1);
        this.renderDraft();
        this._renderExerciseLibrary(App.state.exerciseList || []);
        App.utils.toast('Exercício removido do rascunho.', 'info');
      },
    });
  },

  moveExercise(index, direction) {
    const target = index + direction;
    if (target < 0 || target >= App.state.workoutDraft.length) return;
    const draft = App.state.workoutDraft;
    [draft[index], draft[target]] = [draft[target], draft[index]];
    this.renderDraft();
  },

  updateDraftField(index, field, value) {
    if (!App.state.workoutDraft[index]) return;
    App.state.workoutDraft[index][field] = value;
  },

  renderDraft() {
    const el = document.getElementById('treino-draft');
    const count = document.getElementById('draft-count');

    if (count) count.textContent = App.state.workoutDraft.length;
    this._renderSelectionBar();

    if (!el) return;

    if (!App.state.workoutDraft.length) {
      el.innerHTML = App.utils.emptyState({
        icon: 'plus',
        title: 'Nenhum exercício selecionado',
        text: 'Monte uma sequência equilibrada para depois ajustar séries, repetições e descanso.',
      });
      return;
    }

    el.innerHTML = App.state.workoutDraft
      .map(
        (ex, i) => `
          <div class="draft-item">
            <div class="draft-item-top">
              <div>
                <div class="exercise-title-inline">
                  <strong>${App.utils.esc(ex.nome)}</strong>
                  <button class="btn-video-inline" type="button" onclick='event.stopPropagation(); App.utils.openExerciseVideo(${JSON.stringify(ex.nome)})'>
                    ${App.icons.get('play-circle', 13)} Ver Execução
                  </button>
                </div>
                <div class="draft-item-meta">
                  ${App.utils.esc(ex.grupo_muscular || '')}
                  ${ex.tipo ? ` · ${App.utils.esc(App.EXERCISE_TYPES[ex.tipo] || ex.tipo)}` : ''}
                </div>
              </div>

              <div class="draft-actions">
                <button class="btn-icon-sm" onclick="App.views.trainer.moveExercise(${i}, -1)" aria-label="Mover para cima">
                  ${App.icons.get('chevron-up', 14)}
                </button>
                <button class="btn-icon-sm" onclick="App.views.trainer.moveExercise(${i}, 1)" aria-label="Mover para baixo">
                  ${App.icons.get('chevron-down', 14)}
                </button>
                <button class="btn-icon-sm" onclick="App.views.trainer.removeExerciseFromDraft(${i})" aria-label="Remover exercício">
                  ${App.icons.get('x', 14)}
                </button>
              </div>
            </div>

            <div class="draft-grid">
              <div class="form-group">
                <label>Séries</label>
                <input class="input-sm" type="number" min="1" value="${ex.series}" onchange="App.views.trainer.updateDraftField(${i}, 'series', this.value)">
              </div>
              <div class="form-group">
                <label>Repetições</label>
                <input class="input-sm" type="text" value="${App.utils.esc(ex.repeticoes)}" onchange="App.views.trainer.updateDraftField(${i}, 'repeticoes', this.value)">
              </div>
              <div class="form-group">
                <label>Descanso</label>
                <select class="input-sm" onchange="App.views.trainer.updateDraftField(${i}, 'descanso', this.value)">
                  ${App.REST_OPTIONS.map((r) => `<option value="${r}" ${r === ex.descanso ? 'selected' : ''}>${r}</option>`).join('')}
                </select>
              </div>
            </div>

            <div class="form-group" style="margin-bottom:0">
              <label>Observações</label>
              <textarea class="input-obs" placeholder="Observações opcionais do treinador" onchange="App.views.trainer.updateDraftField(${i}, 'observacoes', this.value)">${App.utils.esc(ex.observacoes || '')}</textarea>
            </div>
          </div>
        `
      )
      .join('');
  },

  async saveTreino() {
    const alunoId = document.getElementById('treino-aluno-select')?.value;
    const nome = document.getElementById('treino-nome')?.value?.trim();
    const descricao = document.getElementById('treino-descricao')?.value?.trim() || '';

    if (!alunoId) {
      App.utils.toast('Selecione o aluno.', 'warn');
      return;
    }

    if (!nome) {
      App.utils.toast('Informe o nome do treino.', 'warn');
      return;
    }

    if (!App.state.workoutDraft.length) {
      App.utils.toast('Adicione pelo menos um exercício.', 'warn');
      return;
    }

    App.utils.setBtnLoading('btn-save-treino', true);

    try {
      const treino = await App.data.criarTreino(App.state.user.id, alunoId, nome, descricao, App.state.workoutDraft);
      if (!treino) {
        App.utils.toast('Erro ao salvar treino.', 'error');
        return;
      }

      App.utils.toast('Treino salvo com sucesso!');
      App.state.workoutDraft = [];
      this.renderDraft();
      App.boot.navigateTo('trainer-dashboard');
    } finally {
      App.utils.setBtnLoading('btn-save-treino', false);
    }
  },
};

/* -----------------------------------------------------------------
   Complementos da área do treinador para seleção mais rica e segura.
   ----------------------------------------------------------------- */
App.views.trainer._exerciseGroups = ['Todos', 'Peito', 'Costas', 'Pernas', 'Glúteos', 'Ombro', 'Bíceps', 'Tríceps', 'Core', 'Cardio'];

App.views.trainer.renderCriarTreino = async function renderCriarTreino(alunoId) {
  App.state.selectedAluno = alunoId || null;
  App.state.workoutDraft = [];
  this._exerciseSearch = '';
  this._exerciseGroup = '';

  const alunos = this._alunosCache.length ? this._alunosCache : await App.data.getAlunosDoTreinador(App.state.user?.id);
  this._alunosCache = alunos || [];

  const alunoSelect = document.getElementById('treino-aluno-select');
  if (alunoSelect) {
    alunoSelect.innerHTML =
      `<option value="">Selecione o aluno...</option>` +
      this._alunosCache
        .map((row) => {
          const al = row.aluno || row;
          return `<option value="${al.id}" ${al.id === alunoId ? 'selected' : ''}>${App.utils.esc(al.nome)}</option>`;
        })
        .join('');
  }

  const lib = document.getElementById('exercise-library');
  if (lib) {
    lib.innerHTML = `
      <div class="exercise-selector-shell">
        <div class="exercise-selector-toolbar">
          <div class="search-field exercise-search-field">
            <span class="search-icon">${App.icons.get('search', 16)}</span>
            <input type="search" id="exercise-search" placeholder="Buscar exercício, grupo, equipamento..." aria-label="Buscar exercício">
          </div>
          <div class="science-chip-row compact trainer-filter-row" id="exercise-group-chips">
            ${this._exerciseGroups
              .map((group) => `
                <button class="filter-chip ${group === 'Todos' ? 'active' : ''}" type="button" onclick="App.views.trainer.setExerciseGroup('${group}')">
                  ${group === 'Todos' ? App.icons.get('filter', 14) : App.icons.get(this._iconForGroup(group), 14)}
                  ${group}
                </button>
              `)
              .join('')}
          </div>
        </div>
        <div id="exercise-selection-bar"></div>
        <div id="exercise-library-results">${App.utils.skeleton(6, 'skeleton-grid')}</div>
      </div>
    `;
  }

  const draft = document.getElementById('treino-draft');
  if (draft) {
    draft.innerHTML = App.utils.emptyState({
      icon: 'plus',
      title: 'Nenhum exercício selecionado',
      text: 'Escolha exercícios na biblioteca para começar a montar o treino.',
    });
  }

  const exercicios = await App.data.getExercicios();
  this._bindExerciseSearch(exercicios);
  this._renderExerciseLibrary(exercicios);
  this.renderDraft();
};

App.views.trainer.setExerciseGroup = function setExerciseGroup(group) {
  this._exerciseGroup = group === 'Todos' ? '' : group;
  document.querySelectorAll('#exercise-group-chips .filter-chip').forEach((chip) => {
    chip.classList.toggle('active', chip.textContent.trim().includes(group));
  });
  this._renderExerciseLibrary(App.state.exerciseList || []);
};

App.views.trainer._renderExerciseLibrary = function _renderExerciseLibrary(exercicios) {
  const resultsEl = document.getElementById('exercise-library-results');
  if (!resultsEl) return;

  const q = (this._exerciseSearch || '').trim().toLowerCase();
  const group = this._exerciseGroup || '';

  const filtered = (exercicios || []).filter((ex) => {
    const rawGroup = ex.grupo_muscular || '';
    const normalizedGroup = App.utils.normalizeMuscleGroup(rawGroup);
    const haystack = [
      ex.nome,
      rawGroup,
      normalizedGroup,
      ex.execucao,
      ex.equipamento,
      ex.observacao_cientifica,
    ].join(' ').toLowerCase();
    const matchQuery = !q || haystack.includes(q);
    const matchGroup = !group || rawGroup === group || normalizedGroup === group;
    return matchQuery && matchGroup;
  });

  this._renderSelectionBar();

  if (!filtered.length) {
    resultsEl.innerHTML = App.utils.emptyState({
      icon: 'search',
      title: 'Nenhum exercício encontrado',
      text: 'Ajuste a busca ou troque o grupo muscular para explorar novas opções.',
    });
    return;
  }

  resultsEl.innerHTML = `<div class="exercise-card-grid">${filtered.map((ex) => this._buildExerciseGridCard(ex)).join('')}</div>`;
};

App.views.trainer._buildExerciseGridCard = function _buildExerciseGridCard(ex) {
  const selected = App.state.workoutDraft.some((item) => item.exercicio_id === ex.id);
  const group = App.utils.normalizeMuscleGroup(ex.grupo_muscular);
  const tipPreview = (ex.execucao || 'Execução guiada e amplitude controlada.').trim();
  const typeLabel = App.utils.getExerciseTypeLabel(ex.tipo);

  return `
    <button
      class="exercise-grid-card ${selected ? 'selected' : ''}"
      type="button"
      onclick="App.views.trainer.addExerciseToDraft(${ex.id})"
      aria-pressed="${selected ? 'true' : 'false'}"
    >
      <span class="exercise-grid-check">${selected ? App.icons.get('check-circle', 16) : ''}</span>

      <div class="exercise-grid-top">
        <span class="exercise-grid-icon">${App.icons.get(this._iconForGroup(ex.grupo_muscular), 16)}</span>
        <div class="exercise-grid-badges">
          <span class="badge-sm badge-type">${App.utils.esc(typeLabel)}</span>
          ${ex.video_url ? `<span class="badge-sm badge-video">${App.icons.get('play-circle', 12)} vídeo</span>` : ''}
        </div>
      </div>

      <div class="exercise-grid-name-row">
        <div class="exercise-grid-name">${App.utils.esc(ex.nome)}</div>
      </div>
      <div class="exercise-grid-group">${App.utils.esc(group || 'Geral')}</div>

      <p class="exercise-grid-tip">${App.utils.esc(tipPreview)}</p>

      <div class="exercise-grid-footer">
        ${ex.equipamento ? `<span class="exercise-grid-footer-item">${App.icons.get('gauge', 12)} ${App.utils.esc(ex.equipamento)}</span>` : ''}
        ${ex.observacao_cientifica ? `<span class="exercise-grid-footer-item">${App.icons.get('book-open', 12)} nota técnica</span>` : ''}
      </div>
    </button>
  `;
};

App.views.trainer._renderSelectionBar = function _renderSelectionBar() {
  const bar = document.getElementById('exercise-selection-bar');
  if (!bar) return;

  const count = App.state.workoutDraft.length;
  bar.innerHTML = `
    <div class="selection-bar">
      <div class="selection-bar-copy">
        <strong>${count} exercício${count === 1 ? '' : 's'} selecionado${count === 1 ? '' : 's'}</strong>
        <span>${count ? 'Seu rascunho já está pronto para ajustes finos.' : 'Selecione exercícios para começar o treino.'}</span>
      </div>
      <button class="btn btn-primary btn-sm" type="button" onclick="App.views.trainer.scrollToDraft()" ${count ? '' : 'disabled'}>
        ${App.icons.get('check-circle', 14)} Continuar
      </button>
    </div>
  `;
};

App.views.trainer.addExerciseToDraft = function addExerciseToDraft(exercicioId) {
  const ex = (App.state.exerciseList || []).find((item) => item.id === exercicioId);
  if (!ex) return;

  const alreadySelected = App.state.workoutDraft.some((item) => item.exercicio_id === ex.id);
  if (alreadySelected) {
    App.utils.toast(`${ex.nome} já está no rascunho.`, 'info', 1800);
    this.scrollToDraft();
    return;
  }

  App.state.workoutDraft.push({
    exercicio_id: ex.id,
    nome: ex.nome,
    grupo_muscular: ex.grupo_muscular,
    tipo: ex.tipo,
    execucao: ex.execucao || '',
    equipamento: ex.equipamento || '',
    observacao_cientifica: ex.observacao_cientifica || '',
    video_url: ex.video_url || '',
    series: 3,
    repeticoes: '8-12',
    descanso: '60s',
    observacoes: '',
  });

  this.renderDraft();
  this._renderExerciseLibrary(App.state.exerciseList || []);
  App.utils.toast(`${ex.nome} adicionado ao treino.`, 'success', 1800);
};

App.views.trainer.renderDraft = function renderDraft() {
  const el = document.getElementById('treino-draft');
  const count = document.getElementById('draft-count');

  if (count) count.textContent = App.state.workoutDraft.length;
  this._renderSelectionBar();

  if (!el) return;

  if (!App.state.workoutDraft.length) {
    el.innerHTML = App.utils.emptyState({
      icon: 'plus',
      title: 'Nenhum exercício selecionado',
      text: 'Monte uma sequência equilibrada para depois ajustar séries, repetições e descanso.',
    });
    return;
  }

  el.innerHTML = App.state.workoutDraft
    .map((ex, i) => `
      <div class="draft-item">
        <div class="draft-item-top">
          <div class="draft-item-main">
            <div class="exercise-title-inline">
              <strong>${App.utils.esc(ex.nome)}</strong>
              ${ex.video_url ? `
                <a class="btn-video-inline" href="${App.utils.esc(App.utils.sanitizeUrl(ex.video_url))}" target="_blank" rel="noopener noreferrer">
                  ${App.icons.get('play-circle', 13)} Ver execução
                </a>
              ` : ''}
            </div>
            <div class="draft-item-meta">
              ${App.utils.esc(App.utils.normalizeMuscleGroup(ex.grupo_muscular || ''))}
              ${ex.tipo ? ` · ${App.utils.esc(App.utils.getExerciseTypeLabel(ex.tipo))}` : ''}
            </div>
            ${ex.execucao ? `<p class="draft-item-tip">${App.utils.esc(ex.execucao)}</p>` : ''}
          </div>

          <div class="draft-actions">
            <button class="btn-icon-sm" onclick="App.views.trainer.moveExercise(${i}, -1)" aria-label="Mover para cima">
              ${App.icons.get('chevron-up', 14)}
            </button>
            <button class="btn-icon-sm" onclick="App.views.trainer.moveExercise(${i}, 1)" aria-label="Mover para baixo">
              ${App.icons.get('chevron-down', 14)}
            </button>
            <button class="btn-icon-sm" onclick="App.views.trainer.removeExerciseFromDraft(${i})" aria-label="Remover exercício">
              ${App.icons.get('x', 14)}
            </button>
          </div>
        </div>

        <div class="draft-helper-row">
          ${ex.equipamento ? `<span class="exercise-grid-footer-item">${App.icons.get('gauge', 12)} ${App.utils.esc(ex.equipamento)}</span>` : ''}
          ${ex.observacao_cientifica ? `<span class="exercise-grid-footer-item">${App.icons.get('book-open', 12)} nota científica</span>` : ''}
        </div>

        <div class="draft-grid">
          <div class="form-group">
            <label>Séries</label>
            <input class="input-sm" type="number" min="1" value="${ex.series}" onchange="App.views.trainer.updateDraftField(${i}, 'series', this.value)">
          </div>
          <div class="form-group">
            <label>Repetições</label>
            <input class="input-sm" type="text" value="${App.utils.esc(ex.repeticoes)}" onchange="App.views.trainer.updateDraftField(${i}, 'repeticoes', this.value)">
          </div>
          <div class="form-group">
            <label>Descanso</label>
            <select class="input-sm" onchange="App.views.trainer.updateDraftField(${i}, 'descanso', this.value)">
              ${App.REST_OPTIONS.map((r) => `<option value="${r}" ${r === ex.descanso ? 'selected' : ''}>${r}</option>`).join('')}
            </select>
          </div>
        </div>

        <div class="form-group" style="margin-bottom:0">
          <label>Observações</label>
          <textarea class="input-obs" placeholder="Observações opcionais do treinador" onchange="App.views.trainer.updateDraftField(${i}, 'observacoes', this.value)">${App.utils.esc(ex.observacoes || '')}</textarea>
        </div>
      </div>
    `)
    .join('');
};

App.modal = {
  _currentSave: null,

  open(id, title, onSave, opts = {}) {
    const el = document.getElementById(id);
    if (!el) return;

    this._currentSave = onSave || null;
    const titleEl = el.querySelector('.modal-title');
    if (titleEl) titleEl.textContent = title || '';

    const card = el.querySelector('.modal-card');
    if (card) card.classList.toggle('modal-wide', !!opts.wide);

    el.classList.remove('hidden');
    el.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';

    setTimeout(() => {
      el.querySelector('input, textarea, select, button')?.focus();
    }, 60);
  },

  close() {
    document.querySelectorAll('.modal').forEach((m) => {
      m.classList.add('hidden');
      m.setAttribute('aria-hidden', 'true');
    });

    const frame = document.getElementById('exercise-video-frame');
    if (frame) frame.src = 'about:blank';

    document.body.style.overflow = '';
    this._currentSave = null;
  },

  save() {
    if (typeof this._currentSave === 'function') this._currentSave();
  },
};
