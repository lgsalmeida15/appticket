import timeTrackingService from '../services/timeTrackingService.js';
import timeTrackingBackfillService from '../services/timeTrackingBackfillService.js';

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

/**
 * Buscar totais de tempo (com sessão ativa incluída) para vários chamados de uma vez
 */
export const buscarTotais = async (req, res, next) => {
  try {
    const { ids } = req.query;
    if (!ids) {
      const error = new Error('Parâmetro "ids" é obrigatório');
      error.statusCode = 400;
      error.code = 'MISSING_IDS';
      throw error;
    }

    const chamadoIds = String(ids)
      .split(',')
      .map((id) => parseInt(id.trim(), 10))
      .filter((id) => !isNaN(id) && id > 0);

    if (chamadoIds.length === 0) {
      const error = new Error('Nenhum ID válido informado');
      error.statusCode = 400;
      error.code = 'INVALID_IDS';
      throw error;
    }

    const totais = await timeTrackingService.buscarTotaisPorChamados(chamadoIds);

    res.json({ totais });
  } catch (error) {
    next(error);
  }
};

/**
 * Pré-visualizar o backfill retroativo de tempo (não grava nada)
 */
export const preverBackfill = async (req, res, next) => {
  try {
    const resultado = await timeTrackingBackfillService.preverTodos();
    res.json(resultado);
  } catch (error) {
    next(error);
  }
};

/**
 * Executar o backfill retroativo de tempo (grava registros "retroativo")
 */
export const executarBackfill = async (req, res, next) => {
  try {
    const resultado = await timeTrackingBackfillService.executarTodos();
    res.json(resultado);
  } catch (error) {
    next(error);
  }
};

export default {
  iniciarContagem,
  pararContagem,
  buscarHistorico,
  buscarContagemAtiva,
  buscarTotais,
  preverBackfill,
  executarBackfill
};

