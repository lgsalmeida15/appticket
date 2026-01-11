import grupoRepository from '../repositories/grupoRepository.js';
import logger from '../utils/logger.js';
import auditoriaService from './auditoriaService.js';

/**
 * Service de grupos
 * Contém lógica de negócio para grupos
 */
class GrupoService {
  /**
   * Criar novo grupo
   */
  async criar(dados, req = null) {
    const { nome, descricao, ativo = true, webhook_url, webhook_eventos = [] } = dados;

    const grupo = await grupoRepository.criar({
      nome,
      descricao,
      ativo,
      webhook_url: webhook_url || null,
      webhook_eventos
    });

    // Registrar na auditoria
    await auditoriaService.registrarCriacao(
      req?.usuario?.id || 0, // Se não tiver req, usar 0 (sistema)
      'grupo',
      grupo.id,
      {
        nome: grupo.nome,
        descricao: grupo.descricao
      },
      req
    );

    logger.info('Grupo criado', {
      grupoId: grupo.id,
      nome: grupo.nome
    });

    return grupo.toJSON ? grupo.toJSON() : grupo;
  }

  /**
   * Listar grupos
   * @param {Object} filtros - Filtros de busca
   * @param {Object} usuario - Usuário logado (para aplicar filtros de permissão)
   */
  async listar(filtros, usuario = null) {
    // ✅ Se está buscando grupos executores, todos podem ver (sem filtro de permissão)
    // Isso permite que qualquer usuário selecione um grupo executor ao criar chamados
    const aplicarFiltrosPermissao = usuario && !filtros.executor;
    
    // Se deve aplicar filtros de permissão E não é admin
    if (aplicarFiltrosPermissao && usuario.tipo !== 'admin') {
      // Aqui poderíamos adicionar lógica de permissão específica para grupos solicitantes
      // Por enquanto, mantemos o comportamento atual de listar todos os grupos ativos
    }
    
    const resultado = await grupoRepository.listar(filtros);
    
    return {
      grupos: resultado.grupos.map(g => g.toJSON ? g.toJSON() : g),
      total: resultado.total,
      page: resultado.page,
      totalPages: resultado.totalPages
    };
  }

  /**
   * Buscar grupo por ID
   */
  async buscarPorId(grupoId, opcoes = {}) {
    const grupo = await grupoRepository.buscarPorId(grupoId, {
      incluirUsuarios: opcoes.incluirUsuarios || false
    });
    
    if (!grupo) {
      const error = new Error('Grupo não encontrado');
      error.statusCode = 404;
      error.code = 'GRUPO_NOT_FOUND';
      throw error;
    }

    return grupo.toJSON ? grupo.toJSON() : grupo;
  }

  /**
   * Atualizar grupo
   * @param {Number} grupoId - ID do grupo
   * @param {Object} dados - Dados para atualização
   * @param {Object} req - Request object (para auditoria)
   * @param {Object} opcoes - Opções { incluirUsuarios: boolean }
   */
  async atualizar(grupoId, dados, req = null, opcoes = {}) {
    const { incluirUsuarios = false } = opcoes;
    
    const grupo = await grupoRepository.buscarPorId(grupoId);
    
    if (!grupo) {
      const error = new Error('Grupo não encontrado');
      error.statusCode = 404;
      error.code = 'GRUPO_NOT_FOUND';
      throw error;
    }

    // Buscar dados anteriores para auditoria
    const dadosAnteriores = {
      nome: grupo.nome,
      descricao: grupo.descricao,
      ativo: grupo.ativo
    };

    const grupoAtualizado = await grupoRepository.atualizar(grupoId, dados);

    // Preparar dados novos
    const dadosNovos = {};
    if (dados.nome !== undefined) dadosNovos.nome = dados.nome;
    if (dados.descricao !== undefined) dadosNovos.descricao = dados.descricao;
    if (dados.ativo !== undefined) dadosNovos.ativo = dados.ativo;

    // Registrar na auditoria
    if (Object.keys(dadosNovos).length > 0) {
      await auditoriaService.registrarAtualizacao(
        req?.usuario?.id || 0,
        'grupo',
        grupoId,
        dadosAnteriores,
        dadosNovos,
        req
      );
    }

    logger.info('Grupo atualizado', {
      grupoId
    });

    // Se incluirUsuarios, buscar novamente com usuários
    if (incluirUsuarios) {
      return await this.buscarPorId(grupoId, { incluirUsuarios: true });
    }

    return grupoAtualizado.toJSON ? grupoAtualizado.toJSON() : grupoAtualizado;
  }

  /**
   * Deletar grupo (soft delete)
   */
  async deletar(grupoId, req = null) {
    const grupo = await grupoRepository.buscarPorId(grupoId);
    
    if (!grupo) {
      const error = new Error('Grupo não encontrado');
      error.statusCode = 404;
      error.code = 'GRUPO_NOT_FOUND';
      throw error;
    }

    // Preparar dados para auditoria
    const dados = {
      nome: grupo.nome,
      descricao: grupo.descricao
    };

    await grupoRepository.deletar(grupoId);

    // Registrar na auditoria
    await auditoriaService.registrarExclusao(
      req?.usuario?.id || 0,
      'grupo',
      grupoId,
      dados,
      req
    );

    logger.info('Grupo deletado', {
      grupoId
    });

    return { message: 'Grupo deletado com sucesso' };
  }

  /**
   * Deletar grupo permanentemente (hard delete)
   * Só é possível se não houver chamados vinculados (RESTRICT)
   */
  async deletarPermanente(grupoId, req = null) {
    const grupo = await grupoRepository.buscarPorId(grupoId);
    
    if (!grupo) {
      const error = new Error('Grupo não encontrado');
      error.statusCode = 404;
      error.code = 'GRUPO_NOT_FOUND';
      throw error;
    }

    // Verificar dependências antes de tentar deletar
    const dependencias = await grupoRepository.verificarDependencias(grupoId);
    
    if (dependencias.total > 0) {
      const error = new Error(
        `Não é possível deletar o grupo. Ele possui ${dependencias.chamados} chamado(s) vinculado(s)`
      );
      error.statusCode = 400;
      error.code = 'GRUPO_HAS_DEPENDENCIES';
      error.dependencias = dependencias;
      throw error;
    }

    // Guardar dados antes de deletar para auditoria
    const dados = {
      nome: grupo.nome,
      descricao: grupo.descricao
    };

    // Registrar na auditoria ANTES de deletar
    await auditoriaService.registrarExclusao(
      req?.usuario?.id || 0,
      'grupo',
      grupoId,
      dados,
      req
    );

    // Deletar permanentemente
    // UsuarioGrupo, SLA e WebhookLog serão deletados em CASCADE
    await grupoRepository.deletarPermanente(grupoId);

    logger.info('Grupo deletado permanentemente', {
      grupoId,
      nome: dados.nome
    });

    return { message: 'Grupo deletado permanentemente' };
  }


  /**
   * Buscar todos os grupos ativos
   */
  async buscarAtivos(opcoes = {}) {
    const grupos = await grupoRepository.buscarAtivos(opcoes);
    return grupos.map(g => g.toJSON ? g.toJSON() : g);
  }

  /**
   * Buscar grupos de um usuário
   */
  async buscarPorUsuario(usuarioId, opcoes = {}) {
    const grupos = await grupoRepository.buscarPorUsuario(usuarioId, opcoes);
    // Filtrar grupos nulos e converter para JSON
    return grupos
      .filter(g => g !== null && g !== undefined)
      .map(g => g.toJSON ? g.toJSON() : g);
  }

  /**
   * Adicionar usuário ao grupo
   */
  async adicionarUsuario(grupoId, usuarioId, papel = 'agente') {
    // Verificar se grupo existe
    const grupo = await grupoRepository.buscarPorId(grupoId);
    if (!grupo) {
      const error = new Error('Grupo não encontrado');
      error.statusCode = 404;
      error.code = 'GRUPO_NOT_FOUND';
      throw error;
    }

    await grupoRepository.adicionarUsuario(grupoId, usuarioId, papel);

    logger.info('Usuário adicionado ao grupo', {
      grupoId,
      usuarioId,
      papel
    });

    return { message: 'Usuário adicionado ao grupo com sucesso' };
  }

  /**
   * Remover usuário do grupo
   */
  async removerUsuario(grupoId, usuarioId) {
    // Verificar se grupo existe
    const grupo = await grupoRepository.buscarPorId(grupoId);
    if (!grupo) {
      const error = new Error('Grupo não encontrado');
      error.statusCode = 404;
      error.code = 'GRUPO_NOT_FOUND';
      throw error;
    }

    const removido = await grupoRepository.removerUsuario(grupoId, usuarioId);
    
    if (!removido) {
      const error = new Error('Usuário não pertence ao grupo');
      error.statusCode = 404;
      error.code = 'USER_NOT_IN_GROUP';
      throw error;
    }

    logger.info('Usuário removido do grupo', {
      grupoId,
      usuarioId
    });

    return { message: 'Usuário removido do grupo com sucesso' };
  }

  /**
   * Atualizar papel do usuário no grupo
   */
  async atualizarPapelUsuario(grupoId, usuarioId, papel) {
    if (!papel || !['gerente', 'agente'].includes(papel)) {
      const error = new Error('Papel deve ser "gerente" ou "agente"');
      error.statusCode = 400;
      error.code = 'INVALID_PAPEL';
      throw error;
    }

    // Verificar se grupo existe
    const grupo = await grupoRepository.buscarPorId(grupoId);
    if (!grupo) {
      const error = new Error('Grupo não encontrado');
      error.statusCode = 404;
      error.code = 'GRUPO_NOT_FOUND';
      throw error;
    }

    const atualizado = await grupoRepository.atualizarPapelUsuario(grupoId, usuarioId, papel);
    
    if (!atualizado) {
      const error = new Error('Associação não encontrada');
      error.statusCode = 404;
      error.code = 'ASSOCIATION_NOT_FOUND';
      throw error;
    }

    logger.info('Papel do usuário atualizado no grupo', {
      grupoId,
      usuarioId,
      papel
    });

    return { message: 'Papel atualizado com sucesso' };
  }
}

export default new GrupoService();

