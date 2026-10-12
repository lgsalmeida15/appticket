import chamadoTarefaRepository from '../repositories/chamadoTarefaRepository.js';
import chamadoRepository from '../repositories/chamadoRepository.js';
import eventEmitter from '../utils/EventEmitter.js';
import logger from '../utils/logger.js';

/**
 * Service de tarefas de chamado
 * Contém lógica de negócio para as tarefas dinâmicas dentro de um chamado
 */
class ChamadoTarefaService {
  async _buscarChamadoOuFalhar(chamadoId) {
    const chamado = await chamadoRepository.buscarPorId(chamadoId);
    if (!chamado) {
      const error = new Error('Chamado não encontrado');
      error.statusCode = 404;
      error.code = 'CHAMADO_NOT_FOUND';
      throw error;
    }
    return chamado;
  }

  _verificarChamadoNaoFechado(chamado) {
    if (chamado.status_fechamento === 'fechado') {
      const error = new Error('Não é possível criar ou alterar tarefas em chamados fechados');
      error.statusCode = 400;
      error.code = 'CHAMADO_FECHADO';
      throw error;
    }
  }

  async criar(chamadoId, usuarioId, dados) {
    const chamado = await this._buscarChamadoOuFalhar(chamadoId);
    this._verificarChamadoNaoFechado(chamado);

    const tarefa = await chamadoTarefaRepository.criar({
      chamado_id: chamadoId,
      titulo: dados.titulo,
      descricao: dados.descricao || null,
      responsavel_id: dados.responsavel_id || null,
      data_inicio_prevista: dados.data_inicio_prevista || null,
      data_fim_prevista: dados.data_fim_prevista || null,
      criado_por: usuarioId
    });

    logger.info('Tarefa de chamado criada', { tarefaId: tarefa.id, chamadoId, usuarioId });

    const tarefaCompleta = await chamadoTarefaRepository.buscarPorId(tarefa.id);

    eventEmitter.emit('tarefa:criada', { tarefa: tarefaCompleta, chamado }).catch((err) => {
      logger.error('Erro ao emitir evento de tarefa criada', { tarefaId: tarefa.id, error: err.message });
    });

    return tarefaCompleta.toJSON ? tarefaCompleta.toJSON() : tarefaCompleta;
  }

  async listarPorChamado(chamadoId) {
    await this._buscarChamadoOuFalhar(chamadoId);
    const tarefas = await chamadoTarefaRepository.buscarPorChamado(chamadoId);
    return tarefas.map((t) => (t.toJSON ? t.toJSON() : t));
  }

  async buscarPorId(chamadoId, tarefaId) {
    const tarefa = await chamadoTarefaRepository.buscarPorIdEChamado(tarefaId, chamadoId);
    if (!tarefa) {
      const error = new Error('Tarefa não encontrada');
      error.statusCode = 404;
      error.code = 'TAREFA_NOT_FOUND';
      throw error;
    }
    return tarefa.toJSON ? tarefa.toJSON() : tarefa;
  }

  async atualizar(chamadoId, tarefaId, dados) {
    const chamado = await this._buscarChamadoOuFalhar(chamadoId);
    this._verificarChamadoNaoFechado(chamado);

    const tarefa = await chamadoTarefaRepository.buscarPorIdEChamado(tarefaId, chamadoId);
    if (!tarefa) {
      const error = new Error('Tarefa não encontrada');
      error.statusCode = 404;
      error.code = 'TAREFA_NOT_FOUND';
      throw error;
    }

    const dadosAtualizacao = { ...dados };
    if (dados.status === 'concluida' && tarefa.status !== 'concluida') {
      dadosAtualizacao.concluida_em = new Date();
    }

    const tarefaAtualizada = await chamadoTarefaRepository.atualizar(tarefaId, dadosAtualizacao);

    logger.info('Tarefa de chamado atualizada', { tarefaId, chamadoId });

    const tarefaCompleta = await chamadoTarefaRepository.buscarPorId(tarefaId);

    eventEmitter.emit('tarefa:atualizada', { tarefa: tarefaCompleta, chamado }).catch((err) => {
      logger.error('Erro ao emitir evento de tarefa atualizada', { tarefaId, error: err.message });
    });

    return tarefaAtualizada.toJSON ? tarefaAtualizada.toJSON() : tarefaAtualizada;
  }

  /**
   * "Excluir" tarefa = cancelar (nunca hard delete, para não sumir horas já
   * contabilizadas no chamado pai via ticket_time_tracking)
   */
  async cancelar(chamadoId, tarefaId) {
    return await this.atualizar(chamadoId, tarefaId, { status: 'cancelada' });
  }

  async contarAtivasPorChamado(chamadoId) {
    return await chamadoTarefaRepository.contarAtivasPorChamado(chamadoId);
  }

  async contarAtivasPorChamados(chamadoIds) {
    return await chamadoTarefaRepository.contarAtivasPorChamados(chamadoIds);
  }

  async temTarefaAtiva(chamadoId) {
    const total = await chamadoTarefaRepository.contarAtivasPorChamado(chamadoId);
    return total > 0;
  }
}

export default new ChamadoTarefaService();
