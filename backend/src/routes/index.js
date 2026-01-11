import express from 'express';
import authRoutes from './authRoutes.js';
import usuarioRoutes from './usuarioRoutes.js';
import grupoRoutes from './grupoRoutes.js';
import chamadoRoutes from './chamadoRoutes.js';
import webhookRoutes from './webhookRoutes.js';
import dashboardRoutes from './dashboardRoutes.js';
import auditoriaRoutes from './auditoriaRoutes.js';
import solutionCategoryRoutes from './solutionCategoryRoutes.js';

const router = express.Router();

// Rota de teste
router.get('/', (req, res) => {
  res.json({
    message: 'API AppTicket',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      usuarios: '/api/usuarios',
      grupos: '/api/grupos',
      chamados: '/api/chamados',
      webhooks: '/api/webhooks',
      dashboard: '/api/dashboard',
      auditoria: '/api/auditoria',
      solution_categories: '/api/solution-categories'
    }
  });
});

// Rotas de autenticação
router.use('/auth', authRoutes);

// Rotas de usuários
router.use('/usuarios', usuarioRoutes);

// Rotas de grupos
router.use('/grupos', grupoRoutes);

// Rotas de chamados
router.use('/chamados', chamadoRoutes);

// Rotas de webhooks
router.use('/webhooks', webhookRoutes);

// Rotas de Dashboard
router.use('/dashboard', dashboardRoutes);

// Rotas de Auditoria
router.use('/auditoria', auditoriaRoutes);

// Rotas de Categorias de Solução
router.use('/solution-categories', solutionCategoryRoutes);

export default router;

