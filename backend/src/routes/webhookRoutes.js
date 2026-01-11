import express from 'express';
import {
  listarLogs,
  buscarLog,
  estatisticas,
  retentarWebhook
} from '../controllers/webhookController.js';
import { autenticar, verificarGerente } from '../middleware/auth.js';

const router = express.Router();

// Todas as rotas requerem autenticação de gerente/admin
router.use(autenticar);
router.use(verificarGerente);

/**
 * @route GET /api/webhooks/estatisticas
 * @desc Estatísticas de webhooks
 * @access Gerente ou Admin
 */
router.get('/estatisticas', estatisticas);

/**
 * @route GET /api/webhooks/logs
 * @desc Listar logs de webhooks
 * @access Gerente ou Admin
 */
router.get('/logs', listarLogs);

/**
 * @route GET /api/webhooks/logs/:id
 * @desc Buscar log específico
 * @access Gerente ou Admin
 */
router.get('/logs/:id', buscarLog);

/**
 * @route POST /api/webhooks/logs/:id/retry
 * @desc Retentar webhook falhado
 * @access Gerente ou Admin
 */
router.post('/logs/:id/retry', retentarWebhook);

export default router;

