/* ============================================================
   TrainFlow v2 — js/utils.js + js/data.js + js/auth.js
   (agrupados num único arquivo para simplificar o carregamento)
   ============================================================ */

// ════════════════════════════════════════════════════════════
// UTILS
// ════════════════════════════════════════════════════════════
TF.utils = {

  /** Formata data para pt-BR */
  fmtDate(str, opts = {}) {
    if (!str) return '—';
    const d = new Date(str + 'T12:00:00');
    return d.toLocaleDateString('pt-BR', { day:'numeric', month:'short', ...opts });
  },

  /** Diferença em dias entre duas datas */
  dayDiff(a, b) {
    const d1 = new Date(a + 'T00:00:00');
    const d2 = new Date(b + 'T00:00:00');
    return Math.round((d2 - d1) / 86400000);
  },

  /** Data de hoje em yyyy-mm-dd */
  today() {
    return new Date().toISOString().split('T')[0];
  },

  /** Desabilita/habilita um botão e troca o texto */
  setBtnLoading(id, loading, text = 'Aguarde...') {
    const btn = document.getElementById(id);
    if (!btn) return;
    btn.disabled = loading;
    const span = btn.querySelector('span') || btn;
    if (span !== btn) span.textContent = loading ? text : btn.dataset.label || span.textContent;
  },

  /** Mostra um toast de notificação */
  toast(msg, type = 'success', dur = 3500) {
    const icons = { success:'✅', error:'❌', warn:'⚠️', info:'ℹ️' };
    const el = document.createElement('div');
    el.className = `toast ${type}`;
    el.innerHTML = `<span class="toast-icon">${icons[type]||'ℹ️'}</span><span>${msg}</span>`;
    const container = document.getElementById('toast-container');
    container.appendChild(el);
    setTimeout(() => el.remove(), dur);
  },

  /** Calcula streak (dias consecutivos) a partir do histórico */
  calcStreak(history) {
    if (!history.length) return { current:0, best: TF.ls('best_streak') || 0 };
    const dates = [...new Set(history.map(h => h.date))].sort((a,b) => b > a ? 1 : -1);
    const today  = this.today();
    let current = 0, prev = today;
    for (const d of dates) {
      const diff = this.dayDiff(d, prev);
      if (diff <= 1) { current++; prev = d; }
      else break;
    }
    const best = Math.max(current, TF.ls('best_streak') || 0);
    TF.ls('best_streak', best);
    return { current, best };
  },

  /** Conta treinos distintos na semana atual */
  countWeekWorkouts(history) {
    const now   = new Date();
    const start = new Date(now);
    start.setDate(now.getDate() - now.getDay());
    start.setHours(0,0,0,0);
    const keys = new Set(history
      .filter(h => new Date(h.date+'T12:00:00') >= start)
      .map(h => h.date + '_' + (h.day_id||'')));
    return keys.size;
  },

  /** Retorna saudação por hora do dia */
  greeting(nome) {
    const h = new Date().getHours();
    const g = h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite';
    return `${g}, ${(nome||'').split(' ')[0]}! 👋`;
  },

  /** Escapa HTML para evitar XSS */
  esc(str) {
    return String(str||'')
      .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
      .replace(/"/g,'&quot;');
  },

  /** Converte segundos → mm:ss */
  fmtTime(secs) {
    const m = String(Math.floor(secs/60)).padStart(2,'0');
    const s = String(secs%60).padStart(2,'0');
    return `${m}:${s}`;
  },
};

// ════════════════════════════════════════════════════════════
// LOCALSTORAGE HELPER (namespaced)
// ════════════════════════════════════════════════════════════
TF.ls = function(key, val) {
  const k = 'tf2_' + key;
  if (val !== undefined) { localStorage.setItem(k, JSON.stringify(val)); return val; }
  try { return JSON.parse(localStorage.getItem(k)); } catch { return null; }
};

// ════════════════════════════════════════════════════════════
// DATA SERVICE  (Supabase ou localStorage como fallback)
// ════════════════════════════════════════════════════════════
TF.data = {

  // ── Histórico ──────────────────────────────────────────
  async saveLog(entry) {
    const uid   = TF.state.user?.id;
    const clean = { ...entry, user_id: uid };
    // localStorage (sempre — fallback e cache)
    const hist  = TF.ls('history') || [];
    hist.push(clean);
    TF.ls('history', hist);
    // Supabase
    if (TF.USE_SUPABASE && TF.sb) {
      await TF.sb.from('historico').insert({
        user_id:       uid,
        exercise_id:   clean.exercise_id,
        exercise_name: clean.exercise_name,
        day_id:        clean.day_id,
        carga:         clean.carga,
        reps:          clean.reps,
        series:        clean.series,
        data:          clean.date,
      });
    }
  },

  async getHistory(userId) {
    if (TF.USE_SUPABASE && TF.sb) {
      const { data, error } = await TF.sb.from('historico')
        .select('*').eq('user_id', userId).order('data',{ ascending:false });
      if (!error && data) {
        const mapped = data.map(r => ({
          exercise_id:   r.exercise_id,
          exercise_name: r.exercise_name,
          day_id:        r.day_id,
          carga:         r.carga,
          reps:          r.reps,
          series:        r.series,
          date:          r.data,
          user_id:       r.user_id,
        }));
        TF.ls('history', mapped);
        return mapped;
      }
    }
    return TF.ls('history') || [];
  },

  getHistorySync() { return TF.ls('history') || []; },

  // ── Perfil ─────────────────────────────────────────────
  async getProfile(userId) {
    if (TF.USE_SUPABASE && TF.sb) {
      const { data } = await TF.sb.from('profiles').select('*').eq('id', userId).single();
      if (data) { TF.ls('profile', data); return data; }
    }
    return TF.ls('profile');
  },

  async updateProfile(userId, fields) {
    TF.ls('profile', { ...TF.ls('profile'), ...fields });
    if (TF.USE_SUPABASE && TF.sb) {
      await TF.sb.from('profiles').update(fields).eq('id', userId);
    }
  },

  // ── Perfil do aluno ────────────────────────────────────
  async getAlunoPerfil(userId) {
    if (TF.USE_SUPABASE && TF.sb) {
      const { data } = await TF.sb.from('aluno_perfil').select('*').eq('user_id', userId).single();
      if (data) { TF.ls('aluno_perfil', data); return data; }
    }
    return TF.ls('aluno_perfil');
  },

  async upsertAlunoPerfil(userId, fields) {
    const data = { user_id: userId, ...fields, updated_at: new Date().toISOString() };
    TF.ls('aluno_perfil', data);
    if (TF.USE_SUPABASE && TF.sb) {
      await TF.sb.from('aluno_perfil').upsert(data, { onConflict:'user_id' });
    }
  },

  // ── Medidas ────────────────────────────────────────────
  async getMedidas(userId) {
    if (TF.USE_SUPABASE && TF.sb) {
      const { data } = await TF.sb.from('medidas').select('*')
        .eq('user_id', userId).order('data',{ ascending:false });
      if (data) { TF.ls('medidas', data); return data; }
    }
    return TF.ls('medidas') || [];
  },

  async saveMedida(userId, fields) {
    const row = { user_id: userId, data: TF.utils.today(), ...fields };
    const arr = TF.ls('medidas') || [];
    arr.unshift(row);
    TF.ls('medidas', arr);
    if (TF.USE_SUPABASE && TF.sb) {
      await TF.sb.from('medidas').insert(row);
    }
  },

  // ── Treinador: busca alunos vinculados ─────────────────
  async getAlunosDoTreinador(treinadorId) {
    if (TF.USE_SUPABASE && TF.sb) {
      const { data } = await TF.sb.from('treinador_aluno')
        .select('aluno_id, profiles:aluno_id(id,nome,plan_type,created_at), aluno_perfil:aluno_id(objetivo,peso,altura)')
        .eq('treinador_id', treinadorId).eq('ativo', true);
      if (data) return data;
    }
    return [];
  },

  async vincularAluno(treinadorId, alunoEmail) {
    if (!TF.USE_SUPABASE || !TF.sb) return { error: 'Supabase não configurado.' };
    // Busca o aluno pelo email
    const { data: users } = await TF.sb.from('profiles').select('id,nome').eq('email_check', alunoEmail);
    // alternativa: buscar via auth — mas sem admin key não dá.
    // Usamos um campo de busca por nome ou workaround:
    const { data: profile } = await TF.sb.rpc('get_profile_by_email', { p_email: alunoEmail });
    if (!profile) return { error: 'Aluno não encontrado com este email.' };
    await TF.sb.from('treinador_aluno').upsert({ treinador_id: treinadorId, aluno_id: profile.id, ativo: true });
    return { ok: true, aluno: profile };
  },

  async getHistoricoAluno(alunoId) {
    if (TF.USE_SUPABASE && TF.sb) {
      const { data } = await TF.sb.from('historico').select('*')
        .eq('user_id', alunoId).order('data',{ ascending:false }).limit(100);
      return data || [];
    }
    return [];
  },

  // ── Notas do treinador ─────────────────────────────────
  async getNotas(alunoId) {
    if (TF.USE_SUPABASE && TF.sb) {
      const { data } = await TF.sb.from('notas_treinador').select('*')
        .eq('aluno_id', alunoId).order('created_at',{ ascending:false });
      if (data) return data;
    }
    return TF.ls(`notas_${alunoId}`) || [];
  },

  async saveNota(treinadorId, alunoId, conteudo) {
    const row = { treinador_id: treinadorId, aluno_id: alunoId, conteudo, created_at: new Date().toISOString() };
    // localStorage
    const arr = TF.ls(`notas_${alunoId}`) || [];
    arr.unshift(row);
    TF.ls(`notas_${alunoId}`, arr);
    // Supabase
    if (TF.USE_SUPABASE && TF.sb) {
      await TF.sb.from('notas_treinador').insert(row);
    }
  },
};

// ════════════════════════════════════════════════════════════
// AUTH
// ════════════════════════════════════════════════════════════
TF.auth = {

  /** Role selecionada no form de signup */
  _selectedRole: 'aluno',

  init() {
    this._setupRoleSelector();
  },

  _setupRoleSelector() {
    document.querySelectorAll('.role-option').forEach(el => {
      el.addEventListener('click', () => {
        document.querySelectorAll('.role-option').forEach(o => o.classList.remove('selected'));
        el.classList.add('selected');
        this._selectedRole = el.dataset.role;
      });
    });
    // Seleciona 'aluno' por default
    document.querySelector('.role-option[data-role="aluno"]')?.classList.add('selected');
  },

  toggleForm(mode) {
    document.getElementById('login-form').classList.toggle('hidden', mode !== 'login');
    document.getElementById('signup-form').classList.toggle('hidden', mode !== 'signup');
  },

  showError(formId, msg) {
    const el = document.getElementById(formId + '-error');
    if (!el) return;
    el.textContent = msg;
    el.classList.remove('hidden');
    setTimeout(() => el.classList.add('hidden'), 5000);
  },

  async login() {
    const email = document.getElementById('login-email').value.trim();
    const pass  = document.getElementById('login-password').value;
    if (!email || !pass) { this.showError('login','Preencha email e senha.'); return; }

    TF.utils.setBtnLoading('btn-login', true);

    if (!TF.USE_SUPABASE) {
      // Demo mode
      const users = TF.ls('demo_users') || {};
      const u = users[email];
      if (!u || u.password !== pass) {
        TF.utils.setBtnLoading('btn-login', false);
        this.showError('login','Email ou senha incorretos.'); return;
      }
      TF.state.user = { id:email, nome:u.nome, email, role:u.role, plan_type:'premium' };
      TF.ls('demo_user', TF.state.user);
      TF.utils.setBtnLoading('btn-login', false);
      TF.app.enterApp();
      return;
    }

    const { data, error } = await TF.sb.auth.signInWithPassword({ email, password: pass });
    TF.utils.setBtnLoading('btn-login', false);
    if (error) { this.showError('login', error.message); return; }
    const profile = await TF.data.getProfile(data.user.id);
    TF.state.user = { ...data.user, ...profile };
    TF.app.enterApp();
  },

  async signup() {
    const nome  = document.getElementById('signup-nome').value.trim();
    const email = document.getElementById('signup-email').value.trim();
    const pass  = document.getElementById('signup-password').value;
    const role  = this._selectedRole;

    if (!nome||!email||!pass) { this.showError('signup','Preencha todos os campos.'); return; }
    if (pass.length < 6)       { this.showError('signup','Senha: mínimo 6 caracteres.'); return; }
    if (!email.includes('@'))  { this.showError('signup','Email inválido.'); return; }

    TF.utils.setBtnLoading('btn-signup', true);

    if (!TF.USE_SUPABASE) {
      const users = TF.ls('demo_users') || {};
      if (users[email]) { TF.utils.setBtnLoading('btn-signup',false); this.showError('signup','Email já cadastrado.'); return; }
      const id = 'u_' + Date.now();
      users[email] = { id, nome, password:pass, email, role, plan_type:'premium' };
      TF.ls('demo_users', users);
      TF.state.user = { id, nome, email, role, plan_type:'premium' };
      TF.ls('demo_user', TF.state.user);
      TF.utils.setBtnLoading('btn-signup', false);
      TF.app.enterApp();
      return;
    }

    const { data, error } = await TF.sb.auth.signUp({
      email, password: pass,
      options: { data: { nome, role } },
    });
    TF.utils.setBtnLoading('btn-signup', false);
    if (error) { this.showError('signup', error.message); return; }
    // Profile criado pelo trigger. Aguarda um tick:
    setTimeout(async () => {
      const profile = await TF.data.getProfile(data.user.id);
      TF.state.user = { ...data.user, ...profile };
      TF.app.enterApp();
    }, 800);
  },

  async logout() {
    if (TF.USE_SUPABASE && TF.sb) await TF.sb.auth.signOut();
    ['demo_user','history','profile','aluno_perfil','medidas','best_streak']
      .forEach(k => TF.ls(k, null));
    TF.state.user = null;
    TF.state.activeWorkout = null;
    clearInterval(TF.state.clockInterval);
    clearInterval(TF.state.restInterval);
    TF.app.enterAuth();
  },

  enterDemo() {
    TF.state.user = { id:'demo', nome:'Demo', email:'demo@trainflow.app', role:'aluno', plan_type:'premium' };
    TF.ls('demo_user', TF.state.user);
    TF.app.enterApp();
  },

  /** Verifica se usuário tem plano premium */
  isPremium() {
    return TF.state.user?.plan_type === 'premium';
  },

  /** Verifica se é treinador */
  isTrainer() {
    return TF.state.user?.role === 'treinador';
  },
};
