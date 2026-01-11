import express from 'express';
import {
  listarChamados,
  buscarChamado,
  criarChamado,
  atualizarChamado,
  deletarChamado,
  adicionarComentario,
  listarComentarios,
  estatisticas,
  fecharChamado,
  buscarFechamento,
  verificarPodeFechamento,
  reabrirChamado
} from '../controllers/chamadoController.js';
import {
  associarFilho,
  desassociarFilho,
  listarFilhos,
  verificarPodeEncerrar
} from '../controllers/chamadoAssociacaoController.js';
import {
  iniciarContagem,
  pararContagem,
  buscarHistorico
} from '../controllers/timeTrackingController.js';
import { autenticar, verificarGerente, verificarAdmin } from '../middleware/auth.js';
import { uploadMultiple } from '../config/upload.js';
import { listarChamadosValidator } from '../validators/chamado/listarChamadosValidator.js';
import { criarChamadoValidator } from '../validators/chamado/criarChamadoValidator.js';
import { atualizarChamadoValidator } from '../validators/chamado/atualizarChamadoValidator.js';
import { idParamValidator } from '../validators/chamado/idParamValidator.js';
import { fecharChamadoValidator } from '../validators/chamado/fecharChamadoValidator.js';
import { associarChamadoParamsValidator, idPaiParamsValidator } from '../validators/chamado/associarChamadoValidator.js';
import { uploadLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// Todas as rotas requerem autenticação
router.use(autenticar);

/**
 * @swagger
 * /chamados/estatisticas:
 *   get:
 *     summary: Buscar estatísticas de chamados
 *     tags: [Chamados]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Estatísticas retornadas com sucesso
 */
router.get('/estatisticas', estatisticas);

/**
 * @swagger
 * /chamados:
 *   get:
 *     summary: Listar chamados
 *     tags: [Chamados]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Lista de chamados
 */
router.get('/', listarChamadosValidator, listarChamados);

/**
 * @swagger
 * /chamados/{id}/comentarios:
 *   get:
 *     summary: Listar comentários de um chamado
 *     tags: [Chamados]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Lista de comentários
 */
router.get('/:id/comentarios', idParamValidator, listarComentarios);

/**
 * @swagger
 * /chamados/{id}/time/history:
 *   get:
 *     summary: Buscar histórico de time tracking
 *     tags: [Time Tracking]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Histórico de time tracking
 */
router.get('/:id/time/history', idParamValidator, buscarHistorico);

/**
 * @swagger
 * /chamados/{idPai}/associar/{idFilho}:
 *   post:
 *     summary: Associar chamado filho a um chamado pai
 *     tags: [Chamados]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: idPai
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: idFilho
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       201:
 *         description: Chamado associado com sucesso
 *       400:
 *         description: 'Erro de validação - ex: chamado já tem pai, chamado pai não pode ser filho'
 *       404:
 *         description: Chamado não encontrado
 */
router.post('/:idPai/associar/:idFilho', associarChamadoParamsValidator, associarFilho);

/**
 * @swagger
 * /chamados/{idPai}/filhos:
 *   get:
 *     summary: Listar todos os filhos de um chamado pai
 *     tags: [Chamados]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: idPai
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Lista de filhos retornada com sucesso
 *       404:
 *         description: Chamado pai não encontrado
 */
router.get('/:idPai/filhos', idPaiParamsValidator, listarFilhos);

/**
 * @swagger
 * /chamados/{id}:
 *   get:
 *     summary: Buscar chamado por ID
 *     tags: [Chamados]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Chamado encontrado
 */
router.get('/:id', idParamValidator, buscarChamado);

/**
 * @swagger
 * /chamados:
 *   post:
 *     summary: Criar novo chamado
 *     tags: [Chamados]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - titulo
 *               - descricao
 *               - grupo_id
 *             properties:
 *               titulo:
 *                 type: string
 *               descricao:
 *                 type: string
 *               grupo_id:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Chamado criado com sucesso
 */
router.post('/', uploadLimiter, uploadMultiple, criarChamadoValidator, criarChamado);

/**
 * @swagger
 * /chamados/{id}:
 *   put:
 *     summary: Atualizar chamado
 *     tags: [Chamados]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               titulo:
 *                 type: string
 *               descricao:
 *                 type: string
 *               tipo:
 *                 type: string
 *               prioridade:
 *                 type: string
 *               grupo_id:
 *                 type: integer
 *               arquivos:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       200:
 *         description: Chamado atualizado com sucesso
 */
router.put('/:id', idParamValidator, uploadLimiter, uploadMultiple, atualizarChamadoValidator, atualizarChamado);

/**
 * @swagger
 * /chamados/{id}:
 *   delete:
 *     summary: Cancelar chamado
 *     tags: [Chamados]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Chamado cancelado com sucesso
 */
router.delete('/:id', idParamValidator, verificarGerente, deletarChamado);

/**
 * @swagger
 * /chamados/{id}/comentarios:
 *   post:
 *     summary: Adicionar comentário
 *     tags: [Chamados]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       201:
 *         description: Comentário adicionado com sucesso
 */
router.post('/:id/comentarios', idParamValidator, uploadLimiter, uploadMultiple, adicionarComentario);

/**
 * @swagger
 * /chamados/{id}/time/start:
 *   post:
 *     summary: Iniciar contagem de tempo
 *     tags: [Time Tracking]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       201:
 *         description: Contagem iniciada
 */
router.post('/:id/time/start', idParamValidator, iniciarContagem);

/**
 * @swagger
 * /chamados/{id}/time/stop:
 *   post:
 *     summary: Parar contagem de tempo
 *     tags: [Time Tracking]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Contagem parada
 */
router.post('/:id/time/stop', idParamValidator, pararContagem);

/**
 * @swagger
 * /chamados/{id}/close:
 *   post:
 *     summary: Fechar chamado
 *     tags: [Chamados]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - data_hora_resolucao
 *               - categoria_solucao_id
 *               - descricao_fechamento
 *             properties:
 *               data_hora_resolucao:
 *                 type: string
 *                 format: date-time
 *               categoria_solucao_id:
 *                 type: integer
 *               descricao_fechamento:
 *                 type: string
 *     responses:
 *       201:
 *         description: Chamado fechado com sucesso
 */
router.post('/:id/close', idParamValidator, fecharChamadoValidator, fecharChamado);

/**
 * @swagger
 * /chamados/{id}/fechamento:
 *   get:
 *     summary: Buscar fechamento de um chamado
 *     tags: [Chamados]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Fechamento encontrado
 */
router.get('/:id/fechamento', idParamValidator, buscarFechamento);

/**
 * @swagger
 * /chamados/{id}/pode-fechar:
 *   get:
 *     summary: Verificar se chamado pode ser fechado
 *     tags: [Chamados]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Resultado da verificação
 */
router.get('/:id/pode-fechar', idParamValidator, verificarPodeFechamento);

/**
 * @swagger
 * /chamados/{idFilho}/desassociar:
 *   delete:
 *     summary: Desassociar chamado filho do seu pai
 *     tags: [Chamados]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: idFilho
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Chamado desassociado com sucesso
 *       400:
 *         description: Chamado não possui pai associado
 *       404:
 *         description: Chamado não encontrado
 */
router.delete('/:idFilho/desassociar', idParamValidator, desassociarFilho);

/**
 * @swagger
 * /chamados/{id}/pode-encerrar:
 *   get:
 *     summary: Verificar se chamado pai pode ser encerrado (verifica filhos ativos)
 *     tags: [Chamados]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: 'Resultado da verificação com lista de filhos ativos, se houver'
 *       404:
 *         description: Chamado não encontrado
 */
router.get('/:id/pode-encerrar', idParamValidator, verificarPodeEncerrar);

/**
 * @swagger
 * /chamados/{id}/reopen:
 *   post:
 *     summary: Reabrir chamado fechado (apenas admin)
 *     tags: [Chamados]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Chamado reaberto com sucesso
 */
router.post('/:id/reopen', idParamValidator, verificarAdmin, reabrirChamado);

export default router;
