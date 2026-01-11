import grupoService from '../services/grupoService.js';

/**
 * Listar grupos do usuário logado
 */
export const meusGrupos = async (req, res, next) => {
  try {
    const grupos = await grupoService.buscarPorUsuario(req.usuario.id);

    res.json({ grupos });
  } catch (error) {
    next(error);
  }
};

/**
 * Listar todos os grupos
 */
export const listarGrupos = async (req, res, next) => {
  try {
    const filtros = {
      page: req.query.page || 1,
      limit: req.query.limit || 10,
      search: req.query.search || '',
      ativo: req.query.ativo !== '' ? req.query.ativo === 'true' : undefined,
      executor: req.query.executor === 'true' ? true : undefined,
      solicitante: req.query.solicitante === 'true' ? true : undefined
    };

    // ✅ Se está buscando grupos executores, todos os usuários podem ver
    // Caso contrário, aplicar filtros de permissão normais
    const resultado = await grupoService.listar(filtros, req.usuario);

    res.json(resultado);
  } catch (error) {
    next(error);
  }
};

/**
 * Buscar grupo por ID
 */
export const buscarGrupo = async (req, res, next) => {
  try {
    const { id } = req.params;
    const idNum = parseInt(id);
    if (isNaN(idNum) || idNum <= 0) {
      const error = new Error('ID inválido');
      error.statusCode = 400;
      error.code = 'INVALID_ID';
      throw error;
    }

    const grupo = await grupoService.buscarPorId(idNum, {
      incluirUsuarios: true
    });

    res.json({ grupo });
  } catch (error) {
    next(error);
  }
};

/**
 * Criar novo grupo
 */
export const criarGrupo = async (req, res, next) => {
  try {
    // Validação obrigatória - validator sempre deve executar
    if (!req.validatedData) {
      const error = new Error('Dados não validados');
      error.statusCode = 400;
      error.code = 'VALIDATION_REQUIRED';
      throw error;
    }
    const dados = req.validatedData;
    
    const grupo = await grupoService.criar(dados, req);

    res.status(201).json({
      message: 'Grupo criado com sucesso',
      grupo
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Atualizar grupo
 */
export const atualizarGrupo = async (req, res, next) => {
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

    const grupo = await grupoService.atualizar(idNum, dados, req, {
      incluirUsuarios: true
    });

    res.json({
      message: 'Grupo atualizado com sucesso',
      grupo
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Deletar grupo permanentemente
 */
export const deletarGrupo = async (req, res, next) => {
  try {
    const { id } = req.params;
    const idNum = parseInt(id);
    if (isNaN(idNum) || idNum <= 0) {
      const error = new Error('ID inválido');
      error.statusCode = 400;
      error.code = 'INVALID_ID';
      throw error;
    }

    const resultado = await grupoService.deletarPermanente(idNum, req);

    res.json({ message: resultado.message || 'Grupo deletado permanentemente' });
  } catch (error) {
    next(error);
  }
};

/**
 * Listar usuários de um grupo
 */
export const listarUsuariosGrupo = async (req, res, next) => {
  try {
    const { id } = req.params;
    const idNum = parseInt(id);
    if (isNaN(idNum) || idNum <= 0) {
      const error = new Error('ID inválido');
      error.statusCode = 400;
      error.code = 'INVALID_ID';
      throw error;
    }

    const grupo = await grupoService.buscarPorId(idNum, {
      incluirUsuarios: true
    });

    const usuarios = grupo.usuarios || [];

    res.json({
      grupo_id: idNum,
      usuarios: usuarios.map(u => {
        const associacao = u.usuario_grupo || u.UsuarioGrupo;
        return {
          ...u,
          papel: associacao?.papel,
          associacao_id: associacao?.id
        };
      })
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Adicionar usuário ao grupo
 */
export const adicionarUsuario = async (req, res, next) => {
  try {
    const { id } = req.params;
    const idNum = parseInt(id);
    if (isNaN(idNum) || idNum <= 0) {
      const error = new Error('ID inválido');
      error.statusCode = 400;
      error.code = 'INVALID_ID';
      throw error;
    }
    const { usuario_id, papel = 'agente' } = req.body;

    if (!usuario_id) {
      const error = new Error('ID do usuário é obrigatório');
      error.statusCode = 400;
      error.code = 'USER_ID_REQUIRED';
      throw error;
    }
    const usuarioIdNum = parseInt(usuario_id);
    if (isNaN(usuarioIdNum) || usuarioIdNum <= 0) {
      const error = new Error('ID do usuário inválido');
      error.statusCode = 400;
      error.code = 'INVALID_USER_ID';
      throw error;
    }

    await grupoService.adicionarUsuario(idNum, usuarioIdNum, papel);

    // Buscar grupo atualizado com usuários para retornar associação
    const grupo = await grupoService.buscarPorId(idNum, {
      incluirUsuarios: true
    });

    const usuarioAssociado = grupo.usuarios?.find(u => u.id === usuarioIdNum);

    res.status(201).json({
      message: 'Usuário adicionado ao grupo com sucesso',
      associacao: usuarioAssociado ? {
        usuario_id: usuarioAssociado.id,
        grupo_id: idNum,
        papel: usuarioAssociado.usuario_grupo?.papel || papel,
        usuario: {
          id: usuarioAssociado.id,
          nome: usuarioAssociado.nome,
          email: usuarioAssociado.email,
          tipo: usuarioAssociado.tipo
        }
      } : null
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Remover usuário do grupo
 */
export const removerUsuario = async (req, res, next) => {
  try {
    const { id, usuarioId } = req.params;
    const idNum = parseInt(id);
    const usuarioIdNum = parseInt(usuarioId);
    if (isNaN(idNum) || idNum <= 0 || isNaN(usuarioIdNum) || usuarioIdNum <= 0) {
      const error = new Error('IDs inválidos');
      error.statusCode = 400;
      error.code = 'INVALID_IDS';
      throw error;
    }

    const resultado = await grupoService.removerUsuario(idNum, usuarioIdNum);

    res.json({ message: resultado.message || 'Usuário removido do grupo com sucesso' });
  } catch (error) {
    next(error);
  }
};

export default {
  listarGrupos,
  buscarGrupo,
  criarGrupo,
  atualizarGrupo,
  deletarGrupo,
  listarUsuariosGrupo,
  adicionarUsuario,
  removerUsuario,
  meusGrupos
};
