import express from 'express';
import { buscarResumo } from '../controllers/dashboardController.js';
import { autenticar } from '../middleware/auth.js';

const router = express.Router();

// Todas as rotas requerem autenticação
router.use(autenticar);

/**
 * @route GET /api/dashboard/resumo
 * @desc Buscar resumo do dashboard
 * @access Autenticado
 */
router.get('/resumo', buscarResumo);

export default router;

