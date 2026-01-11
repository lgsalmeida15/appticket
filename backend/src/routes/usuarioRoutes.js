import express from 'express';
import {
  listarUsuarios,
  buscarUsuario,
  criarUsuario,
  atualizarUsuario,
  deletarUsuario,
  associarGrupo,
  removerGrupo,
  atualizarPapelGrupo
} from '../controllers/usuarioController.js';
import { autenticar, verificarAdmin } from '../middleware/auth.js';
import { criarUsuarioValidator } from '../validators/usuario/criarUsuarioValidator.js';
import { atualizarUsuarioValidator } from '../validators/usuario/atualizarUsuarioValidator.js';
import { idParamValidator } from '../validators/chamado/idParamValidator.js';
import { idsParamsValidator } from '../validators/chamado/idsParamsValidator.js';

const router = express.Router();

// Todas as rotas requerem autenticação
router.use(autenticar);

/**
 * @route GET /api/usuarios
 * @desc Listar todos os usuários (com paginação e filtros)
 * @access Admin
 */
router.get('/', verificarAdmin, listarUsuarios);

/**
 * @route GET /api/usuarios/:id
 * @desc Buscar usuário por ID
 * @access Admin
 */
router.get('/:id', idParamValidator, verificarAdmin, buscarUsuario);

/**
 * @route POST /api/usuarios
 * @desc Criar novo usuário
 * @access Admin
 */
router.post('/', verificarAdmin, criarUsuarioValidator, criarUsuario);

/**
 * @route PUT /api/usuarios/:id
 * @desc Atualizar usuário
 * @access Admin
 */
router.put('/:id', idParamValidator, verificarAdmin, atualizarUsuarioValidator, atualizarUsuario);

/**
 * @route DELETE /api/usuarios/:id
 * @desc Desativar usuário (soft delete)
 * @access Admin
 */
router.delete('/:id', idParamValidator, verificarAdmin, deletarUsuario);

/**
 * @route POST /api/usuarios/:id/grupos
 * @desc Associar usuário a um grupo
 * @access Admin
 */
router.post('/:id/grupos', idParamValidator, verificarAdmin, associarGrupo);

/**
 * @route DELETE /api/usuarios/:id/grupos/:grupoId
 * @desc Remover usuário de um grupo
 * @access Admin
 */
router.delete('/:id/grupos/:grupoId', idsParamsValidator, verificarAdmin, removerGrupo);

/**
 * @route PATCH /api/usuarios/:id/grupos/:grupoId
 * @desc Atualizar papel do usuário em um grupo
 * @access Admin
 */
router.patch('/:id/grupos/:grupoId', idsParamsValidator, verificarAdmin, atualizarPapelGrupo);

export default router;

