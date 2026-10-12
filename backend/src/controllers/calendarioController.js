import calendarioService from '../services/calendarioService.js';

export const buscarEventos = async (req, res, next) => {
  try {
    const { inicio, fim, grupo_id, agente_id } = req.query;

    if (!inicio || !fim) {
      const error = new Error('Parâmetros "inicio" e "fim" são obrigatórios');
      error.statusCode = 400;
      error.code = 'MISSING_DATE_RANGE';
      throw error;
    }

    const dataInicio = new Date(inicio);
    const dataFim = new Date(fim);
    if (isNaN(dataInicio.getTime()) || isNaN(dataFim.getTime())) {
      const error = new Error('Datas inválidas');
      error.statusCode = 400;
      error.code = 'INVALID_DATE_RANGE';
      throw error;
    }

    const filtros = {};
    if (grupo_id) filtros.grupo_id = parseInt(grupo_id);
    if (agente_id) filtros.agente_id = parseInt(agente_id);

    const resultado = await calendarioService.buscarEventos(dataInicio, dataFim, filtros);
    res.json(resultado);
  } catch (error) {
    next(error);
  }
};

export default { buscarEventos };
