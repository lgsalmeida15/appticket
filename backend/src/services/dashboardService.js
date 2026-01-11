import chamadoRepository from '../repositories/chamadoRepository.js';
import dashboardRepository from '../repositories/dashboardRepository.js';
import permissionService from './permissionService.js';
import { Op } from 'sequelize';

/**
 * Service de Dashboard
 * Contém lógica para agregação de dados do dashboard
 */
class DashboardService {
  /**
   * Buscar resumo geral do dashboard
   */
  async buscarResumo(filtros = {}) {
    const { dataInicio, dataFim, usuarioLogado } = filtros;

    // Construir filtros de data se fornecidos
    const whereData = {};
    if (dataInicio || dataFim) {
      whereData.data_abertura = {};
      if (dataInicio) whereData.data_abertura[Op.gte] = new Date(dataInicio);
      if (dataFim) {
        const fimDate = new Date(dataFim);
        fimDate.setHours(23, 59, 59, 999); // Fim do dia
        whereData.data_abertura[Op.lte] = fimDate;
      }
    }

    // Aplicar filtros de permissão
    const whereCustom = usuarioLogado ? await permissionService.aplicarFiltrosPermissaoChamados(usuarioLogado) : {};
    const where = { ...whereData, ...whereCustom };

    // Buscar totais por status
    const [total, porStatus, porGrupo, porAgente, horasTrabalhadas] = await Promise.all([
      chamadoRepository.contarTotal({ whereCustom: where }),
      dashboardRepository.buscarPorStatus(where),
      dashboardRepository.buscarPorGrupo(where),
      dashboardRepository.buscarPorAgente(where),
      dashboardRepository.buscarHorasTrabalhadasPorAgente(filtros)
    ]);

    return {
      periodo: {
        inicio: dataInicio || null,
        fim: dataFim || null
      },
      total_chamados: total,
      por_status: porStatus,
      por_grupo: porGrupo,
      por_agente: porAgente,
      horas_trabalhadas: horasTrabalhadas,
      timestamp: new Date().toISOString()
    };
  }


}

export default new DashboardService();

