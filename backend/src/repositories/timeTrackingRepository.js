import TicketTimeTracking from '../models/TicketTimeTracking.js';
import Usuario from '../models/Usuario.js';
import Chamado from '../models/Chamado.js';
import { Op } from 'sequelize';
import sequelize from '../config/database.js';

/**
 * Repository para operações de banco de dados relacionadas a time tracking
 * Isola acesso direto ao Sequelize
 */
class TimeTrackingRepository {
  /**
   * Criar novo registro de time tracking
   */
  async criar(dados) {
    return await TicketTimeTracking.create({
      ...dados,
      inicio: dados.inicio || new Date()
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
    
    if (opcoes.incluirChamado) {
      include.push({
        model: Chamado,
        as: 'chamado',
        attributes: ['id', 'titulo', 'status']
      });
    }

    return await TicketTimeTracking.findByPk(id, { include });
  }

  /**
   * Buscar contagem ativa por chamado e usuário
   */
  async buscarAtivoPorChamadoEUsuario(chamadoId, usuarioId) {
    return await TicketTimeTracking.findOne({
      where: {
        chamado_id: chamadoId,
        usuario_id: usuarioId,
        fim: null
      },
      include: [{
        model: Usuario,
        as: 'usuario',
        attributes: ['id', 'nome', 'email']
      }]
    });
  }

  /**
   * Buscar todas as contagens de um chamado
   */
  async buscarTodosPorChamado(chamadoId, opcoes = {}) {
    return await TicketTimeTracking.findAll({
      where: { chamado_id: chamadoId },
      include: [{
        model: Usuario,
        as: 'usuario',
        attributes: ['id', 'nome', 'email']
      }],
      order: [['inicio', 'DESC']],
      ...opcoes
    });
  }

  /**
   * Buscar todas as contagens de um usuário
   */
  async buscarTodosPorUsuario(usuarioId, opcoes = {}) {
    const { dataInicio, dataFim, apenasAtivos = false } = opcoes;

    const where = { usuario_id: usuarioId };
    
    if (apenasAtivos) {
      where.fim = null;
    }
    
    if (dataInicio || dataFim) {
      where.inicio = {};
      if (dataInicio) where.inicio[Op.gte] = dataInicio;
      if (dataFim) where.inicio[Op.lte] = dataFim;
    }

    return await TicketTimeTracking.findAll({
      where,
      include: [{
        model: Chamado,
        as: 'chamado',
        attributes: ['id', 'titulo', 'status']
      }],
      order: [['inicio', 'DESC']]
    });
  }

  /**
   * Finalizar uma contagem
   */
  async finalizar(id, fim) {
    const registro = await TicketTimeTracking.findByPk(id);
    
    if (!registro) {
      return null;
    }

    // Calcular duração em minutos
    const inicio = new Date(registro.inicio);
    const fimDate = fim || new Date();
    const duracaoMs = fimDate.getTime() - inicio.getTime();
    const duracaoMinutos = Math.floor(duracaoMs / (1000 * 60));

    await registro.update({
      fim: fimDate,
      duracao_minutos: duracaoMinutos
    });

    return registro;
  }

  /**
   * Calcular total de minutos trabalhados em um chamado
   */
  async calcularTotalPorChamado(chamadoId) {
    const resultado = await TicketTimeTracking.findAll({
      where: {
        chamado_id: chamadoId,
        fim: { [Op.ne]: null } // Apenas contagens finalizadas
      },
      attributes: [
        [sequelize.fn('SUM', sequelize.col('duracao_minutos')), 'total_minutos']
      ],
      raw: true
    });

    return parseInt(resultado[0]?.total_minutos || 0);
  }

  /**
   * Calcular total de minutos trabalhados por um usuário
   */
  async calcularTotalPorUsuario(usuarioId, opcoes = {}) {
    const { dataInicio, dataFim } = opcoes;

    const where = {
      usuario_id: usuarioId,
      fim: { [Op.ne]: null } // Apenas contagens finalizadas
    };

    if (dataInicio || dataFim) {
      where.inicio = {};
      if (dataInicio) where.inicio[Op.gte] = dataInicio;
      if (dataFim) where.inicio[Op.lte] = dataFim;
    }

    const resultado = await TicketTimeTracking.findAll({
      where,
      attributes: [
        [sequelize.fn('SUM', sequelize.col('duracao_minutos')), 'total_minutos']
      ],
      raw: true
    });

    return parseInt(resultado[0]?.total_minutos || 0);
  }

  /**
   * Buscar contagem ativa do usuário (qualquer chamado)
   */
  async buscarContagemAtivaDoUsuario(usuarioId) {
    return await TicketTimeTracking.findOne({
      where: {
        usuario_id: usuarioId,
        fim: null
      },
      include: [{
        model: Chamado,
        as: 'chamado',
        attributes: ['id', 'titulo', 'status']
      }],
      order: [['inicio', 'DESC']]
    });
  }
}

export default new TimeTrackingRepository();

