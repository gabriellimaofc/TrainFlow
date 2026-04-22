/* ============================================================
   TrainFlow v2 — js/app.js
   Boot, estado global, roteador e inicialização da UI.
   Carregado por último.
   ============================================================ */

// ── Estado global da aplicação ─────────────────────────────
TF.state = {
  user:           null,  // { id, nome, email, role, plan_type }
  currentView:    null,
  activeWorkout:  null,  // { dayId, logs, completedExercises, startTime }
  clockInterval:  null,
  clockSecs:      0,
  restInterval:   null,
  restTotal:      90,
  restRemaining:  90,
  currentLogId:   null,
  progressChart:  null,
  viewingAluno:   null,
  alunosList:     [],
};

// ── TF.app — Controlador principal ─────────────────────────
TF.app = {

  /** Inicializa o app ao carregar a página */
  async init() {
    // Inicializa cliente Supabase se configurado
    if (TF.USE_SUPABASE && window.supabase) {
      TF.sb = window.supabase.createClient(TF.SUPABASE_URL, TF.SUPABASE_KEY);
    }

    // Setup auth form
    TF.auth.init();

    // Setup event listeners globais
    this._setupNavListeners();
    this._setupKeyboardShortcuts();
    this._setupModalBackdrops();

    // Tenta restaurar sessão
    if (TF.USE_SUPABASE && TF.sb) {
      const { data: { session } } = await TF.sb.auth.getSession();
      if (session) {
        const profile = await TF.data.getProfile(session.user.id);
        TF.state.user = { ...session.user, ...profile };
        this.enterApp();
        return;
      }
      TF.sb.auth.onAuthStateChange((_e, s) => { if (!s) this.enterAuth(); });
    } else {
      // Modo demo: tenta restaurar do localStorage
      const demo = TF.ls('demo_user');
      if (demo) { TF.state.user = demo; this.enterApp(); return; }
    }

    // Nenhuma sessão — mostra auth
    this.enterAuth();
  },

  /** Navega para a tela de auth */
  enterAuth() {
    document.getElementById('auth-screen').classList.remove('hidden');
    document.getElementById('app-screen').classList.add('hidden');
    TF.auth.toggleForm('login');
  },

  /** Entra no app após autenticação */
  enterApp() {
    document.getElementById('auth-screen').classList.add('hidden');
    document.getElementById('app-screen').classList.remove('hidden');
    this._updateUserUI();
    this._buildNav();
    this.navigateTo(TF.auth.isTrainer() ? 'trainer-dashboard' : 'dashboard');
  },

  /** Atualiza UI com dados do usuário */
  _updateUserUI() {
    const u       = TF.state.user;
    const nome    = u?.nome || 'Usuário';
    const initial = nome[0].toUpperCase();
    const role    = TF.auth.isTrainer() ? '🏋️ Treinador' : 'Aluno · ' + (u?.plan_type||'free');

    document.querySelectorAll('.user-avatar').forEach(el => el.textContent = initial);
    document.querySelectorAll('.user-name-text').forEach(el => el.textContent = nome);
    document.querySelectorAll('.user-role-text').forEach(el => el.textContent = role);
  },

  /** Constrói navegação baseada no role */
  _buildNav() {
    const isTrainer = TF.auth.isTrainer();
    const sidebarNav = document.getElementById('sidebar-nav');
    const bottomNav  = document.getElementById('bottom-nav');

    const studentNavItems = [
      { view:'dashboard',     icon:'⬡', label:'Dashboard' },
      { view:'programa',      icon:'📋', label:'Programa' },
      { view:'treinar',       icon:'💪', label:'Treinar' },
      { view:'progresso',     icon:'📈', label:'Progresso' },
      { view:'perfil',        icon:'👤', label:'Meu Perfil' },
      { view:'cardio',        icon:'⏱', label:'Cardio' },
      { view:'ciencia',       icon:'🔬', label:'Ciência' },
      { view:'periodizacao',  icon:'📅', label:'Periodização' },
    ];

    const trainerNavItems = [
      { view:'trainer-dashboard', icon:'⬡', label:'Dashboard' },
      { view:'trainer-alunos',    icon:'👥', label:'Meus Alunos' },
    ];

    const items = isTrainer ? trainerNavItems : studentNavItems;
    const bottomItems = isTrainer ? trainerNavItems : studentNavItems.slice(0,5);

    if (sidebarNav) {
      sidebarNav.innerHTML = items.map(it => `
        <a href="#" class="nav-item" data-view="${it.view}" role="menuitem"
          aria-label="${it.label}">
          <span aria-hidden="true">${it.icon}</span>${it.label}
        </a>
      `).join('');
    }

    if (bottomNav) {
      bottomNav.innerHTML = bottomItems.map(it => `
        <a href="#" class="bnav-item" data-view="${it.view}" aria-label="${it.label}">
          <span aria-hidden="true">${it.icon}</span>
          <small>${it.label}</small>
        </a>
      `).join('');
    }

    // Re-attach listeners após recriar os elementos
    this._setupNavListeners();
  },

  /** Setup de event listeners de navegação */
  _setupNavListeners() {
    document.querySelectorAll('[data-view]').forEach(el => {
      // Remove listener antigo para evitar duplicatas
      el.replaceWith(el.cloneNode(true));
    });
    document.querySelectorAll('[data-view]').forEach(el => {
      el.addEventListener('click', e => {
        e.preventDefault();
        this.navigateTo(el.dataset.view);
      });
    });
  },

  /** Navega para uma view */
  navigateTo(viewName) {
    TF.state.currentView = viewName;

    // Atualiza estado ativo dos navs
    document.querySelectorAll('[data-view]').forEach(el => {
      el.classList.toggle('active', el.dataset.view === viewName);
      el.setAttribute('aria-current', el.dataset.view === viewName ? 'page' : 'false');
    });

    // Mostra a view correta
    document.querySelectorAll('.view').forEach(v => {
      v.classList.toggle('active', v.id === 'view-' + viewName);
    });

    // Scroll para o topo
    document.getElementById('main-content')?.scrollTo(0, 0);

    // Renderiza o conteúdo da view
    this._renderView(viewName);
  },

  /** Mapa de views → funções de renderização */
  _renderView(name) {
    const sv = TF.views.student;
    const tv = TF.views.trainer;

    const renderMap = {
      'dashboard':          () => sv.renderDashboard(),
      'programa':           () => sv.renderPrograma(),
      'treinar':            () => this._renderTreinarView(),
      'progresso':          () => sv.renderProgresso(),
      'perfil':             () => sv.renderPerfil(),
      'cardio':             () => sv.renderCardio(),
      'ciencia':            () => sv.renderCiencia(),
      'periodizacao':       () => sv.renderPeriodizacao(),
      'trainer-dashboard':  () => tv.renderDashboard(),
      'trainer-alunos':     () => tv.renderAlunos(),
    };

    if (renderMap[name]) renderMap[name]();
  },

  _renderTreinarView() {
    if (TF.state.activeWorkout) {
      // Já tem treino ativo — mantém a tela
      document.getElementById('workout-select-screen').classList.add('hidden');
      document.getElementById('workout-active-screen').classList.remove('hidden');
    } else {
      document.getElementById('workout-active-screen').classList.add('hidden');
      document.getElementById('workout-select-screen').classList.remove('hidden');
      // Renderiza grid de dias
      const el = document.getElementById('treinar-day-grid');
      if (el) el.innerHTML = TF.PROGRAM.map(day => `
        <button class="day-quick-card" onclick="TF.workout.startDay('${day.id}')"
          aria-label="Iniciar ${day.nome}">
          <div class="dqc-day">${day.dia}</div>
          <div class="dqc-name">${day.nome}</div>
          <div class="dqc-focus">${day.foco}</div>
        </button>
      `).join('');
    }
  },

  /** Atalhos de teclado */
  _setupKeyboardShortcuts() {
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') {
        TF.modal.close();
        TF.workout.skipRest?.();
      }
      if (e.key === 'Enter') {
        const logModal = document.getElementById('modal-log');
        if (logModal && !logModal.classList.contains('hidden') &&
            document.activeElement?.tagName !== 'TEXTAREA') {
          e.preventDefault();
          TF.workout.saveLog();
        }
      }
    });
  },

  /** Click nos backdrops fecha os modais */
  _setupModalBackdrops() {
    document.querySelectorAll('.modal-backdrop').forEach(el => {
      el.addEventListener('click', () => TF.modal.close());
    });
  },
};

// ── Funções globais chamadas pelo HTML (onclick) ─────────────
// Auth
window.handleLogin    = () => TF.auth.login();
window.handleSignup   = () => TF.auth.signup();
window.handleLogout   = () => TF.auth.logout();
window.enterDemoMode  = () => TF.auth.enterDemo();
window.toggleAuth     = (m) => TF.auth.toggleForm(m);

// Workout
window.saveLog        = () => TF.workout.saveLog();
window.skipRest       = () => TF.workout.skipRest();
window.cancelWorkout  = () => TF.workout.cancel();
window.finishWorkout  = () => TF.workout.finish();

// Modal
window.closeModal     = () => TF.modal.close();
window.saveModal      = () => TF.modal.save();

// Progresso
window.renderProgressChart = () => TF.views.student.renderProgressChart();

// Treinador
window.openVincularAluno = () => TF.views.trainer._openVincularModal();

// ── Inicia quando o DOM estiver pronto ──────────────────────
document.addEventListener('DOMContentLoaded', () => TF.app.init());
