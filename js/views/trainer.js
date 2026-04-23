/* =================================================================
   views/trainer.js — Área completa do treinador
   Compatível com App.*
   ================================================================= */

App.views = App.views || {};
App.views.trainer = {

  _alunosCache: [],

  /* DASHBOARD DO TREINADOR */
  async renderDashboard() {
    const u = App.state.user;
    const greet = document.getElementById('trainer-greeting');
    const statAlunos = document.getElementById('trainer-stat-alunos');
    const statTreinos = document.getElementById('trainer-stat-treinos');

    if (greet) greet.textContent = App.utils.greeting(u?.nome);

    const alunos = await App.data.getAlunosDoTreinador(u?.id);
    this._alunosCache = alunos || [];

    if (statAlunos) statAlunos.textContent = this._alunosCache.length;

    const treinos = await App.data.getTreinosDoTreinador(u?.id);
    if (statTreinos) statTreinos.textContent = (treinos || []).length;

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
          <p>Vincule alunos para criar treinos personalizados.</p>
          <button class="btn btn-primary" onclick="App.views.trainer._openVincularModal()">
            ${App.icons.get('user-plus', 15)} Vincular aluno
          </button>
        </div>`;
      return;
    }

    el.innerHTML = alunos.slice(0, 5).map(a => this._buildAlunoRow(a.aluno || a)).join('');
  },

  /* LISTA DE ALUNOS */
  async renderAlunos() {
    const alunos = await App.data.getAlunosDoTreinador(App.state.user?.id);
    this._alunosCache = alunos || [];

    const el = document.getElementById('trainer-alunos-list');
    if (!el) return;

    el.innerHTML = `
      <div class="list-toolbar">
        <div class="search-field">
          <span class="search-icon">${App.icons.get('search',16)}</span>
          <input type="search" id="aluno-search" placeholder="Buscar por nome ou email..." aria-label="Buscar aluno">
        </div>
        <button class="btn btn-primary btn-sm" onclick="App.views.trainer._openVincularModal()">
          ${App.icons.get('user-plus',15)} Vincular aluno
        </button>
      </div>
      <div id="alunos-results"></div>
    `;

    const input = document.getElementById('aluno-search');
    if (input) {
      input.addEventListener('input', () => this._filterAlunos(input.value));
    }

    this._filterAlunos('');
  },

  _filterAlunos(query) {
    const q = (query || '').toLowerCase();
    const filtered = this._alunosCache.filter(a => {
      const al = a.aluno || a;
      return !q ||
        (al.nome || '').toLowerCase().includes(q) ||
        (al.email || '').toLowerCase().includes(q);
    });

    const el = document.getElementById('alunos-results');
    if (!el) return;

    el.innerHTML = filtered.length
      ? filtered.map(a => this._buildAlunoRow(a.aluno || a, true)).join('')
      : `<p class="empty-text">Nenhum aluno encontrado.</p>`;
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
        ${showActions ? `
          <div class="aluno-actions">
            <button class="btn btn-secondary btn-sm" onclick="App.views.trainer.openAlunoDetail('${aluno?.id}')">
              ${App.icons.get('eye',15)} Detalhes
            </button>
            <button class="btn btn-primary btn-sm" onclick="App.boot.navigateTo('criar-treino','${aluno?.id}')">
              ${App.icons.get('plus',15)} Treino
            </button>
          </div>
        ` : ''}
      </div>
    `;
  },

  /* DETALHE DO ALUNO */
  async openAlunoDetail(alunoId) {
    App.state.selectedAluno = alunoId;

    const [history, obs] = await Promise.all([
      App.data.getHistory(alunoId),
      App.data.getObservacoes ? App.data.getObservacoes(alunoId) : []
    ]);

    const aluno =
      this._alunosCache.find(a => (a.aluno || a)?.id === alunoId)?.aluno ||
      this._alunosCache.find(a => (a.aluno || a)?.id === alunoId) ||
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
          <div class="mini-stat-val">${App.utils.calcStreak(history.map(h => h.data || h.date))}</div>
          <div class="mini-stat-lbl">Streak</div>
        </div>
      </div>

      <div class="obs-section">
        <div class="obs-label">Nova observação</div>
        <textarea id="nova-obs" rows="3" placeholder="Anotações, feedback, ajustes recomendados..."></textarea>
        <button class="btn btn-primary btn-sm mt-8" onclick="App.views.trainer._saveObs('${alunoId}')">
          ${App.icons.get('save',15)} Salvar
        </button>
      </div>

      ${obs && obs.length ? `
        <div class="obs-history">
          <div class="obs-label">Observações anteriores</div>
          ${obs.slice(0,5).map(o => `
            <div class="obs-item">
              <div class="obs-date">${App.utils.fmtDate((o.created_at || '').split('T')[0])}</div>
              <p>${App.utils.esc(o.conteudo)}</p>
            </div>
          `).join('')}
        </div>
      ` : ''}

      <div class="aluno-actions-footer">
        <button class="btn btn-primary" onclick="App.boot.navigateTo('criar-treino','${alunoId}'); App.modal.close();">
          ${App.icons.get('dumbbell',15)} Criar treino para este aluno
        </button>
      </div>
    `;

    App.modal.open('modal-aluno', `Aluno: ${App.utils.esc(aluno?.nome || '')}`);
  },

  async _saveObs(alunoId) {
    const txt = document.getElementById('nova-obs')?.value?.trim();
    if (!txt) {
      App.utils.toast('Digite uma observação.', 'warn');
      return;
    }

    if (App.data.saveObservacao) {
      await App.data.saveObservacao(App.state.user.id, alunoId, txt);
      App.utils.toast('Observação salva.');
      this.openAlunoDetail(alunoId);
    } else {
      App.utils.toast('Função de observação ainda não disponível.', 'warn');
    }
  },

  /* VINCULAR ALUNO */
  _openVincularModal() {
    App.modal.open('modal-vincular', 'Vincular Aluno', () => this._doVincular());
  },

  async _doVincular() {
    const email = document.getElementById('vincular-email')?.value?.trim();
    if (!email) {
      App.utils.toast('Informe o email do aluno.', 'warn');
      return;
    }

    const result = await App.data.vincularAluno(App.state.user.id, email);

    if (result.error) {
      App.utils.toast(result.error, 'error');
      return;
    }

    App.utils.toast(`${result.aluno?.nome || 'Aluno'} vinculado!`);
    App.modal.close();
    await this.renderAlunos();
    await this.renderDashboard();
  },

  /* CRIAR TREINO */
  async renderCriarTreino(alunoId) {
    App.state.selectedAluno = alunoId || null;
    App.state.workoutDraft = [];

    const alunos = this._alunosCache.length
      ? this._alunosCache
      : await App.data.getAlunosDoTreinador(App.state.user?.id);

    this._alunosCache = alunos || [];

    const exercicios = await App.data.getExercicios();

    const alunoSelect = document.getElementById('treino-aluno-select');
    if (alunoSelect) {
      alunoSelect.innerHTML =
        `<option value="">Selecione o aluno...</option>` +
        this._alunosCache.map(a => {
          const al = a.aluno || a;
          return `<option value="${al.id}" ${al.id === alunoId ? 'selected' : ''}>${App.utils.esc(al.nome)}</option>`;
        }).join('');
    }

    const lib = document.getElementById('exercise-library');
    if (lib) {
      if (!exercicios.length) {
        lib.innerHTML = `<p class="empty-text">Nenhum exercício encontrado.</p>`;
      } else {
        lib.innerHTML = exercicios.map(ex => `
          <div class="exercise-lib-item">
            <div>
              <div class="exercise-lib-name">${App.utils.esc(ex.nome)}</div>
              <div class="exercise-lib-meta">${App.utils.esc(ex.grupo_muscular)} · ${App.utils.esc(ex.tipo)}</div>
            </div>
            <button class="btn btn-secondary btn-sm" onclick='App.views.trainer.addExerciseToDraft(${JSON.stringify(ex).replace(/'/g, "&apos;")})'>
              ${App.icons.get('plus',14)} Adicionar
            </button>
          </div>
        `).join('');
      }
    }

    this.renderDraft();
  },

  addExerciseToDraft(ex) {
    App.state.workoutDraft.push({
      exercicio_id: ex.id,
      nome: ex.nome,
      grupo_muscular: ex.grupo_muscular,
      series: 3,
      repeticoes: '10-12',
      descanso: '60s',
      observacoes: ''
    });
    this.renderDraft();
  },

  removeExerciseFromDraft(index) {
    App.state.workoutDraft.splice(index, 1);
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

    el.innerHTML = App.state.workoutDraft.map((ex, i) => `
      <div class="draft-item">
        <div class="draft-item-top">
          <strong>${App.utils.esc(ex.nome)}</strong>
          <button class="btn-icon-sm" onclick="App.views.trainer.removeExerciseFromDraft(${i})">×</button>
        </div>
        <div class="draft-grid">
          <input class="input-sm" type="number" min="1" value="${ex.series}" onchange="App.views.trainer.updateDraftField(${i}, 'series', this.value)">
          <input class="input-sm" type="text" value="${App.utils.esc(ex.repeticoes)}" onchange="App.views.trainer.updateDraftField(${i}, 'repeticoes', this.value)">
          <select class="input-sm" onchange="App.views.trainer.updateDraftField(${i}, 'descanso', this.value)">
            ${App.REST_OPTIONS.map(r => `<option value="${r}" ${r === ex.descanso ? 'selected' : ''}>${r}</option>`).join('')}
          </select>
        </div>
        <textarea class="input-obs" placeholder="Observações" onchange="App.views.trainer.updateDraftField(${i}, 'observacoes', this.value)">${App.utils.esc(ex.observacoes || '')}</textarea>
      </div>
    `).join('');
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
  }
};

/* MODAL MANAGER */
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
    }, 50);
  },

  close() {
    document.querySelectorAll('.modal').forEach(m => {
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
  }
};
