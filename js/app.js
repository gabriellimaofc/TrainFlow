/* =================================================================
   app.js — Boot principal, roteador e estado global de navegação
   -----------------------------------------------------------------
   Responsabilidades deste arquivo:
   1) Inicializar a aplicação
   2) Criar o client do Supabase
   3) Gerenciar autenticação de sessão atual
   4) Controlar a navegação entre views
   5) Expor handlers globais usados no HTML inline
   -----------------------------------------------------------------
   Observação:
   - Mantém a arquitetura SPA atual
   - Continua compatível com index.html, core.js, student.js e trainer.js
   ================================================================= */

App.boot = {
  /* ===============================================================
     INIT PRINCIPAL
     =============================================================== */
  async init() {
    /* Garante que o client do Supabase exista antes de qualquer ação */
    this._ensureSupabase();

    /* Inicializa bindings de autenticação */
    App.auth.init();

    /* Inicializa eventos globais da interface */
    this._setupNav();
    this._setupKeyboard();
    this._setupModalBackdrops();

    /* Se a URL veio de fluxo de recovery do Supabase, entra direto na tela de nova senha */
    if (this._isPasswordRecoveryUrl()) {
      this.enterAuth('reset-password');
      return;
    }

    /* Se houver Supabase ativo, tenta restaurar sessão */
    if (App.USE_SUPABASE && App.state.sb) {
      await this._restoreSupabaseSession();
    } else {
      /* Fallback local extremamente simples */
      const cached = App.ls('current_user');
      if (cached) {
        App.state.user = cached;
        await this.enterApp();
        return;
      }

      this.enterAuth('login');
    }
  },

  /* ===============================================================
     SUPABASE
     =============================================================== */
  _ensureSupabase() {
    if (App.USE_SUPABASE && !App.state.sb && window.supabase?.createClient) {
      App.state.sb = window.supabase.createClient(
        App.SUPABASE_URL,
        App.SUPABASE_KEY
      );
    }
  },

  _isPasswordRecoveryUrl() {
    const hash = window.location.hash || '';
    return hash.includes('access_token') && hash.includes('type=recovery');
  },

  async _restoreSupabaseSession() {
    try {
      const {
        data: { session },
        error,
      } = await App.state.sb.auth.getSession();

      if (error) {
        console.error('Erro ao restaurar sessão:', error);
        this.enterAuth('login');
        return;
      }

      /* Se já existe usuário logado */
      if (session?.user) {
        /* Se confirmação de email for obrigatória, impede entrada sem confirmação */
        if (!session.user.email_confirmed_at) {
          this.enterAuth('login');
          return;
        }

        const profile = await App.data.getProfile(session.user.id);
        App.state.user = { ...session.user, ...profile };

        await this.enterApp();
        this._bindAuthStateChanges();
        return;
      }

      /* Sem sessão: vai para login */
      this._bindAuthStateChanges();
      this.enterAuth('login');
    } catch (err) {
      console.error('Erro inesperado ao restaurar sessão:', err);
      this.enterAuth('login');
    }
  },

  _bindAuthStateChanges() {
    if (!App.state.sb?.auth) return;

    App.state.sb.auth.onAuthStateChange((event) => {
      /* Fluxo de redefinição de senha */
      if (event === 'PASSWORD_RECOVERY') {
        this.enterAuth('reset-password');
        return;
      }

      /* Fluxo de logout */
      if (event === 'SIGNED_OUT') {
        this.enterAuth('login');
      }
    });
  },

  /* ===============================================================
     TELAS DE AUTENTICAÇÃO
     =============================================================== */
  enterAuth(panel = 'login') {
    const authScreen = document.getElementById('auth-screen');
    const appScreen = document.getElementById('app-screen');

    if (authScreen) authScreen.classList.remove('hidden');
    if (appScreen) appScreen.classList.add('hidden');

    this._showAuthPanel(panel);
  },

  _showAuthPanel(panel) {
    ['login', 'register', 'forgot', 'reset-password'].forEach((name) => {
      const el = document.getElementById(`panel-${name}`);
      if (el) el.classList.toggle('hidden', name !== panel);
    });
  },

  /* ===============================================================
     ENTRADA NO APP
     =============================================================== */
  async enterApp() {
    const authScreen = document.getElementById('auth-screen');
    const appScreen = document.getElementById('app-screen');

    if (authScreen) authScreen.classList.add('hidden');
    if (appScreen) appScreen.classList.remove('hidden');

    this.updateUserUI();
    this._buildNav();

    /* Regra crítica:
       o treino do aluno só existe se tiver sido criado por treinador.
       Não mostramos treino fake/local automático.
    */
    if (!App.auth.isTrainer()) {
      App.state.workout = await App.data.getTreinoAtivo(App.state.user.id);
    }

    await this.navigateTo(App.auth.isTrainer() ? 'trainer-dashboard' : 'dashboard');
  },

  updateUserUI() {
    const u = App.state.user;
    const nome = u?.nome || 'Usuário';
    const initial = App.utils.initial(nome);
    const role = App.auth.isTrainer()
      ? 'Treinador'
      : `Aluno · ${u?.plan_type || 'free'}`;

    document.querySelectorAll('.user-avatar').forEach((el) => {
      el.textContent = initial;
    });

    document.querySelectorAll('.user-name-display').forEach((el) => {
      el.textContent = nome;
    });

    document.querySelectorAll('.user-role-display').forEach((el) => {
      el.textContent = role;
    });
  },

  /* ===============================================================
     NAVEGAÇÃO
     =============================================================== */
  _buildNav() {
    const isTrainer = App.auth.isTrainer();
    const icons = App.icons;

    /* Menu do aluno */
    const studentItems = [
      { view: 'dashboard', label: 'Início', icon: 'home' },
      { view: 'treino', label: 'Treino', icon: 'dumbbell' },
      { view: 'progresso', label: 'Progresso', icon: 'activity' },
      { view: 'perfil', label: 'Meu Perfil', icon: 'user' },
      { view: 'ciencia', label: 'Ciência', icon: 'book-open' },
      { view: 'cardio', label: 'Cardio', icon: 'activity' },
    ];

    /* Menu do treinador */
    const trainerItems = [
      { view: 'trainer-dashboard', label: 'Início', icon: 'home' },
      { view: 'trainer-alunos', label: 'Alunos', icon: 'users' },
      { view: 'criar-treino', label: 'Criar Treino', icon: 'plus' },
    ];

    const items = isTrainer ? trainerItems : studentItems;
    const bottomItems = isTrainer ? trainerItems : studentItems.slice(0, 5);

    const sidebar = document.getElementById('sidebar-nav');
    const bottomNav = document.getElementById('bottom-nav');

    if (sidebar) {
      sidebar.innerHTML = items
        .map(
          (it) => `
            <a href="#" class="nav-item" data-view="${it.view}" role="menuitem" aria-label="${it.label}">
              <span class="nav-icon" aria-hidden="true">${icons.get(it.icon, 18)}</span>
              <span class="nav-label">${it.label}</span>
            </a>
          `
        )
        .join('');
    }

    if (bottomNav) {
      bottomNav.innerHTML = bottomItems
        .map(
          (it) => `
            <a href="#" class="bnav-item" data-view="${it.view}" aria-label="${it.label}">
              <span aria-hidden="true">${icons.get(it.icon, 22)}</span>
              <span>${it.label}</span>
            </a>
          `
        )
        .join('');
    }

    this._setupNav();
  },

  _setupNav() {
    /* Remove listeners antigos recriando nós */
    document.querySelectorAll('[data-view]').forEach((el) => {
      const clone = el.cloneNode(true);
      el.parentNode?.replaceChild(clone, el);
    });

    /* Registra novos listeners */
    document.querySelectorAll('[data-view]').forEach((el) => {
      el.addEventListener('click', async (e) => {
        e.preventDefault();
        const view = el.dataset.view;
        if (view) await this.navigateTo(view);
      });
    });
  },

  async navigateTo(view, param = null) {
    App.state.currentView = view;

    /* Reseta seleção visual */
    document.querySelectorAll('.view').forEach((v) => v.classList.remove('active'));
    document
      .querySelectorAll('.nav-item, .bnav-item')
      .forEach((v) => v.classList.remove('active'));

    /* Ativa view atual */
    const currentView = document.getElementById(`view-${view}`);
    if (currentView) currentView.classList.add('active');

    /* Ativa item do menu atual */
    document
      .querySelectorAll(`[data-view="${view}"]`)
      .forEach((v) => v.classList.add('active'));

    /* Renderização específica por tela */
    switch (view) {
      case 'dashboard':
        await App.views.student?.renderDashboard?.();
        break;

      case 'treino':
        await App.views.student?.renderTreino?.();
        break;

      case 'progresso':
        await App.views.student?.renderProgresso?.();
        break;

      case 'perfil':
        await App.views.student?.renderPerfil?.();
        break;

      case 'ciencia':
        await App.views.student?.renderCiencia?.();
        break;

      case 'cardio':
        await App.views.student?.renderCardio?.();
        break;

      case 'trainer-dashboard':
        await App.views.trainer?.renderDashboard?.();
        break;

      case 'trainer-alunos':
        await App.views.trainer?.renderAlunos?.();
        break;

      case 'criar-treino':
        await App.views.trainer?.renderCriarTreino?.(param);
        break;

      default:
        break;
    }

    const main = document.getElementById('main-content');
    if (main) {
      main.scrollTo({ top: 0, behavior: 'smooth' });
    }
  },

  /* ===============================================================
     EVENTOS GLOBAIS
     =============================================================== */
  _setupKeyboard() {
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && App.modal?.close) {
        App.modal.close();
      }
    });
  },

  _setupModalBackdrops() {
    document.querySelectorAll('.modal .modal-backdrop').forEach((backdrop) => {
      backdrop.addEventListener('click', () => {
        if (App.modal?.close) App.modal.close();
      });
    });
  },
};

/* =================================================================
   HELPERS GLOBAIS
   -----------------------------------------------------------------
   Usados pelos atributos onclick existentes no index.html
   ================================================================= */
window.toggleAuthPanel = (panel) => App.boot.enterAuth(panel);
window.handleLogin = () => App.auth.login();
window.handleRegister = () => App.auth.register();
window.handleForgot = () => App.auth.forgotPassword();
window.handleUpdatePassword = () => App.auth.updatePassword();
window.handleLogout = () => App.auth.logout();
window.handleResendConfirmation = () => App.auth.resendConfirmationEmail();

window.closeModal = () => App.modal.close();
window.saveModal = () => App.modal.save();
window.saveTreino = () => App.views.trainer.saveTreino();

/* =================================================================
   BOOT RESILIENTE
   -----------------------------------------------------------------
   Inicializa a aplicação mesmo em cenários de carregamento variado.
   ================================================================= */
const startApp = () => {
  App.boot.init();
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', startApp);
} else {
  startApp();
}
