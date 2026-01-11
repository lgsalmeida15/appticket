import http from '../api/http.js';

/**
 * Service de dashboard
 * Centraliza todas as chamadas de API relacionadas ao dashboard
 */
class DashboardService {
  /**
   * Buscar resumo do dashboard
   */
  async buscarResumo(filtros = {}) {
    const params = new URLSearchParams();
    
    if (filtros.data_inicio) params.append('data_inicio', filtros.data_inicio);
    if (filtros.data_fim) params.append('data_fim', filtros.data_fim);

    const queryString = params.toString();
    const url = `/dashboard/resumo${queryString ? `?${queryString}` : ''}`;
    const response = await http.get(url);
    return response.data;
  }
}

export default new DashboardService();

