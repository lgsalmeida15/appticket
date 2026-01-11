import chamadoFechamentoRepository from '../repositories/chamadoFechamentoRepository.js';
import solutionCategoryRepository from '../repositories/solutionCategoryRepository.js';
import chamadoRepository from '../repositories/chamadoRepository.js';
import chamadoAssociacaoService from './chamadoAssociacaoService.js';
import auditoriaService from './auditoriaService.js';
import eventEmitter from '../utils/EventEmitter.js';
import logger from '../utils/logger.js';
import AppError from '../utils/AppError.js';

class ChamadoFechamentoService {
  /**
   * Fechar chamado
   * @param {number} chamadoId
   * @param {Object} dados
   * @param {number} usuarioId
   * @param {Object} req - Request object para auditoria
   * @returns {Promise<Object>}
   */
  async fecharChamado(chamadoId, dados, usuarioId, req = null) {
    const { 
      data_hora_resolucao, 
      categoria_solucao_id, 
      descricao_fechamento 
    } = dados;

    // Validar campos obrigatórios
    if (!data_hora_resolucao || !categoria_solucao_id || !descricao_fechamento) {
      throw new AppError('Todos os campos são obrigatórios para fechar o chamado', 400);
    }

    // Validar descrição mínima
    if (descricao_fechamento.trim().length < 10) {
      throw new AppError('A descrição do fechamento deve ter no mínimo 10 caracteres', 400);
    }

    // Buscar chamado
    const chamado = await chamadoRepository.buscarPorId(chamadoId, {
      include: []
    });

    if (!chamado) {
      throw new AppError('Chamado não encontrado', 404);
    }

    // Verificar se chamado já está fechado
    if (chamado.status_fechamento === 'fechado') {
      throw new AppError('Este chamado já está fechado', 400);
    }

    // Verificar se status permite fechamento
    const statusNaoPermitidos = ['cancelado'];
    if (statusNaoPermitidos.includes(chamado.status)) {
      throw new AppError(`Não é possível fechar chamados com status "${chamado.status}"`, 400);
    }

    // Validar: se chamado é pai, verificar se todos os filhos estão encerrados
    const temFilhos = await chamadoRepository.temFilhos(chamadoId);
    if (temFilhos) {
      const verificacao = await chamadoAssociacaoService.verificarPodeEncerrarPai(chamadoId);
      if (!verificacao.podeEncerrar) {
        throw new AppError(
          verificacao.motivo,
          400,
          'FILHOS_ATIVOS_BLOQUEANDO',
          {
            filhosAtivos: verificacao.filhosAtivos
          }
        );
      }
    }

    // Verificar se já existe fechamento
    const fechamentoExistente = await chamadoFechamentoRepository.exists(chamadoId);
    if (fechamentoExistente) {
      throw new AppError('Este chamado já possui um registro de fechamento', 409);
    }

    // Verificar se categoria existe e está ativa
    const categoria = await solutionCategoryRepository.findById(categoria_solucao_id);
    if (!categoria) {
      throw new AppError('Categoria de solução não encontrada', 404);
    }
    if (!categoria.ativo) {
      throw new AppError('Esta categoria de solução está inativa', 400);
    }

    // Validar data de resolução
    const dataResolucao = new Date(data_hora_resolucao);
    const dataAbertura = new Date(chamado.data_abertura);
    const agora = new Date();

    if (dataResolucao < dataAbertura) {
      throw new AppError('A data de resolução não pode ser anterior à data de abertura do chamado', 400);
    }

    if (dataResolucao > agora) {
      throw new AppError('A data de resolução não pode ser futura', 400);
    }

    // Criar fechamento
    const fechamento = await chamadoFechamentoRepository.create({
      chamado_id: chamadoId,
      data_hora_resolucao: dataResolucao,
      categoria_solucao_id,
      descricao_fechamento: descricao_fechamento.trim(),
      usuario_fechamento_id: usuarioId
    });

    // Guardar dados anteriores para webhook e auditoria
    const dadosAnteriores = {
      status: chamado.status,
      status_fechamento: chamado.status_fechamento,
      data_fechamento: chamado.data_fechamento
    };

    // Atualizar status do chamado
    await chamadoRepository.atualizar(chamadoId, {
      status_fechamento: 'fechado',
      data_fechamento: dataResolucao,
      status: 'fechado' // Também atualiza o status principal
    });

    // Registrar auditoria
    await auditoriaService.registrarAtualizacao(
      usuarioId,
      'chamado',
      chamadoId,
      dadosAnteriores,
      {
        status: 'fechado',
        status_fechamento: 'fechado',
        categoria_solucao: {
          id: categoria.id,
          nivel_1: categoria.categoria_nivel_1,
          nivel_2: categoria.categoria_nivel_2,
          nivel_3: categoria.categoria_nivel_3
        },
        descricao_fechamento: descricao_fechamento.trim(),
        data_hora_resolucao: dataResolucao,
        usuario_fechamento_id: usuarioId
      },
      req
    );

    // Buscar chamado atualizado completo para webhook
    const chamadoAtualizado = await chamadoRepository.buscarPorId(chamadoId, {
      incluirCriador: true,
      incluirResponsavel: true,
      incluirGrupo: true,
      incluirGrupoExecutor: true,
      incluirPai: true,
      incluirFilhos: true
    });

    // Emitir evento para disparar webhook (webhooks serão disparados pelos event handlers)
    eventEmitter.emit('chamado:atualizado', {
      chamado: chamadoAtualizado,
      dadosAnteriores,
      req
    }).catch(err => {
      logger.error('Erro ao emitir evento de atualização ao fechar chamado', {
        chamadoId,
        error: err.message
      });
    });

    logger.info('Chamado fechado', {
      chamadoId,
      usuarioId,
      categoriaSolucaoId: categoria_solucao_id
    });

    return fechamento;
  }

  /**
   * Buscar fechamento de um chamado
   * @param {number} chamadoId
   * @returns {Promise<Object|null>}
   */
  async buscarPorChamado(chamadoId) {
    // Verificar se chamado existe
    const chamado = await chamadoRepository.buscarPorId(chamadoId);
    if (!chamado) {
      throw new AppError('Chamado não encontrado', 404);
    }

    return await chamadoFechamentoRepository.findByChamadoId(chamadoId);
  }

  /**
   * Buscar fechamentos por categoria
   * @param {number} categoriaId
   * @returns {Promise<Array>}
   */
  async buscarPorCategoria(categoriaId) {
    return await chamadoFechamentoRepository.findByCategoria(categoriaId);
  }

  /**
   * Buscar fechamentos por usuário
   * @param {number} usuarioId
   * @returns {Promise<Array>}
   */
  async buscarPorUsuario(usuarioId) {
    return await chamadoFechamentoRepository.findByUsuario(usuarioId);
  }

  /**
   * Verificar se chamado pode ser fechado
   * @param {number} chamadoId
   * @returns {Promise<Object>}
   */
  async verificarPodeFechamento(chamadoId) {
    const chamado = await chamadoRepository.buscarPorId(chamadoId);
    
    if (!chamado) {
      return {
        pode_fechar: false,
        motivo: 'Chamado não encontrado',
        filhosAtivos: []
      };
    }

    if (chamado.status_fechamento === 'fechado') {
      return {
        pode_fechar: false,
        motivo: 'Chamado já está fechado',
        filhosAtivos: []
      };
    }

    const statusNaoPermitidos = ['cancelado'];
    if (statusNaoPermitidos.includes(chamado.status)) {
      return {
        pode_fechar: false,
        motivo: `Chamados com status "${chamado.status}" não podem ser fechados`,
        filhosAtivos: []
      };
    }

    // Verificar se é pai e tem filhos ativos
    const temFilhos = await chamadoRepository.temFilhos(chamadoId);
    if (temFilhos) {
      const verificacao = await chamadoAssociacaoService.verificarPodeEncerrarPai(chamadoId);
      if (!verificacao.podeEncerrar) {
        return {
          pode_fechar: false,
          motivo: verificacao.motivo,
          filhosAtivos: verificacao.filhosAtivos
        };
      }
    }

    return {
      pode_fechar: true,
      motivo: null,
      filhosAtivos: []
    };
  }

  /**
   * Reabrir chamado fechado (apenas admin)
   * @param {number} chamadoId
   * @param {number} usuarioId
   * @param {Object} req
   * @returns {Promise<Object>}
   */
  async reabrirChamado(chamadoId, usuarioId, req = null) {
    // Buscar chamado
    const chamado = await chamadoRepository.buscarPorId(chamadoId);

    if (!chamado) {
      throw new AppError('Chamado não encontrado', 404);
    }

    // Verificar se chamado está fechado
    if (chamado.status_fechamento !== 'fechado') {
      throw new AppError('Este chamado não está fechado', 400);
    }

    // Buscar dados do fechamento antes de deletar
    const fechamento = await chamadoFechamentoRepository.findByChamadoId(chamadoId);
    
    if (!fechamento) {
      throw new AppError('Registro de fechamento não encontrado', 404);
    }

    // Guardar dados do fechamento para auditoria
    const dadosFechamento = {
      categoria_solucao: {
        id: fechamento.categoria_solucao?.id,
        nivel_1: fechamento.categoria_solucao?.categoria_nivel_1,
        nivel_2: fechamento.categoria_solucao?.categoria_nivel_2,
        nivel_3: fechamento.categoria_solucao?.categoria_nivel_3
      },
      descricao_fechamento: fechamento.descricao_fechamento,
      data_hora_resolucao: fechamento.data_hora_resolucao,
      usuario_fechamento: {
        id: fechamento.usuario_fechamento?.id,
        nome: fechamento.usuario_fechamento?.nome
      },
      data_fechamento: fechamento.created_at
    };

    // Remover registro de fechamento
    await chamadoFechamentoRepository.model.destroy({
      where: { chamado_id: chamadoId }
    });

    // Atualizar status do chamado para em_andamento
    await chamadoRepository.atualizar(chamadoId, {
      status_fechamento: 'aberto',
      data_fechamento: null,
      status: 'em_andamento'
    });

    // Registrar auditoria da reabertura
    await auditoriaService.registrarAtualizacao(
      usuarioId,
      'chamado',
      chamadoId,
      {
        status: 'fechado',
        status_fechamento: 'fechado',
        fechamento: dadosFechamento
      },
      {
        status: 'em_andamento',
        status_fechamento: 'aberto',
        acao: 'reabertura',
        motivo: 'Chamado reaberto por administrador'
      },
      req
    );

    return {
      message: 'Chamado reaberto com sucesso',
      chamadoId,
      status_anterior: 'fechado',
      status_novo: 'em_andamento',
      reaberto_por: usuarioId,
      fechamento_removido: dadosFechamento
    };
  }
}

export default new ChamadoFechamentoService();

