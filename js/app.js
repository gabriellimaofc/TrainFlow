/* =================================================================
   app.js — Boot principal, roteador, estado global
   Carregado por último.
   ================================================================= */

App.boot = {

  /* ── Inicialização ──────────────────────────────────────────── */
  async init() {

    /* Inicializa Supabase */
    if (App.USE_SUPABASE && !App.state.sb && window.supabase?.createClient) {
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
        if (event === 'PASSWORD_RECOVERY') {
          this.enterAuth('reset-password');
          return;
        }

        if (event === 'SIGNED_OUT') {
          this.enterAuth('login');
        }
      });
    } else {
      const cached = App.ls('current_user');
      if (cached) {
        App.state.user = cached;
        this.enterApp();
        return;
      }
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
    const role    = App.auth.isTrainer() ? 'Treinador' : `Aluno · ${u?.plan_type || 'free'}`;

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
      { view:'trainer-dashboard', label:'Início',       icon:'home' },
      { view:'trainer-alunos',    label:'Alunos',       icon:'users' },
      { view:'criar-treino',      label:'Criar Treino', icon:'plus' },
    ];

    const items = isTrainer ? trainerItems : studentItems;
    const botItems = isTrainer ? trainerItems : studentItems.slice(0, 5);

    const sidebar = document.getElementById('sidebar-nav');
    const botNav  = document.getElementById('bottom-nav');

    if (sidebar) {
      sidebar.innerHTML = items.map(it => `
        <a href="#" class="nav-item" data-view="${it.view}" role="menuitem" aria-label="${it.label}">
          <span class="nav-icon" aria-hidden="true">${icons.get(it.icon, 18)}</span>
          <span class="nav-label">${it.label}</span>
        </a>
      `).join('');
    }

    if (botNav) {
      botNav.innerHTML = botItems.map(it => `
        <a href="#" class="bnav-item" data-view="${it.view}" aria-label="${it.label}">
          <span aria-hidden="true">${icons.get(it.icon, 22)}</span>
          <span>${it.label}</span>
        </a>
      `).join('');
    }

    this._setupNav();
  },

  /* ── Setup de event listeners de navegação ───────────────────── */
  _setupNav() {
    document.querySelectorAll('[data-view]').forEach(el => {
      const clone = el.cloneNode(true);
      el.parentNode?.replaceChild(clone, el);
    });

    document.querySelectorAll('[data-view]').forEach(el => {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        const view = el.dataset.view;
        if (view) this.navigateTo(view);
      });
    });
  },

  _setupKeyboard() {
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && App.modal?.close) {
        App.modal.close();
      }
    });
  },

  _setupModalBackdrops() {
    document.querySelectorAll('.modal .modal-backdrop').forEach(backdrop => {
      backdrop.addEventListener('click', () => {
        if (App.modal?.close) App.modal.close();
      });
    });
  },

  /* ── Navegação entre views ───────────────────────────────────── */
  async navigateTo(view, param = null) {
    App.state.currentView = view;

    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.querySelectorAll('.nav-item, .bnav-item').forEach(v => v.classList.remove('active'));

    const currentView = document.getElementById(`view-${view}`);
    if (currentView) currentView.classList.add('active');

    document.querySelectorAll(`[data-view="${view}"]`).forEach(v => v.classList.add('active'));

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
        break;
      case 'cardio':
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
    if (main) main.scrollTo({ top: 0, behavior: 'smooth' });
  },
};

/* ── Helpers globais usados no HTML inline ─────────────────────── */
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
/* ── Boot resiliente ───────────────────────────────────────────── */
const startApp = () => {
  if (App.USE_SUPABASE && !App.state.sb && window.supabase?.createClient) {
    App.state.sb = window.supabase.createClient(App.SUPABASE_URL, App.SUPABASE_KEY);
  }
  App.boot.init();
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', startApp);
} else {
  startApp();
}
