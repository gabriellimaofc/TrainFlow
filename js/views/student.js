/* =================================================================
   views/student.js — Área completa do aluno
   -----------------------------------------------------------------
   Responsabilidades deste arquivo:
   1) Dashboard do aluno
   2) Tela de treino atual
   3) Tela de progresso
   4) Tela de perfil
   5) Integração com modais de perfil e medidas
   -----------------------------------------------------------------
   Objetivo:
   - manter a arquitetura atual baseada em App.*
   - melhorar legibilidade, UX e estabilidade
   - não quebrar as funcionalidades existentes
   ================================================================= */

App.views = App.views || {};
App.views.student = {
  /* ===============================================================
     DASHBOARD
     =============================================================== */
  async renderDashboard() {
    const u = App.state.user;
    const history = await App.data.getHistory(u?.id);

    /* Atualiza saudação e data */
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

    /* Métricas do topo */
    const streak = App.utils.calcStreak(history.map((h) => h.data || h.date));
    const weekCnt = this._countWeek(history);
    const total = history.length;
    const toDeload = Math.max(0, 20 - (total % 20));

    this._setText('stat-streak', streak);
    this._setText('stat-week', weekCnt);
    this._setText('stat-total', total);
    this._setText('stat-deload', toDeload > 0 ? toDeload : 'Agora');

    /* Alertas, treino rápido e histórico recente */
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

    /* Alerta de deload */
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

    /* Alerta de consistência */
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

    /* Regra crítica do produto:
       treino só aparece se existir treino ativo criado pelo treinador.
    */
    const treino = App.state.workout || null;

    if (!treino) {
      el.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">${App.icons.get('dumbbell', 40)}</div>
          <h3>Nenhum treino atribuído</h3>
          <p>Seu treinador ainda não criou um treino para você.</p>
        </div>
      `;
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
      el.innerHTML = `<p class="empty-text">Nenhuma sessão registrada ainda.</p>`;
      return;
    }

    /* Agrupa por dia + treino para evitar repetição excessiva */
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

  /* ===============================================================
     TREINO
     =============================================================== */
  async renderTreino() {
    const el = document.getElementById('treino-content');
    if (!el) return;

    const treino = App.state.workout;

    /* Empty state obrigatório quando não houver treino */
    if (!treino) {
      el.innerHTML = `
        <div class="empty-state large">
          <div class="empty-icon">${App.icons.get('dumbbell', 48)}</div>
          <h2>Sem treino atribuído</h2>
          <p>
            Seu treinador ainda não criou um treino para você.
            Quando houver um treino ativo, ele aparecerá aqui automaticamente.
          </p>
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
        ${
          exercicios.length
            ? exercicios.map((te, i) => this._buildExerciseCard(te, i)).join('')
            : `<p class="empty-text">Nenhum exercício adicionado ainda.</p>`
        }
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
              <div class="ex-name">${App.utils.esc(ex.nome || 'Exercício')}</div>
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

            ${
              te.observacoes
                ? `
                  <div class="ex-detail-item ex-detail-wide">
                    <div class="ex-detail-label">Observações</div>
                    <div class="ex-detail-val">${App.utils.esc(te.observacoes)}</div>
                  </div>
                `
                : ''
            }
          </div>

          ${
            ex.execucao
              ? `
                <div class="ex-execucao">
                  <div class="ex-execucao-label">Execução</div>
                  <p>${App.utils.esc(ex.execucao)}</p>
                </div>
              `
              : ''
          }

          ${
            ex.equipamento
              ? `
                <div class="ex-equip">
                  ${App.icons.get('info', 13)}
                  <span>${App.utils.esc(ex.equipamento)}</span>
                </div>
              `
              : ''
          }
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

  /* ===============================================================
     PROGRESSO
     =============================================================== */
  async renderProgresso() {
    const content = document.getElementById('progresso-content');
    if (!content) return;

    /* FREE vê teaser, PREMIUM vê métricas completas */
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

      if (h.carga > 0 && (!prs[key] || h.carga > prs[key].carga)) {
        prs[key] = h;
      }
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

  /* ===============================================================
     PERFIL
     =============================================================== */
  async renderPerfil() {
    const el = document.getElementById('perfil-content');
    if (!el) return;

    const [profile, detalhes, medidas] = await Promise.all([
      App.data.getProfile(App.state.user?.id),
      App.data.getAlunoDetalhes(App.state.user?.id),
      App.data.getMedidas(App.state.user?.id),
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
    `;
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
          ${campos
            .map((c) => {
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
            })
            .join('')}
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

  _openPerfilModal() {
    App.modal.open('modal-perfil', 'Editar Perfil', () => this._savePerfil());

    /* Preenche campos atuais */
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
    await App.data.upsertAlunoDetalhes(userId, {
      idade,
      sexo,
      peso,
      altura,
      objetivo,
      observacoes,
    });

    /* Reflete na sessão local */
    App.state.user = { ...App.state.user, nome };
    App.boot.updateUserUI();
    App.modal.close();
    App.utils.toast('Perfil atualizado com sucesso!');
    await this.renderPerfil();
  },

  _openMedidasModal() {
    App.modal.open('modal-medidas', 'Registrar Medidas', () => this._saveMedidas());

    /* Data padrão = hoje */
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

  /* ===============================================================
     TELAS ESTÁTICAS
     =============================================================== */
  renderCiencia() {
    /* O conteúdo permanece no HTML por enquanto.
       Em fase futura, podemos migrar para render dinâmico modular.
    */
  },

  renderCardio() {
    /* O conteúdo permanece no HTML por enquanto.
       Em fase futura, podemos migrar para render dinâmico modular.
    */
  },
};
