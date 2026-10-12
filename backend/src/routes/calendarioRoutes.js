import express from 'express';
import { buscarEventos } from '../controllers/calendarioController.js';
import { autenticar } from '../middleware/auth.js';

const router = express.Router();

router.use(autenticar);

/**
 * @route GET /api/calendario?inicio=&fim=&grupo_id=&agente_id=
 * @desc Buscar eventos agregados (chamados + tarefas) para calendário/Gantt
 * @access Autenticado
 */
router.get('/', buscarEventos);

export default router;
