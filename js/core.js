/* =================================================================
   core.js — Utils, Data Service e Auth
   ================================================================= */

/* ─── UTILS ────────────────────────────────────────────────────── */
App.utils = {
  today()            { return new Date().toISOString().split('T')[0]; },
  fmtDate(str, opts) { if(!str) return '—'; return new Date(str+'T12:00:00').toLocaleDateString('pt-BR',{day:'numeric',month:'short',...opts}); },
  greeting(nome)     { const h=new Date().getHours(); const g=h<12?'Bom dia':h<18?'Boa tarde':'Boa noite'; return `${g}, ${(nome||'').split(' ')[0]}`; },
  initial(nome)      { return (nome||'U')[0].toUpperCase(); },
  esc(str)           { return String(str||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); },

  /* Mostra/esconde spinner num botão */
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

  /* Toast de notificação (sem emojis) */
  toast(msg, type = 'success', duration = 4000) {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const icons = { success:'check-circle', error:'alert-triangle', warn:'info', info:'info' };
    const colors = { success:'var(--success)', error:'var(--error)', warn:'var(--warning)', info:'var(--primary)' };
    const el = document.createElement('div');
    el.className = `toast toast-${type}`;
    el.innerHTML = `<span class="toast-icon" style="color:${colors[type]}">${App.icons.get(icons[type]||'info',16)}</span><span class="toast-msg">${this.esc(msg)}</span>`;
    container.appendChild(el);
    requestAnimationFrame(() => el.classList.add('toast-visible'));
    setTimeout(() => { el.classList.remove('toast-visible'); setTimeout(()=>el.remove(), 400); }, duration);
  },

  /* Calcula streak de dias consecutivos */
  calcStreak(dates) {
    if (!dates.length) return 0;
    const sorted = [...new Set(dates)].sort((a,b) => b>a?1:-1);
    let streak = 0;
    let prev   = this.today();
    for (const d of sorted) {
      const diff = (new Date(prev+'T12:00:00') - new Date(d+'T12:00:00')) / 86400000;
      if (diff <= 1) { streak++; prev = d; } else break;
    }
    return streak;
  },

  /* Valida email */
  isEmail(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); },

  /* Debounce para campos de busca */
  debounce(fn, ms = 300) {
    let t;
    return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
  },
};

/* ─── DATA SERVICE ─────────────────────────────────────────────── */
App.data = {

  /* Histórico de treinos */
  async saveSession(entry) {
    const uid = App.state.user?.id;
    const row = { ...entry, user_id: uid };
    const cache = App.ls('history') || [];
    cache.unshift(row);
    App.ls('history', cache.slice(0, 500));
    if (App.USE_SUPABASE && App.state.sb) {
      await App.state.sb.from('historico_treino').insert({
        user_id:        uid,
        treino_id:      entry.treino_id   || null,
        exercicio_id:   entry.exercicio_id|| null,
        exercicio_nome: entry.exercicio_nome,
        carga:          entry.carga       || 0,
        reps:           entry.reps        || 0,
        series:         entry.series      || 0,
        data:           entry.data        || App.utils.today(),
      });
    }
  },

  async getHistory(userId) {
    if (App.USE_SUPABASE && App.state.sb) {
      const { data } = await App.state.sb.from('historico_treino')
        .select('*').eq('user_id', userId).order('data', { ascending: false }).limit(200);
      if (data) { App.ls('history', data); return data; }
    }
    return App.ls('history') || [];
  },

  /* Profile */
  async getProfile(userId) {
    if (App.USE_SUPABASE && App.state.sb) {
      const { data } = await App.state.sb.from('profiles').select('*').eq('id', userId).single();
      if (data) { App.ls('profile', data); return data; }
    }
    return App.ls('profile');
  },

  async updateProfile(userId, fields) {
    App.ls('profile', { ...(App.ls('profile')||{}), ...fields });
    if (App.USE_SUPABASE && App.state.sb) {
      await App.state.sb.from('profiles').update(fields).eq('id', userId);
    }
  },

  /* Detalhes do aluno */
  async getAlunoDetalhes(userId) {
    if (App.USE_SUPABASE && App.state.sb) {
      const { data } = await App.state.sb.from('alunos_detalhes').select('*').eq('user_id', userId).single();
      if (data) { App.ls(`aluno_${userId}`, data); return data; }
    }
    return App.ls(`aluno_${userId}`);
  },

  async upsertAlunoDetalhes(userId, fields) {
    const row = { user_id: userId, ...fields };
    App.ls(`aluno_${userId}`, row);
    if (App.USE_SUPABASE && App.state.sb) {
      await App.state.sb.from('alunos_detalhes').upsert(row, { onConflict: 'user_id' });
    }
  },

  /* Medidas */
  async getMedidas(userId) {
    if (App.USE_SUPABASE && App.state.sb) {
      const { data } = await App.state.sb.from('medidas').select('*').eq('user_id', userId).order('data', { ascending: false });
      if (data) { App.ls(`medidas_${userId}`, data); return data; }
    }
    return App.ls(`medidas_${userId}`) || [];
  },

  async saveMedida(userId, fields) {
    const row = { user_id: userId, data: App.utils.today(), ...fields };
    const arr = App.ls(`medidas_${userId}`) || [];
    arr.unshift(row);
    App.ls(`medidas_${userId}`, arr);
    if (App.USE_SUPABASE && App.state.sb) {
      await App.state.sb.from('medidas').insert(row);
    }
  },

  /* Biblioteca de exercícios */
  async getExercicios() {
    if (App.state.exerciseList.length) return App.state.exerciseList;
    if (App.USE_SUPABASE && App.state.sb) {
      const { data } = await App.state.sb.from('exercicios').select('*').eq('ativo', true).order('grupo_muscular').order('nome');
      if (data && data.length) { App.state.exerciseList = data; App.ls('exercicios', data); return data; }
    }
    const cached = App.ls('exercicios');
    if (cached) { App.state.exerciseList = cached; return cached; }
    return [];
  },

  /* Treino do aluno */
  async getTreinoAtivo(alunoId) {
    if (App.USE_SUPABASE && App.state.sb) {
      const { data } = await App.state.sb.from('treinos')
        .select(`*, treino_exercicios(*, exercicios(*))`)
        .eq('aluno_id', alunoId).eq('status', 'ativo')
        .order('created_at', { ascending: false }).limit(1).single();
      if (data) { App.ls(`treino_${alunoId}`, data); return data; }
      return null;
    }
    return App.ls(`treino_${alunoId}`) || null;
  },

  /* Treinos do treinador */
  async getTreinosDoTreinador(treinadorId) {
    if (!App.USE_SUPABASE || !App.state.sb) return [];
    const { data } = await App.state.sb.from('treinos')
      .select('*, profiles!treinos_aluno_id_fkey(nome, email)')
      .eq('treinador_id', treinadorId)
      .order('updated_at', { ascending: false });
    return data || [];
  },

  /* Criar treino */
  async criarTreino(treinadorId, alunoId, nome, descricao, exercicios) {
    if (!App.USE_SUPABASE || !App.state.sb) {
      App.utils.toast('Supabase não configurado.', 'error'); return null;
    }
    const { data: treino, error } = await App.state.sb.from('treinos').insert({
      treinador_id: treinadorId, aluno_id: alunoId,
      nome, descricao, status: 'ativo',
    }).select().single();
    if (error || !treino) { App.utils.toast('Erro ao criar treino.', 'error'); return null; }

    // Inserir exercícios do treino
    const rows = exercicios.map((ex, i) => ({
      treino_id:    treino.id,
      exercicio_id: ex.exercicio_id,
      series:       ex.series,
      repeticoes:   ex.repeticoes,
      descanso:     ex.descanso || '60s',
      observacoes:  ex.observacoes || null,
      ordem:        i,
    }));
    await App.state.sb.from('treino_exercicios').insert(rows);
    return treino;
  },

  /* Alunos vinculados ao treinador */
async getAlunosDoTreinador(treinadorId) {
  if (!App.USE_SUPABASE || !App.state.sb) return [];

  const { data, error } = await App.state.sb
    .from('treinador_aluno')
    .select(`
      *,
      aluno:aluno_id (
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

 // vincular aluno no treinador
async vincularAluno(treinadorId, alunoEmail) {
  if (!App.USE_SUPABASE || !App.state.sb) return { error: 'Supabase não configurado.' };

  const email = alunoEmail.trim().toLowerCase();

  const { data: profile, error } = await App.state.sb
    .from('profiles')
    .select('id, nome, email, role, plan_type')
    .ilike('email', email)
    .single();

  if (error || !profile) return { error: 'Nenhum aluno encontrado com esse email.' };
  if (profile.id === treinadorId) return { error: 'Não é possível se vincular a si mesmo.' };
  if (profile.role !== 'aluno') return { error: 'Esse email não pertence a um aluno.' };

  const { error: linkError } = await App.state.sb
    .from('treinador_aluno')
    .upsert(
      { treinador_id: treinadorId, aluno_id: profile.id, ativo: true },
      { onConflict: 'treinador_id,aluno_id' }
    );

  if (linkError) return { error: linkError.message || 'Erro ao criar vínculo.' };

  return { ok: true, aluno: profile };
},

  /* Observações */
  async getObservacoes(alunoId) {
    if (!App.USE_SUPABASE || !App.state.sb) return App.ls(`obs_${alunoId}`) || [];
    const { data } = await App.state.sb.from('observacoes_treinador')
      .select('*').eq('aluno_id', alunoId).order('created_at', { ascending: false });
    return data || [];
  },

  async saveObservacao(treinadorId, alunoId, conteudo) {
    const row = { treinador_id: treinadorId, aluno_id: alunoId, conteudo, created_at: new Date().toISOString() };
    if (App.USE_SUPABASE && App.state.sb) {
      await App.state.sb.from('observacoes_treinador').insert(row);
    } else {
      const arr = App.ls(`obs_${alunoId}`) || [];
      arr.unshift(row);
      App.ls(`obs_${alunoId}`, arr);
    }
  },
};

/* ─── AUTH ─────────────────────────────────────────────────────── */
App.auth = {
  _role: 'aluno',

  init() {
    this._bindRoleTabs();
    this._bindPasswordToggles();
  },

  _bindRoleTabs() {
    document.querySelectorAll('.role-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.role-tab').forEach(t => {
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
    document.querySelectorAll('[data-toggle-password]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-toggle-password');
        const input = document.getElementById(id);
        if (!input) return;
        input.type = input.type === 'password' ? 'text' : 'password';
        btn.innerHTML = App.icons.get(input.type === 'password' ? 'eye' : 'eye-off', 18);
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

      if (!App.USE_SUPABASE) {
        const users = App.ls('local_users') || {};
        const user = users[email];

        if (!user || user.password !== pass) {
          this._showError('login', 'Email ou senha inválidos.');
          return;
        }

        App.state.user = user;
        App.ls('current_user', user);
        App.boot.enterApp();
        return;
      }

      if (!App.state.sb) {
        this._showError('login', 'Conexão com Supabase não inicializada.');
        return;
      }

      const { data, error } = await App.state.sb.auth.signInWithPassword({
        email,
        password: pass
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

      if (!App.USE_SUPABASE) {
        const users = App.ls('local_users') || {};
        if (users[email]) {
          this._showError('register', 'Email já cadastrado.');
          return;
        }

        const id = 'u_' + Date.now();
        users[email] = { id, nome, password: pass, email, role, plan_type: 'premium' };
        App.ls('local_users', users);
        App.state.user = { id, nome, email, role, plan_type: 'premium' };
        App.ls('current_user', App.state.user);
        App.boot.enterApp();
        return;
      }

      if (!App.state.sb) {
        this._showError('register', 'Conexão com Supabase não inicializada.');
        return;
      }

      const { error } = await App.state.sb.auth.signUp({
        email,
        password: pass,
        options: {
          data: { nome, role },
          emailRedirectTo: `${window.location.origin}/`
        }
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

      if (!App.USE_SUPABASE) {
        document.getElementById('forgot-form')?.classList.add('hidden');
        document.getElementById('forgot-success')?.classList.remove('hidden');
        return;
      }

      if (!App.state.sb) {
        this._showError('forgot', 'Conexão com Supabase não inicializada.');
        return;
      }

      const { error } = await App.state.sb.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/`
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
        password: pass
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
          emailRedirectTo: `${window.location.origin}/`
        }
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

  isPremium() { return App.state.user?.plan_type === 'premium'; },
  isTrainer() { return App.state.user?.role === 'treinador'; },
};
