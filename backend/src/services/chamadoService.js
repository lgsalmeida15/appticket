import chamadoRepository from '../repositories/chamadoRepository.js';
import grupoRepository from '../repositories/grupoRepository.js';
import usuarioRepository from '../repositories/usuarioRepository.js';
import permissionService from './permissionService.js';
import historicoService from './historicoService.js';
import auditoriaService from './auditoriaService.js';
import eventEmitter from '../utils/EventEmitter.js';
import logger from '../utils/logger.js';
import { validarDataHoraInicio } from '../utils/validations.js';

/**
 * Service de chamados
 * Contém toda lógica de negócio para chamados
 */
class ChamadoService {
  /**
   * Listar chamados com filtros e paginação
   */
  async listar(filtros, usuarioLogado) {
    // Aplicar filtros de permissão baseados em grupos
    const whereCustom = await permissionService.aplicarFiltrosPermissaoChamados(usuarioLogado);
    
    // Normalizar filtros de arrays
    const filtrosNormalizados = {
      ...filtros,
      status: this._normalizarFiltroArray(filtros.status),
      prioridade: this._normalizarFiltroArray(filtros.prioridade),
      tipo: this._normalizarFiltroArray(filtros.tipo),
      grupo_id: this._normalizarFiltroArray(filtros.grupo_id),
      whereCustom
    };

    const resultado = await chamadoRepository.listar(filtrosNormalizados, {
      page: filtros.page || 1,
      limit: filtros.limit || 10
    });

    return {
      chamados: resultado.chamados.map(c => c.toJSON ? c.toJSON() : c),
      total: resultado.total,
      page: resultado.page,
      totalPages: resultado.totalPages
    };
  }

  /**
   * Buscar chamado por ID
   */
  async buscarPorId(chamadoId, usuarioLogado, opcoes = {}) {
    const incluirRelacionamentos = opcoes.incluirRelacionamentos !== false; // Por padrão inclui
    
    const chamado = await chamadoRepository.buscarPorId(chamadoId, {
      incluirCriador: true,
      incluirResponsavel: true,
      incluirGrupo: true,
      incluirGrupoExecutor: true,
      incluirHistorico: opcoes.incluirHistorico || false,
      incluirComentarios: opcoes.incluirComentarios || false,
      incluirPai: incluirRelacionamentos,
      incluirFilhos: incluirRelacionamentos
    });

    if (!chamado) {
      const error = new Error('Chamado não encontrado');
      error.statusCode = 404;
      error.code = 'CHAMADO_NOT_FOUND';
      throw error;
    }

    // Verificar permissão para ver o chamado
    await permissionService.verificarPermissaoVisualizacaoChamado(chamado, usuarioLogado);

    return chamado.toJSON ? chamado.toJSON() : chamado;
  }

  /**
   * Criar novo chamado
   */
  async criar(dados, usuarioId, req = null) {
    const {
      titulo,
      descricao,
      tipo = 'incidente',
      prioridade = 'media',
      grupo_id,
      grupo_executor_id,
      atribuido_a,
      solicitante_id,
      prazo,
      tags = [],
      campos_customizados = {}
    } = dados;

    // Obter usuário do request ou buscar do banco
    const usuario = req?.usuario || await usuarioRepository.buscarPorId(usuarioId);
    const isAdmin = permissionService.isAdmin(usuario);

    // VALIDAÇÃO: Não-admin não pode usar solicitante_id
    if (!isAdmin && solicitante_id !== undefined && solicitante_id !== null) {
      const error = new Error('Apenas administradores podem indicar um solicitante diferente');
      error.statusCode = 403;
      error.code = 'FORBIDDEN_SOLICITANTE';
      throw error;
    }

    // Determinar usuarioIdFinal (solicitante do chamado)
    let usuarioIdFinal = usuarioId; // Padrão: usuário autenticado
    
    if (isAdmin && solicitante_id !== undefined && solicitante_id !== null) {
      // Admin informou solicitante_id: validar se usuário existe e está ativo
      const solicitante = await usuarioRepository.buscarPorId(solicitante_id);
      if (!solicitante) {
        const error = new Error('Solicitante não encontrado');
        error.statusCode = 404;
        error.code = 'SOLICITANTE_NOT_FOUND';
        throw error;
      }
      if (!solicitante.ativo) {
        const error = new Error('Solicitante está inativo');
        error.statusCode = 400;
        error.code = 'SOLICITANTE_INATIVO';
        throw error;
      }
      usuarioIdFinal = solicitante_id;
    }
    // Se não for admin OU solicitante_id não foi informado: usa usuarioId (comportamento atual)

    // Verificar se grupo existe e está ativo
    const grupo = await grupoRepository.buscarPorId(grupo_id);
    if (!permissionService.grupoEstaAtivo(grupo)) {
      const error = new Error('Grupo não encontrado ou inativo');
      error.statusCode = 404;
      error.code = 'GRUPO_NOT_FOUND';
      throw error;
    }

    // Verificar se usuário pertence ao grupo (admins podem criar para qualquer grupo)
    // IMPORTANTE: Usar usuarioIdFinal para verificar permissão do grupo
    if (!isAdmin) {
      const pertenceAoGrupo = await permissionService.usuarioPertenceAoGrupo(usuarioIdFinal, grupo_id);
      if (!pertenceAoGrupo) {
        const error = new Error('Usuário não pertence ao grupo especificado');
        error.statusCode = 403;
        error.code = 'USER_NOT_IN_GROUP';
        throw error;
      }
    }

    // Processar anexos se existirem
    let anexos = [];
    if (campos_customizados.anexos && Array.isArray(campos_customizados.anexos)) {
      anexos = campos_customizados.anexos;
    }

    // Processar data_hora_inicio (apenas para admins)
    const agora = new Date();
    let dataHoraInicio = agora;
    let dataHoraInicioAlteradoPor = null;
    let dataHoraInicioAlteradoEm = null;

    if (isAdmin && dados.data_hora_inicio) {
      const dataFornecida = new Date(dados.data_hora_inicio);
      
      // Validar data_hora_inicio
      const validacao = validarDataHoraInicio(dataFornecida, agora);
      if (!validacao.valido) {
        const error = new Error(validacao.erro);
        error.statusCode = 400;
        error.code = 'DATA_HORA_INICIO_INVALIDA';
        throw error;
      }
      
      dataHoraInicio = dataFornecida;
      dataHoraInicioAlteradoPor = usuarioId;
      dataHoraInicioAlteradoEm = agora;
    }

    // Criar chamado usando usuarioIdFinal
    const chamado = await chamadoRepository.criar({
      titulo,
      descricao,
      tipo,
      prioridade,
      status: 'novo',
      grupo_id,
      grupo_executor_id: grupo_executor_id || null,
      usuario_id: usuarioIdFinal,
      atribuido_a: atribuido_a || null,
      prazo: prazo ? new Date(prazo) : null,
      tags,
      campos_customizados: {
        ...campos_customizados,
        anexos
      },
      data_abertura: new Date(),
      data_hora_inicio: dataHoraInicio,
      data_hora_inicio_alterado_por: dataHoraInicioAlteradoPor,
      data_hora_inicio_alterado_em: dataHoraInicioAlteradoEm
    });

    // Registrar no histórico usando usuarioIdFinal (solicitante)
    await historicoService.registrarCriacao(chamado.id, usuarioIdFinal, {
      status: 'novo',
      prioridade,
      tipo
    });

    // Registrar na auditoria usando usuarioId (quem criou o chamado no sistema)
    await auditoriaService.registrarCriacao(usuarioId, 'chamado', chamado.id, {
      titulo,
      tipo,
      prioridade,
      status: 'novo',
      grupo_id,
      solicitante_id: usuarioIdFinal !== usuarioId ? usuarioIdFinal : undefined
    }, req);

    // Buscar chamado completo
    const chamadoCompleto = await chamadoRepository.buscarPorId(chamado.id, {
      incluirCriador: true,
      incluirResponsavel: true,
      incluirGrupo: true,
      incluirPai: false, // Chamado recém-criado não tem pai
      incluirFilhos: false // Chamado recém-criado não tem filhos
    });

    // Emitir evento (webhook será disparado pelo event handler)
    eventEmitter.emit('chamado:criado', {
      chamado: chamadoCompleto,
      req
    }).catch(err => {
      logger.error('Erro ao emitir evento de criação', {
        chamadoId: chamado.id,
        error: err.message
      });
    });

    logger.info('Chamado criado', {
      chamadoId: chamado.id,
      usuarioId,
      grupoId: grupo_id
    });

    return chamadoCompleto.toJSON ? chamadoCompleto.toJSON() : chamadoCompleto;
  }

  /**
   * Atualizar chamado
   */
  async atualizar(chamadoId, dados, usuarioLogado, req = null) {
    const chamado = await chamadoRepository.buscarPorId(chamadoId);
    
    if (!chamado) {
      const error = new Error('Chamado não encontrado');
      error.statusCode = 404;
      error.code = 'CHAMADO_NOT_FOUND';
      throw error;
    }

    // ✅ Verificar se chamado está fechado
    if (chamado.status_fechamento === 'fechado') {
      const error = new Error('Não é possível editar chamados fechados');
      error.statusCode = 400;
      error.code = 'CHAMADO_FECHADO';
      throw error;
    }

    const isAdmin = permissionService.isAdmin(usuarioLogado);
    const isGerente = usuarioLogado.tipo === 'gerente';

    // ✅ VALIDAÇÃO: Agentes só podem editar seus próprios chamados ou chamados atribuídos a eles
    if (usuarioLogado.tipo === 'agente') {
      const podeEditar = chamado.usuario_id === usuarioLogado.id || chamado.atribuido_a === usuarioLogado.id;
      if (!podeEditar) {
        const error = new Error('Você não tem permissão para editar este chamado');
        error.statusCode = 403;
        error.code = 'FORBIDDEN_EDITAR';
        throw error;
      }
    }

    // VALIDAÇÃO: Não-admin não pode usar solicitante_id
    if (!isAdmin && dados.solicitante_id !== undefined && dados.solicitante_id !== null) {
      const error = new Error('Apenas administradores podem alterar o solicitante');
      error.statusCode = 403;
      error.code = 'FORBIDDEN_SOLICITANTE';
      throw error;
    }

    // RESTRIÇÃO: Apenas ADMIN pode alterar campos administrativos
    const camposAdministrativos = Object.keys(dados).filter(campo => ['tipo', 'prioridade', 'status', 'atribuido_a'].includes(campo));
    
    if (!permissionService.podeAlterarCamposAdministrativos(usuarioLogado, camposAdministrativos)) {
      const error = new Error('Apenas administradores podem alterar status, prioridade, tipo ou atribuir responsáveis');
      error.statusCode = 403;
      error.code = 'FORBIDDEN';
      throw error;
    }

    // ✅ BLOQUEIO: Não permitir mudança manual para status "fechado" ou "resolvido"
    if (dados.status !== undefined) {
      if (dados.status === 'fechado' || dados.status === 'resolvido') {
        const error = new Error('Não é possível alterar o status para "fechado" ou "resolvido" manualmente. Use o processo de fechamento de chamado.');
        error.statusCode = 400;
        error.code = 'STATUS_PROTEGIDO';
        throw error;
      }
    }

    // Processar solicitante_id se fornecido (apenas para admins)
    if (isAdmin && dados.solicitante_id !== undefined && dados.solicitante_id !== null) {
      // Admin informou solicitante_id: validar se usuário existe e está ativo
      const solicitante = await usuarioRepository.buscarPorId(dados.solicitante_id);
      if (!solicitante) {
        const error = new Error('Solicitante não encontrado');
        error.statusCode = 404;
        error.code = 'SOLICITANTE_NOT_FOUND';
        throw error;
      }
      if (!solicitante.ativo) {
        const error = new Error('Solicitante está inativo');
        error.statusCode = 400;
        error.code = 'SOLICITANTE_INATIVO';
        throw error;
      }
    }

    // Guardar dados anteriores
    const dadosAnteriores = {
      titulo: chamado.titulo,
      descricao: chamado.descricao,
      tipo: chamado.tipo,
      prioridade: chamado.prioridade,
      status: chamado.status,
      atribuido_a: chamado.atribuido_a,
      grupo_executor_id: chamado.grupo_executor_id,
      usuario_id: chamado.usuario_id,
      data_hora_inicio: chamado.data_hora_inicio
    };

    // ✅ VALIDAÇÃO: Não permitir alteração direta de chamado_pai_id via update
    // A associação deve ser feita apenas através do serviço de associação
    if (dados.chamado_pai_id !== undefined) {
      const error = new Error('A associação de chamados deve ser feita através do endpoint específico de associação');
      error.statusCode = 400;
      error.code = 'ASSOCIACAO_PROTEGIDA';
      throw error;
    }

    // ✅ VALIDAÇÃO: Apenas ADMIN pode editar data_hora_inicio
    if (dados.data_hora_inicio !== undefined) {
      if (!isAdmin) {
        const error = new Error('Apenas administradores podem alterar a data/hora de início');
        error.statusCode = 403;
        error.code = 'FORBIDDEN_DATA_HORA_INICIO';
        throw error;
      }
      
      const novaData = new Date(dados.data_hora_inicio);
      
      // Validar contra created_at do chamado existente
      const validacao = validarDataHoraInicio(novaData, chamado.created_at);
      if (!validacao.valido) {
        const error = new Error(validacao.erro);
        error.statusCode = 400;
        error.code = 'DATA_HORA_INICIO_INVALIDA';
        throw error;
      }
    }
    
    // Preparar dados de atualização
    const dadosAtualizacao = {};
    if (dados.titulo !== undefined) dadosAtualizacao.titulo = dados.titulo;
    if (dados.descricao !== undefined) dadosAtualizacao.descricao = dados.descricao;
    if (dados.tipo !== undefined) dadosAtualizacao.tipo = dados.tipo;
    if (dados.prioridade !== undefined) dadosAtualizacao.prioridade = dados.prioridade;
    if (dados.status !== undefined) {
      dadosAtualizacao.status = dados.status;
      // ✅ Removido: não atualizar data_fechamento manualmente para status fechado/resolvido
      // Esses status são gerenciados automaticamente pelo sistema
    }
    if (dados.atribuido_a !== undefined) dadosAtualizacao.atribuido_a = dados.atribuido_a;
    if (dados.prazo !== undefined) dadosAtualizacao.prazo = dados.prazo ? new Date(dados.prazo) : null;
    if (dados.tags !== undefined) dadosAtualizacao.tags = dados.tags;
    if (dados.grupo_id !== undefined) dadosAtualizacao.grupo_id = dados.grupo_id;
    
    // Processar data_hora_inicio (apenas para admins - validação já foi feita acima)
    if (dados.data_hora_inicio !== undefined && isAdmin) {
      dadosAtualizacao.data_hora_inicio = new Date(dados.data_hora_inicio);
      dadosAtualizacao.data_hora_inicio_alterado_por = usuarioLogado.id;
      dadosAtualizacao.data_hora_inicio_alterado_em = new Date();
    }
    
    // Processar solicitante_id (usuario_id) se fornecido (apenas para admins)
    if (isAdmin && dados.solicitante_id !== undefined && dados.solicitante_id !== null) {
      const solicitanteId = parseInt(dados.solicitante_id);
      if (!isNaN(solicitanteId) && solicitanteId > 0) {
        dadosAtualizacao.usuario_id = solicitanteId;
      }
    }
    
    // ✅ CRÍTICO: Preservar grupo_executor_id se não for uma atualização explícita
    // Se dados.grupo_executor_id for null E já existir um valor, NÃO sobrescrever
    if (dados.grupo_executor_id !== undefined && dados.grupo_executor_id !== null) {
      // Atualização explícita com valor válido
      dadosAtualizacao.grupo_executor_id = dados.grupo_executor_id;
      logger.info('✅ Atualizando grupo_executor_id', { novo_valor: dados.grupo_executor_id });
    } else if (dados.grupo_executor_id === null && chamado.grupo_executor_id !== null) {
      // Se recebeu null mas já havia um valor, NÃO atualizar (preservar)
      logger.warn('⚠️ Ignorando grupo_executor_id=null, preservando valor existente', { 
        valor_existente: chamado.grupo_executor_id 
      });
      // NÃO incluir no dadosAtualizacao para não sobrescrever
    }
    
    // Processar campos customizados e anexos
    if (dados.campos_customizados !== undefined) {
      // Mesclar com campos customizados existentes
      const camposExistentes = chamado.campos_customizados || {};
      dadosAtualizacao.campos_customizados = {
        ...camposExistentes,
        ...dados.campos_customizados
      };
      
      // Se houver anexos novos, mesclar com os existentes
      if (dados.campos_customizados.anexos && Array.isArray(dados.campos_customizados.anexos)) {
        const anexosExistentes = camposExistentes.anexos || [];
        dadosAtualizacao.campos_customizados.anexos = [
          ...anexosExistentes,
          ...dados.campos_customizados.anexos
        ];
      }
    }

    // Atualizar chamado
    await chamadoRepository.atualizar(chamadoId, dadosAtualizacao);

    // Determinar tipo de ação para histórico
    let acaoHistorico = 'edicao';
    if (dados.status && dados.status !== dadosAnteriores.status) {
      acaoHistorico = 'mudanca_status';
    } else if (dados.prioridade && dados.prioridade !== dadosAnteriores.prioridade) {
      acaoHistorico = 'mudanca_prioridade';
    } else if (dados.atribuido_a !== undefined && dados.atribuido_a !== dadosAnteriores.atribuido_a) {
      acaoHistorico = 'atribuicao';
    }

    // Registrar no histórico
    await historicoService.registrarAtualizacao(
      chamadoId,
      usuarioLogado.id,
      dadosAnteriores,
      dadosAtualizacao,
      acaoHistorico
    );

    // Registrar na auditoria
    await auditoriaService.registrarAtualizacao(
      usuarioLogado.id,
      'chamado',
      chamadoId,
      dadosAnteriores,
      dadosAtualizacao,
      req
    );

    // Buscar chamado atualizado
    const chamadoAtualizado = await chamadoRepository.buscarPorId(chamadoId, {
      incluirCriador: true,
      incluirResponsavel: true,
      incluirGrupo: true,
      incluirGrupoExecutor: true,
      incluirPai: true,
      incluirFilhos: true
    });

    // Emitir evento (webhooks serão disparados pelos event handlers)
    eventEmitter.emit('chamado:atualizado', {
      chamado: chamadoAtualizado,
      dadosAnteriores,
      req
    }).catch(err => {
      logger.error('Erro ao emitir evento de atualização', {
        chamadoId,
        error: err.message
      });
    });

    logger.info('Chamado atualizado', {
      chamadoId,
      usuarioId: usuarioLogado.id,
      acao: acaoHistorico
    });

    return chamadoAtualizado.toJSON ? chamadoAtualizado.toJSON() : chamadoAtualizado;
  }

  /**
   * Deletar chamado (cancelar)
   */
  async deletar(chamadoId, usuarioId, req = null) {
    const chamado = await chamadoRepository.buscarPorId(chamadoId);
    
    if (!chamado) {
      const error = new Error('Chamado não encontrado');
      error.statusCode = 404;
      error.code = 'CHAMADO_NOT_FOUND';
      throw error;
    }

    const dadosAnteriores = {
      status: chamado.status,
      titulo: chamado.titulo
    };

    // Atualizar status para cancelado
    await chamadoRepository.atualizar(chamadoId, { status: 'cancelado' });

    // Registrar no histórico
    await historicoService.registrarCancelamento(chamadoId, usuarioId, dadosAnteriores);

    // Registrar na auditoria
    await auditoriaService.registrarExclusao(
      usuarioId,
      'chamado',
      chamadoId,
      dadosAnteriores,
      req
    );

    logger.info('Chamado cancelado', {
      chamadoId,
      usuarioId
    });

    return { message: 'Chamado cancelado com sucesso' };
  }

  /**
   * Deletar chamado permanentemente (hard delete)
   * Remove completamente o chamado e todas as suas dependências
   */
  async deletarPermanente(chamadoId, usuarioId, req = null) {
    const chamado = await chamadoRepository.buscarPorId(chamadoId);
    
    if (!chamado) {
      const error = new Error('Chamado não encontrado');
      error.statusCode = 404;
      error.code = 'CHAMADO_NOT_FOUND';
      throw error;
    }

    // Guardar dados antes de deletar para auditoria
    const dadosAnteriores = {
      titulo: chamado.titulo,
      descricao: chamado.descricao,
      status: chamado.status,
      tipo: chamado.tipo,
      prioridade: chamado.prioridade,
      grupo_id: chamado.grupo_id,
      usuario_id: chamado.usuario_id
    };

    // Registrar na auditoria ANTES de deletar
    await auditoriaService.registrarExclusao(
      usuarioId,
      'chamado',
      chamadoId,
      dadosAnteriores,
      req
    );

    // Deletar permanentemente
    // Isso vai deletar em CASCADE: Historico, Comentario, TicketTimeTracking, WebhookLog
    await chamadoRepository.deletarPermanente(chamadoId);

    logger.info('Chamado deletado permanentemente', {
      chamadoId,
      usuarioId,
      titulo: dadosAnteriores.titulo
    });

    return { 
      message: 'Chamado deletado permanentemente',
      chamado: { id: chamadoId }
    };
  }

  /**
   * Buscar estatísticas de chamados
   */
  async buscarEstatisticas(usuarioLogado) {
    // Aplicar filtros de permissão
    const whereCustom = await permissionService.aplicarFiltrosPermissaoChamados(usuarioLogado);

    const [total, porStatus, porPrioridade, porTipo] = await Promise.all([
      chamadoRepository.contarTotal({ whereCustom }),
      chamadoRepository.contarPorStatus({ whereCustom }),
      chamadoRepository.contarPorPrioridade({ whereCustom }),
      chamadoRepository.contarPorTipo({ whereCustom })
    ]);

    return {
      total,
      por_status: porStatus,
      por_prioridade: porPrioridade,
      por_tipo: porTipo
    };
  }

  /**
   * Normalizar filtro para aceitar string ou array
   * @private
   */
  _normalizarFiltroArray(valor) {
    if (!valor) return undefined;
    if (Array.isArray(valor)) return valor;
    return [valor];
  }
}

export default new ChamadoService();

