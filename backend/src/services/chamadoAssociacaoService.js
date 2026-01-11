import chamadoRepository from '../repositories/chamadoRepository.js';
import historicoService from './historicoService.js';
import auditoriaService from './auditoriaService.js';
import AppError from '../utils/AppError.js';
import logger from '../utils/logger.js';

/**
 * Service para gerenciar associações entre chamados (Parent/Child)
 * Implementa todas as regras de negócio relacionadas à associação
 */
class ChamadoAssociacaoService {
  /**
   * Associar um chamado filho a um chamado pai
   * @param {number} chamadoPaiId - ID do chamado pai
   * @param {number} chamadoFilhoId - ID do chamado filho
   * @param {number} usuarioId - ID do usuário que está fazendo a associação
   * @param {Object} req - Request object para auditoria
   * @returns {Promise<Object>}
   */
  async associarFilho(chamadoPaiId, chamadoFilhoId, usuarioId, req = null) {
    // Validar: não pode associar um chamado a ele mesmo
    if (chamadoPaiId === chamadoFilhoId) {
      throw new AppError(
        'Não é possível associar um chamado a ele mesmo',
        400,
        'ASSOCIACAO_INVALIDA'
      );
    }

    // Buscar chamado pai
    const chamadoPai = await chamadoRepository.buscarPorId(chamadoPaiId);
    if (!chamadoPai) {
      throw new AppError('Chamado pai não encontrado', 404, 'CHAMADO_PAI_NOT_FOUND');
    }

    // Validar: chamado pai não pode ser filho de outro (verificar se já é filho)
    const paiTemPai = await chamadoRepository.temPai(chamadoPaiId);
    if (paiTemPai) {
      throw new AppError(
        'Chamados pais não podem ser associados como filhos',
        400,
        'PAI_NAO_PODE_SER_FILHO'
      );
    }

    // Buscar chamado filho
    const chamadoFilho = await chamadoRepository.buscarPorId(chamadoFilhoId);
    if (!chamadoFilho) {
      throw new AppError('Chamado filho não encontrado', 404, 'CHAMADO_FILHO_NOT_FOUND');
    }

    // Validar: chamado filho não pode já ter pai
    const filhoTemPai = await chamadoRepository.temPai(chamadoFilhoId);
    if (filhoTemPai) {
      throw new AppError(
        'Este chamado já está associado a outro chamado pai',
        409,
        'FILHO_JA_TEM_PAI'
      );
    }

    // Validar: chamado filho não pode ser pai (ter filhos)
    const filhoTemFilhos = await chamadoRepository.temFilhos(chamadoFilhoId);
    if (filhoTemFilhos) {
      throw new AppError(
        'Chamados pais não podem ser associados como filhos',
        400,
        'FILHO_NAO_PODE_SER_PAI'
      );
    }

    // Guardar dados anteriores para histórico/auditoria
    const dadosAnteriores = {
      chamado_pai_id: chamadoFilho.chamado_pai_id || null
    };

    // Realizar associação
    await chamadoRepository.atualizar(chamadoFilhoId, {
      chamado_pai_id: chamadoPaiId
    });

    // Registrar no histórico do chamado filho
    await historicoService.criar({
      chamado_id: chamadoFilhoId,
      usuario_id: usuarioId,
      acao: 'associacao_filho',
      descricao: `Associado ao chamado pai #${chamadoPaiId}: ${chamadoPai.titulo}`,
      dados_anteriores: dadosAnteriores,
      dados_novos: {
        chamado_pai_id: chamadoPaiId,
        chamado_pai_titulo: chamadoPai.titulo
      }
    });

    // Registrar no histórico do chamado pai
    await historicoService.criar({
      chamado_id: chamadoPaiId,
      usuario_id: usuarioId,
      acao: 'associacao_filho',
      descricao: `Chamado filho #${chamadoFilhoId}: ${chamadoFilho.titulo} foi associado`,
      dados_anteriores: null,
      dados_novos: {
        chamado_filho_id: chamadoFilhoId,
        chamado_filho_titulo: chamadoFilho.titulo
      }
    });

    // Registrar na auditoria
    await auditoriaService.registrarAtualizacao(
      usuarioId,
      'chamado',
      chamadoFilhoId,
      dadosAnteriores,
      {
        chamado_pai_id: chamadoPaiId,
        acao: 'associacao_filho'
      },
      req
    );

    logger.info('Chamado associado', {
      chamadoPaiId,
      chamadoFilhoId,
      usuarioId
    });

    // Buscar chamado filho atualizado com relacionamentos
    const chamadoFilhoAtualizado = await chamadoRepository.buscarPorId(chamadoFilhoId, {
      incluirPai: true
    });

    return {
      message: 'Chamado associado com sucesso',
      chamado_pai: {
        id: chamadoPai.id,
        titulo: chamadoPai.titulo
      },
      chamado_filho: chamadoFilhoAtualizado.toJSON ? chamadoFilhoAtualizado.toJSON() : chamadoFilhoAtualizado
    };
  }

  /**
   * Desassociar um chamado filho do seu pai
   * @param {number} chamadoFilhoId - ID do chamado filho
   * @param {number} usuarioId - ID do usuário que está fazendo a desassociação
   * @param {Object} req - Request object para auditoria
   * @returns {Promise<Object>}
   */
  async desassociarFilho(chamadoFilhoId, usuarioId, req = null) {
    // Buscar chamado filho
    const chamadoFilho = await chamadoRepository.buscarPorId(chamadoFilhoId, {
      incluirPai: true
    });

    if (!chamadoFilho) {
      throw new AppError('Chamado não encontrado', 404, 'CHAMADO_NOT_FOUND');
    }

    // Validar: chamado deve ter pai
    if (!chamadoFilho.chamado_pai_id) {
      throw new AppError(
        'Este chamado não possui um chamado pai associado',
        400,
        'SEM_PAI'
      );
    }

    const chamadoPaiId = chamadoFilho.chamado_pai_id;
    const chamadoPai = chamadoFilho.pai || await chamadoRepository.buscarPorId(chamadoPaiId);

    // Guardar dados anteriores para histórico/auditoria
    const dadosAnteriores = {
      chamado_pai_id: chamadoPaiId,
      chamado_pai_titulo: chamadoPai?.titulo || 'N/A'
    };

    // Realizar desassociação
    await chamadoRepository.atualizar(chamadoFilhoId, {
      chamado_pai_id: null
    });

    // Registrar no histórico do chamado filho
    await historicoService.criar({
      chamado_id: chamadoFilhoId,
      usuario_id: usuarioId,
      acao: 'desassociacao_filho',
      descricao: `Desassociado do chamado pai #${chamadoPaiId}`,
      dados_anteriores: dadosAnteriores,
      dados_novos: {
        chamado_pai_id: null
      }
    });

    // Registrar no histórico do chamado pai
    await historicoService.criar({
      chamado_id: chamadoPaiId,
      usuario_id: usuarioId,
      acao: 'desassociacao_filho',
      descricao: `Chamado filho #${chamadoFilhoId}: ${chamadoFilho.titulo} foi desassociado`,
      dados_anteriores: {
        chamado_filho_id: chamadoFilhoId,
        chamado_filho_titulo: chamadoFilho.titulo
      },
      dados_novos: {
        chamado_filho_id: null
      }
    });

    // Registrar na auditoria
    await auditoriaService.registrarAtualizacao(
      usuarioId,
      'chamado',
      chamadoFilhoId,
      dadosAnteriores,
      {
        chamado_pai_id: null,
        acao: 'desassociacao_filho'
      },
      req
    );

    logger.info('Chamado desassociado', {
      chamadoFilhoId,
      chamadoPaiId,
      usuarioId
    });

    return {
      message: 'Chamado desassociado com sucesso',
      chamado_pai: {
        id: chamadoPaiId,
        titulo: chamadoPai?.titulo || 'N/A'
      },
      chamado_filho: {
        id: chamadoFilho.id,
        titulo: chamadoFilho.titulo
      }
    };
  }

  /**
   * Listar todos os filhos de um chamado pai
   * @param {number} chamadoPaiId - ID do chamado pai
   * @returns {Promise<Array>}
   */
  async listarFilhos(chamadoPaiId) {
    // Verificar se chamado pai existe
    const chamadoPai = await chamadoRepository.buscarPorId(chamadoPaiId);
    if (!chamadoPai) {
      throw new AppError('Chamado pai não encontrado', 404, 'CHAMADO_PAI_NOT_FOUND');
    }

    const filhos = await chamadoRepository.buscarFilhosPorPaiId(chamadoPaiId);
    return filhos.map(f => f.toJSON ? f.toJSON() : f);
  }

  /**
   * Verificar se um chamado pai pode ser encerrado
   * Verifica se todos os filhos estão encerrados (fechado, resolvido ou cancelado)
   * @param {number} chamadoPaiId - ID do chamado pai
   * @returns {Promise<{podeEncerrar: boolean, motivo: string|null, filhosAtivos: Array}>}
   */
  async verificarPodeEncerrarPai(chamadoPaiId) {
    const resultado = await chamadoRepository.verificarTemFilhosAtivos(chamadoPaiId);

    if (resultado.temFilhosAtivos) {
      return {
        podeEncerrar: false,
        motivo: 'Não é possível encerrar este chamado enquanto houver chamados associados em andamento',
        filhosAtivos: resultado.filhosAtivos
      };
    }

    return {
      podeEncerrar: true,
      motivo: null,
      filhosAtivos: []
    };
  }
}

export default new ChamadoAssociacaoService();

