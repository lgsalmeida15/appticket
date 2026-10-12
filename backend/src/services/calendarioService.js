import calendarioRepository from '../repositories/calendarioRepository.js';

/**
 * Service do calendário/Gantt agregado: junta prazos de chamados e tarefas
 * num único array de eventos já normalizado (mesma forma para os dois tipos),
 * para o frontend não precisar fazer 2 chamadas + merge na mão.
 */
class CalendarioService {
  async buscarEventos(inicio, fim, filtros = {}) {
    const [chamados, tarefas] = await Promise.all([
      calendarioRepository.buscarChamadosNoIntervalo(inicio, fim, filtros),
      calendarioRepository.buscarTarefasNoIntervalo(inicio, fim, filtros)
    ]);

    const eventosChamados = chamados.map((c) => {
      const json = c.toJSON ? c.toJSON() : c;
      const hoje = new Date().toISOString().slice(0, 10);
      return {
        tipo: 'chamado',
        id: json.id,
        titulo: json.titulo,
        status: json.status,
        prioridade: json.prioridade,
        grupo_id: json.grupo_id,
        atribuido_a: json.responsavel || null,
        inicio: json.data_abertura,
        fim: json.prazo || json.data_fechamento || hoje
      };
    });

    const eventosTarefas = tarefas.map((t) => {
      const json = t.toJSON ? t.toJSON() : t;
      return {
        tipo: 'tarefa',
        id: json.id,
        chamado_id: json.chamado_id,
        titulo: json.titulo,
        status: json.status,
        grupo_id: json.chamado?.grupo_id || null,
        responsavel: json.responsavel || null,
        inicio: json.data_inicio_prevista || json.data_fim_prevista,
        fim: json.data_fim_prevista || json.data_inicio_prevista
      };
    });

    return { eventos: [...eventosChamados, ...eventosTarefas] };
  }
}

export default new CalendarioService();
