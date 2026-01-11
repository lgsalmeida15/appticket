import { Op, Sequelize } from 'sequelize';
import { Chamado, Grupo, Usuario, TicketTimeTracking } from '../models/index.js';

/**
 * Repository para queries complexas do Dashboard
 * Centraliza queries agregadas e complexas
 */
class DashboardRepository {
  /**
   * Buscar totais por status
   * @param {Object} where - Filtros where
   * @returns {Promise<Object>} Objeto com contagens por status
   */
  async buscarPorStatus(where = {}) {
    const resultados = await Chamado.findAll({
      where,
      attributes: [
        'status',
        [Sequelize.fn('COUNT', Sequelize.col('id')), 'total']
      ],
      group: ['status'],
      raw: true
    });

    // Formatar resultado
    const formatado = {
      novo: 0,
      em_andamento: 0,
      aguardando: 0,
      resolvido: 0,
      fechado: 0,
      cancelado: 0
    };

    resultados.forEach(r => {
      formatado[r.status] = parseInt(r.total) || 0;
    });

    return formatado;
  }

  /**
   * Buscar totais por grupo
   * @param {Object} where - Filtros where
   * @returns {Promise<Array>} Array de objetos { grupo_id, grupo_nome, total }
   */
  async buscarPorGrupo(where = {}) {
    const resultados = await Chamado.findAll({
      where,
      attributes: [
        'grupo_id',
        [Sequelize.fn('COUNT', Sequelize.col('chamado.id')), 'total']
      ],
      include: [{
        model: Grupo,
        as: 'grupo',
        attributes: ['id', 'nome']
      }],
      group: ['grupo_id', 'grupo.id', 'grupo.nome'],
      raw: false
    });

    return resultados.map(r => ({
      grupo_id: r.grupo_id,
      grupo_nome: r.grupo?.nome || 'Sem grupo',
      total: parseInt(r.getDataValue('total')) || 0
    }));
  }

  /**
   * Buscar totais por agente (responsável)
   * @param {Object} where - Filtros where
   * @returns {Promise<Array>} Array de objetos { agente_id, agente_nome, agente_email, total }
   */
  async buscarPorAgente(where = {}) {
    // Adicionar filtro para apenas chamados atribuídos
    const whereAtribuido = {
      ...where,
      atribuido_a: { [Op.ne]: null }
    };

    const resultados = await Chamado.findAll({
      where: whereAtribuido,
      attributes: [
        'atribuido_a',
        [Sequelize.fn('COUNT', Sequelize.col('chamado.id')), 'total']
      ],
      include: [{
        model: Usuario,
        as: 'responsavel',
        attributes: ['id', 'nome', 'email']
      }],
      group: ['atribuido_a', 'responsavel.id', 'responsavel.nome', 'responsavel.email'],
      raw: false
    });

    return resultados.map(r => ({
      agente_id: r.atribuido_a,
      agente_nome: r.responsavel?.nome || 'Não atribuído',
      agente_email: r.responsavel?.email || null,
      total: parseInt(r.getDataValue('total')) || 0
    }));
  }

  /**
   * Buscar horas trabalhadas por agente
   * @param {Object} filtros - Filtros de data { dataInicio, dataFim }
   * @returns {Promise<Array>} Array de objetos { agente_id, agente_nome, agente_email, total_minutos, horas }
   */
  async buscarHorasTrabalhadasPorAgente(filtros = {}) {
    const where = {
      fim: { [Op.ne]: null } // Apenas contagens finalizadas
    };

    if (filtros.dataInicio || filtros.dataFim) {
      where.inicio = {};
      if (filtros.dataInicio) where.inicio[Op.gte] = new Date(filtros.dataInicio);
      if (filtros.dataFim) {
        const fimDate = new Date(filtros.dataFim);
        fimDate.setHours(23, 59, 59, 999);
        where.inicio[Op.lte] = fimDate;
      }
    }

    const resultados = await TicketTimeTracking.findAll({
      where,
      attributes: [
        'usuario_id',
        [Sequelize.fn('SUM', Sequelize.col('duracao_minutos')), 'total_minutos']
      ],
      include: [{
        model: Usuario,
        as: 'usuario',
        attributes: ['id', 'nome', 'email']
      }],
      group: ['usuario_id', 'usuario.id', 'usuario.nome', 'usuario.email'],
      raw: false
    });

    return resultados.map(r => {
      const totalMinutos = parseInt(r.getDataValue('total_minutos')) || 0;
      return {
        agente_id: r.usuario_id,
        agente_nome: r.usuario?.nome || 'Desconhecido',
        agente_email: r.usuario?.email || null,
        total_minutos: totalMinutos,
        horas: parseFloat((totalMinutos / 60).toFixed(2))
      };
    });
  }
}

export default new DashboardRepository();

