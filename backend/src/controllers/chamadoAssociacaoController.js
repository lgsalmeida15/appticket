import chamadoAssociacaoService from '../services/chamadoAssociacaoService.js';

/**
 * Associar chamado filho a um chamado pai
 * POST /chamados/:idPai/associar/:idFilho
 */
export const associarFilho = async (req, res, next) => {
  try {
    const { idPai, idFilho } = req.params;
    const idPaiNum = parseInt(idPai);
    const idFilhoNum = parseInt(idFilho);
    if (isNaN(idPaiNum) || idPaiNum <= 0 || isNaN(idFilhoNum) || idFilhoNum <= 0) {
      const error = new Error('IDs inválidos');
      error.statusCode = 400;
      error.code = 'INVALID_IDS';
      throw error;
    }
    const usuarioId = req.usuario.id;

    const resultado = await chamadoAssociacaoService.associarFilho(
      idPaiNum,
      idFilhoNum,
      usuarioId,
      req
    );

    res.status(201).json(resultado);
  } catch (error) {
    next(error);
  }
};

/**
 * Desassociar chamado filho do seu pai
 * DELETE /chamados/:idFilho/desassociar
 */
export const desassociarFilho = async (req, res, next) => {
  try {
    const { idFilho } = req.params;
    const idFilhoNum = parseInt(idFilho);
    if (isNaN(idFilhoNum) || idFilhoNum <= 0) {
      const error = new Error('ID inválido');
      error.statusCode = 400;
      error.code = 'INVALID_ID';
      throw error;
    }
    const usuarioId = req.usuario.id;

    const resultado = await chamadoAssociacaoService.desassociarFilho(
      idFilhoNum,
      usuarioId,
      req
    );

    res.json(resultado);
  } catch (error) {
    next(error);
  }
};

/**
 * Listar todos os filhos de um chamado pai
 * GET /chamados/:idPai/filhos
 */
export const listarFilhos = async (req, res, next) => {
  try {
    const { idPai } = req.params;
    const idPaiNum = parseInt(idPai);
    if (isNaN(idPaiNum) || idPaiNum <= 0) {
      const error = new Error('ID inválido');
      error.statusCode = 400;
      error.code = 'INVALID_ID';
      throw error;
    }

    const filhos = await chamadoAssociacaoService.listarFilhos(idPaiNum);

    res.json({
      chamado_pai_id: idPaiNum,
      filhos,
      total: filhos.length
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Verificar se um chamado pai pode ser encerrado
 * GET /chamados/:id/pode-encerrar
 */
export const verificarPodeEncerrar = async (req, res, next) => {
  try {
    const { id } = req.params;
    const idNum = parseInt(id);
    if (isNaN(idNum) || idNum <= 0) {
      const error = new Error('ID inválido');
      error.statusCode = 400;
      error.code = 'INVALID_ID';
      throw error;
    }

    const resultado = await chamadoAssociacaoService.verificarPodeEncerrarPai(idNum);

    res.json(resultado);
  } catch (error) {
    next(error);
  }
};

export default {
  associarFilho,
  desassociarFilho,
  listarFilhos,
  verificarPodeEncerrar
};

