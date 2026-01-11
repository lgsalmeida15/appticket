import Chamado from '../models/Chamado.js';
import Usuario from '../models/Usuario.js';
import Grupo from '../models/Grupo.js';
import Historico from '../models/Historico.js';
import Comentario from '../models/Comentario.js';
import { Op } from 'sequelize';

/**
 * Repository para operações de banco de dados relacionadas a chamados
 * Isola acesso direto ao Sequelize
 */
class ChamadoRepository {
  /**
   * Criar novo chamado
   */
  async criar(dados) {
    return await Chamado.create(dados);
  }

  /**
   * Buscar chamado por ID
   */
  async buscarPorId(id, opcoes = {}) {
    const include = [];
    
    if (opcoes.incluirCriador !== false) {
      include.push({
        model: Usuario,
        as: 'criador',
        attributes: ['id', 'nome', 'email', 'tipo']
      });
    }
    
    if (opcoes.incluirResponsavel !== false) {
      include.push({
        model: Usuario,
        as: 'responsavel',
        attributes: ['id', 'nome', 'email', 'tipo']
      });
    }
    
    if (opcoes.incluirGrupo !== false) {
      include.push({
        model: Grupo,
        as: 'grupo',
        attributes: ['id', 'nome', 'descricao']
      });
    }

    if (opcoes.incluirGrupoExecutor !== false) {
      include.push({
        model: Grupo,
        as: 'grupoExecutor',
        attributes: ['id', 'nome', 'descricao'],
        required: false,
        include: [{
          model: Usuario,
          as: 'usuarios',
          attributes: ['id', 'nome', 'email', 'tipo'],
          through: { attributes: [] },
          required: false
        }]
      });
    }
    
    if (opcoes.incluirHistorico) {
      include.push({
        model: Historico,
        as: 'historico',
        include: [{
          model: Usuario,
          as: 'usuario',
          attributes: ['id', 'nome']
        }],
        order: [['data_hora', 'DESC']]
      });
    }
    
    if (opcoes.incluirComentarios) {
      include.push({
        model: Comentario,
        as: 'comentarios',
        include: [{
          model: Usuario,
          as: 'usuario',
          attributes: ['id', 'nome', 'email']
        }],
        order: [['data_hora', 'ASC']]
      });
    }

    if (opcoes.incluirPai) {
      include.push({
        model: Chamado,
        as: 'pai',
        attributes: ['id', 'titulo', 'status', 'prioridade'],
        required: false,
        include: [{
          model: Usuario,
          as: 'criador',
          attributes: ['id', 'nome', 'email']
        }]
      });
    }

    if (opcoes.incluirFilhos) {
      include.push({
        model: Chamado,
        as: 'filhos',
        attributes: ['id', 'titulo', 'status', 'prioridade', 'tipo'],
        required: false,
        include: [{
          model: Usuario,
          as: 'criador',
          attributes: ['id', 'nome', 'email']
        }],
        order: [['created_at', 'ASC']]
      });
    }

    return await Chamado.findByPk(id, { include });
  }

  /**
   * Listar chamados com filtros e paginação
   */
  async listar(filtros = {}, paginacao = {}) {
    const {
      page = 1,
      limit = 10,
      search,
      status,
      prioridade,
      tipo,
      grupo_id,
      grupo_executor_id,
      usuario_id,
      atribuido_a,
      numero_chamado,
      data_inicio,
      data_fim,
      whereCustom
    } = filtros;

    const where = {};
    
    // Busca por número do chamado (ID)
    if (numero_chamado) {
      const id = parseInt(numero_chamado);
      if (!isNaN(id)) {
        where.id = id;
      }
    }
    
    // Busca textual (título e descrição)
    if (search && !numero_chamado) {
      where[Op.or] = [
        { titulo: { [Op.iLike]: `%${search}%` } },
        { descricao: { [Op.iLike]: `%${search}%` } }
      ];
    }

    // Filtro por data de abertura
    if (data_inicio || data_fim) {
      where.data_abertura = {};
      if (data_inicio) {
        where.data_abertura[Op.gte] = new Date(data_inicio);
      }
      if (data_fim) {
        // Adicionar 1 dia e subtrair 1 milissegundo para incluir todo o dia final
        const dataFim = new Date(data_fim);
        dataFim.setHours(23, 59, 59, 999);
        where.data_abertura[Op.lte] = dataFim;
      }
    }

    if (status) {
      if (Array.isArray(status)) {
        where.status = { [Op.in]: status };
      } else {
        where.status = status;
      }
    }
    
    if (prioridade) {
      if (Array.isArray(prioridade)) {
        where.prioridade = { [Op.in]: prioridade };
      } else {
        where.prioridade = prioridade;
      }
    }
    
    if (tipo) {
      if (Array.isArray(tipo)) {
        where.tipo = { [Op.in]: tipo };
      } else {
        where.tipo = tipo;
      }
    }
    
    if (grupo_id) {
      if (Array.isArray(grupo_id)) {
        where.grupo_id = { [Op.in]: grupo_id };
      } else {
        where.grupo_id = grupo_id;
      }
    }
    
    // Filtro por grupo executor
    if (grupo_executor_id) {
      if (Array.isArray(grupo_executor_id)) {
        where.grupo_executor_id = { [Op.in]: grupo_executor_id };
      } else {
        where.grupo_executor_id = grupo_executor_id;
      }
    }
    
    if (usuario_id) {
      if (Array.isArray(usuario_id)) {
        where.usuario_id = { [Op.in]: usuario_id };
      } else {
        where.usuario_id = usuario_id;
      }
    }
    
    if (atribuido_a !== undefined) {
      if (atribuido_a === null || atribuido_a === 'null') {
        where.atribuido_a = null;
      } else {
        where.atribuido_a = atribuido_a;
      }
    }
    
    // Mesclar filtros customizados
    if (whereCustom) {
      Object.assign(where, whereCustom);
    }

    const offset = (page - 1) * limit;

    const { count, rows } = await Chamado.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['created_at', 'DESC']],
      include: [
        {
          model: Usuario,
          as: 'criador',
          attributes: ['id', 'nome', 'email']
        },
        {
          model: Usuario,
          as: 'responsavel',
          attributes: ['id', 'nome', 'email']
        },
        {
          model: Grupo,
          as: 'grupo',
          attributes: ['id', 'nome', 'descricao']
        },
        {
          model: Grupo,
          as: 'grupoExecutor',
          attributes: ['id', 'nome'],
          required: false
        }
      ]
    });

    return {
      chamados: rows,
      total: count,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(count / limit)
    };
  }

  /**
   * Atualizar chamado
   */
  async atualizar(id, dados) {
    const chamado = await Chamado.findByPk(id);
    if (!chamado) {
      return null;
    }
    
    await chamado.update(dados);
    return chamado;
  }

  /**
   * Deletar chamado (soft delete via status)
   */
  async deletar(id) {
    const chamado = await Chamado.findByPk(id);
    if (!chamado) {
      return null;
    }
    
    await chamado.update({ status: 'cancelado' });
    return chamado;
  }

  /**
   * Deletar chamado permanentemente (hard delete)
   * Deleta também: Historico, Comentario, SLAResultado, TicketTimeTracking, WebhookLog (CASCADE)
   */
  async deletarPermanente(id) {
    const chamado = await Chamado.findByPk(id);
    if (!chamado) {
      return null;
    }
    
    // Destroy vai deletar o chamado e todos os relacionamentos em CASCADE
    await chamado.destroy();
    return chamado;
  }

  /**
   * Contar chamados por status
   */
  async contarPorStatus(filtros = {}) {
    const { whereCustom } = filtros;
    const where = whereCustom || {};
    
    const statuses = ['novo', 'em_andamento', 'aguardando', 'resolvido', 'fechado', 'cancelado'];
    const counts = {};
    
    for (const status of statuses) {
      counts[status] = await Chamado.count({
        where: { ...where, status }
      });
    }
    
    return counts;
  }

  /**
   * Contar chamados por prioridade
   */
  async contarPorPrioridade(filtros = {}) {
    const { whereCustom } = filtros;
    const where = whereCustom || {};
    
    const prioridades = ['baixa', 'media', 'alta', 'urgente'];
    const counts = {};
    
    for (const prioridade of prioridades) {
      counts[prioridade] = await Chamado.count({
        where: { ...where, prioridade }
      });
    }
    
    return counts;
  }

  /**
   * Contar chamados por tipo
   */
  async contarPorTipo(filtros = {}) {
    const { whereCustom } = filtros;
    const where = whereCustom || {};
    
    const tipos = ['incidente', 'requisicao', 'problema', 'mudanca'];
    const counts = {};
    
    for (const tipo of tipos) {
      counts[tipo] = await Chamado.count({
        where: { ...where, tipo }
      });
    }
    
    return counts;
  }

  /**
   * Buscar chamados por grupo
   */
  async buscarPorGrupo(grupoId, opcoes = {}) {
    return await Chamado.findAll({
      where: { grupo_id: grupoId, ...opcoes.where },
      include: [
        {
          model: Usuario,
          as: 'criador',
          attributes: ['id', 'nome', 'email']
        },
        {
          model: Usuario,
          as: 'responsavel',
          attributes: ['id', 'nome', 'email']
        }
      ],
      order: [['created_at', 'DESC']],
      ...opcoes
    });
  }

  /**
   * Buscar chamados atribuídos a um usuário
   */
  async buscarPorResponsavel(usuarioId, opcoes = {}) {
    return await Chamado.findAll({
      where: { atribuido_a: usuarioId, ...opcoes.where },
      include: [
        {
          model: Usuario,
          as: 'criador',
          attributes: ['id', 'nome', 'email']
        },
        {
          model: Grupo,
          as: 'grupo',
          attributes: ['id', 'nome']
        }
      ],
      order: [['created_at', 'DESC']],
      ...opcoes
    });
  }

  /**
   * Contar total de chamados
   */
  async contarTotal(filtros = {}) {
    const { whereCustom } = filtros;
    return await Chamado.count({ where: whereCustom || {} });
  }

  /**
   * Buscar todos os filhos de um chamado pai
   * @param {number} chamadoPaiId - ID do chamado pai
   * @returns {Promise<Array>} Lista de chamados filhos
   */
  async buscarFilhosPorPaiId(chamadoPaiId) {
    return await Chamado.findAll({
      where: { chamado_pai_id: chamadoPaiId },
      include: [
        {
          model: Usuario,
          as: 'criador',
          attributes: ['id', 'nome', 'email']
        },
        {
          model: Usuario,
          as: 'responsavel',
          attributes: ['id', 'nome', 'email']
        },
        {
          model: Grupo,
          as: 'grupo',
          attributes: ['id', 'nome']
        }
      ],
      order: [['created_at', 'ASC']]
    });
  }

  /**
   * Verificar se um chamado pai tem filhos com status ativo
   * Status ativos: 'novo', 'em_andamento', 'aguardando'
   * @param {number} chamadoPaiId - ID do chamado pai
   * @returns {Promise<{temFilhosAtivos: boolean, filhosAtivos: Array}>}
   */
  async verificarTemFilhosAtivos(chamadoPaiId) {
    const filhosAtivos = await Chamado.findAll({
      where: {
        chamado_pai_id: chamadoPaiId,
        status: {
          [Op.in]: ['novo', 'em_andamento', 'aguardando']
        }
      },
      attributes: ['id', 'titulo', 'status', 'prioridade'],
      include: [{
        model: Usuario,
        as: 'criador',
        attributes: ['id', 'nome']
      }],
      order: [['created_at', 'ASC']]
    });

    return {
      temFilhosAtivos: filhosAtivos.length > 0,
      filhosAtivos: filhosAtivos.map(f => f.toJSON ? f.toJSON() : f)
    };
  }

  /**
   * Verificar se um chamado já possui um pai associado
   * @param {number} chamadoId - ID do chamado filho
   * @returns {Promise<boolean>}
   */
  async temPai(chamadoId) {
    const chamado = await Chamado.findByPk(chamadoId, {
      attributes: ['id', 'chamado_pai_id']
    });
    return chamado && chamado.chamado_pai_id !== null;
  }

  /**
   * Verificar se um chamado é pai (tem filhos)
   * @param {number} chamadoId - ID do chamado
   * @returns {Promise<boolean>}
   */
  async temFilhos(chamadoId) {
    const count = await Chamado.count({
      where: { chamado_pai_id: chamadoId }
    });
    return count > 0;
  }
}

export default new ChamadoRepository();

