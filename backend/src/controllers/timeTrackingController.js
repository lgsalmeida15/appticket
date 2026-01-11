import timeTrackingService from '../services/timeTrackingService.js';

/**
 * Iniciar contagem de tempo
 */
export const iniciarContagem = async (req, res, next) => {
  try {
    const { id } = req.params;
    const idNum = parseInt(id);
    if (isNaN(idNum) || idNum <= 0) {
      const error = new Error('ID inválido');
      error.statusCode = 400;
      error.code = 'INVALID_ID';
      throw error;
    }
    const { descricao } = req.body || {};

    const registro = await timeTrackingService.iniciarContagem(
      idNum,
      req.usuario.id,
      descricao
    );

    res.status(201).json({
      message: 'Contagem de tempo iniciada',
      registro
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Parar contagem de tempo
 */
export const pararContagem = async (req, res, next) => {
  try {
    const { id } = req.params;
    const idNum = parseInt(id);
    if (isNaN(idNum) || idNum <= 0) {
      const error = new Error('ID inválido');
      error.statusCode = 400;
      error.code = 'INVALID_ID';
      throw error;
    }

    const registro = await timeTrackingService.pararContagem(
      idNum,
      req.usuario.id
    );

    res.json({
      message: 'Contagem de tempo parada',
      registro
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Buscar histórico de time tracking de um chamado
 */
export const buscarHistorico = async (req, res, next) => {
  try {
    const { id } = req.params;
    const idNum = parseInt(id);
    if (isNaN(idNum) || idNum <= 0) {
      const error = new Error('ID inválido');
      error.statusCode = 400;
      error.code = 'INVALID_ID';
      throw error;
    }

    const resultado = await timeTrackingService.buscarHistoricoPorChamado(idNum);

    res.json(resultado);
  } catch (error) {
    next(error);
  }
};

/**
 * Buscar contagem ativa do usuário
 */
export const buscarContagemAtiva = async (req, res, next) => {
  try {
    const contagem = await timeTrackingService.buscarContagemAtiva(req.usuario.id);

    res.json({ contagem });
  } catch (error) {
    next(error);
  }
};

export default {
  iniciarContagem,
  pararContagem,
  buscarHistorico,
  buscarContagemAtiva
};

