import http from '../api/http.js';

/**
 * Service de tarefas de chamado
 * Centraliza todas as chamadas de API relacionadas às tarefas dentro de um chamado
 */
class ChamadoTarefaService {
  async listar(chamadoId) {
    const response = await http.get(`/chamados/${chamadoId}/tarefas`);
    return response.data;
  }

  async buscarPorId(chamadoId, tarefaId) {
    const response = await http.get(`/chamados/${chamadoId}/tarefas/${tarefaId}`);
    return response.data;
  }

  async criar(chamadoId, dados) {
    const response = await http.post(`/chamados/${chamadoId}/tarefas`, dados);
    return response.data;
  }

  async atualizar(chamadoId, tarefaId, dados) {
    const response = await http.put(`/chamados/${chamadoId}/tarefas/${tarefaId}`, dados);
    return response.data;
  }

  async cancelar(chamadoId, tarefaId) {
    const response = await http.delete(`/chamados/${chamadoId}/tarefas/${tarefaId}`);
    return response.data;
  }

  async iniciarContagem(chamadoId, tarefaId, descricao = null) {
    const response = await http.post(`/chamados/${chamadoId}/tarefas/${tarefaId}/time/start`, { descricao });
    return response.data;
  }

  async pararContagem(chamadoId, tarefaId) {
    const response = await http.post(`/chamados/${chamadoId}/tarefas/${tarefaId}/time/stop`);
    return response.data;
  }

  async buscarHistoricoTempo(chamadoId, tarefaId) {
    const response = await http.get(`/chamados/${chamadoId}/tarefas/${tarefaId}/time/history`);
    return response.data;
  }

  async listarComentarios(chamadoId, tarefaId) {
    const response = await http.get(`/chamados/${chamadoId}/tarefas/${tarefaId}/comentarios`);
    return response.data;
  }

  async adicionarComentario(chamadoId, tarefaId, dados) {
    const response = await http.post(`/chamados/${chamadoId}/tarefas/${tarefaId}/comentarios`, dados);
    return response.data;
  }
}

export default new ChamadoTarefaService();
