import dashboardService from '../services/dashboardService.js';

/**
 * Buscar resumo do dashboard
 */
export const buscarResumo = async (req, res, next) => {
  try {
    const { data_inicio, data_fim } = req.query;

    const resumo = await dashboardService.buscarResumo({
      dataInicio: data_inicio || undefined,
      dataFim: data_fim || undefined,
      usuarioLogado: req.usuario
    });

    res.json(resumo);
  } catch (error) {
    next(error);
  }
};

export default {
  buscarResumo
};

