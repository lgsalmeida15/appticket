import Historico from '../models/Historico.js';
import Usuario from '../models/Usuario.js';
import Chamado from '../models/Chamado.js';
import { Op } from 'sequelize';

/**
 * Repository para operações de banco de dados relacionadas ao histórico
 * Isola acesso direto ao Sequelize
 */
class HistoricoRepository {
  /**
   * Criar novo registro de histórico
   */
  async criar(dados) {
    return await Historico.create({
      ...dados,
      data_hora: dados.data_hora || new Date()
    });
  }

  /**
   * Buscar histórico por ID
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
    
    if (opcoes.incluirChamado) {
      include.push({
        model: Chamado,
        as: 'chamado',
        attributes: ['id', 'titulo', 'status']
      });
    }

    return await Historico.findByPk(id, { include });
  }

  /**
   * Listar histórico de um chamado
   */
  async listarPorChamado(chamadoId, opcoes = {}) {
    const {
      acao,
      limit,
      ordenar = 'DESC'
    } = opcoes;

    const where = { chamado_id: chamadoId };
    if (acao) {
      where.acao = acao;
    }

    const queryOptions = {
      where,
      include: [{
        model: Usuario,
        as: 'usuario',
        attributes: ['id', 'nome']
      }],
      order: [['data_hora', ordenar]]
    };

    if (limit) {
      queryOptions.limit = limit;
    }

    return await Historico.findAll(queryOptions);
  }

  /**
   * Buscar histórico por usuário
   */
  async buscarPorUsuario(usuarioId, opcoes = {}) {
    const {
      entidade,
      acao,
      dataInicio,
      dataFim,
      limit
    } = opcoes;

    const where = { usuario_id: usuarioId };
    
    if (acao) where.acao = acao;
    if (entidade) where.entidade = entidade;
    
    if (dataInicio || dataFim) {
      where.data_hora = {};
      if (dataInicio) where.data_hora[Op.gte] = dataInicio;
      if (dataFim) where.data_hora[Op.lte] = dataFim;
    }

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

    return await Historico.findAll(queryOptions);
  }

  /**
   * Buscar histórico por ação
   */
  async buscarPorAcao(acao, opcoes = {}) {
    const { dataInicio, dataFim, limit } = opcoes;

    const where = { acao };
    
    if (dataInicio || dataFim) {
      where.data_hora = {};
      if (dataInicio) where.data_hora[Op.gte] = dataInicio;
      if (dataFim) where.data_hora[Op.lte] = dataFim;
    }

    const queryOptions = {
      where,
      include: [
        {
          model: Usuario,
          as: 'usuario',
          attributes: ['id', 'nome', 'email']
        },
        {
          model: Chamado,
          as: 'chamado',
          attributes: ['id', 'titulo', 'status']
        }
      ],
      order: [['data_hora', 'DESC']]
    };

    if (limit) {
      queryOptions.limit = limit;
    }

    return await Historico.findAll(queryOptions);
  }

  /**
   * Contar histórico de um chamado
   */
  async contarPorChamado(chamadoId, opcoes = {}) {
    const { acao } = opcoes;
    const where = { chamado_id: chamadoId };
    if (acao) where.acao = acao;
    
    return await Historico.count({ where });
  }

  /**
   * Buscar último histórico de um chamado
   */
  async buscarUltimoPorChamado(chamadoId, opcoes = {}) {
    const { acao } = opcoes;
    const where = { chamado_id: chamadoId };
    if (acao) where.acao = acao;

    return await Historico.findOne({
      where,
      include: [{
        model: Usuario,
        as: 'usuario',
        attributes: ['id', 'nome']
      }],
      order: [['data_hora', 'DESC']]
    });
  }

  /**
   * Listar todas as ações disponíveis
   */
  async listarAcoes() {
    const acoes = await Historico.findAll({
      attributes: [[Historico.sequelize.fn('DISTINCT', Historico.sequelize.col('acao')), 'acao']],
      raw: true
    });

    return acoes.map(a => a.acao);
  }
}

export default new HistoricoRepository();

