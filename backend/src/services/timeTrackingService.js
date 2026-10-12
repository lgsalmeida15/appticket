import timeTrackingRepository from '../repositories/timeTrackingRepository.js';
import chamadoRepository from '../repositories/chamadoRepository.js';
import chamadoTarefaRepository from '../repositories/chamadoTarefaRepository.js';
import historicoService from './historicoService.js';
import logger from '../utils/logger.js';

/**
 * Service de time tracking
 * Contém lógica de negócio para controle de tempo trabalhado
 */
class TimeTrackingService {
  /**
   * Iniciar contagem de tempo. Se `tarefaId` for informado, a contagem fica
   * vinculada àquela tarefa (chamado_id continua sempre preenchido também).
   * Se o chamado já tiver alguma tarefa ativa, não é mais permitido iniciar
   * contagem "solta" direto no chamado — tem que ser através de uma tarefa
   * (mesmo padrão de ferramentas de mercado: lançar tempo contra o item de
   * trabalho mais granular quando ele existe).
   */
  async iniciarContagem(chamadoId, usuarioId, descricao = null, tarefaId = null) {
    // Verificar se chamado existe
    const chamado = await chamadoRepository.buscarPorId(chamadoId);
    if (!chamado) {
      const error = new Error('Chamado não encontrado');
      error.statusCode = 404;
      error.code = 'CHAMADO_NOT_FOUND';
      throw error;
    }

    let tarefa = null;
    if (tarefaId) {
      tarefa = await chamadoTarefaRepository.buscarPorIdEChamado(tarefaId, chamadoId);
      if (!tarefa) {
        const error = new Error('Tarefa não encontrada neste chamado');
        error.statusCode = 404;
        error.code = 'TAREFA_NOT_FOUND';
        throw error;
      }
      if (tarefa.status === 'cancelada') {
        const error = new Error('Não é possível cronometrar uma tarefa cancelada');
        error.statusCode = 400;
        error.code = 'TAREFA_CANCELADA';
        throw error;
      }
    } else {
      const temTarefaAtiva = await chamadoTarefaRepository.contarAtivasPorChamado(chamadoId) > 0;
      if (temTarefaAtiva) {
        const error = new Error('Este chamado tem tarefas ativas — cronometre pelas tarefas em vez do chamado diretamente');
        error.statusCode = 400;
        error.code = 'TASKS_REQUIRE_TASK_LEVEL_TRACKING';
        throw error;
      }
    }

    // Verificar se já existe contagem ativa para este usuário neste chamado
    // (independente de ser direto no chamado ou em alguma de suas tarefas)
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
      tarefa_id: tarefaId || null,
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
      descricao: tarefaId
        ? `Contagem de tempo iniciada na tarefa "${tarefa.titulo}"`
        : 'Contagem de tempo iniciada',
      dados_anteriores: null,
      dados_novos: { time_tracking_id: registro.id, tarefa_id: tarefaId || null }
    });

    logger.info('Contagem de tempo iniciada', {
      registroId: registro.id,
      chamadoId,
      tarefaId,
      usuarioId
    });

    // Buscar registro completo
    const registroCompleto = await timeTrackingRepository.buscarPorId(registro.id, {
      incluirUsuario: true
    });

    return registroCompleto.toJSON ? registroCompleto.toJSON() : registroCompleto;
  }

  /**
   * Parar contagem de tempo. `tarefaId` opcional: se informado, valida que a
   * contagem ativa do usuário pertence àquela tarefa (evita pausar a tarefa
   * errada quando há mais de um timer disponível na tela).
   */
  async pararContagem(chamadoId, usuarioId, tarefaId = null) {
    // Buscar contagem ativa
    const contagem = await timeTrackingRepository.buscarAtivoPorChamadoEUsuario(chamadoId, usuarioId);

    if (!contagem) {
      const error = new Error('Não há contagem ativa para este chamado');
      error.statusCode = 404;
      error.code = 'NO_ACTIVE_TRACKING';
      throw error;
    }

    if (tarefaId && contagem.tarefa_id !== tarefaId) {
      const error = new Error('A contagem ativa pertence a outra tarefa/chamado');
      error.statusCode = 400;
      error.code = 'TRACKING_TAREFA_MISMATCH';
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

    // Calcular total (apenas sessões finalizadas, mantém compatibilidade)
    const totalMinutos = await timeTrackingRepository.calcularTotalPorChamado(chamadoId);

    // Calcular total incluindo sessão(ões) ativa(s) no momento da consulta
    const comAtivo = await timeTrackingRepository.calcularTotalComAtivoPorChamado(chamadoId);

    return {
      historico: registros.map(r => r.toJSON ? r.toJSON() : r),
      total_minutos: totalMinutos,
      total_horas: (totalMinutos / 60).toFixed(2),
      total_minutos_ao_vivo: comAtivo.total_minutos,
      total_horas_ao_vivo: (comAtivo.total_minutos / 60).toFixed(2),
      tem_sessao_ativa: comAtivo.tem_sessao_ativa,
      sessoes_ativas: comAtivo.sessoes_ativas
    };
  }

  /**
   * Buscar totais de tempo (com sessão ativa incluída) para vários chamados,
   * já incluindo se cada um tem tarefa ativa (usado para decidir se o
   * play/pause direto do chamado deve ficar disponível na UI).
   */
  async buscarTotaisPorChamados(chamadoIds) {
    const totais = await timeTrackingRepository.calcularTotaisPorChamados(chamadoIds);
    const tarefasAtivas = await chamadoTarefaRepository.contarAtivasPorChamados(chamadoIds);

    for (const id of chamadoIds) {
      if (totais[id]) {
        totais[id].tem_tarefas_ativas = (tarefasAtivas[id] || 0) > 0;
      }
    }

    return totais;
  }

  /**
   * Buscar histórico de time tracking de uma tarefa específica
   */
  async buscarHistoricoPorTarefa(chamadoId, tarefaId) {
    const tarefa = await chamadoTarefaRepository.buscarPorIdEChamado(tarefaId, chamadoId);
    if (!tarefa) {
      const error = new Error('Tarefa não encontrada neste chamado');
      error.statusCode = 404;
      error.code = 'TAREFA_NOT_FOUND';
      throw error;
    }

    const registros = await timeTrackingRepository.buscarTodosPorTarefa(tarefaId);
    const totalMinutos = await timeTrackingRepository.calcularTotalPorTarefa(tarefaId);
    const comAtivo = await timeTrackingRepository.calcularTotalComAtivoPorTarefa(tarefaId);

    return {
      historico: registros.map((r) => (r.toJSON ? r.toJSON() : r)),
      total_minutos: totalMinutos,
      total_horas: (totalMinutos / 60).toFixed(2),
      total_minutos_ao_vivo: comAtivo.total_minutos,
      total_horas_ao_vivo: (comAtivo.total_minutos / 60).toFixed(2),
      tem_sessao_ativa: comAtivo.tem_sessao_ativa,
      sessoes_ativas: comAtivo.sessoes_ativas
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
   * Finalizar todas as contagens ativas de um chamado (de qualquer usuário).
   * Usado quando o chamado sai do status "em_andamento" por qualquer caminho
   * (edição, fechamento, cancelamento), não só pelo botão de pausar.
   */
  async finalizarTodasAtivas(chamadoId) {
    const ativas = await timeTrackingRepository.buscarTodosAtivosPorChamado(chamadoId);
    const finalizados = [];

    for (const ativa of ativas) {
      const registro = await timeTrackingRepository.finalizar(ativa.id, new Date());
      finalizados.push(registro);

      await historicoService.criar({
        chamado_id: chamadoId,
        usuario_id: ativa.usuario_id,
        acao: 'edicao',
        descricao: `Contagem de tempo finalizada automaticamente (saiu de "em_andamento"). Duração: ${registro.duracao_minutos} minutos`,
        dados_anteriores: null,
        dados_novos: { time_tracking_id: registro.id, duracao_minutos: registro.duracao_minutos }
      });

      logger.info('Contagem de tempo finalizada automaticamente por mudança de status', {
        registroId: registro.id,
        chamadoId,
        usuarioId: ativa.usuario_id,
        duracaoMinutos: registro.duracao_minutos
      });
    }

    return finalizados;
  }

  /**
   * Sincroniza o time tracking de um chamado com uma mudança de status,
   * qualquer que seja a origem dela (edição, fechamento, reabertura, cancelamento).
   * - Entrando em "em_andamento": inicia contagem para o responsável (idempotente).
   * - Saindo de "em_andamento": finaliza todas as contagens ativas do chamado.
   */
  async sincronizarPorMudancaStatus(chamadoId, statusAnterior, statusNovo, usuarioResponsavelId) {
    if (!statusNovo || statusAnterior === statusNovo) return;

    const entrouEmAndamento = statusNovo === 'em_andamento' && statusAnterior !== 'em_andamento';
    const saiuDeEmAndamento = statusAnterior === 'em_andamento' && statusNovo !== 'em_andamento';

    if (entrouEmAndamento && usuarioResponsavelId) {
      try {
        await this.iniciarContagem(chamadoId, usuarioResponsavelId, 'Iniciado automaticamente por mudança de status');
      } catch (error) {
        // Casos esperados, não são erro real aqui:
        // - já existe contagem ativa para esse usuário neste chamado
        // - chamado tem tarefas ativas (o trabalho deve ser cronometrado por elas, não direto)
        const codigosEsperados = ['TRACKING_ALREADY_ACTIVE', 'TASKS_REQUIRE_TASK_LEVEL_TRACKING'];
        if (!codigosEsperados.includes(error.code)) {
          logger.error('Erro ao iniciar contagem automática por mudança de status', {
            chamadoId,
            usuarioResponsavelId,
            error: error.message
          });
        }
      }
    }

    if (saiuDeEmAndamento) {
      try {
        await this.finalizarTodasAtivas(chamadoId);
      } catch (error) {
        logger.error('Erro ao finalizar contagens automáticas por mudança de status', {
          chamadoId,
          error: error.message
        });
      }
    }
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

