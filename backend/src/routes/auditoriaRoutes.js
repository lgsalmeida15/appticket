import express from 'express';
import {
  listarLogs,
  buscarLog
} from '../controllers/auditoriaController.js';
import { autenticar, verificarAdmin } from '../middleware/auth.js';
import { idParamValidator } from '../validators/chamado/idParamValidator.js';

const router = express.Router();

// Todas as rotas requerem autenticação de admin
router.use(autenticar);
router.use(verificarAdmin);

/**
 * @route GET /api/auditoria
 * @desc Listar logs de auditoria
 * @access Admin
 */
router.get('/', listarLogs);

/**
 * @route GET /api/auditoria/:id
 * @desc Buscar log por ID
 * @access Admin
 */
router.get('/:id', idParamValidator, buscarLog);

export default router;

