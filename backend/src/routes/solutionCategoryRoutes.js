import express from 'express';
import {
  listarCategoriasAtivas,
  listarTodasCategorias,
  buscarCategoria,
  criarCategoria,
  atualizarCategoria,
  desativarCategoria,
  ativarCategoria,
  buscarNiveis1,
  buscarNiveis2,
  buscarNiveis3
} from '../controllers/solutionCategoryController.js';
import { autenticar, verificarAdmin } from '../middleware/auth.js';
import { idParamValidator } from '../validators/chamado/idParamValidator.js';
import { criarCategoriaValidator } from '../validators/solutionCategory/criarCategoriaValidator.js';
import { atualizarCategoriaValidator } from '../validators/solutionCategory/atualizarCategoriaValidator.js';

const router = express.Router();

// Todas as rotas requerem autenticação
router.use(autenticar);

/**
 * @swagger
 * /solution-categories/active:
 *   get:
 *     summary: Listar categorias ativas
 *     tags: [Solution Categories]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de categorias ativas
 */
router.get('/active', listarCategoriasAtivas);

/**
 * @swagger
 * /solution-categories/levels/1:
 *   get:
 *     summary: Buscar níveis 1 únicos
 *     tags: [Solution Categories]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de níveis 1
 */
router.get('/levels/1', buscarNiveis1);

/**
 * @swagger
 * /solution-categories/levels/2:
 *   get:
 *     summary: Buscar níveis 2 para um nível 1
 *     tags: [Solution Categories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: nivel1
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Lista de níveis 2
 */
router.get('/levels/2', buscarNiveis2);

/**
 * @swagger
 * /solution-categories/levels/3:
 *   get:
 *     summary: Buscar níveis 3 para um nível 1 e 2
 *     tags: [Solution Categories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: nivel1
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: nivel2
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Lista de níveis 3
 */
router.get('/levels/3', buscarNiveis3);

/**
 * @swagger
 * /solution-categories:
 *   get:
 *     summary: Listar todas as categorias (admin)
 *     tags: [Solution Categories]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de todas as categorias
 */
router.get('/', verificarAdmin, listarTodasCategorias);

/**
 * @swagger
 * /solution-categories/{id}:
 *   get:
 *     summary: Buscar categoria por ID
 *     tags: [Solution Categories]
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
 *         description: Categoria encontrada
 */
router.get('/:id', idParamValidator, buscarCategoria);

/**
 * @swagger
 * /solution-categories:
 *   post:
 *     summary: Criar nova categoria (admin)
 *     tags: [Solution Categories]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - categoria_nivel_1
 *               - categoria_nivel_2
 *               - categoria_nivel_3
 *             properties:
 *               categoria_nivel_1:
 *                 type: string
 *               categoria_nivel_2:
 *                 type: string
 *               categoria_nivel_3:
 *                 type: string
 *     responses:
 *       201:
 *         description: Categoria criada com sucesso
 */
router.post('/', verificarAdmin, criarCategoriaValidator, criarCategoria);

/**
 * @swagger
 * /solution-categories/{id}:
 *   put:
 *     summary: Atualizar categoria (admin)
 *     tags: [Solution Categories]
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
 *             properties:
 *               categoria_nivel_1:
 *                 type: string
 *               categoria_nivel_2:
 *                 type: string
 *               categoria_nivel_3:
 *                 type: string
 *     responses:
 *       200:
 *         description: Categoria atualizada com sucesso
 */
router.put('/:id', idParamValidator, verificarAdmin, atualizarCategoriaValidator, atualizarCategoria);

/**
 * @swagger
 * /solution-categories/{id}/deactivate:
 *   patch:
 *     summary: Desativar categoria (admin)
 *     tags: [Solution Categories]
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
 *         description: Categoria desativada com sucesso
 */
router.patch('/:id/deactivate', idParamValidator, verificarAdmin, desativarCategoria);

/**
 * @swagger
 * /solution-categories/{id}/activate:
 *   patch:
 *     summary: Ativar categoria (admin)
 *     tags: [Solution Categories]
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
 *         description: Categoria ativada com sucesso
 */
router.patch('/:id/activate', idParamValidator, verificarAdmin, ativarCategoria);

export default router;

