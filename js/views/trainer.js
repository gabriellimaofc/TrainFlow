/* =================================================================
   views/trainer.js — Área completa do treinador
   -----------------------------------------------------------------
   Responsabilidades deste arquivo:
   1) Dashboard do treinador
   2) Lista e busca de alunos
   3) Vínculo treinador ↔ aluno
   4) Detalhe do aluno e observações
   5) Criação de treino com biblioteca filtrável
   6) Modal manager compatível com o restante da SPA
   -----------------------------------------------------------------
   Regras importantes preservadas:
   - Usa namespace App.*
   - Não quebra a estrutura atual do projeto
   - Continua compatível com Supabase e schema atual
   ================================================================= */

App.views = App.views || {};
App.views.trainer = {
  /* Cache local para evitar refetch desnecessário */
  _alunosCache: [],
  _treinosCache: [],
  _exerciseSearch: '',
  _exerciseGroup: '',

  /* ===============================================================
     DASHBOARD DO TREINADOR
     =============================================================== */
  async renderDashboard() {
    const user = App.state.user;

    const greetEl = document.getElementById('trainer-greeting');
    const statAlunosEl = document.getElementById('trainer-stat-alunos');
    const statTreinosEl = document.getElementById('trainer-stat-treinos');

    if (greetEl) greetEl.textContent = App.utils.greeting(user?.nome);

    /* Busca alunos e treinos do treinador */
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
          <p>Vincule alunos para começar a montar treinos personalizados.</p>
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

  /* ===============================================================
     LISTA DE ALUNOS
     =============================================================== */
  async renderAlunos() {
    const alunos = await App.data.getAlunosDoTreinador(App.state.user?.id);
    this._alunosCache = alunos || [];

    const el = document.getElementById('trainer-alunos-list');
    if (!el) return;

    el.innerHTML = `
      <div class="list-toolbar">
        <div class="search-field">
          <span class="search-icon">${App.icons.get('search', 16)}</span>
          <input
            type="search"
            id="aluno-search"
            placeholder="Buscar por nome ou email..."
            aria-label="Buscar aluno"
          >
        </div>

        <button class="btn btn-primary btn-sm" onclick="App.views.trainer._openVincularModal()">
          ${App.icons.get('user-plus', 15)} Vincular aluno
        </button>
      </div>

      <div id="alunos-results"></div>
    `;

    const input = document.getElementById('aluno-search');
    if (input) {
      input.addEventListener(
        'input',
        App.utils.debounce(() => this._filterAlunos(input.value), 180)
      );
    }

    this._filterAlunos('');
  },

  _filterAlunos(query) {
    const q = (query || '').trim().toLowerCase();

    const filtered = this._alunosCache.filter((row) => {
      const aluno = row.aluno || row;

      return (
        !q ||
        (aluno.nome || '').toLowerCase().includes(q) ||
        (aluno.email || '').toLowerCase().includes(q)
      );
    });

    const el = document.getElementById('alunos-results');
    if (!el) return;

    if (!filtered.length) {
      el.innerHTML = `<p class="empty-text">Nenhum aluno encontrado.</p>`;
      return;
    }

    el.innerHTML = filtered
      .map((row) => this._buildAlunoRow(row.aluno || row, true))
      .join('');
  },

  _buildAlunoRow(aluno, showActions = false) {
    const ini = App.utils.initial(aluno?.nome);
    const plan = aluno?.plan_type || 'free';

    return `
      <div class="aluno-row" role="listitem">
        <div class="aluno-avatar">${ini}</div>

        <div class="aluno-info">
          <div class="aluno-name">${App.utils.esc(aluno?.nome || 'Aluno')}</div>
          <div class="aluno-email">${App.utils.esc(aluno?.email || '')}</div>
        </div>

        <span class="chip chip-plan ${plan}">
          ${plan === 'premium' ? 'Premium' : 'Free'}
        </span>

        ${
          showActions
            ? `
              <div class="aluno-actions">
                <button class="btn btn-secondary btn-sm" onclick="App.views.trainer.openAlunoDetail('${aluno?.id}')">
                  ${App.icons.get('eye', 15)} Detalhes
                </button>

                <button class="btn btn-primary btn-sm" onclick="App.boot.navigateTo('criar-treino','${aluno?.id}')">
                  ${App.icons.get('plus', 15)} Treino
                </button>
              </div>
            `
            : ''
        }
      </div>
    `;
  },

  /* ===============================================================
     DETALHE DO ALUNO
     =============================================================== */
  async openAlunoDetail(alunoId) {
    App.state.selectedAluno = alunoId;

    /* Busca histórico e observações */
    const [history, observacoes] = await Promise.all([
      App.data.getHistory(alunoId),
      App.data.getObservacoes(alunoId),
    ]);

    const aluno =
      this._alunosCache.find((a) => (a.aluno || a)?.id === alunoId)?.aluno ||
      this._alunosCache.find((a) => (a.aluno || a)?.id === alunoId) ||
      {};

    const content = document.getElementById('modal-aluno-content');
    if (!content) return;

    content.innerHTML = `
      <div class="aluno-detail-header">
        <div class="aluno-avatar lg">${App.utils.initial(aluno?.nome)}</div>
        <div>
          <h3>${App.utils.esc(aluno?.nome || 'Aluno')}</h3>
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

      <div class="obs-section">
        <div class="obs-label">Nova observação</div>
        <textarea id="nova-obs" rows="3" placeholder="Anotações, feedback, ajustes ou recomendações..."></textarea>
        <button class="btn btn-primary btn-sm mt-8" onclick="App.views.trainer._saveObs('${alunoId}')">
          ${App.icons.get('check', 15)} Salvar observação
        </button>
      </div>

      ${
        observacoes?.length
          ? `
            <div class="obs-history">
              <div class="obs-label">Observações anteriores</div>
              ${observacoes
                .slice(0, 5)
                .map(
                  (o) => `
                    <div class="obs-item">
                      <div class="obs-date">${App.utils.fmtDate((o.created_at || '').split('T')[0])}</div>
                      <p>${App.utils.esc(o.conteudo || '')}</p>
                    </div>
                  `
                )
                .join('')}
            </div>
          `
          : ''
      }

      <div class="aluno-actions-footer">
        <button class="btn btn-primary" onclick="App.boot.navigateTo('criar-treino','${alunoId}'); App.modal.close();">
          ${App.icons.get('dumbbell', 15)} Criar treino para este aluno
        </button>
      </div>
    `;

    App.modal.open('modal-aluno', `Aluno: ${App.utils.esc(aluno?.nome || '')}`, null, {
      wide: true,
    });
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

  /* ===============================================================
     VINCULAR ALUNO
     =============================================================== */
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
      if (resultEl) {
        resultEl.innerHTML = `<div class="auth-error">Informe o email do aluno.</div>`;
      }
      return;
    }

    if (!App.utils.isEmail(email)) {
      if (resultEl) {
        resultEl.innerHTML = `<div class="auth-error">Email inválido.</div>`;
      }
      return;
    }

    if (resultEl) {
      resultEl.innerHTML = `<div class="auth-success">Buscando aluno...</div>`;
    }

    const result = await App.data.vincularAluno(App.state.user.id, email);

    if (result.error) {
      if (resultEl) {
        resultEl.innerHTML = `<div class="auth-error">${App.utils.esc(result.error)}</div>`;
      }
      return;
    }

    if (resultEl) {
      resultEl.innerHTML = `<div class="auth-success">Aluno vinculado com sucesso.</div>`;
    }

    App.utils.toast(`${result.aluno?.nome || 'Aluno'} vinculado com sucesso!`);
    App.modal.close();

    /* Atualiza as duas telas */
    await this.renderDashboard();
    await this.renderAlunos();
  },

  /* ===============================================================
     CRIAR TREINO
     =============================================================== */
  async renderCriarTreino(alunoId) {
    App.state.selectedAluno = alunoId || null;

    /* Mantém o rascunho limpo ao entrar na tela */
    App.state.workoutDraft = [];
    this._exerciseSearch = '';
    this._exerciseGroup = '';

    const alunos =
      this._alunosCache.length
        ? this._alunosCache
        : await App.data.getAlunosDoTreinador(App.state.user?.id);

    this._alunosCache = alunos || [];

    const exercicios = await App.data.getExercicios();

    /* Select de aluno */
    const alunoSelect = document.getElementById('treino-aluno-select');
    if (alunoSelect) {
      alunoSelect.innerHTML =
        `<option value="">Selecione o aluno...</option>` +
        this._alunosCache
          .map((row) => {
            const al = row.aluno || row;
            return `
              <option value="${al.id}" ${al.id === alunoId ? 'selected' : ''}>
                ${App.utils.esc(al.nome)}
              </option>
            `;
          })
          .join('');
    }

    /* Cabeçalho de filtro da biblioteca */
    const lib = document.getElementById('exercise-library');
    if (lib) {
      lib.innerHTML = `
        <div class="exercise-lib-toolbar">
          <div class="search-field">
            <span class="search-icon">${App.icons.get('search', 16)}</span>
            <input
              type="search"
              id="exercise-search"
              placeholder="Buscar exercício..."
              aria-label="Buscar exercício"
            >
          </div>

          <div class="form-group" style="margin-bottom:0">
            <select id="exercise-group-filter" aria-label="Filtrar por grupo muscular">
              <option value="">Todos os grupos</option>
              ${App.MUSCLE_GROUPS.map((g) => `<option value="${g}">${g}</option>`).join('')}
            </select>
          </div>
        </div>

        <div id="exercise-library-results"></div>
      `;

      const searchInput = document.getElementById('exercise-search');
      const groupSelect = document.getElementById('exercise-group-filter');

      if (searchInput) {
        searchInput.addEventListener(
          'input',
          App.utils.debounce(() => {
            this._exerciseSearch = searchInput.value || '';
            this._renderExerciseLibrary(exercicios);
          }, 180)
        );
      }

      if (groupSelect) {
        groupSelect.addEventListener('change', () => {
          this._exerciseGroup = groupSelect.value || '';
          this._renderExerciseLibrary(exercicios);
        });
      }

      this._renderExerciseLibrary(exercicios);
    }

    this.renderDraft();
  },

  _renderExerciseLibrary(exercicios) {
    const resultsEl = document.getElementById('exercise-library-results');
    if (!resultsEl) return;

    const q = (this._exerciseSearch || '').trim().toLowerCase();
    const group = this._exerciseGroup || '';

    const filtered = (exercicios || []).filter((ex) => {
      const matchQuery =
        !q ||
        (ex.nome || '').toLowerCase().includes(q) ||
        (ex.grupo_muscular || '').toLowerCase().includes(q);

      const matchGroup = !group || ex.grupo_muscular === group;

      return matchQuery && matchGroup;
    });

    if (!filtered.length) {
      resultsEl.innerHTML = `<p class="empty-text">Nenhum exercício encontrado para os filtros atuais.</p>`;
      return;
    }

    resultsEl.innerHTML = filtered
      .map(
        (ex) => `
          <div class="exercise-lib-item">
            <div class="exercise-lib-main">
              <div class="exercise-lib-name">${App.utils.esc(ex.nome)}</div>
              <div class="exercise-lib-meta">
                ${App.utils.esc(ex.grupo_muscular)} · ${App.utils.esc(App.EXERCISE_TYPES[ex.tipo] || ex.tipo || '—')}
              </div>
              ${
                ex.execucao
                  ? `<div class="exercise-lib-tip">${App.utils.esc(ex.execucao)}</div>`
                  : ''
              }
            </div>

            <button
              class="btn btn-secondary btn-sm"
              onclick="App.views.trainer.addExerciseToDraft(${ex.id})"
              aria-label="Adicionar ${App.utils.esc(ex.nome)} ao treino"
            >
              ${App.icons.get('plus', 14)} Adicionar
            </button>
          </div>
        `
      )
      .join('');
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
    App.utils.toast(`${ex.nome} adicionado ao treino.`, 'success', 1800);
  },

  removeExerciseFromDraft(index) {
    App.state.workoutDraft.splice(index, 1);
    this.renderDraft();
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
    if (!el) return;

    if (!App.state.workoutDraft.length) {
      el.innerHTML = `<p class="empty-text">Nenhum exercício selecionado.</p>`;
      return;
    }

    el.innerHTML = App.state.workoutDraft
      .map(
        (ex, i) => `
          <div class="draft-item">
            <div class="draft-item-top">
              <div>
                <strong>${App.utils.esc(ex.nome)}</strong>
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
                <input
                  class="input-sm"
                  type="number"
                  min="1"
                  value="${ex.series}"
                  onchange="App.views.trainer.updateDraftField(${i}, 'series', this.value)"
                >
              </div>

              <div class="form-group">
                <label>Repetições</label>
                <input
                  class="input-sm"
                  type="text"
                  value="${App.utils.esc(ex.repeticoes)}"
                  onchange="App.views.trainer.updateDraftField(${i}, 'repeticoes', this.value)"
                >
              </div>

              <div class="form-group">
                <label>Descanso</label>
                <select
                  class="input-sm"
                  onchange="App.views.trainer.updateDraftField(${i}, 'descanso', this.value)"
                >
                  ${App.REST_OPTIONS.map((r) => `<option value="${r}" ${r === ex.descanso ? 'selected' : ''}>${r}</option>`).join('')}
                </select>
              </div>
            </div>

            <div class="form-group" style="margin-bottom:0">
              <label>Observações</label>
              <textarea
                class="input-obs"
                placeholder="Observações opcionais do treinador"
                onchange="App.views.trainer.updateDraftField(${i}, 'observacoes', this.value)"
              >${App.utils.esc(ex.observacoes || '')}</textarea>
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
      const treino = await App.data.criarTreino(
        App.state.user.id,
        alunoId,
        nome,
        descricao,
        App.state.workoutDraft
      );

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

/* =================================================================
   MODAL MANAGER
   -----------------------------------------------------------------
   Gerenciador central de modais, compatível com index.html e app.js
   ================================================================= */
App.modal = {
  _currentSave: null,

  open(id, title, onSave, opts = {}) {
    const el = document.getElementById(id);
    if (!el) return;

    this._currentSave = onSave || null;

    const titleEl = el.querySelector('.modal-title');
    if (titleEl) titleEl.textContent = title || '';

    const card = el.querySelector('.modal-card');
    if (card) {
      card.classList.toggle('modal-wide', !!opts.wide);
    }

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

    document.body.style.overflow = '';
    this._currentSave = null;
  },

  save() {
    if (typeof this._currentSave === 'function') {
      this._currentSave();
    }
  },
};
