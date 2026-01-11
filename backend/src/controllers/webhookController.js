import WebhookLog from '../models/WebhookLog.js';
import Grupo from '../models/Grupo.js';
import Chamado from '../models/Chamado.js';
import { Op } from 'sequelize';

/**
 * Listar logs de webhooks
 */
export const listarLogs = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      grupo_id = '',
      evento = '',
      sucesso = '',
      chamado_id = ''
    } = req.query;

    // Construir filtros
    const where = {};

    if (grupo_id) where.grupo_id = grupo_id;
    if (evento) where.evento = evento;
    if (sucesso !== '') where.sucesso = sucesso === 'true';
    if (chamado_id) where.chamado_id = chamado_id;

    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 20;
    const pageFinal = (!isNaN(pageNum) && pageNum > 0) ? pageNum : 1;
    const limitFinal = (!isNaN(limitNum) && limitNum > 0) ? limitNum : 20;
    const offset = (pageFinal - 1) * limitFinal;

    const { count, rows: logs } = await WebhookLog.findAndCountAll({
      where,
      limit: limitFinal,
      offset: offset,
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
          attributes: ['id', 'titulo', 'status']
        }
      ]
    });

    res.json({
      logs,
      total: count,
      page: pageFinal,
      totalPages: Math.ceil(count / limitFinal)
    });
  } catch (error) {
    res.status(500).json({
      error: {
        message: error.message || 'Erro ao listar logs de webhook',
        status: 500
      }
    });
  }
};

/**
 * Buscar log por ID
 */
export const buscarLog = async (req, res) => {
  try {
    const { id } = req.params;
    const idNum = parseInt(id);
    if (isNaN(idNum) || idNum <= 0) {
      return res.status(400).json({
        error: {
          message: 'ID inválido',
          status: 400,
          code: 'INVALID_ID'
        }
      });
    }

    const log = await WebhookLog.findByPk(idNum, {
      include: [
        {
          model: Grupo,
          as: 'grupo',
          attributes: ['id', 'nome', 'webhook_url']
        },
        {
          model: Chamado,
          as: 'chamado',
          attributes: ['id', 'titulo', 'status', 'prioridade']
        }
      ]
    });

    if (!log) {
      return res.status(404).json({
        error: {
          message: 'Log não encontrado',
          status: 404
        }
      });
    }

    res.json({ log });
  } catch (error) {
    res.status(500).json({
      error: {
        message: error.message || 'Erro ao buscar log',
        status: 500
      }
    });
  }
};

/**
 * Estatísticas de webhooks
 */
export const estatisticas = async (req, res) => {
  try {
    const { grupo_id = null } = req.query;
    
    const where = {};
    if (grupo_id) where.grupo_id = grupo_id;

    const [
      total,
      sucesso,
      falha,
      porEvento,
      tempoMedioResposta,
      ultimos24h
    ] = await Promise.all([
      WebhookLog.count({ where }),
      WebhookLog.count({ where: { ...where, sucesso: true } }),
      WebhookLog.count({ where: { ...where, sucesso: false } }),
      WebhookLog.findAll({
        where,
        attributes: [
          'evento',
          [WebhookLog.sequelize.fn('COUNT', 'id'), 'count'],
          [WebhookLog.sequelize.fn('SUM', WebhookLog.sequelize.cast(WebhookLog.sequelize.col('sucesso'), 'integer')), 'sucessos']
        ],
        group: ['evento']
      }),
      WebhookLog.findOne({
        where: { ...where, tempo_resposta_ms: { [Op.ne]: null } },
        attributes: [[WebhookLog.sequelize.fn('AVG', WebhookLog.sequelize.col('tempo_resposta_ms')), 'media']]
      }),
      WebhookLog.count({
        where: {
          ...where,
          data_hora: {
            [Op.gte]: new Date(Date.now() - 24 * 60 * 60 * 1000)
          }
        }
      })
    ]);

    res.json({
      total,
      sucesso,
      falha,
      taxa_sucesso: total > 0 ? ((sucesso / total) * 100).toFixed(2) + '%' : '0%',
      por_evento: porEvento,
      tempo_medio_resposta_ms: Math.round(tempoMedioResposta?.dataValues?.media || 0),
      ultimos_24h: ultimos24h
    });
  } catch (error) {
    res.status(500).json({
      error: {
        message: error.message || 'Erro ao buscar estatísticas',
        status: 500
      }
    });
  }
};

/**
 * Retentar webhook falhado
 */
export const retentarWebhook = async (req, res) => {
  try {
    const { id } = req.params;
    const idNum = parseInt(id);
    if (isNaN(idNum) || idNum <= 0) {
      return res.status(400).json({
        error: {
          message: 'ID inválido',
          status: 400,
          code: 'INVALID_ID'
        }
      });
    }

    const log = await WebhookLog.findByPk(idNum, {
      include: [
        {
          model: Grupo,
          as: 'grupo'
        },
        {
          model: Chamado,
          as: 'chamado'
        }
      ]
    });

    if (!log) {
      return res.status(404).json({
        error: {
          message: 'Log não encontrado',
          status: 404
        }
      });
    }

    if (log.sucesso) {
      return res.status(400).json({
        error: {
          message: 'Webhook já foi executado com sucesso',
          status: 400
        }
      });
    }

    // Importar serviço e retentar
    const WebhookService = (await import('../services/webhookService.js')).default;
    
    const novoLog = await WebhookService.dispararWebhook(
      log.grupo_id,
      log.evento,
      log.payload.dados || {},
      1 // Nova tentativa
    );

    res.json({
      message: 'Webhook retentado',
      log: novoLog
    });
  } catch (error) {
    res.status(500).json({
      error: {
        message: error.message || 'Erro ao retentar webhook',
        status: 500
      }
    });
  }
};

export default {
  listarLogs,
  buscarLog,
  estatisticas,
  retentarWebhook
};

