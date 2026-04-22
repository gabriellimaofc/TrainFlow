/* ============================================================
   TrainFlow v2 — js/views/trainer.js + js/workout.js
   Área do treinador e motor de treino ativo.
   ============================================================ */

// ════════════════════════════════════════════════════════════
// TRAINER VIEWS
// ════════════════════════════════════════════════════════════
TF.views = TF.views || {};
TF.views.trainer = {

  // ══════════════════════════════════════════════
  // DASHBOARD DO TREINADOR
  // ══════════════════════════════════════════════
  async renderDashboard() {
    const u = TF.state.user;
    document.getElementById('trainer-greeting').textContent = TF.utils.greeting(u?.nome);
    document.getElementById('trainer-date').textContent =
      new Date().toLocaleDateString('pt-BR',{ weekday:'long', day:'numeric', month:'long' });

    const alunos = await TF.data.getAlunosDoTreinador(u?.id);
    document.getElementById('trainer-stat-alunos').textContent = alunos.length;

    // Atividade desta semana entre todos os alunos
    document.getElementById('trainer-stat-ativos').textContent =
      alunos.filter(a => a.profiles).length;

    this._renderAlunosList(alunos, 'trainer-alunos-quick');
  },

  // ══════════════════════════════════════════════
  // LISTA DE ALUNOS
  // ══════════════════════════════════════════════
  async renderAlunos() {
    const alunos = await TF.data.getAlunosDoTreinador(TF.state.user?.id);
    this._renderAlunosList(alunos, 'trainer-alunos-full');
  },

  _renderAlunosList(alunos, containerId) {
    const el = document.getElementById(containerId);
    if (!el) return;
    if (!alunos.length) {
      el.innerHTML = `<div class="empty-state">
        <div class="empty-state-icon">👥</div>
        Nenhum aluno vinculado ainda.<br>
        <button class="btn-primary" style="margin-top:16px" onclick="TF.views.trainer._openVincularModal()">
          + Vincular Aluno
        </button>
      </div>`;
      return;
    }
    el.innerHTML = alunos.map(a => {
      const p   = a.profiles || a; // Supabase join ou fallback
      const ap  = a.aluno_perfil || {};
      const ini = (p.nome||'?')[0].toUpperCase();
      const obj = TF.GOALS[ap.objetivo] || '—';
      return `
        <div class="student-list-item" onclick="TF.views.trainer._openAlunoDetail('${p.id}')"
          role="button" tabindex="0" aria-label="Ver detalhes de ${TF.utils.esc(p.nome)}">
          <div class="stu-avatar" aria-hidden="true">${ini}</div>
          <div style="flex:1">
            <div class="stu-name">${TF.utils.esc(p.nome||'—')}</div>
            <div class="stu-meta">${obj}${ap.peso ? ' · '+ap.peso+' kg' : ''}${ap.altura ? ' · '+ap.altura+' cm' : ''}</div>
          </div>
          <span class="plan-badge ${p.plan_type||'free'}">${p.plan_type==='premium'?'⭐ Premium':'Free'}</span>
          <div class="stu-last-train">
            <span>Último treino</span>
            ${a.ultimo_treino ? TF.utils.fmtDate(a.ultimo_treino) : '—'}
          </div>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" stroke-width="2" aria-hidden="true"><polyline points="9,18 15,12 9,6"/></svg>
        </div>
      `;
    }).join('');
  },

  // ══════════════════════════════════════════════
  // DETALHE DO ALUNO
  // ══════════════════════════════════════════════
  async _openAlunoDetail(alunoId) {
    TF.state.viewingAluno = alunoId;

    // Busca dados
    const [history, notas, perfil] = await Promise.all([
      TF.data.getHistoricoAluno(alunoId),
      TF.data.getNotas(alunoId),
      TF.data.getAlunoPerfil(alunoId),
    ]);

    // Busca nome do aluno da lista já carregada
    const alunoNome = TF.state.alunosList?.find(a => (a.profiles?.id||a.id) === alunoId)?.profiles?.nome
      || TF.ls('profile_' + alunoId)?.nome || 'Aluno';

    document.getElementById('modal-aluno-content').innerHTML = `
      <div style="margin-bottom:20px">
        <div class="perfil-header" style="border:none;padding:0;margin-bottom:16px">
          <div class="stu-avatar" style="width:52px;height:52px;font-size:22px" aria-hidden="true">
            ${alunoNome[0].toUpperCase()}
          </div>
          <div>
            <h3 style="font-size:20px">${TF.utils.esc(alunoNome)}</h3>
            ${perfil?.objetivo ? `<div class="perfil-chip" style="display:inline-block;margin-top:4px">${TF.GOALS[perfil.objetivo]||''}</div>` : ''}
          </div>
        </div>

        <!-- Estatísticas rápidas -->
        <div class="stats-grid" style="grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:20px">
          <div class="stat-card" style="padding:14px 12px">
            <div class="stat-val" style="font-size:28px">${history.length}</div>
            <div class="stat-lbl">Treinos totais</div>
          </div>
          <div class="stat-card" style="padding:14px 12px">
            <div class="stat-val" style="font-size:28px">${TF.utils.calcStreak(history).current}</div>
            <div class="stat-lbl">Streak atual</div>
          </div>
          <div class="stat-card" style="padding:14px 12px">
            <div class="stat-val" style="font-size:28px">${TF.utils.countWeekWorkouts(history)}</div>
            <div class="stat-lbl">Esta semana</div>
          </div>
        </div>

        <!-- Últimos treinos -->
        <div class="sc-label" style="margin-bottom:8px">Últimos treinos</div>
        ${history.slice(0,5).length ? `
        <div class="section-card" style="margin-bottom:16px">
          ${history.slice(0,5).map(h => `
            <div class="activity-item">
              <div class="activity-left">
                <div class="activity-dot" aria-hidden="true"></div>
                <div>
                  <div class="activity-day-name">${TF.utils.esc(h.exercise_name||'Exercício')}</div>
                  <div class="activity-date">${TF.utils.fmtDate(h.date)}</div>
                </div>
              </div>
              <div style="text-align:right">
                ${h.carga > 0 ? `<div style="font-family:var(--font-display);font-size:16px;color:var(--accent)">${h.carga} kg</div>` : ''}
                <div style="font-size:11px;color:var(--muted)">${h.series}×${h.reps} reps</div>
              </div>
            </div>
          `).join('')}
        </div>` : '<p class="c-muted" style="font-size:13px;margin-bottom:16px">Nenhum treino registrado ainda.</p>'}

        <!-- Adicionar nota -->
        <div class="sc-label" style="margin-bottom:8px">Adicionar observação</div>
        <div class="form-group">
          <textarea id="nota-nova" rows="3" placeholder="Notas de evolução, feedback, ajustes no treino..."></textarea>
        </div>
        <button class="btn-primary" onclick="TF.views.trainer._saveNota('${alunoId}')" style="margin-bottom:20px">
          💾 Salvar nota
        </button>

        <!-- Notas anteriores -->
        ${notas.length ? `
          <div class="sc-label" style="margin-bottom:8px">Observações anteriores</div>
          ${notas.slice(0,5).map(n => `
            <div class="nota-item">
              <div class="nota-date">${TF.utils.fmtDate(n.created_at?.split('T')[0])}</div>
              <div class="nota-text">${TF.utils.esc(n.conteudo)}</div>
            </div>
          `).join('')}` : ''}
      </div>
    `;

    TF.modal.open('modal-aluno', `Aluno: ${TF.utils.esc(alunoNome)}`, null, { wide: true });
  },

  async _saveNota(alunoId) {
    const txt = document.getElementById('nota-nova')?.value?.trim();
    if (!txt) { TF.utils.toast('Digite uma observação.', 'warn'); return; }
    await TF.data.saveNota(TF.state.user.id, alunoId, txt);
    TF.utils.toast('Observação salva! 📝');
    document.getElementById('nota-nova').value = '';
    // Reabrir com dados frescos
    this._openAlunoDetail(alunoId);
  },

  // ══════════════════════════════════════════════
  // VINCULAR ALUNO
  // ══════════════════════════════════════════════
  _openVincularModal() {
    document.getElementById('modal-vincular-content').innerHTML = `
      <p style="font-size:13px;color:var(--muted);margin-bottom:16px">
        O aluno precisa ter uma conta no TrainFlow. Informe o email cadastrado.
      </p>
      <div class="form-group">
        <label for="vincular-email">Email do aluno</label>
        <input type="email" id="vincular-email" placeholder="aluno@email.com">
      </div>
      <div id="vincular-result"></div>
    `;
    TF.modal.open('modal-vincular', 'Vincular Aluno', () => this._doVincular());
  },

  async _doVincular() {
    const email = document.getElementById('vincular-email')?.value?.trim();
    if (!email) { TF.utils.toast('Informe o email do aluno.','warn'); return; }
    const result = await TF.data.vincularAluno(TF.state.user.id, email);
    if (result.error) {
      document.getElementById('vincular-result').innerHTML =
        `<div class="auth-error">${TF.utils.esc(result.error)}</div>`;
      return;
    }
    TF.utils.toast(`${result.aluno?.nome || 'Aluno'} vinculado com sucesso! 🎉`);
    TF.modal.close();
    this.renderAlunos();
  },
};

// ════════════════════════════════════════════════════════════
// WORKOUT ENGINE
// ════════════════════════════════════════════════════════════
TF.workout = {

  /** Inicia treino de um dia específico */
  startDay(dayId) {
    const day = TF.getDayById(dayId);
    if (!day) return;

    TF.state.activeWorkout = {
      dayId,
      startTime:          Date.now(),
      logs:               {},
      completedExercises: new Set(),
    };

    // Navega para a view de treino ativo
    TF.app.navigateTo('treinar');

    // Renderiza tela ativa
    this._showActiveScreen(day);
  },

  /** Renderiza tela de treino ativo */
  _showActiveScreen(day) {
    document.getElementById('workout-select-screen').classList.add('hidden');
    const activeEl = document.getElementById('workout-active-screen');
    activeEl.classList.remove('hidden');

    document.getElementById('active-day-name').textContent  = day.nome;
    document.getElementById('active-day-focus').textContent = day.foco;

    this._updateProgress(day);
    this._renderExercises(day);
    this._startClock();
  },

  _renderExercises(day) {
    const container = document.getElementById('active-exercise-list');
    container.innerHTML = day.exercicios.map((ex, i) => `
      <div class="active-ex-card" id="aec-${ex.id}" role="listitem">
        <div class="aec-header">
          <div class="aec-left">
            <div class="aec-num" aria-hidden="true">${i+1}</div>
            <div>
              <div class="aec-name">${TF.utils.esc(ex.nome)}</div>
              <div class="aec-muscle">${TF.utils.esc(ex.grupo)} · ${ex.descanso}</div>
            </div>
          </div>
          <div style="display:flex;align-items:center;gap:10px;flex-shrink:0">
            <div class="aec-sets-reps">${ex.series}×${ex.reps}</div>
            <span class="aec-done-mark" aria-hidden="true">✓</span>
          </div>
          <button class="btn-log-ex" onclick="TF.workout.openLogModal(${ex.id})"
            aria-label="Registrar ${TF.utils.esc(ex.nome)}">Registrar</button>
        </div>
        <div class="aec-body">
          <div class="aec-tips">${TF.utils.esc(ex.dicas)}</div>
          <span class="aec-logged-info" id="aec-info-${ex.id}" aria-live="polite"></span>
        </div>
      </div>
    `).join('');
  },

  _updateProgress(day) {
    const total = day.exercicios.length;
    const done  = TF.state.activeWorkout?.completedExercises.size || 0;
    const pct   = total > 0 ? (done / total) * 100 : 0;
    const bar   = document.getElementById('workout-prog-bar');
    const txt   = document.getElementById('workout-prog-text');
    if (bar) bar.style.width  = pct + '%';
    if (txt) txt.textContent  = `${done}/${total}`;
  },

  _startClock() {
    clearInterval(TF.state.clockInterval);
    TF.state.clockSecs = 0;
    TF.state.clockInterval = setInterval(() => {
      TF.state.clockSecs++;
      const el = document.getElementById('workout-clock');
      if (el) el.textContent = TF.utils.fmtTime(TF.state.clockSecs);
    }, 1000);
  },

  /** Abre modal de log de exercício */
  openLogModal(exerciseId) {
    TF.state.currentLogId = exerciseId;
    const day = TF.getDayById(TF.state.activeWorkout?.dayId);
    const ex  = day?.exercicios.find(e => e.id === exerciseId);
    if (!ex) return;

    const history  = TF.data.getHistorySync();
    const lastLogs = history.filter(h => h.exercise_id === exerciseId)
      .sort((a,b) => b.date > a.date ? 1 : -1);
    const last = lastLogs[0];

    document.getElementById('modal-ex-name').textContent = ex.nome;
    document.getElementById('modal-ex-info').innerHTML =
      `<strong>${ex.series} × ${ex.reps}</strong> · Descanso: ${ex.descanso} · ${ex.rpe}<br>
       <em style="font-style:italic;color:var(--muted)">${TF.utils.esc(ex.obs)}</em>`;

    const hintEl = document.getElementById('modal-last-log');
    if (last) {
      hintEl.textContent = `Último: ${last.carga}kg × ${last.reps} reps (${TF.utils.fmtDate(last.date)})`;
      hintEl.classList.remove('hidden');
      document.getElementById('modal-carga').value  = last.carga || '';
      document.getElementById('modal-reps').value   = last.reps  || '';
    } else {
      hintEl.classList.add('hidden');
      document.getElementById('modal-carga').value = '';
      document.getElementById('modal-reps').value  = '';
    }
    document.getElementById('modal-series').value = ex.series;

    TF.modal.open('modal-log', `Registrar — ${ex.nome}`);
    setTimeout(() => document.getElementById('modal-carga')?.focus(), 100);
  },

  /** Salva o log do exercício */
  async saveLog() {
    const exId   = TF.state.currentLogId;
    const carga  = parseFloat(document.getElementById('modal-carga').value) || 0;
    const reps   = parseInt(document.getElementById('modal-reps').value)   || 0;
    const series = parseInt(document.getElementById('modal-series').value)  || 1;
    if (!exId) return;

    const ex    = TF.getExerciseById(exId);
    const entry = {
      exercise_id:   exId,
      exercise_name: ex?.nome || '',
      day_id:        TF.state.activeWorkout.dayId,
      carga, reps, series,
      date: TF.utils.today(),
    };

    await TF.data.saveLog(entry);
    TF.state.activeWorkout.logs[exId] = entry;
    TF.state.activeWorkout.completedExercises.add(exId);

    // Marca card como concluído
    const card   = document.getElementById(`aec-${exId}`);
    const infoEl = document.getElementById(`aec-info-${exId}`);
    if (card)   card.classList.add('done');
    if (infoEl) infoEl.textContent = carga > 0 ? `${carga} kg × ${reps} reps` : `${reps} reps`;

    // Atualiza progresso
    const day = TF.getDayById(TF.state.activeWorkout.dayId);
    if (day) this._updateProgress(day);

    TF.modal.close();

    // Timer de descanso
    const restSecs = this._parseRestSecs(ex?.descanso || '90s');
    this.startRest(restSecs);
  },

  _parseRestSecs(str) {
    if (!str) return 90;
    if (str.includes('2–3') || str.includes('2-3')) return 150;
    if (str.includes('2 min'))  return 120;
    if (str.includes('90'))     return 90;
    if (str.includes('60–90') || str.includes('60-90')) return 75;
    if (str.includes('60'))     return 60;
    return 90;
  },

  /** Inicia timer de descanso */
  startRest(secs) {
    TF.state.restTotal     = secs;
    TF.state.restRemaining = secs;
    const overlay  = document.getElementById('rest-overlay');
    const numEl    = document.getElementById('rest-num');
    const ring     = document.getElementById('rest-ring-fill');
    const CIRC     = 339.3;

    overlay.classList.remove('hidden');
    numEl.textContent = secs;
    ring.style.strokeDashoffset = 0;

    clearInterval(TF.state.restInterval);
    TF.state.restInterval = setInterval(() => {
      TF.state.restRemaining--;
      if (TF.state.restRemaining <= 0) { this.skipRest(); return; }
      numEl.textContent = TF.state.restRemaining;
      ring.style.strokeDashoffset = (1 - TF.state.restRemaining / TF.state.restTotal) * CIRC;
    }, 1000);
  },

  skipRest() {
    clearInterval(TF.state.restInterval);
    document.getElementById('rest-overlay').classList.add('hidden');
  },

  /** Cancela o treino atual */
  cancel() {
    if (!confirm('Cancelar o treino atual?')) return;
    clearInterval(TF.state.clockInterval);
    clearInterval(TF.state.restInterval);
    TF.state.activeWorkout = null;
    document.getElementById('workout-active-screen').classList.add('hidden');
    document.getElementById('workout-select-screen').classList.remove('hidden');
  },

  /** Finaliza e salva o treino */
  async finish() {
    const done = TF.state.activeWorkout?.completedExercises.size || 0;
    if (done === 0) { TF.utils.toast('Registre pelo menos um exercício!', 'warn'); return; }

    clearInterval(TF.state.clockInterval);
    clearInterval(TF.state.restInterval);
    this.skipRest();

    const mins  = Math.floor((TF.state.clockSecs || 0) / 60);
    const day   = TF.getDayById(TF.state.activeWorkout?.dayId);
    TF.utils.toast(`🎉 ${day?.nome||'Treino'} concluído! ${done} exercícios em ${mins} min.`, 'success', 4000);

    TF.state.activeWorkout = null;
    document.getElementById('workout-active-screen').classList.add('hidden');
    document.getElementById('workout-select-screen').classList.remove('hidden');
    TF.app.navigateTo('dashboard');
  },
};

// ════════════════════════════════════════════════════════════
// MODAL MANAGER
// ════════════════════════════════════════════════════════════
TF.modal = {
  _currentSave: null,

  open(id, title, onSave, opts = {}) {
    const el = document.getElementById(id);
    if (!el) return;
    this._currentSave = onSave;
    const titleEl = el.querySelector('.modal-header h3');
    if (titleEl) titleEl.textContent = title;
    if (opts.wide) el.querySelector('.modal-card').style.maxWidth = '640px';
    else if (el.querySelector('.modal-card')) el.querySelector('.modal-card').style.maxWidth = '';
    el.classList.remove('hidden');
    // Foca no primeiro input
    setTimeout(() => el.querySelector('input, textarea, select')?.focus(), 100);
    // Accessibility
    el.setAttribute('aria-hidden','false');
    document.body.style.overflow = 'hidden';
  },

  close() {
    document.querySelectorAll('.modal').forEach(m => {
      m.classList.add('hidden');
      m.setAttribute('aria-hidden','true');
    });
    document.body.style.overflow = '';
    this._currentSave = null;
  },

  save() {
    if (typeof this._currentSave === 'function') this._currentSave();
  },
};
