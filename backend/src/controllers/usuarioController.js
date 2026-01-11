import usuarioService from '../services/usuarioService.js';
import grupoService from '../services/grupoService.js';

/**
 * Listar todos os usuários
 */
export const listarUsuarios = async (req, res, next) => {
  try {
    const filtros = {
      page: req.query.page || 1,
      limit: req.query.limit || 10,
      search: req.query.search || '',
      tipo: req.query.tipo || '',
      ativo: req.query.ativo !== '' ? req.query.ativo === 'true' : undefined
    };

    const resultado = await usuarioService.listar(filtros);

    res.json(resultado);
  } catch (error) {
    next(error);
  }
};

/**
 * Buscar usuário por ID
 */
export const buscarUsuario = async (req, res, next) => {
  try {
    const { id } = req.params;
    const idNum = parseInt(id);
    if (isNaN(idNum) || idNum <= 0) {
      const error = new Error('ID inválido');
      error.statusCode = 400;
      error.code = 'INVALID_ID';
      throw error;
    }
    
    const usuario = await usuarioService.buscarPorId(idNum, {
      incluirGrupos: true
    });

    res.json({ usuario });
  } catch (error) {
    next(error);
  }
};

/**
 * Criar novo usuário
 */
export const criarUsuario = async (req, res, next) => {
  try {
    // Validação obrigatória - validator sempre deve executar
    if (!req.validatedData) {
      const error = new Error('Dados não validados');
      error.statusCode = 400;
      error.code = 'VALIDATION_REQUIRED';
      throw error;
    }
    const dados = req.validatedData;
    
    const usuario = await usuarioService.criar(dados, req);

    res.status(201).json({
      message: 'Usuário criado com sucesso',
      usuario
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Atualizar usuário
 */
export const atualizarUsuario = async (req, res, next) => {
  try {
    const { id } = req.params;
    const idNum = parseInt(id);
    if (isNaN(idNum) || idNum <= 0) {
      const error = new Error('ID inválido');
      error.statusCode = 400;
      error.code = 'INVALID_ID';
      throw error;
    }
    // Validação obrigatória - validator sempre deve executar
    if (!req.validatedData) {
      const error = new Error('Dados não validados');
      error.statusCode = 400;
      error.code = 'VALIDATION_REQUIRED';
      throw error;
    }
    const dados = req.validatedData;
    
    // Não permitir atualizar próprio usuário com tipo diferente (proteção)
    if (idNum === req.usuario.id && dados.tipo && dados.tipo !== req.usuario.tipo) {
      const error = new Error('Você não pode alterar seu próprio tipo de usuário');
      error.statusCode = 403;
      error.code = 'FORBIDDEN';
      throw error;
    }

    const usuario = await usuarioService.atualizar(idNum, dados, req, {
      incluirGrupos: true
    });

    res.json({
      message: 'Usuário atualizado com sucesso',
      usuario
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Deletar usuário permanentemente
 */
export const deletarUsuario = async (req, res, next) => {
  try {
    const { id } = req.params;
    const idNum = parseInt(id);
    if (isNaN(idNum) || idNum <= 0) {
      const error = new Error('ID inválido');
      error.statusCode = 400;
      error.code = 'INVALID_ID';
      throw error;
    }
    
    // Não permitir deletar o próprio usuário
    if (idNum === req.usuario.id) {
      const error = new Error('Você não pode deletar sua própria conta');
      error.statusCode = 400;
      error.code = 'CANNOT_DELETE_SELF';
      throw error;
    }

    const resultado = await usuarioService.deletarPermanente(idNum, req);

    res.json({ message: resultado.message || 'Usuário deletado permanentemente' });
  } catch (error) {
    next(error);
  }
};

/**
 * Associar usuário a um grupo
 */
export const associarGrupo = async (req, res, next) => {
  try {
    const { id } = req.params;
    const idNum = parseInt(id);
    if (isNaN(idNum) || idNum <= 0) {
      const error = new Error('ID inválido');
      error.statusCode = 400;
      error.code = 'INVALID_ID';
      throw error;
    }
    const { grupo_id, papel = 'agente' } = req.body;

    if (!grupo_id) {
      const error = new Error('ID do grupo é obrigatório');
      error.statusCode = 400;
      error.code = 'GRUPO_ID_REQUIRED';
      throw error;
    }
    const grupoIdNum = parseInt(grupo_id);
    if (isNaN(grupoIdNum) || grupoIdNum <= 0) {
      const error = new Error('ID do grupo inválido');
      error.statusCode = 400;
      error.code = 'INVALID_GRUPO_ID';
      throw error;
    }

    // Adicionar usuário ao grupo usando o service (service valida se usuário existe)
    await grupoService.adicionarUsuario(grupoIdNum, idNum, papel);

    // Buscar usuário atualizado com grupos usando service
    const usuarioAtualizado = await usuarioService.buscarPorId(idNum, {
      incluirGrupos: true
    });

    res.status(201).json({
      message: 'Usuário associado ao grupo com sucesso',
      usuario: usuarioAtualizado
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Remover usuário de um grupo
 */
export const removerGrupo = async (req, res, next) => {
  try {
    // Os parâmetros já foram validados e convertidos pelo validator (idsParamsValidator)
    // O validator atualiza req.params com valores numéricos
    const usuarioId = req.params.id;
    const grupoIdInt = req.params.grupoId;

    // Validação adicional de segurança
    if (!usuarioId || !grupoIdInt || typeof usuarioId !== 'number' || typeof grupoIdInt !== 'number' || usuarioId <= 0 || grupoIdInt <= 0) {
      const error = new Error('IDs inválidos');
      error.statusCode = 400;
      error.code = 'INVALID_IDS';
      throw error;
    }

    await grupoService.removerUsuario(grupoIdInt, usuarioId);

    res.json({
      message: 'Usuário removido do grupo com sucesso'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Atualizar papel do usuário em um grupo
 */
export const atualizarPapelGrupo = async (req, res, next) => {
  try {
    // Os parâmetros já foram validados e convertidos pelo validator (idsParamsValidator)
    const usuarioId = req.params.id;
    const grupoIdInt = req.params.grupoId;
    const { papel } = req.body;

    // Validação adicional de segurança
    if (!usuarioId || !grupoIdInt || typeof usuarioId !== 'number' || typeof grupoIdInt !== 'number' || usuarioId <= 0 || grupoIdInt <= 0) {
      const error = new Error('IDs inválidos');
      error.statusCode = 400;
      error.code = 'INVALID_IDS';
      throw error;
    }

    await grupoService.atualizarPapelUsuario(grupoIdInt, usuarioId, papel);

    res.json({
      message: 'Papel atualizado com sucesso'
    });
  } catch (error) {
    next(error);
  }
};

export default {
  listarUsuarios,
  buscarUsuario,
  criarUsuario,
  atualizarUsuario,
  deletarUsuario,
  associarGrupo,
  removerGrupo,
  atualizarPapelGrupo
};
