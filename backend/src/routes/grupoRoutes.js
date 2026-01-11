import express from 'express';
import {
  listarGrupos,
  buscarGrupo,
  criarGrupo,
  atualizarGrupo,
  deletarGrupo,
  listarUsuariosGrupo,
  adicionarUsuario,
  removerUsuario,
  meusGrupos
} from '../controllers/grupoController.js';
import { autenticar, verificarAdmin, verificarGerente, verificarGerenteOuGruposExecutores } from '../middleware/auth.js';
import { criarGrupoValidator } from '../validators/grupo/criarGrupoValidator.js';
import { atualizarGrupoValidator } from '../validators/grupo/atualizarGrupoValidator.js';
import { idParamValidator } from '../validators/chamado/idParamValidator.js';

const router = express.Router();

// Todas as rotas requerem autenticação
router.use(autenticar);

/**
 * @route GET /api/grupos/meus
 * @desc Listar grupos do usuário logado
 * @access Autenticado
 */
router.get('/meus', meusGrupos);

/**
 * @route GET /api/grupos
 * @desc Listar todos os grupos (com paginação e filtros)
 * @access Gerente/Admin ou qualquer usuário autenticado para grupos executores
 */
router.get('/', verificarGerenteOuGruposExecutores, listarGrupos);

/**
 * @route GET /api/grupos/:id
 * @desc Buscar grupo por ID
 * @access Gerente ou Admin
 */
router.get('/:id', idParamValidator, verificarGerente, buscarGrupo);

/**
 * @route POST /api/grupos
 * @desc Criar novo grupo
 * @access Admin
 */
router.post('/', verificarAdmin, criarGrupoValidator, criarGrupo);

/**
 * @route PUT /api/grupos/:id
 * @desc Atualizar grupo
 * @access Admin
 */
router.put('/:id', idParamValidator, verificarAdmin, atualizarGrupoValidator, atualizarGrupo);

/**
 * @route DELETE /api/grupos/:id
 * @desc Desativar grupo (soft delete)
 * @access Admin
 */
router.delete('/:id', idParamValidator, verificarAdmin, deletarGrupo);

/**
 * @route GET /api/grupos/:id/usuarios
 * @desc Listar usuários de um grupo
 * @access Gerente ou Admin
 */
router.get('/:id/usuarios', idParamValidator, verificarGerente, listarUsuariosGrupo);

/**
 * @route POST /api/grupos/:id/usuarios
 * @desc Adicionar usuário ao grupo
 * @access Admin
 */
router.post('/:id/usuarios', idParamValidator, verificarAdmin, adicionarUsuario);

/**
 * @route DELETE /api/grupos/:id/usuarios/:usuarioId
 * @desc Remover usuário do grupo
 * @access Admin
 */
router.delete('/:id/usuarios/:usuarioId', idParamValidator, verificarAdmin, removerUsuario);

export default router;

