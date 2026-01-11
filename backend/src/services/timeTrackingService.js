import timeTrackingRepository from '../repositories/timeTrackingRepository.js';
import chamadoRepository from '../repositories/chamadoRepository.js';
import historicoService from './historicoService.js';
import logger from '../utils/logger.js';

/**
 * Service de time tracking
 * Contém lógica de negócio para controle de tempo trabalhado
 */
class TimeTrackingService {
  /**
   * Iniciar contagem de tempo
   */
  async iniciarContagem(chamadoId, usuarioId, descricao = null) {
    // Verificar se chamado existe
    const chamado = await chamadoRepository.buscarPorId(chamadoId);
    if (!chamado) {
      const error = new Error('Chamado não encontrado');
      error.statusCode = 404;
      error.code = 'CHAMADO_NOT_FOUND';
      throw error;
    }

    // Verificar se já existe contagem ativa para este usuário neste chamado
    const contagemAtiva = await timeTrackingRepository.buscarAtivoPorChamadoEUsuario(chamadoId, usuarioId);
    if (contagemAtiva) {
      const error = new Error('Já existe uma contagem ativa para este chamado');
      error.statusCode = 400;
      error.code = 'TRACKING_ALREADY_ACTIVE';
      throw error;
    }

    // Verificar se usuário tem contagem ativa em outro chamado
    const contagemAtivaOutroChamado = await timeTrackingRepository.buscarContagemAtivaDoUsuario(usuarioId);
    if (contagemAtivaOutroChamado) {
      logger.warn('Usuário iniciou nova contagem mas já tem uma ativa em outro chamado', {
        usuarioId,
        chamadoAtivo: contagemAtivaOutroChamado.chamado_id,
        novoChamado: chamadoId
      });
      // Não impedir, apenas alertar via log
    }

    // Criar nova contagem
    const registro = await timeTrackingRepository.criar({
      chamado_id: chamadoId,
      usuario_id: usuarioId,
      inicio: new Date(),
      fim: null,
      descricao
    });

    // Registrar no histórico do chamado
    await historicoService.criar({
      chamado_id: chamadoId,
      usuario_id: usuarioId,
      acao: 'edicao',
      descricao: `Contagem de tempo iniciada`,
      dados_anteriores: null,
      dados_novos: { time_tracking_id: registro.id }
    });

    logger.info('Contagem de tempo iniciada', {
      registroId: registro.id,
      chamadoId,
      usuarioId
    });

    // Buscar registro completo
    const registroCompleto = await timeTrackingRepository.buscarPorId(registro.id, {
      incluirUsuario: true
    });

    return registroCompleto.toJSON ? registroCompleto.toJSON() : registroCompleto;
  }

  /**
   * Parar contagem de tempo
   */
  async pararContagem(chamadoId, usuarioId) {
    // Buscar contagem ativa
    const contagem = await timeTrackingRepository.buscarAtivoPorChamadoEUsuario(chamadoId, usuarioId);
    
    if (!contagem) {
      const error = new Error('Não há contagem ativa para este chamado');
      error.statusCode = 404;
      error.code = 'NO_ACTIVE_TRACKING';
      throw error;
    }

    // Verificar se o usuário pode parar esta contagem
    if (contagem.usuario_id !== usuarioId) {
      const error = new Error('Você não pode parar a contagem de outro usuário');
      error.statusCode = 403;
      error.code = 'FORBIDDEN';
      throw error;
    }

    // Finalizar contagem
    const registro = await timeTrackingRepository.finalizar(contagem.id, new Date());

    // Registrar no histórico do chamado
    await historicoService.criar({
      chamado_id: chamadoId,
      usuario_id: usuarioId,
      acao: 'edicao',
      descricao: `Contagem de tempo parada. Duração: ${registro.duracao_minutos} minutos`,
      dados_anteriores: null,
      dados_novos: { 
        time_tracking_id: registro.id,
        duracao_minutos: registro.duracao_minutos
      }
    });

    logger.info('Contagem de tempo parada', {
      registroId: registro.id,
      chamadoId,
      usuarioId,
      duracaoMinutos: registro.duracao_minutos
    });

    // Buscar registro completo
    const registroCompleto = await timeTrackingRepository.buscarPorId(registro.id, {
      incluirUsuario: true
    });

    return registroCompleto.toJSON ? registroCompleto.toJSON() : registroCompleto;
  }

  /**
   * Buscar histórico de time tracking de um chamado
   */
  async buscarHistoricoPorChamado(chamadoId) {
    // Verificar se chamado existe
    const chamado = await chamadoRepository.buscarPorId(chamadoId);
    if (!chamado) {
      const error = new Error('Chamado não encontrado');
      error.statusCode = 404;
      error.code = 'CHAMADO_NOT_FOUND';
      throw error;
    }

    const registros = await timeTrackingRepository.buscarTodosPorChamado(chamadoId);
    
    // Calcular total
    const totalMinutos = await timeTrackingRepository.calcularTotalPorChamado(chamadoId);

    return {
      historico: registros.map(r => r.toJSON ? r.toJSON() : r),
      total_minutos: totalMinutos,
      total_horas: (totalMinutos / 60).toFixed(2)
    };
  }

  /**
   * Buscar resumo de tempo trabalhado por usuário
   */
  async buscarResumoPorUsuario(usuarioId, opcoes = {}) {
    const { dataInicio, dataFim } = opcoes;

    const registros = await timeTrackingRepository.buscarTodosPorUsuario(usuarioId, {
      dataInicio,
      dataFim,
      apenasAtivos: false
    });

    const totalMinutos = await timeTrackingRepository.calcularTotalPorUsuario(usuarioId, {
      dataInicio,
      dataFim
    });

    return {
      registros: registros.map(r => r.toJSON ? r.toJSON() : r),
      total_minutos: totalMinutos,
      total_horas: (totalMinutos / 60).toFixed(2),
      periodo: {
        inicio: dataInicio || null,
        fim: dataFim || null
      }
    };
  }

  /**
   * Buscar contagem ativa do usuário
   */
  async buscarContagemAtiva(usuarioId) {
    const contagem = await timeTrackingRepository.buscarContagemAtivaDoUsuario(usuarioId);
    
    if (!contagem) {
      return null;
    }

    // Calcular duração atual (se ainda está ativa)
    const inicio = new Date(contagem.inicio);
    const agora = new Date();
    const duracaoMs = agora.getTime() - inicio.getTime();
    const duracaoMinutos = Math.floor(duracaoMs / (1000 * 60));

    return {
      ...(contagem.toJSON ? contagem.toJSON() : contagem),
      duracao_atual_minutos: duracaoMinutos,
      duracao_atual_horas: (duracaoMinutos / 60).toFixed(2)
    };
  }
}

export default new TimeTrackingService();

