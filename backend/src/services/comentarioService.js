import comentarioRepository from '../repositories/comentarioRepository.js';
import chamadoRepository from '../repositories/chamadoRepository.js';
import historicoService from './historicoService.js';
import eventEmitter from '../utils/EventEmitter.js';
import logger from '../utils/logger.js';

/**
 * Service de comentários
 * Contém lógica de negócio para comentários em chamados
 */
class ComentarioService {
  /**
   * Adicionar comentário a um chamado
   */
  async adicionarComentario(chamadoId, usuarioId, dados) {
    const { texto, interno = false, anexos = [] } = dados;

    // Verificar se chamado existe
    const chamado = await chamadoRepository.buscarPorId(chamadoId);
    if (!chamado) {
      const error = new Error('Chamado não encontrado');
      error.statusCode = 404;
      error.code = 'CHAMADO_NOT_FOUND';
      throw error;
    }

    // ✅ Verificar se chamado está fechado
    if (chamado.status_fechamento === 'fechado') {
      const error = new Error('Não é possível adicionar comentários em chamados fechados');
      error.statusCode = 400;
      error.code = 'CHAMADO_FECHADO';
      throw error;
    }

    // Criar comentário
    const comentario = await comentarioRepository.criar({
      chamado_id: chamadoId,
      usuario_id: usuarioId,
      texto,
      interno,
      anexos,
      data_hora: new Date()
    });

    // Registrar no histórico
    await historicoService.registrarComentario(chamadoId, usuarioId);

    logger.info('Comentário adicionado', {
      comentarioId: comentario.id,
      chamadoId,
      usuarioId
    });

    // Buscar comentário completo
    const comentarioCompleto = await comentarioRepository.buscarPorId(comentario.id, {
      incluirUsuario: true
    });

    // Buscar chamado completo para evento
    const chamadoCompleto = await chamadoRepository.buscarPorId(chamadoId);

    // Emitir evento (webhook será disparado pelo event handler)
    eventEmitter.emit('comentario:adicionado', {
      chamado: chamadoCompleto,
      comentario: comentarioCompleto
    }).catch(err => {
      logger.error('Erro ao emitir evento de comentário adicionado', {
        comentarioId: comentario.id,
        error: err.message
      });
    });

    return comentarioCompleto.toJSON ? comentarioCompleto.toJSON() : comentarioCompleto;
  }

  /**
   * Listar comentários de um chamado
   */
  async listarPorChamado(chamadoId, opcoes = {}) {
    // Verificar se chamado existe
    const chamado = await chamadoRepository.buscarPorId(chamadoId);
    if (!chamado) {
      const error = new Error('Chamado não encontrado');
      error.statusCode = 404;
      error.code = 'CHAMADO_NOT_FOUND';
      throw error;
    }

    const comentarios = await comentarioRepository.listarPorChamado(chamadoId, opcoes);
    return comentarios.map(c => c.toJSON ? c.toJSON() : c);
  }

  /**
   * Buscar comentário por ID
   */
  async buscarPorId(comentarioId) {
    const comentario = await comentarioRepository.buscarPorId(comentarioId, {
      incluirUsuario: true,
      incluirChamado: true
    });

    if (!comentario) {
      const error = new Error('Comentário não encontrado');
      error.statusCode = 404;
      error.code = 'COMENTARIO_NOT_FOUND';
      throw error;
    }

    return comentario.toJSON ? comentario.toJSON() : comentario;
  }

  /**
   * Atualizar comentário
   */
  async atualizar(comentarioId, usuarioId, dados) {
    const comentario = await comentarioRepository.buscarPorId(comentarioId);
    
    if (!comentario) {
      const error = new Error('Comentário não encontrado');
      error.statusCode = 404;
      error.code = 'COMENTARIO_NOT_FOUND';
      throw error;
    }

    // Verificar se usuário é o autor do comentário
    if (comentario.usuario_id !== usuarioId) {
      const error = new Error('Você não tem permissão para editar este comentário');
      error.statusCode = 403;
      error.code = 'FORBIDDEN';
      throw error;
    }

    const comentarioAtualizado = await comentarioRepository.atualizar(comentarioId, dados);

    logger.info('Comentário atualizado', {
      comentarioId,
      usuarioId
    });

    return comentarioAtualizado.toJSON ? comentarioAtualizado.toJSON() : comentarioAtualizado;
  }

  /**
   * Deletar comentário
   */
  async deletar(comentarioId, usuarioId) {
    const comentario = await comentarioRepository.buscarPorId(comentarioId);
    
    if (!comentario) {
      const error = new Error('Comentário não encontrado');
      error.statusCode = 404;
      error.code = 'COMENTARIO_NOT_FOUND';
      throw error;
    }

    // Verificar se usuário é o autor do comentário ou admin
    // TODO: Verificar se usuário é admin
    if (comentario.usuario_id !== usuarioId) {
      const error = new Error('Você não tem permissão para deletar este comentário');
      error.statusCode = 403;
      error.code = 'FORBIDDEN';
      throw error;
    }

    await comentarioRepository.deletar(comentarioId);

    logger.info('Comentário deletado', {
      comentarioId,
      usuarioId
    });

    return { message: 'Comentário deletado com sucesso' };
  }

  /**
   * Contar comentários de um chamado
   */
  async contarPorChamado(chamadoId, opcoes = {}) {
    return await comentarioRepository.contarPorChamado(chamadoId, opcoes);
  }
}

export default new ComentarioService();

