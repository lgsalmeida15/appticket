<template>
  <div class="app-layout">
    <!-- Sidebar Fixa -->
    <aside :class="['app-sidebar', { 'sidebar-collapsed': isCollapsed }]">
      <!-- Logo / Brand -->
      <div class="sidebar-header">
        <router-link to="/chamados" class="sidebar-brand">
          <div class="brand-logo">
            <img src="@/assets/minilogo.png" alt="AppTicket" class="brand-image" />
          </div>
          <span v-if="!isCollapsed" class="brand-text">AppTicket</span>
        </router-link>
        
        <button 
          @click="toggleSidebar" 
          class="sidebar-toggle"
          :title="isCollapsed ? 'Expandir' : 'Recolher'"
        >
          <i :class="isCollapsed ? 'bi bi-chevron-right' : 'bi bi-chevron-left'"></i>
        </button>
      </div>

      <!-- Navigation Menu -->
      <nav class="sidebar-nav">
        <ul class="nav-list">
          <li class="nav-item">
            <router-link to="/chamados" class="nav-link">
              <i class="bi bi-list-task"></i>
              <span v-if="!isCollapsed" class="nav-text">Chamados</span>
            </router-link>
          </li>
          
          <li class="nav-item">
            <router-link to="/chamados/consultas" class="nav-link">
              <i class="bi bi-search"></i>
              <span v-if="!isCollapsed" class="nav-text">Consultas</span>
            </router-link>
          </li>
          
          <li class="nav-item">
            <router-link to="/dashboard" class="nav-link">
              <i class="bi bi-graph-up"></i>
              <span v-if="!isCollapsed" class="nav-text">Dashboard</span>
            </router-link>
          </li>
        </ul>

        <!-- Admin Menu -->
        <div v-if="authStore.isAdmin" class="nav-section">
          <div v-if="!isCollapsed" class="nav-section-title">Gerenciamento</div>
          <ul class="nav-list">
            <li class="nav-item">
              <router-link to="/usuarios" class="nav-link">
                <i class="bi bi-people"></i>
                <span v-if="!isCollapsed" class="nav-text">Usuários</span>
              </router-link>
            </li>
            
            <li class="nav-item">
              <router-link to="/grupos" class="nav-link">
                <i class="bi bi-diagram-3"></i>
                <span v-if="!isCollapsed" class="nav-text">Grupos</span>
              </router-link>
            </li>
            
            <li class="nav-item">
              <router-link to="/auditoria" class="nav-link">
                <i class="bi bi-journal-text"></i>
                <span v-if="!isCollapsed" class="nav-text">Auditoria</span>
              </router-link>
            </li>
            
            <li class="nav-item">
              <router-link to="/solution-categories" class="nav-link">
                <i class="bi bi-tags"></i>
                <span v-if="!isCollapsed" class="nav-text">Categorias</span>
              </router-link>
            </li>
          </ul>
        </div>
      </nav>

      <!-- Sidebar Footer - User Menu -->
      <div class="sidebar-footer">
        <div class="sidebar-user">
          <div class="user-dropdown" @click="toggleUserMenu" ref="userMenuTrigger">
            <div class="user-avatar">
              <i class="bi bi-person-circle"></i>
            </div>
            <div v-if="!isCollapsed" class="user-info">
              <div class="user-name">{{ authStore.currentUser?.nome || 'Usuário' }}</div>
              <div class="user-role">{{ tipoUsuarioLabel }}</div>
            </div>
            <i v-if="!isCollapsed" class="bi bi-three-dots"></i>
          </div>

          <!-- User Dropdown Menu -->
          <div v-if="isUserMenuOpen" class="user-menu" ref="userMenu">
            <div class="user-menu-header">
              <div class="user-avatar-large">
                <i class="bi bi-person-circle"></i>
              </div>
              <div class="user-details">
                <div class="user-name-large">{{ authStore.currentUser?.nome }}</div>
                <div class="user-email">{{ authStore.currentUser?.email }}</div>
              </div>
            </div>
            <div class="user-menu-divider"></div>
            <a href="#" @click.prevent="handlePerfil" class="user-menu-item">
              <i class="bi bi-person-lines-fill"></i>
              <span>Meu Perfil</span>
            </a>
            <div class="user-menu-divider"></div>
            <a href="#" @click.prevent="handleLogout" class="user-menu-item text-danger">
              <i class="bi bi-box-arrow-right"></i>
              <span>Sair</span>
            </a>
          </div>
        </div>
      </div>
    </aside>

    <!-- Main Content Area -->
    <div class="app-main">
      <!-- Header Superior -->
      <header class="app-header">
        <div class="header-content">
          <!-- Breadcrumb ou Título da página -->
          <div class="header-left">
            <h1 class="page-title">{{ pageTitle }}</h1>
          </div>

          <!-- Actions ou informações extras -->
          <div class="header-right">
            <slot name="header-actions"></slot>
          </div>
        </div>
      </header>

      <!-- Conteúdo Principal -->
      <main class="app-content">
        <slot></slot>
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();

// Estado da sidebar
const isCollapsed = ref(false);
const isUserMenuOpen = ref(false);

// Refs para o menu do usuário
const userMenuTrigger = ref(null);
const userMenu = ref(null);

// Computeds
const tipoUsuarioLabel = computed(() => {
  const tipos = {
    admin: 'Administrador',
    gerente: 'Gerente',
    agente: 'Agente'
  };
  return tipos[authStore.userType] || 'Usuário';
});

const pageTitle = computed(() => {
  const titles = {
    '/chamados': 'Chamados',
    '/dashboard': 'Dashboard',
    '/usuarios': 'Usuários',
    '/grupos': 'Grupos',
    '/auditoria': 'Auditoria',
    '/perfil': 'Meu Perfil'
  };
  
  // Verificar se é uma rota de detalhes
  if (route.path.includes('/chamado/')) {
    return 'Detalhes do Chamado';
  }
  
  return titles[route.path] || 'AppTicket';
});

// Funções
const toggleSidebar = () => {
  isCollapsed.value = !isCollapsed.value;
  // Salvar preferência no localStorage
  localStorage.setItem('sidebar-collapsed', isCollapsed.value.toString());
};

const toggleUserMenu = () => {
  isUserMenuOpen.value = !isUserMenuOpen.value;
};

const handlePerfil = () => {
  isUserMenuOpen.value = false;
  router.push({ name: 'perfil' });
};

const handleLogout = async () => {
  isUserMenuOpen.value = false;
  await authStore.logout();
  router.push({ name: 'login' });
};

// Fechar menu ao clicar fora
const handleClickOutside = (event) => {
  if (
    isUserMenuOpen.value &&
    userMenuTrigger.value &&
    userMenu.value &&
    !userMenuTrigger.value.contains(event.target) &&
    !userMenu.value.contains(event.target)
  ) {
    isUserMenuOpen.value = false;
  }
};

// Lifecycle
onMounted(() => {
  // Recuperar preferência salva
  const savedState = localStorage.getItem('sidebar-collapsed');
  if (savedState === 'true') {
    isCollapsed.value = true;
  }
  
  // Listener para fechar menu ao clicar fora
  document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});
</script>

<style scoped>
/* ========================================
   LAYOUT PRINCIPAL - SaaS Modern
   ======================================== */
.app-layout {
  display: flex;
  min-height: 100vh;
  background-color: var(--color-bg-secondary);
}

/* ========================================
   SIDEBAR FIXA
   ======================================== */
.app-sidebar {
  width: var(--sidebar-width);
  height: 100vh;
  position: fixed;
  left: 0;
  top: 0;
  background-color: var(--color-bg-primary);
  border-right: 1px solid var(--color-border-medium);
  display: flex;
  flex-direction: column;
  transition: width var(--transition-slow);
  z-index: var(--z-fixed);
}

.app-sidebar.sidebar-collapsed {
  width: var(--sidebar-collapsed-width);
}

/* ========================================
   SIDEBAR HEADER - Logo + Toggle
   ======================================== */
.sidebar-header {
  height: var(--header-height);
  padding: var(--space-4);
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid var(--color-border-medium);
}

.sidebar-brand {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  text-decoration: none;
  color: var(--color-text-primary);
  transition: all var(--transition-base);
}

.sidebar-brand:hover {
  color: var(--color-primary);
}

.brand-logo {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--color-brand-600), var(--color-brand-500));
  border-radius: var(--radius-base);
  flex-shrink: 0;
}

.brand-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.brand-text {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-bold);
  letter-spacing: var(--letter-spacing-tight);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.sidebar-toggle {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: 1px solid var(--color-border-medium);
  border-radius: var(--radius-base);
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all var(--transition-base);
  flex-shrink: 0;
}

.sidebar-toggle:hover {
  background-color: var(--color-bg-tertiary);
  color: var(--color-text-primary);
  border-color: var(--color-border-strong);
}

/* ========================================
   SIDEBAR NAVIGATION
   ======================================== */
.sidebar-nav {
  flex: 1;
  padding: var(--space-4);
  overflow-y: auto;
  overflow-x: hidden;
}

.nav-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.nav-section {
  margin-top: var(--space-6);
}

.nav-section-title {
  padding: var(--space-2) var(--space-3);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  text-transform: uppercase;
  letter-spacing: var(--letter-spacing-wider);
  color: var(--color-text-tertiary);
  margin-bottom: var(--space-2);
}

.nav-item {
  margin-bottom: var(--space-1);
}

.nav-link {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-2) var(--space-3);
  color: var(--color-text-secondary);
  text-decoration: none;
  border-radius: var(--radius-base);
  transition: all var(--transition-base);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  position: relative;
}

.nav-link i {
  font-size: 1.25rem;
  flex-shrink: 0;
  width: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.nav-text {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.nav-link:hover {
  background-color: var(--color-bg-tertiary);
  color: var(--color-text-primary);
}

.nav-link.router-link-active {
  background-color: var(--color-primary-light);
  color: var(--color-primary);
  font-weight: var(--font-weight-semibold);
}

.sidebar-collapsed .nav-link {
  justify-content: center;
  padding: var(--space-2);
}

/* ========================================
   SIDEBAR FOOTER - User Menu
   ======================================== */
.sidebar-footer {
  padding: var(--space-4);
  border-top: 1px solid var(--color-border-medium);
}

.sidebar-user {
  position: relative;
}

.user-dropdown {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-2);
  border-radius: var(--radius-base);
  cursor: pointer;
  transition: all var(--transition-base);
}

.user-dropdown:hover {
  background-color: var(--color-bg-tertiary);
}

.user-avatar {
  width: 36px;
  height: 36px;
  border-radius: var(--radius-full);
  background: linear-gradient(135deg, var(--color-brand-600), var(--color-brand-500));
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.5rem;
  flex-shrink: 0;
}

.user-info {
  flex: 1;
  min-width: 0;
}

.user-name {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-role {
  font-size: var(--font-size-xs);
  color: var(--color-text-tertiary);
}

.sidebar-collapsed .user-dropdown {
  justify-content: center;
}

/* User Menu Dropdown */
.user-menu {
  position: absolute;
  bottom: calc(100% + var(--space-2));
  left: 0;
  right: 0;
  background-color: var(--color-bg-primary);
  border: 1px solid var(--color-border-medium);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  padding: var(--space-3);
  z-index: var(--z-dropdown);
  animation: slideUp 0.2s ease;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.sidebar-collapsed .user-menu {
  left: calc(100% + var(--space-2));
  right: auto;
  bottom: 0;
  width: 260px;
}

.user-menu-header {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-2);
}

.user-avatar-large {
  width: 48px;
  height: 48px;
  border-radius: var(--radius-full);
  background: linear-gradient(135deg, var(--color-brand-600), var(--color-brand-500));
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 2rem;
  flex-shrink: 0;
}

.user-details {
  flex: 1;
  min-width: 0;
}

.user-name-large {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  margin-bottom: var(--space-1);
}

.user-email {
  font-size: var(--font-size-xs);
  color: var(--color-text-tertiary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-menu-divider {
  height: 1px;
  background-color: var(--color-border-medium);
  margin: var(--space-2) 0;
}

.user-menu-item {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-2) var(--space-3);
  color: var(--color-text-primary);
  text-decoration: none;
  border-radius: var(--radius-base);
  font-size: var(--font-size-sm);
  transition: all var(--transition-base);
}

.user-menu-item:hover {
  background-color: var(--color-bg-tertiary);
}

.user-menu-item.text-danger {
  color: var(--color-danger-600);
}

.user-menu-item.text-danger:hover {
  background-color: var(--color-danger-50);
}

/* ========================================
   MAIN CONTENT AREA
   ======================================== */
.app-main {
  flex: 1;
  margin-left: var(--sidebar-width);
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  transition: margin-left var(--transition-slow);
}

.sidebar-collapsed + .app-main {
  margin-left: var(--sidebar-collapsed-width);
}

/* ========================================
   HEADER SUPERIOR
   ======================================== */
.app-header {
  height: var(--header-height);
  background-color: var(--color-bg-primary);
  border-bottom: 1px solid var(--color-border-medium);
  position: sticky;
  top: 0;
  z-index: var(--z-sticky);
}

.header-content {
  height: 100%;
  padding: 0 var(--space-6);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.header-left {
  display: flex;
  align-items: center;
  gap: var(--space-4);
}

.page-title {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  margin: 0;
}

.header-right {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

/* ========================================
   CONTEÚDO PRINCIPAL
   ======================================== */
.app-content {
  flex: 1;
  padding: var(--space-6);
}

/* ========================================
   RESPONSIVIDADE
   ======================================== */
@media (max-width: 1024px) {
  .app-sidebar {
    width: var(--sidebar-collapsed-width);
  }
  
  .app-main {
    margin-left: var(--sidebar-collapsed-width);
  }
  
  .sidebar-collapsed .user-menu {
    left: calc(100% + var(--space-2));
    right: auto;
    width: 260px;
  }
}

@media (max-width: 768px) {
  .app-sidebar {
    transform: translateX(-100%);
  }
  
  .app-main {
    margin-left: 0;
  }
  
  .page-title {
    font-size: var(--font-size-lg);
  }
  
  .app-content {
    padding: var(--space-4);
  }
}
</style>
