import historicoRepository from '../repositories/historicoRepository.js';
import logger from '../utils/logger.js';

/**
 * Service de histórico
 * Contém lógica de negócio para registro de histórico de ações
 */
class HistoricoService {
  /**
   * Criar registro de histórico
   */
  async criar(dados) {
    const { chamado_id, usuario_id, acao, descricao, dados_anteriores, dados_novos } = dados;

    const historico = await historicoRepository.criar({
      chamado_id,
      usuario_id,
      acao,
      descricao,
      dados_anteriores,
      dados_novos,
      data_hora: new Date()
    });

    logger.debug('Histórico criado', {
      historicoId: historico.id,
      chamadoId: chamado_id,
      acao
    });

    return historico.toJSON ? historico.toJSON() : historico;
  }

  /**
   * Registrar criação de chamado
   */
  async registrarCriacao(chamadoId, usuarioId, dados) {
    return await this.criar({
      chamado_id: chamadoId,
      usuario_id: usuarioId,
      acao: 'criacao',
      descricao: `Chamado criado`,
      dados_anteriores: null,
      dados_novos: dados
    });
  }

  /**
   * Registrar atualização de chamado
   */
  async registrarAtualizacao(chamadoId, usuarioId, dadosAnteriores, dadosNovos, tipoAtualizacao = 'edicao') {
    let descricao = 'Chamado editado';
    
    if (tipoAtualizacao === 'mudanca_status') {
      descricao = `Status alterado de "${dadosAnteriores.status}" para "${dadosNovos.status}"`;
    } else if (tipoAtualizacao === 'mudanca_prioridade') {
      descricao = `Prioridade alterada de "${dadosAnteriores.prioridade}" para "${dadosNovos.prioridade}"`;
    } else if (tipoAtualizacao === 'atribuicao') {
      descricao = `Chamado atribuído`;
    }

    return await this.criar({
      chamado_id: chamadoId,
      usuario_id: usuarioId,
      acao: tipoAtualizacao,
      descricao,
      dados_anteriores: dadosAnteriores,
      dados_novos: dadosNovos
    });
  }

  /**
   * Registrar adição de comentário
   */
  async registrarComentario(chamadoId, usuarioId) {
    return await this.criar({
      chamado_id: chamadoId,
      usuario_id: usuarioId,
      acao: 'adicao_comentario',
      descricao: 'Comentário adicionado',
      dados_anteriores: null,
      dados_novos: null
    });
  }

  /**
   * Registrar fechamento de chamado
   */
  async registrarFechamento(chamadoId, usuarioId, dadosAnteriores) {
    return await this.criar({
      chamado_id: chamadoId,
      usuario_id: usuarioId,
      acao: 'fechamento',
      descricao: 'Chamado fechado',
      dados_anteriores: dadosAnteriores,
      dados_novos: { status: 'fechado' }
    });
  }

  /**
   * Registrar cancelamento de chamado
   */
  async registrarCancelamento(chamadoId, usuarioId, dadosAnteriores) {
    return await this.criar({
      chamado_id: chamadoId,
      usuario_id: usuarioId,
      acao: 'cancelamento',
      descricao: 'Chamado cancelado',
      dados_anteriores: dadosAnteriores,
      dados_novos: { status: 'cancelado' }
    });
  }

  /**
   * Buscar histórico de um chamado
   */
  async buscarPorChamado(chamadoId, opcoes = {}) {
    const historicos = await historicoRepository.listarPorChamado(chamadoId, opcoes);
    return historicos.map(h => h.toJSON ? h.toJSON() : h);
  }

  /**
   * Buscar histórico por usuário
   */
  async buscarPorUsuario(usuarioId, opcoes = {}) {
    const historicos = await historicoRepository.buscarPorUsuario(usuarioId, opcoes);
    return historicos.map(h => h.toJSON ? h.toJSON() : h);
  }
}

export default new HistoricoService();

