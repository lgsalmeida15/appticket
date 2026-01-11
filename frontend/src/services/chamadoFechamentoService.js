import http from '../api/http.js';

/**
 * Serviço para gerenciar fechamento de chamados
 */
class ChamadoFechamentoService {
  /**
   * Fechar chamado
   */
  async fecharChamado(chamadoId, dados) {
    const response = await http.post(`/chamados/${chamadoId}/close`, dados);
    return response.data.fechamento;
  }

  /**
   * Buscar fechamento de um chamado
   */
  async buscarFechamento(chamadoId) {
    const response = await http.get(`/chamados/${chamadoId}/fechamento`);
    return response.data.fechamento;
  }

  /**
   * Verificar se chamado pode ser fechado
   */
  async verificarPodeFechamento(chamadoId) {
    const response = await http.get(`/chamados/${chamadoId}/pode-fechar`);
    return response.data;
  }

  /**
   * Reabrir chamado fechado (apenas admin)
   */
  async reabrirChamado(chamadoId) {
    const response = await http.post(`/chamados/${chamadoId}/reopen`);
    return response.data;
  }
}

export default new ChamadoFechamentoService();

