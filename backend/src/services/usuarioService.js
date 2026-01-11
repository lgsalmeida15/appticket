import usuarioRepository from '../repositories/usuarioRepository.js';
import logger from '../utils/logger.js';
import auditoriaService from './auditoriaService.js';
import Grupo from '../models/Grupo.js';

/**
 * Service de usuários
 * Contém lógica de negócio para usuários
 */
class UsuarioService {
  /**
   * Criar novo usuário
   */
  async criar(dados, req = null) {
    const { nome, email, password, tipo = 'agente', ativo = true } = dados;

    // Verificar se email já existe
    const emailExiste = await usuarioRepository.emailExiste(email);
    if (emailExiste) {
      const error = new Error('Email já está em uso');
      error.statusCode = 400;
      error.code = 'EMAIL_ALREADY_EXISTS';
      throw error;
    }

    // Criar usuário (senha será hashada automaticamente pelo hook do model)
    const usuario = await usuarioRepository.criar({
      nome,
      email,
      senha: password,
      tipo,
      ativo
    });

    // Registrar na auditoria
    await auditoriaService.registrarCriacao(usuario.id, 'usuario', usuario.id, {
      nome: usuario.nome,
      email: usuario.email,
      tipo: usuario.tipo
    }, req);

    logger.info('Usuário criado', {
      userId: usuario.id,
      email: usuario.email,
      tipo: usuario.tipo
    });

    return usuario.toJSON ? usuario.toJSON() : usuario;
  }

  /**
   * Listar usuários
   */
  async listar(filtros, paginacao) {
    const resultado = await usuarioRepository.listar(filtros, paginacao, {
      incluirGrupos: true // Sempre incluir grupos na listagem
    });
    
    return {
      usuarios: resultado.usuarios.map(u => u.toJSON ? u.toJSON() : u),
      total: resultado.total,
      page: resultado.page,
      totalPages: resultado.totalPages
    };
  }

  /**
   * Buscar usuário por ID
   * @param {Number} usuarioId - ID do usuário
   * @param {Object} opcoes - Opções de busca { incluirGrupos: boolean }
   */
  async buscarPorId(usuarioId, opcoes = {}) {
    const { incluirGrupos = false } = opcoes;
    
    const opcoesBusca = {};
    if (incluirGrupos) {
      opcoesBusca.include = [{
        model: Grupo,
        as: 'grupos',
        through: {
          attributes: ['papel', 'ativo', 'id'],
          where: { ativo: true } // Filtrar apenas associações ativas
        },
        where: { ativo: true }, // Filtrar apenas grupos ativos
        required: false
      }];
    }
    
    const usuario = await usuarioRepository.buscarPorId(usuarioId, opcoesBusca);
    
    if (!usuario) {
      const error = new Error('Usuário não encontrado');
      error.statusCode = 404;
      error.code = 'USER_NOT_FOUND';
      throw error;
    }

    // Filtrar grupos inativos caso ainda existam (backup)
    if (incluirGrupos && usuario.grupos) {
      usuario.grupos = usuario.grupos.filter(g => {
        // Verificar se a associação está ativa e se o grupo está ativo
        const associacao = g.usuario_grupo || g.UsuarioGrupo;
        return associacao && associacao.ativo !== false && g.ativo !== false;
      });
    }

    return usuario.toJSON ? usuario.toJSON() : usuario;
  }

  /**
   * Atualizar usuário
   * @param {Number} usuarioId - ID do usuário
   * @param {Object} dados - Dados para atualização
   * @param {Object} req - Request object (para auditoria)
   * @param {Object} opcoes - Opções { incluirGrupos: boolean }
   */
  async atualizar(usuarioId, dados, req = null, opcoes = {}) {
    const { incluirGrupos = true } = opcoes;
    
    const usuario = await usuarioRepository.buscarPorId(usuarioId);
    
    if (!usuario) {
      const error = new Error('Usuário não encontrado');
      error.statusCode = 404;
      error.code = 'USER_NOT_FOUND';
      throw error;
    }

    // Se email está sendo alterado, verificar se já existe
    if (dados.email && dados.email !== usuario.email) {
      const emailExiste = await usuarioRepository.emailExiste(dados.email, usuarioId);
      if (emailExiste) {
        const error = new Error('Email já está em uso');
        error.statusCode = 400;
        error.code = 'EMAIL_ALREADY_EXISTS';
        throw error;
      }
    }

    // Preparar dados de atualização (sem senha se não foi fornecida nova)
    const dadosAtualizacao = { ...dados };
    if (dados.password) {
      dadosAtualizacao.senha = dados.password;
      delete dadosAtualizacao.password;
    } else {
      delete dadosAtualizacao.password;
      delete dadosAtualizacao.senha;
    }

    // Buscar dados anteriores para auditoria
    const usuarioAnterior = await usuarioRepository.buscarPorId(usuarioId);
    const dadosAnteriores = usuarioAnterior ? {
      nome: usuarioAnterior.nome,
      email: usuarioAnterior.email,
      tipo: usuarioAnterior.tipo,
      ativo: usuarioAnterior.ativo
    } : {};

    const usuarioAtualizado = await usuarioRepository.atualizar(usuarioId, dadosAtualizacao);

    // Preparar dados novos para auditoria
    const dadosNovos = {};
    if (dados.nome !== undefined) dadosNovos.nome = dados.nome;
    if (dados.email !== undefined) dadosNovos.email = dados.email;
    if (dados.tipo !== undefined) dadosNovos.tipo = dados.tipo;
    if (dados.ativo !== undefined) dadosNovos.ativo = dados.ativo;

    // Registrar na auditoria se houver mudanças
    if (Object.keys(dadosNovos).length > 0) {
      await auditoriaService.registrarAtualizacao(
        usuarioId, // Assumindo que o próprio usuário ou admin está fazendo
        'usuario',
        usuarioId,
        dadosAnteriores,
        dadosNovos,
        req
      );
    }

    logger.info('Usuário atualizado', {
      userId: usuarioId
    });

    // Se incluirGrupos, buscar novamente com grupos
    if (incluirGrupos) {
      const usuarioComGrupos = await usuarioRepository.buscarPorId(usuarioId, {
        include: [{
          model: Grupo,
          as: 'grupos',
          through: {
            attributes: ['papel', 'ativo', 'id'],
            where: { ativo: true } // Filtrar apenas associações ativas
          },
          where: { ativo: true }, // Filtrar apenas grupos ativos
          required: false
        }]
      });
      
      // Filtrar grupos inativos caso ainda existam (backup)
      if (usuarioComGrupos && usuarioComGrupos.grupos) {
        usuarioComGrupos.grupos = usuarioComGrupos.grupos.filter(g => {
          const associacao = g.usuario_grupo || g.UsuarioGrupo;
          return associacao && associacao.ativo !== false && g.ativo !== false;
        });
      }
      
      return usuarioComGrupos.toJSON ? usuarioComGrupos.toJSON() : usuarioComGrupos;
    }

    return usuarioAtualizado.toJSON ? usuarioAtualizado.toJSON() : usuarioAtualizado;
  }

  /**
   * Deletar usuário (soft delete)
   */
  async deletar(usuarioId, req = null) {
    const usuario = await usuarioRepository.buscarPorId(usuarioId);
    
    if (!usuario) {
      const error = new Error('Usuário não encontrado');
      error.statusCode = 404;
      error.code = 'USER_NOT_FOUND';
      throw error;
    }

    // Buscar dados antes de deletar para auditoria
    const dados = {
      nome: usuario.nome,
      email: usuario.email,
      tipo: usuario.tipo
    };

    await usuarioRepository.deletar(usuarioId);

    // Registrar na auditoria
    await auditoriaService.registrarExclusao(
      req?.usuario?.id || 0, // Se não tiver req, usar 0 (sistema)
      'usuario',
      usuarioId,
      dados,
      req
    );

    logger.info('Usuário deletado', {
      userId: usuarioId
    });

    return { message: 'Usuário deletado com sucesso' };
  }

  /**
   * Deletar usuário permanentemente (hard delete)
   * Só é possível se não houver dependências com RESTRICT
   */
  async deletarPermanente(usuarioId, req = null) {
    const usuario = await usuarioRepository.buscarPorId(usuarioId);
    
    if (!usuario) {
      const error = new Error('Usuário não encontrado');
      error.statusCode = 404;
      error.code = 'USER_NOT_FOUND';
      throw error;
    }

    // Verificar dependências antes de tentar deletar
    const dependencias = await usuarioRepository.verificarDependencias(usuarioId);
    
    if (dependencias.total > 0) {
      const mensagens = [];
      if (dependencias.chamadosCriados > 0) {
        mensagens.push(`${dependencias.chamadosCriados} chamado(s) criado(s)`);
      }
      if (dependencias.chamadosAtribuidos > 0) {
        mensagens.push(`${dependencias.chamadosAtribuidos} chamado(s) atribuído(s)`);
      }
      if (dependencias.comentarios > 0) {
        mensagens.push(`${dependencias.comentarios} comentário(s)`);
      }
      if (dependencias.historicos > 0) {
        mensagens.push(`${dependencias.historicos} histórico(s)`);
      }
      if (dependencias.timeTracking > 0) {
        mensagens.push(`${dependencias.timeTracking} registro(s) de tempo`);
      }
      if (dependencias.auditorias > 0) {
        mensagens.push(`${dependencias.auditorias} registro(s) de auditoria`);
      }

      const error = new Error(
        `Não é possível deletar o usuário. Ele possui: ${mensagens.join(', ')}`
      );
      error.statusCode = 400;
      error.code = 'USER_HAS_DEPENDENCIES';
      error.dependencias = dependencias;
      throw error;
    }

    // Guardar dados antes de deletar para auditoria
    const dados = {
      nome: usuario.nome,
      email: usuario.email,
      tipo: usuario.tipo
    };

    // Registrar na auditoria ANTES de deletar
    await auditoriaService.registrarExclusao(
      req?.usuario?.id || 0,
      'usuario',
      usuarioId,
      dados,
      req
    );

    // Deletar permanentemente
    // UsuarioGrupo será deletado em CASCADE
    await usuarioRepository.deletarPermanente(usuarioId);

    logger.info('Usuário deletado permanentemente', {
      userId: usuarioId,
      email: dados.email
    });

    return { message: 'Usuário deletado permanentemente' };
  }

  /**
   * Buscar todos os usuários ativos
   */
  async buscarAtivos(opcoes = {}) {
    const usuarios = await usuarioRepository.buscarAtivos(opcoes);
    return usuarios.map(u => u.toJSON ? u.toJSON() : u);
  }

  /**
   * Buscar usuários por tipo
   */
  async buscarPorTipo(tipo, opcoes = {}) {
    const usuarios = await usuarioRepository.buscarPorTipo(tipo, opcoes);
    return usuarios.map(u => u.toJSON ? u.toJSON() : u);
  }
}

export default new UsuarioService();

