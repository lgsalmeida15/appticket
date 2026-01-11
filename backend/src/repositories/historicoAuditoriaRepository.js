import HistoricoAuditoria from '../models/HistoricoAuditoria.js';
import Usuario from '../models/Usuario.js';
import { Op } from 'sequelize';

/**
 * Repository para operações de banco de dados relacionadas ao histórico de auditoria
 * Isola acesso direto ao Sequelize
 */
class HistoricoAuditoriaRepository {
  /**
   * Criar novo registro de auditoria
   */
  async criar(dados) {
    return await HistoricoAuditoria.create({
      ...dados,
      data: dados.data || new Date()
    });
  }

  /**
   * Buscar registro por ID
   */
  async buscarPorId(id, opcoes = {}) {
    const include = [];
    
    if (opcoes.incluirUsuario !== false) {
      include.push({
        model: Usuario,
        as: 'usuario',
        attributes: ['id', 'nome', 'email']
      });
    }

    return await HistoricoAuditoria.findByPk(id, { include });
  }

  /**
   * Listar registros com filtros
   */
  async listar(filtros = {}, paginacao = {}) {
    const {
      page = 1,
      limit = 10,
      usuario_id,
      entidade,
      entidade_id,
      acao,
      dataInicio,
      dataFim,
      whereCustom
    } = filtros;

    const where = {};
    
    if (usuario_id) where.usuario_id = usuario_id;
    if (entidade) where.entidade = entidade;
    if (entidade_id) where.entidade_id = entidade_id;
    if (acao) where.acao = acao;
    
    if (dataInicio || dataFim) {
      where.data = {};
      if (dataInicio) where.data[Op.gte] = dataInicio;
      if (dataFim) where.data[Op.lte] = dataFim;
    }
    
    if (whereCustom) {
      Object.assign(where, whereCustom);
    }

    const offset = (page - 1) * limit;

    const { count, rows } = await HistoricoAuditoria.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['data', 'DESC']],
      include: [{
        model: Usuario,
        as: 'usuario',
        attributes: ['id', 'nome', 'email']
      }]
    });

    return {
      registros: rows,
      total: count,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(count / limit)
    };
  }

  /**
   * Buscar registros por entidade
   */
  async buscarPorEntidade(entidade, entidadeId, opcoes = {}) {
    const { limit } = opcoes;

    const queryOptions = {
      where: { entidade, entidade_id: entidadeId },
      include: [{
        model: Usuario,
        as: 'usuario',
        attributes: ['id', 'nome', 'email']
      }],
      order: [['data', 'DESC']]
    };

    if (limit) {
      queryOptions.limit = limit;
    }

    return await HistoricoAuditoria.findAll(queryOptions);
  }

  /**
   * Buscar registros por usuário
   */
  async buscarPorUsuario(usuarioId, opcoes = {}) {
    const { acao, dataInicio, dataFim, limit } = opcoes;

    const where = { usuario_id: usuarioId };
    
    if (acao) where.acao = acao;
    
    if (dataInicio || dataFim) {
      where.data = {};
      if (dataInicio) where.data[Op.gte] = dataInicio;
      if (dataFim) where.data[Op.lte] = dataFim;
    }

    const queryOptions = {
      where,
      order: [['data', 'DESC']]
    };

    if (limit) {
      queryOptions.limit = limit;
    }

    return await HistoricoAuditoria.findAll(queryOptions);
  }

  /**
   * Buscar registros por ação
   */
  async buscarPorAcao(acao, opcoes = {}) {
    const { dataInicio, dataFim, limit } = opcoes;

    const where = { acao };
    
    if (dataInicio || dataFim) {
      where.data = {};
      if (dataInicio) where.data[Op.gte] = dataInicio;
      if (dataFim) where.data[Op.lte] = dataFim;
    }

    const queryOptions = {
      where,
      include: [{
        model: Usuario,
        as: 'usuario',
        attributes: ['id', 'nome', 'email']
      }],
      order: [['data', 'DESC']]
    };

    if (limit) {
      queryOptions.limit = limit;
    }

    return await HistoricoAuditoria.findAll(queryOptions);
  }
}

export default new HistoricoAuditoriaRepository();

