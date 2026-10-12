import http from '../api/http.js';

/**
 * Service do calendário/Agenda — busca o array agregado de eventos
 * (chamados + tarefas) para um intervalo de datas.
 */
class CalendarioService {
  async buscarEventos({ inicio, fim, grupoId = null, agenteId = null }) {
    const params = { inicio, fim };
    if (grupoId) params.grupo_id = grupoId;
    if (agenteId) params.agente_id = agenteId;

    const response = await http.get('/calendario', { params });
    return response.data;
  }
}

export default new CalendarioService();
