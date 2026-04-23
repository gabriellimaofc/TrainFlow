/* =================================================================
   app.js — Boot principal, roteador, estado global
   Carregado por último.
   ================================================================= */

App.boot = {

  /* ── Inicialização ──────────────────────────────────────────── */
  async init() {

    /* Inicializa Supabase */
    if (App.USE_SUPABASE && window.supabase) {
      App.state.sb = window.supabase.createClient(App.SUPABASE_URL, App.SUPABASE_KEY);
    }

    /* Inicializa módulo de Auth */
    App.auth.init();

    /* Event listeners globais */
    this._setupNav();
    this._setupKeyboard();
    this._setupModalBackdrops();

    /* Verifica se URL tem parâmetro de reset de senha */
    const hash = window.location.hash;
    if (hash.includes('access_token') && hash.includes('type=recovery')) {
      this.enterAuth('reset-password');
      return;
    }

    /* Verifica sessão existente */
    if (App.USE_SUPABASE && App.state.sb) {
      const { data: { session } } = await App.state.sb.auth.getSession();
      if (session?.user) {
        /* Verifica confirmação de email */
        if (!session.user.email_confirmed_at) {
          this.enterAuth('login');
          return;
        }
        const profile = await App.data.getProfile(session.user.id);
        App.state.user = { ...session.user, ...profile };
        this.enterApp();
        return;
      }
      App.state.sb.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_OUT') this.enterAuth('login');
      });
    } else {
      const cached = App.ls('current_user');
      if (cached) { App.state.user = cached; this.enterApp(); return; }
    }

    this.enterAuth('login');
  },

  /* ── Entrar na tela de auth ──────────────────────────────────── */
  enterAuth(panel = 'login') {
    document.getElementById('auth-screen').classList.remove('hidden');
    document.getElementById('app-screen').classList.add('hidden');
    this._showAuthPanel(panel);
  },

  _showAuthPanel(panel) {
    ['login','register','forgot','reset-password'].forEach(p => {
      const el = document.getElementById(`panel-${p}`);
      if (el) el.classList.toggle('hidden', p !== panel);
    });
  },

  /* ── Entrar no app após autenticação ─────────────────────────── */
  async enterApp() {
    document.getElementById('auth-screen').classList.add('hidden');
    document.getElementById('app-screen').classList.remove('hidden');
    this.updateUserUI();
    this._buildNav();

    /* Pré-carrega treino do aluno */
    if (!App.auth.isTrainer()) {
      App.state.workout = await App.data.getTreinoAtivo(App.state.user.id);
    }

    this.navigateTo(App.auth.isTrainer() ? 'trainer-dashboard' : 'dashboard');
  },

  /* ── Atualiza UI com dados do usuário ────────────────────────── */
  updateUserUI() {
    const u = App.state.user;
    const nome    = u?.nome || 'Usuário';
    const initial = App.utils.initial(nome);
    const role    = App.auth.isTrainer() ? 'Treinador' : `Aluno · ${u?.plan_type||'free'}`;
    document.querySelectorAll('.user-avatar').forEach(el => el.textContent = initial);
    document.querySelectorAll('.user-name-display').forEach(el => el.textContent = nome);
    document.querySelectorAll('.user-role-display').forEach(el => el.textContent = role);
  },

  /* ── Constrói navegação baseada no role ──────────────────────── */
  _buildNav() {
    const isTrainer = App.auth.isTrainer();
    const icons = App.icons;

    const studentItems = [
      { view:'dashboard',    label:'Início',      icon:'home' },
      { view:'treino',       label:'Treino',      icon:'dumbbell' },
      { view:'progresso',    label:'Progresso',   icon:'trending-up' },
      { view:'perfil',       label:'Meu Perfil',  icon:'user' },
      { view:'ciencia',      label:'Ciência',     icon:'book-open' },
      { view:'cardio',       label:'Cardio',      icon:'activity' },
    ];
    const trainerItems = [
      { view:'trainer-dashboard', label:'Início',    icon:'home' },
      { view:'trainer-alunos',    label:'Alunos',    icon:'users' },
      { view:'criar-treino',      label:'Criar Treino', icon:'plus' },
    ];

    const items   = isTrainer ? trainerItems : studentItems;
    const botItems = isTrainer ? trainerItems : studentItems.slice(0,5);

    const sidebar = document.getElementById('sidebar-nav');
    const botNav  = document.getElementById('bottom-nav');

    if (sidebar) sidebar.innerHTML = items.map(it => `
      <a href="#" class="nav-item" data-view="${it.view}" role="menuitem" aria-label="${it.label}">
        <span class="nav-icon" aria-hidden="true">${icons.get(it.icon,18)}</span>
        <span class="nav-label">${it.label}</span>
      </a>`).join('');

    if (botNav) botNav.innerHTML = botItems.map(it => `
      <a href="#" class="bnav-item" data-view="${it.view}" aria-label="${it.label}">
        <span aria-hidden="true">${icons.get(it.icon,22)}</span>
        <span>${it.label}</span>
      </a>`).join('');

    this._setupNav();
  },

  /* ── Setup de event listeners de navegação ───────────────────── */
  _setupNav() {
    document.querySelectorAll('[data-view]').forEach(el => {
      const clone = el.cloneNode(true);
      el.parentNode?.replaceChild(clone, el);
    });
    document.querySelectorAll('[data-view]').forEach(el => {
      el.addEventListener('click', e => { e.preventDefault(); this.navigateTo(el.dataset.view); });
    });
  },

  /* ── Roteador principal ───────────────────────────────────────── */
  navigateTo(viewName, param) {
    App.state.currentView = viewName;

    /* Atualiza estado ativo dos navs */
    document.querySelectorAll('[data-view]').forEach(el => {
      el.classList.toggle('active', el.dataset.view === viewName);
      el.setAttribute('aria-current', el.dataset.view === viewName ? 'page' : 'false');
    });

    /* Mostra a view correta */
    document.querySelectorAll('.view').forEach(v => v.classList.toggle('active', v.id === 'view-'+viewName));

    /* Scroll para o topo */
    document.getElementById('main-content')?.scrollTo(0,0);

    /* Renderiza conteúdo */
    this._renderView(viewName, param);
  },

  _renderView(name, param) {
    const sv = App.views.student;
    const tv = App.views.trainer;
    const map = {
      'dashboard':          () => sv.renderDashboard(),
      'treino':             () => sv.renderTreino(),
      'perfil':             () => sv.renderPerfil(),
      'progresso':          () => sv.renderProgresso(),
      'ciencia':            () => {},
      'cardio':             () => {},
      'trainer-dashboard':  () => tv.renderDashboard(),
      'trainer-alunos':     () => tv.renderAlunos(),
      'criar-treino':       () => tv.renderCriarTreino(param),
    };
    if (map[name]) map[name]();
  },

  /* ── Atalhos de teclado ──────────────────────────────────────── */
  _setupKeyboard() {
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') App.modal.close();
      if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') {
        const activeModal = document.querySelector('.modal:not(.hidden)');
        if (activeModal) { e.preventDefault(); App.modal.save(); }
      }
    });
  },

  /* ── Fecha modais ao clicar no backdrop ──────────────────────── */
  _setupModalBackdrops() {
    document.querySelectorAll('.modal-backdrop').forEach(el => el.addEventListener('click', () => App.modal.close()));
  },
};

/* ── Funções globais (chamadas pelo HTML) ─────────────────────────── */
window.handleLogin          = () => App.auth.login();
window.handleRegister       = () => App.auth.register();
window.handleForgot         = () => App.auth.forgotPassword();
window.handleUpdatePassword = () => App.auth.updatePassword();
window.handleLogout         = () => App.auth.logout();
window.toggleAuthPanel      = (p) => App.boot._showAuthPanel(p);
window.closeModal           = () => App.modal.close();
window.saveModal            = () => App.modal.save();
window.saveTreino           = () => App.views.trainer.saveTreino();

/* ── Inicia quando DOM estiver pronto ─────────────────────────────── */
App.state.sb.auth.onAuthStateChange((event, session) => {
  if (event === 'PASSWORD_RECOVERY') {
    this.enterAuth('reset-password');
    return;
  }

  if (event === 'SIGNED_OUT') {
    this.enterAuth('login');
  }
});
