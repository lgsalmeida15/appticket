import http from '../api/http.js';

/**
 * Service de auditoria
 * Centraliza todas as chamadas de API relacionadas a logs de auditoria
 */
class AuditoriaService {
  /**
   * Listar logs de auditoria
   */
  async listar(filtros = {}) {
    const params = new URLSearchParams();
    
    if (filtros.page) params.append('page', filtros.page);
    if (filtros.limit) params.append('limit', filtros.limit);
    if (filtros.usuario_id) params.append('usuario_id', filtros.usuario_id);
    if (filtros.entidade) params.append('entidade', filtros.entidade);
    if (filtros.acao) params.append('acao', filtros.acao);
    if (filtros.data_inicio) params.append('data_inicio', filtros.data_inicio);
    if (filtros.data_fim) params.append('data_fim', filtros.data_fim);

    const response = await http.get(`/auditoria?${params.toString()}`);
    return response.data;
  }

  /**
   * Buscar log por ID
   */
  async buscarPorId(id) {
    const response = await http.get(`/auditoria/${id}`);
    return response.data;
  }
}

export default new AuditoriaService();

