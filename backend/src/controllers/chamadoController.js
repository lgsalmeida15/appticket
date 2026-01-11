import chamadoService from '../services/chamadoService.js';
import comentarioService from '../services/comentarioService.js';
import fileService from '../services/fileService.js';
import chamadoFechamentoService from '../services/chamadoFechamentoService.js';

/**
 * Listar todos os chamados
 */
export const listarChamados = async (req, res, next) => {
  try {
    // Validação obrigatória - validator sempre deve executar
    // Se não há validator, usar req.query diretamente
    const filtros = req.validatedData || req.query;
    
    const resultado = await chamadoService.listar(filtros, req.usuario);

    res.json(resultado);
  } catch (error) {
    next(error);
  }
};

/**
 * Buscar chamado por ID
 */
export const buscarChamado = async (req, res, next) => {
  try {
    const { id } = req.params;
    const idNum = parseInt(id);
    if (isNaN(idNum) || idNum <= 0) {
      const error = new Error('ID inválido');
      error.statusCode = 400;
      error.code = 'INVALID_ID';
      throw error;
    }
    const opcoes = {
      incluirHistorico: req.query.incluirHistorico === 'true',
      incluirComentarios: req.query.incluirComentarios === 'true',
      incluirRelacionamentos: req.query.incluirRelacionamentos !== 'false' // Por padrão inclui
    };

    const chamado = await chamadoService.buscarPorId(idNum, req.usuario, opcoes);

    res.json({ chamado });
  } catch (error) {
    next(error);
  }
};

/**
 * Criar novo chamado
 */
export const criarChamado = async (req, res, next) => {
  try {
    // Validar e processar arquivos anexados
    if (req.files && req.files.length > 0) {
      fileService.validarArquivos(req.files, {
        maxSize: 10 * 1024 * 1024, // 10MB
        maxFiles: 5
      });
    }

    const anexos = fileService.processarArquivosUpload(req.files, req);

    // Validação obrigatória - validator sempre deve executar
    if (!req.validatedData) {
      const error = new Error('Dados não validados');
      error.statusCode = 400;
      error.code = 'VALIDATION_REQUIRED';
      throw error;
    }
    const dados = req.validatedData;
    
    // Adicionar anexos aos campos customizados
    const camposCustomizados = {
      ...(dados.campos_customizados || {}),
      anexos
    };

    const chamado = await chamadoService.criar(
      {
        ...dados,
        campos_customizados: camposCustomizados
      },
      req.usuario.id,
      req
    );

    res.status(201).json({
      message: 'Chamado criado com sucesso',
      chamado
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Atualizar chamado
 */
export const atualizarChamado = async (req, res, next) => {
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

    const chamado = await chamadoService.atualizar(idNum, dados, req.usuario, req);

    res.json({
      message: 'Chamado atualizado com sucesso',
      chamado
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Deletar chamado permanentemente
 */
export const deletarChamado = async (req, res, next) => {
  try {
    const { id } = req.params;
    const idNum = parseInt(id);
    if (isNaN(idNum) || idNum <= 0) {
      const error = new Error('ID inválido');
      error.statusCode = 400;
      error.code = 'INVALID_ID';
      throw error;
    }

    const resultado = await chamadoService.deletarPermanente(idNum, req.usuario.id, req);

    res.json(resultado);
  } catch (error) {
    next(error);
  }
};

/**
 * Adicionar comentário
 */
export const adicionarComentario = async (req, res, next) => {
  try {
    const { id } = req.params;
    const idNum = parseInt(id);
    if (isNaN(idNum) || idNum <= 0) {
      const error = new Error('ID inválido');
      error.statusCode = 400;
      error.code = 'INVALID_ID';
      throw error;
    }

    // Validar e processar arquivos anexados
    if (req.files && req.files.length > 0) {
      fileService.validarArquivos(req.files, {
        maxSize: 10 * 1024 * 1024, // 10MB
        maxFiles: 5
      });
    }

    const anexos = fileService.processarArquivosUpload(req.files, req);

    const { texto, interno = false } = req.body;

    const comentario = await comentarioService.adicionarComentario(idNum, req.usuario.id, {
      texto,
      interno,
      anexos
    });

    res.status(201).json({
      message: 'Comentário adicionado com sucesso',
      comentario
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Listar comentários de um chamado
 */
export const listarComentarios = async (req, res, next) => {
  try {
    const { id } = req.params;
    const idNum = parseInt(id);
    if (isNaN(idNum) || idNum <= 0) {
      const error = new Error('ID inválido');
      error.statusCode = 400;
      error.code = 'INVALID_ID';
      throw error;
    }

    const comentarios = await comentarioService.listarPorChamado(idNum);

    res.json({ comentarios });
  } catch (error) {
    next(error);
  }
};

/**
 * Estatísticas de chamados
 */
export const estatisticas = async (req, res, next) => {
  try {
    const estatisticas = await chamadoService.buscarEstatisticas(req.usuario);

    res.json(estatisticas);
  } catch (error) {
    next(error);
  }
};

/**
 * Fechar chamado
 */
export const fecharChamado = async (req, res, next) => {
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
    
    const fechamento = await chamadoFechamentoService.fecharChamado(
      idNum,
      dados,
      req.usuario.id,
      req
    );

    res.status(201).json({
      message: 'Chamado fechado com sucesso',
      fechamento
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Buscar fechamento de um chamado
 */
export const buscarFechamento = async (req, res, next) => {
  try {
    const { id } = req.params;
    const idNum = parseInt(id);
    if (isNaN(idNum) || idNum <= 0) {
      const error = new Error('ID inválido');
      error.statusCode = 400;
      error.code = 'INVALID_ID';
      throw error;
    }
    const fechamento = await chamadoFechamentoService.buscarPorChamado(idNum);

    res.json({ fechamento });
  } catch (error) {
    next(error);
  }
};

/**
 * Verificar se chamado pode ser fechado
 */
export const verificarPodeFechamento = async (req, res, next) => {
  try {
    const { id } = req.params;
    const idNum = parseInt(id);
    if (isNaN(idNum) || idNum <= 0) {
      const error = new Error('ID inválido');
      error.statusCode = 400;
      error.code = 'INVALID_ID';
      throw error;
    }
    const resultado = await chamadoFechamentoService.verificarPodeFechamento(idNum);

    res.json(resultado);
  } catch (error) {
    next(error);
  }
};

/**
 * Reabrir chamado fechado (apenas admin)
 */
export const reabrirChamado = async (req, res, next) => {
  try {
    const { id } = req.params;
    const idNum = parseInt(id);
    if (isNaN(idNum) || idNum <= 0) {
      const error = new Error('ID inválido');
      error.statusCode = 400;
      error.code = 'INVALID_ID';
      throw error;
    }
    const resultado = await chamadoFechamentoService.reabrirChamado(
      idNum,
      req.usuario.id,
      req
    );

    res.json(resultado);
  } catch (error) {
    next(error);
  }
};

export default {
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
};
