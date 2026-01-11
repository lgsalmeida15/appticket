import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const routes = [
  {
    path: '/',
    name: 'home',
    redirect: (to) => {
      // Redireciona para login ou chamados dependendo da autenticação
      const authStore = useAuthStore();
      return authStore.isAuthenticated ? { name: 'chamados' } : { name: 'login' };
    }
  },
  {
    path: '/login',
    name: 'login',
    component: () => import('@/views/auth/LoginView.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/cadastro',
    name: 'cadastro',
    component: () => import('@/views/auth/CadastroView.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/chamados',
    name: 'chamados',
    component: () => import('@/views/ChamadosView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/chamados/new',
    name: 'chamado-new',
    component: () => import('@/views/ChamadoNewPage.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/chamados/view/:id',
    name: 'chamado-view',
    component: () => import('@/views/ChamadoViewPage.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/chamados/edit/:id',
    name: 'chamado-edit',
    component: () => import('@/views/ChamadoEditPage.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/chamados/close/:id',
    name: 'chamado-close',
    component: () => import('@/views/ChamadoClosePage.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/chamados/consultas',
    name: 'consultas-chamados',
    component: () => import('@/views/ConsultasChamadosView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/usuarios',
    name: 'usuarios',
    component: () => import('@/views/UsuariosView.vue'),
    meta: { requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/grupos',
    name: 'grupos',
    component: () => import('@/views/GruposView.vue'),
    meta: { requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/dashboard',
    name: 'dashboard',
    component: () => import('@/views/DashboardView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/auditoria',
    name: 'auditoria',
    component: () => import('@/views/AuditoriaView.vue'),
    meta: { requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/solution-categories',
    name: 'solution-categories',
    component: () => import('@/views/SolutionCategoriesView.vue'),
    meta: { requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/perfil',
    name: 'perfil',
    component: () => import('@/views/PerfilView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/docs/api',
    name: 'documentacao-api',
    component: () => import('@/views/DocumentacaoAPIView.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('@/views/NotFoundView.vue')
  }
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
});

// Guard de navegação para rotas protegidas
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore();
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth);
  const requiresAdmin = to.matched.some(record => record.meta.requiresAdmin);

  console.log('🛡️ Router guard:', {
    to: to.name,
    requiresAuth,
    requiresAdmin,
    isAuthenticated: authStore.isAuthenticated,
    user: authStore.user?.email
  });

  if (requiresAuth && !authStore.isAuthenticated) {
    console.log('🔒 Rota protegida - redirecionando para login');
    next({ name: 'login', query: { redirect: to.fullPath } });
  } else if (requiresAdmin && !authStore.isAdmin) {
    console.log('🚫 Acesso negado - não é admin');
    // Se não é admin, redirecionar para chamados
    next({ name: 'chamados' });
  } else if (to.name === 'login' && authStore.isAuthenticated) {
    console.log('✅ Já autenticado - redirecionando para chamados');
    next({ name: 'chamados' });
  } else {
    console.log('✅ Acesso permitido');
    next();
  }
});

export default router;

