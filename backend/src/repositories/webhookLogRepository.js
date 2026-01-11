import WebhookLog from '../models/WebhookLog.js';
import Grupo from '../models/Grupo.js';
import Chamado from '../models/Chamado.js';
import { Op } from 'sequelize';

/**
 * Repository para operações de banco de dados relacionadas a logs de webhook
 * Isola acesso direto ao Sequelize
 */
class WebhookLogRepository {
  /**
   * Criar novo log de webhook
   */
  async criar(dados) {
    return await WebhookLog.create(dados);
  }

  /**
   * Buscar log por ID
   */
  async buscarPorId(id, opcoes = {}) {
    const include = [];
    
    if (opcoes.incluirGrupo !== false) {
      include.push({
        model: Grupo,
        as: 'grupo',
        attributes: ['id', 'nome']
      });
    }
    
    if (opcoes.incluirChamado) {
      include.push({
        model: Chamado,
        as: 'chamado',
        attributes: ['id', 'titulo', 'status']
      });
    }

    return await WebhookLog.findByPk(id, { include });
  }

  /**
   * Listar logs com filtros
   */
  async listar(filtros = {}, paginacao = {}) {
    const {
      page = 1,
      limit = 10,
      grupo_id,
      chamado_id,
      evento,
      sucesso,
      dataInicio,
      dataFim,
      whereCustom
    } = filtros;

    const where = {};
    
    if (grupo_id) where.grupo_id = grupo_id;
    if (chamado_id) where.chamado_id = chamado_id;
    if (evento) where.evento = evento;
    if (sucesso !== undefined) where.sucesso = sucesso;
    
    if (dataInicio || dataFim) {
      where.data_hora = {};
      if (dataInicio) where.data_hora[Op.gte] = dataInicio;
      if (dataFim) where.data_hora[Op.lte] = dataFim;
    }
    
    if (whereCustom) {
      Object.assign(where, whereCustom);
    }

    const offset = (page - 1) * limit;

    const { count, rows } = await WebhookLog.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['data_hora', 'DESC']],
      include: [
        {
          model: Grupo,
          as: 'grupo',
          attributes: ['id', 'nome']
        },
        {
          model: Chamado,
          as: 'chamado',
          attributes: ['id', 'titulo']
        }
      ]
    });

    return {
      logs: rows,
      total: count,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(count / limit)
    };
  }

  /**
   * Buscar logs de um grupo
   */
  async buscarPorGrupo(grupoId, opcoes = {}) {
    const { evento, sucesso, limit } = opcoes;
    
    const where = { grupo_id: grupoId };
    if (evento) where.evento = evento;
    if (sucesso !== undefined) where.sucesso = sucesso;

    const queryOptions = {
      where,
      include: [{
        model: Chamado,
        as: 'chamado',
        attributes: ['id', 'titulo', 'status']
      }],
      order: [['data_hora', 'DESC']]
    };

    if (limit) {
      queryOptions.limit = limit;
    }

    return await WebhookLog.findAll(queryOptions);
  }

  /**
   * Buscar logs de um chamado
   */
  async buscarPorChamado(chamadoId, opcoes = {}) {
    const { evento, sucesso } = opcoes;
    
    const where = { chamado_id: chamadoId };
    if (evento) where.evento = evento;
    if (sucesso !== undefined) where.sucesso = sucesso;

    return await WebhookLog.findAll({
      where,
      include: [{
        model: Grupo,
        as: 'grupo',
        attributes: ['id', 'nome']
      }],
      order: [['data_hora', 'DESC']]
    });
  }

  /**
   * Buscar logs com falha
   */
  async buscarFalhas(opcoes = {}) {
    const { grupo_id, dataInicio, dataFim, limit } = opcoes;
    
    const where = { sucesso: false };
    if (grupo_id) where.grupo_id = grupo_id;
    
    if (dataInicio || dataFim) {
      where.data_hora = {};
      if (dataInicio) where.data_hora[Op.gte] = dataInicio;
      if (dataFim) where.data_hora[Op.lte] = dataFim;
    }

    const queryOptions = {
      where,
      include: [
        {
          model: Grupo,
          as: 'grupo',
          attributes: ['id', 'nome']
        },
        {
          model: Chamado,
          as: 'chamado',
          attributes: ['id', 'titulo']
        }
      ],
      order: [['data_hora', 'DESC']]
    };

    if (limit) {
      queryOptions.limit = limit;
    }

    return await WebhookLog.findAll(queryOptions);
  }

  /**
   * Contar logs por status
   */
  async contarPorStatus(filtros = {}) {
    const { grupo_id, dataInicio, dataFim } = filtros;
    
    const where = {};
    if (grupo_id) where.grupo_id = grupo_id;
    
    if (dataInicio || dataFim) {
      where.data_hora = {};
      if (dataInicio) where.data_hora[Op.gte] = dataInicio;
      if (dataFim) where.data_hora[Op.lte] = dataFim;
    }

    const total = await WebhookLog.count({ where });
    const sucesso = await WebhookLog.count({ where: { ...where, sucesso: true } });
    const falha = await WebhookLog.count({ where: { ...where, sucesso: false } });

    return { total, sucesso, falha };
  }
}

export default new WebhookLogRepository();

