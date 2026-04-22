/* ============================================================
   TrainFlow v2 — js/views/student.js
   Todas as views do aluno: dashboard, programa, progresso,
   perfil (com medidas), cardio e ciência.
   ============================================================ */

TF.views = TF.views || {};

TF.views.student = {

  // ══════════════════════════════════════════════
  // DASHBOARD
  // ══════════════════════════════════════════════
  async renderDashboard() {
    const u = TF.state.user;

    // Saudação e data
    document.getElementById('dashboard-greeting').textContent = TF.utils.greeting(u?.nome);
    document.getElementById('dashboard-date').textContent =
      new Date().toLocaleDateString('pt-BR', { weekday:'long', day:'numeric', month:'long', year:'numeric' });

    const history = await TF.data.getHistory(u?.id);
    const streak  = TF.utils.calcStreak(history);
    const weekCnt = TF.utils.countWeekWorkouts(history);
    const total   = history.length;
    const cycle   = total % 20;
    const toDeload = 20 - cycle;

    // Stats cards
    document.getElementById('stat-streak').textContent  = streak.current;
    document.getElementById('stat-week').textContent    = weekCnt;
    document.getElementById('stat-total').textContent   = total;
    document.getElementById('stat-deload').textContent  = toDeload > 0 ? toDeload : '🔔';

    // Alertas
    this._renderAlerts(streak, toDeload, history);

    // Grade de dias rápidos
    this._renderDayQuickGrid('dashboard-day-grid');

    // Atividade recente
    this._renderRecentActivity(history);
  },

  _renderAlerts(streak, toDeload, history) {
    const zone = document.getElementById('alerts-zone');
    zone.innerHTML = '';
    if (toDeload === 0) {
      zone.innerHTML += `<div class="alert-card deload" role="alert">
        <span class="alert-icon">⚡</span>
        <div class="alert-text"><strong>Hora do Deload!</strong>
        Você completou um ciclo de 20 treinos. Reduza o volume em ~40% por 1 semana para maximizar as adaptações.</div>
      </div>`;
    }
    if (streak.current >= 7) {
      zone.innerHTML += `<div class="alert-card streak" role="status">
        <span class="alert-icon">🔥</span>
        <div class="alert-text"><strong>${streak.current} dias seguidos!</strong>
        Consistência incrível. Continue assim — é o maior fator de resultado.</div>
      </div>`;
    }
    // Estagnação: sem progresso em 5 treinos num exercício
    const hist5 = history.slice(0, 30);
    const hasPR  = hist5.some((h, i) => i > 0 && h.carga > hist5[i-1]?.carga);
    if (history.length >= 10 && !hasPR) {
      zone.innerHTML += `<div class="alert-card stagnation" role="alert">
        <span class="alert-icon">⚠️</span>
        <div class="alert-text"><strong>Possível estagnação</strong>
        Nenhum aumento de carga registrado recentemente. Considere progressão ou deload.</div>
      </div>`;
    }
  },

  _renderDayQuickGrid(containerId) {
    const el = document.getElementById(containerId);
    if (!el) return;
    el.innerHTML = TF.PROGRAM.map(day => `
      <button class="day-quick-card" onclick="TF.workout.startDay('${day.id}')"
        aria-label="Iniciar ${day.nome} — ${day.foco}">
        <div class="dqc-day">${day.dia}</div>
        <div class="dqc-name">${day.nome}</div>
        <div class="dqc-focus">${day.foco}</div>
      </button>
    `).join('');
  },

  _renderRecentActivity(history) {
    const el = document.getElementById('recent-activity-list');
    if (!history.length) {
      el.innerHTML = `<div class="empty-state"><div class="empty-state-icon">🏋️</div>Nenhum treino registrado ainda. Comece agora!</div>`;
      return;
    }
    // Agrupa por data + day_id
    const grouped = {};
    history.forEach(h => {
      const key = h.date + '_' + (h.day_id||'?');
      if (!grouped[key]) grouped[key] = { ...h, count:0 };
      grouped[key].count++;
    });
    const sessions = Object.values(grouped)
      .sort((a,b) => b.date > a.date ? 1 : -1)
      .slice(0, 6);
    el.innerHTML = sessions.map(s => {
      const day = TF.getDayById(s.day_id) || {};
      return `
        <div class="activity-item">
          <div class="activity-left">
            <div class="activity-dot" aria-hidden="true"></div>
            <div>
              <div class="activity-day-name">${day.nome||s.day_id} — ${day.foco||''}</div>
              <div class="activity-date">${TF.utils.fmtDate(s.date, {weekday:'short'})}</div>
            </div>
          </div>
          <span class="activity-excount">${s.count} exercícios</span>
        </div>
      `;
    }).join('');
  },

  // ══════════════════════════════════════════════
  // PROGRAMA
  // ══════════════════════════════════════════════
  renderPrograma() {
    const navEl  = document.getElementById('programa-day-nav');
    const contEl = document.getElementById('programa-day-content');
    navEl.innerHTML = TF.PROGRAM.map((d, i) =>
      `<button class="day-pill${i===0?' active':''}" data-day="${d.id}"
        onclick="TF.views.student._showProgramDay('${d.id}', this)"
        aria-label="Ver treino ${d.nome}">${d.dia} — ${d.nome}</button>`
    ).join('');
    this._showProgramDay(TF.PROGRAM[0].id, navEl.querySelector('.day-pill'));
  },

  _showProgramDay(dayId, btn) {
    document.querySelectorAll('#programa-day-nav .day-pill').forEach(p => {
      p.classList.remove('active');
      p.setAttribute('aria-selected','false');
    });
    if (btn) { btn.classList.add('active'); btn.setAttribute('aria-selected','true'); }
    const day = TF.getDayById(dayId);
    if (!day) return;
    document.getElementById('programa-day-content').innerHTML = this._buildDayCard(day);
  },

  _buildDayCard(day) {
    const rows = day.exercicios.map((ex, i) => `
      <tr>
        <td class="ex-num-cell" aria-hidden="true">${i+1}</td>
        <td>
          <div class="ex-name">${TF.utils.esc(ex.nome)}</div>
          <span class="ex-muscle">${TF.utils.esc(ex.grupo)}</span>
          <div class="ex-tip">${TF.utils.esc(ex.dicas)}</div>
          <a class="google-link" href="https://www.youtube.com/results?search_query=${encodeURIComponent(ex.nome+' execução')}"
            target="_blank" rel="noopener noreferrer" aria-label="Ver execução de ${ex.nome} no YouTube">
            ▶ Ver execução
          </a>
        </td>
        <td class="sets-reps-cell">${ex.series}×${ex.reps}</td>
        <td><span class="rest-pill">${ex.descanso}</span></td>
        <td class="rpe-cell">${ex.rpe}</td>
        <td>
          <button class="btn-icon" onclick="TF.workout.startDay('${day.id}')"
            title="Treinar ${ex.nome}" aria-label="Iniciar treino do dia ${day.nome}">
            ▶
          </button>
        </td>
      </tr>
    `).join('');

    return `
      <div class="day-content-card">
        <div class="day-content-header">
          <div class="dch-num" aria-hidden="true">${day.num}</div>
          <div class="dch-info">
            <h3>${TF.utils.esc(day.nome)} — ${TF.utils.esc(day.foco)}</h3>
            <div class="dch-sub">Intensidade: ${day.intensidade} · ${day.exercicios.length} exercícios</div>
          </div>
          <div class="dch-tags">
            <span class="tag">${day.dia}</span>
            <span class="tag">${day.intensidade}</span>
          </div>
        </div>
        <div class="table-wrap" role="region" aria-label="Exercícios do treino ${day.nome}">
          <table class="ex-table">
            <thead><tr>
              <th scope="col">#</th>
              <th scope="col">Exercício</th>
              <th scope="col">Séries × Reps</th>
              <th scope="col">Descanso</th>
              <th scope="col">RPE</th>
              <th scope="col"><span class="sr-only">Iniciar</span></th>
            </tr></thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
        <div class="cardio-bar">
          <div class="cardio-bar-icon" aria-hidden="true">${day.cardio.icon}</div>
          <div class="cardio-bar-text">
            <strong>${TF.utils.esc(day.cardio.text)}</strong>
            <span>${TF.utils.esc(day.cardio.sub)}</span>
          </div>
        </div>
      </div>
    `;
  },

  // ══════════════════════════════════════════════
  // PROGRESSO
  // ══════════════════════════════════════════════
  async renderProgresso() {
    if (!TF.auth.isPremium()) {
      this._renderPremiumGate('view-progresso-content',
        '📈 Progresso & Gráficos',
        'Acompanhe a evolução de carga em cada exercício, veja seus recordes pessoais e histórico completo.');
      return;
    }
    const u       = TF.state.user;
    const history = await TF.data.getHistory(u?.id);
    const streak  = TF.utils.calcStreak(history);

    document.getElementById('prog-streak').textContent = streak.current;
    document.getElementById('prog-best').textContent   = streak.best;
    document.getElementById('prog-total').textContent  = history.length;

    // Popula select de exercícios com dados históricos
    const usedIds = [...new Set(history.map(h => h.exercise_id).filter(Boolean))];
    const sel = document.getElementById('chart-exercise-select');
    sel.innerHTML = '<option value="">Escolha um exercício...</option>' +
      usedIds.map(id => {
        const ex = TF.getExerciseById(id);
        return ex ? `<option value="${id}">${TF.utils.esc(ex.nome)}</option>` : '';
      }).join('');

    this._renderPRList(history);
  },

  renderProgressChart() {
    const exId   = parseInt(document.getElementById('chart-exercise-select').value);
    const history = TF.data.getHistorySync();
    const data    = history
      .filter(h => h.exercise_id === exId && h.carga > 0)
      .sort((a,b) => a.date > b.date ? 1 : -1)
      .slice(-30); // últimos 30 registros

    if (TF.state.progressChart) { TF.state.progressChart.destroy(); TF.state.progressChart = null; }
    const canvas = document.getElementById('progress-chart');
    if (!canvas || !data.length) return;

    TF.state.progressChart = new Chart(canvas, {
      type: 'line',
      data: {
        labels: data.map(d => TF.utils.fmtDate(d.date)),
        datasets: [{
          label: 'Carga (kg)',
          data: data.map(d => d.carga),
          borderColor: '#e8704a', backgroundColor: 'rgba(232,112,74,0.10)',
          borderWidth: 2.5, tension: 0.35, fill: true,
          pointBackgroundColor: '#e8704a', pointRadius: 4, pointHoverRadius: 6,
        }],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: {
          legend: { display:false },
          tooltip: {
            backgroundColor:'#1e1e21', borderColor:'#2a2a2e', borderWidth:1,
            titleColor:'#e8e6e1', bodyColor:'#e8704a', padding:10,
            callbacks: { label: ctx => ` ${ctx.parsed.y} kg` },
          },
        },
        scales: {
          x: { grid:{ color:'rgba(42,42,46,.5)' }, ticks:{ color:'#7a7875', font:{ size:11 } } },
          y: { grid:{ color:'rgba(42,42,46,.5)' }, ticks:{ color:'#7a7875', font:{ size:11 }, callback: v => v+'kg' } },
        },
      },
    });
  },

  _renderPRList(history) {
    const prs = {};
    history.forEach(h => {
      const key = h.exercise_id || h.exercise_name;
      if (!prs[key] || h.carga > prs[key].carga) prs[key] = h;
    });
    const el = document.getElementById('pr-list');
    const allEx = TF.PROGRAM.flatMap(d => d.exercicios);
    const entries = Object.entries(prs).filter(([,h]) => h.carga > 0).sort(([,a],[,b]) => b.carga - a.carga);
    if (!entries.length) {
      el.innerHTML = '<div class="empty-state"><div class="empty-state-icon">🏆</div>Nenhum PR registrado ainda.</div>';
      return;
    }
    el.innerHTML = entries.map(([key, h]) => {
      const ex = allEx.find(e => e.id === parseInt(key)) || { nome: h.exercise_name||key, grupo:'—' };
      return `
        <div class="pr-list-item">
          <div>
            <div class="pr-ex-name">${TF.utils.esc(ex.nome)}</div>
            <div class="pr-ex-group">${TF.utils.esc(ex.grupo)} · ${TF.utils.fmtDate(h.date)}</div>
          </div>
          <div class="pr-val">${h.carga}<span> kg</span></div>
        </div>
      `;
    }).join('');
  },

  // ══════════════════════════════════════════════
  // PERFIL DO ALUNO
  // ══════════════════════════════════════════════
  async renderPerfil() {
    const u       = TF.state.user;
    const perfil  = await TF.data.getAlunoPerfil(u?.id) || {};
    const medidas = await TF.data.getMedidas(u?.id);
    const initial = (u?.nome||'?')[0].toUpperCase();

    document.getElementById('perfil-view-content').innerHTML = `
      <div class="section-card">
        <div class="perfil-header">
          <div class="perfil-avatar-lg" aria-hidden="true">${initial}</div>
          <div class="perfil-meta">
            <h3>${TF.utils.esc(u?.nome||'Usuário')}</h3>
            <div style="font-size:13px;color:var(--muted)">${TF.utils.esc(u?.email||'')}</div>
            <div class="perfil-chips">
              <span class="plan-badge ${u?.plan_type}">${u?.plan_type === 'premium' ? '⭐ Premium' : 'Free'}</span>
              ${perfil.objetivo ? `<span class="perfil-chip">${TF.GOALS[perfil.objetivo]||''}</span>` : ''}
              ${perfil.peso ? `<span class="perfil-chip">${perfil.peso} kg</span>` : ''}
              ${perfil.altura ? `<span class="perfil-chip">${perfil.altura} cm</span>` : ''}
            </div>
          </div>
          <button class="btn-secondary" onclick="TF.views.student._openPerfilModal()"
            aria-label="Editar perfil">✏️ Editar</button>
        </div>
      </div>

      <!-- Medidas -->
      ${TF.auth.isPremium() ? this._buildMedidasSection(medidas) : this._premiumMedidasTeaser()}
    `;
  },

  _buildMedidasSection(medidas) {
    const last = medidas[0] || {};
    const prev = medidas[1] || {};

    const campos = [
      { key:'braco_d',    label:'Braço D.',  unit:'cm' },
      { key:'braco_e',    label:'Braço E.',  unit:'cm' },
      { key:'peito',      label:'Peito',     unit:'cm' },
      { key:'cintura',    label:'Cintura',   unit:'cm' },
      { key:'quadril',    label:'Quadril',   unit:'cm' },
      { key:'coxa_d',     label:'Coxa D.',   unit:'cm' },
      { key:'coxa_e',     label:'Coxa E.',   unit:'cm' },
      { key:'panturrilha',label:'Panturrilha',unit:'cm'},
      { key:'peso_data',  label:'Peso',      unit:'kg' },
    ];

    const cards = campos.map(c => {
      const val  = last[c.key];
      const pval = prev[c.key];
      let delta  = '';
      if (val != null && pval != null) {
        const diff  = (val - pval).toFixed(1);
        const cls   = diff > 0 ? 'pos' : diff < 0 ? 'neg' : '';
        const arrow = diff > 0 ? '↑' : diff < 0 ? '↓' : '→';
        delta = `<div class="medida-delta ${cls}">${arrow} ${Math.abs(diff)} ${c.unit}</div>`;
      }
      return `
        <div class="medida-item">
          <div class="medida-label">${c.label}</div>
          <div class="medida-val">${val != null ? val : '—'} <span class="medida-unit">${val != null ? c.unit : ''}</span></div>
          ${delta}
        </div>
      `;
    }).join('');

    const histRows = medidas.slice(0,5).map(m => `
      <tr>
        <td>${TF.utils.fmtDate(m.data)}</td>
        <td>${m.peso_data||'—'} kg</td>
        <td>${m.cintura||'—'} cm</td>
        <td>${m.quadril||'—'} cm</td>
        <td>${m.notas ? TF.utils.esc(m.notas) : '—'}</td>
      </tr>
    `).join('');

    return `
      <div class="section-card" style="margin-top:20px">
        <div class="sc-header">
          <div><div class="sc-label">Última medição${last.data ? ' — '+TF.utils.fmtDate(last.data) : ''}</div>
          <h3 class="sc-title">Medidas Corporais</h3></div>
          <button class="btn-primary" onclick="TF.views.student._openMedidasModal()"
            aria-label="Registrar novas medidas">+ Registrar</button>
        </div>
        <div class="medidas-grid">${cards}</div>
      </div>
      ${medidas.length > 1 ? `
      <div class="section-card" style="margin-top:16px">
        <div class="sc-header"><div>
          <div class="sc-label">Histórico</div>
          <h3 class="sc-title">Últimas Medições</h3>
        </div></div>
        <div class="table-wrap">
          <table class="data-table">
            <thead><tr><th>Data</th><th>Peso</th><th>Cintura</th><th>Quadril</th><th>Notas</th></tr></thead>
            <tbody>${histRows}</tbody>
          </table>
        </div>
      </div>` : ''}
    `;
  },

  _premiumMedidasTeaser() {
    return `
      <div class="section-card" style="margin-top:20px">
        <div class="premium-gate">
          <div class="premium-gate-icon">📏</div>
          <h4>Medidas Corporais</h4>
          <p>Registre e acompanhe a evolução das suas medidas ao longo do tempo. Disponível no plano Premium.</p>
          <button class="btn-primary" onclick="TF.views.student._showUpgrade()">⭐ Upgrade para Premium</button>
        </div>
      </div>
    `;
  },

  _openPerfilModal() {
    const perfil = TF.ls('aluno_perfil') || {};
    document.getElementById('modal-perfil-form').innerHTML = `
      <div class="form-row">
        <div class="form-group">
          <label for="pf-idade">Idade</label>
          <input type="number" id="pf-idade" placeholder="25" min="10" max="100" value="${perfil.idade||''}">
        </div>
        <div class="form-group">
          <label for="pf-sexo">Identidade</label>
          <select id="pf-sexo">
            <option value="">Selecione</option>
            ${Object.entries(TF.SEXO).map(([v,l]) =>
              `<option value="${v}"${perfil.sexo===v?' selected':''}>${l}</option>`).join('')}
          </select>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label for="pf-peso">Peso (kg)</label>
          <input type="number" id="pf-peso" placeholder="65.0" step="0.1" min="20" max="400" value="${perfil.peso||''}">
        </div>
        <div class="form-group">
          <label for="pf-altura">Altura (cm)</label>
          <input type="number" id="pf-altura" placeholder="165" min="100" max="250" value="${perfil.altura||''}">
        </div>
      </div>
      <div class="form-group">
        <label for="pf-objetivo">Objetivo principal</label>
        <select id="pf-objetivo">
          <option value="">Selecione</option>
          ${Object.entries(TF.GOALS).map(([v,l]) =>
            `<option value="${v}"${perfil.objetivo===v?' selected':''}>${l}</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label for="pf-obs">Observações pessoais</label>
        <textarea id="pf-obs" rows="3" placeholder="Lesões, limitações, preferências...">${TF.utils.esc(perfil.observacoes||'')}</textarea>
      </div>
    `;
    TF.modal.open('modal-perfil', 'Editar Perfil', () => this._savePerfil());
  },

  async _savePerfil() {
    const u = TF.state.user;
    await TF.data.upsertAlunoPerfil(u.id, {
      idade:       parseInt(document.getElementById('pf-idade').value) || null,
      sexo:        document.getElementById('pf-sexo').value || null,
      peso:        parseFloat(document.getElementById('pf-peso').value) || null,
      altura:      parseInt(document.getElementById('pf-altura').value) || null,
      objetivo:    document.getElementById('pf-objetivo').value || null,
      observacoes: document.getElementById('pf-obs').value || null,
    });
    TF.utils.toast('Perfil atualizado! ✅');
    TF.modal.close();
    this.renderPerfil();
  },

  _openMedidasModal() {
    document.getElementById('modal-medidas-form').innerHTML = `
      <p style="font-size:12px;color:var(--muted);margin-bottom:16px">
        Preencha os campos disponíveis. Deixe em branco os que não mediu.
      </p>
      <div class="form-row">
        <div class="form-group"><label for="med-peso">Peso (kg)</label><input type="number" id="med-peso" step="0.1" placeholder="65.5"></div>
        <div class="form-group"><label for="med-data">Data</label><input type="date" id="med-data" value="${TF.utils.today()}"></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label for="med-braco-d">Braço D. (cm)</label><input type="number" id="med-braco-d" step="0.1" placeholder="30.0"></div>
        <div class="form-group"><label for="med-braco-e">Braço E. (cm)</label><input type="number" id="med-braco-e" step="0.1" placeholder="30.0"></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label for="med-peito">Peito (cm)</label><input type="number" id="med-peito" step="0.1" placeholder="85.0"></div>
        <div class="form-group"><label for="med-cintura">Cintura (cm)</label><input type="number" id="med-cintura" step="0.1" placeholder="70.0"></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label for="med-quadril">Quadril (cm)</label><input type="number" id="med-quadril" step="0.1" placeholder="95.0"></div>
        <div class="form-group"><label for="med-panturrilha">Panturrilha (cm)</label><input type="number" id="med-panturrilha" step="0.1" placeholder="35.0"></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label for="med-coxa-d">Coxa D. (cm)</label><input type="number" id="med-coxa-d" step="0.1" placeholder="55.0"></div>
        <div class="form-group"><label for="med-coxa-e">Coxa E. (cm)</label><input type="number" id="med-coxa-e" step="0.1" placeholder="55.0"></div>
      </div>
      <div class="form-group"><label for="med-notas">Notas</label><textarea id="med-notas" rows="2" placeholder="Como você está se sentindo..."></textarea></div>
    `;
    TF.modal.open('modal-medidas', 'Registrar Medidas', () => this._saveMedida());
  },

  async _saveMedida() {
    const u = TF.state.user;
    const num = id => parseFloat(document.getElementById(id)?.value) || null;
    await TF.data.saveMedida(u.id, {
      data:        document.getElementById('med-data').value || TF.utils.today(),
      peso_data:   num('med-peso'),
      braco_d:     num('med-braco-d'),
      braco_e:     num('med-braco-e'),
      peito:       num('med-peito'),
      cintura:     num('med-cintura'),
      quadril:     num('med-quadril'),
      panturrilha: num('med-panturrilha'),
      coxa_d:      num('med-coxa-d'),
      coxa_e:      num('med-coxa-e'),
      notas:       document.getElementById('med-notas').value || null,
    });
    TF.utils.toast('Medidas salvas! 📏');
    TF.modal.close();
    this.renderPerfil();
  },

  // ══════════════════════════════════════════════
  // CARDIO
  // ══════════════════════════════════════════════
  renderCardio() {
    // Conteúdo estático (já no HTML), nada a renderizar via JS
  },

  // ══════════════════════════════════════════════
  // CIÊNCIA
  // ══════════════════════════════════════════════
  renderCiencia() {
    // Conteúdo estático no HTML
  },

  // ══════════════════════════════════════════════
  // PERIODIZAÇÃO
  // ══════════════════════════════════════════════
  async renderPeriodizacao() {
    const history  = await TF.data.getHistory(TF.state.user?.id);
    const total    = history.length;
    const sinceD   = total % 20;
    const toDeload = 20 - sinceD;
    const el       = document.getElementById('deload-alert-block');
    if (toDeload === 0) {
      el.innerHTML = `<div class="note-box warn" style="margin-bottom:24px">
        <strong>⚡ Hora do Deload!</strong> Ciclo de 20 treinos completo.
        Reduza o volume em ~40% por 1 semana — mesmas cargas, menos séries. Depois volte mais forte.</div>`;
    } else {
      el.innerHTML = `<div class="note-box info" style="margin-bottom:24px">
        <strong>📊 Ciclo atual: ${sinceD}/20 treinos.</strong>
        Próximo deload em <strong>${toDeload} treinos</strong>. Continue registrando suas cargas.</div>`;
    }
  },

  // ══════════════════════════════════════════════
  // HELPERS
  // ══════════════════════════════════════════════
  _renderPremiumGate(containerId, title, desc) {
    const el = document.getElementById(containerId);
    if (!el) return;
    el.innerHTML = `
      <div class="premium-gate">
        <div class="premium-gate-icon">⭐</div>
        <h4>${title}</h4>
        <p>${desc}</p>
        <button class="btn-primary" onclick="TF.views.student._showUpgrade()">Fazer upgrade para Premium</button>
      </div>
    `;
  },

  _showUpgrade() {
    TF.utils.toast('Entre em contato com seu treinador para fazer upgrade! 💬', 'info', 5000);
  },
};
