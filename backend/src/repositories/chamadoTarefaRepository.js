import ChamadoTarefa from '../models/ChamadoTarefa.js';
import Usuario from '../models/Usuario.js';
import { Op } from 'sequelize';

/**
 * Repository para operações de banco de dados relacionadas a tarefas de chamado
 * Isola acesso direto ao Sequelize
 */
class ChamadoTarefaRepository {
  async criar(dados) {
    return await ChamadoTarefa.create(dados);
  }

  async buscarPorId(id, opcoes = {}) {
    const include = [];

    if (opcoes.incluirResponsavel !== false) {
      include.push({
        model: Usuario,
        as: 'responsavel',
        attributes: ['id', 'nome', 'email']
      });
    }

    if (opcoes.incluirCriador !== false) {
      include.push({
        model: Usuario,
        as: 'criador',
        attributes: ['id', 'nome', 'email']
      });
    }

    return await ChamadoTarefa.findByPk(id, { include });
  }

  /**
   * Busca a tarefa garantindo que ela pertence ao chamado informado
   * (nunca confiar em tarefa_id isolado vindo do client sem cruzar com a rota)
   */
  async buscarPorIdEChamado(tarefaId, chamadoId, opcoes = {}) {
    const tarefa = await this.buscarPorId(tarefaId, opcoes);
    if (!tarefa || tarefa.chamado_id !== chamadoId) {
      return null;
    }
    return tarefa;
  }

  async buscarPorChamado(chamadoId) {
    return await ChamadoTarefa.findAll({
      where: { chamado_id: chamadoId },
      include: [
        { model: Usuario, as: 'responsavel', attributes: ['id', 'nome', 'email'] },
        { model: Usuario, as: 'criador', attributes: ['id', 'nome', 'email'] }
      ],
      order: [['created_at', 'ASC']]
    });
  }

  async atualizar(id, dados) {
    const tarefa = await ChamadoTarefa.findByPk(id);
    if (!tarefa) return null;
    await tarefa.update(dados);
    return tarefa;
  }

  /**
   * Conta tarefas "ativas" (não canceladas) de um chamado — usada para decidir
   * se o cronômetro direto do chamado deve ficar bloqueado.
   */
  async contarAtivasPorChamado(chamadoId) {
    return await ChamadoTarefa.count({
      where: {
        chamado_id: chamadoId,
        status: { [Op.ne]: 'cancelada' }
      }
    });
  }

  /**
   * Versão em lote de contarAtivasPorChamado, para telas de listagem (Kanban/Lista)
   */
  async contarAtivasPorChamados(chamadoIds) {
    if (!chamadoIds || chamadoIds.length === 0) return {};

    const resultado = await ChamadoTarefa.findAll({
      where: {
        chamado_id: { [Op.in]: chamadoIds },
        status: { [Op.ne]: 'cancelada' }
      },
      attributes: ['chamado_id'],
      raw: true
    });

    const mapa = {};
    for (const id of chamadoIds) mapa[id] = 0;
    for (const linha of resultado) mapa[linha.chamado_id] += 1;
    return mapa;
  }

  /**
   * Busca tarefas com pelo menos uma das datas previstas preenchidas, dentro
   * de um intervalo — usado pelo calendário/Gantt.
   */
  async buscarComPrazoNoIntervalo(inicio, fim, filtros = {}) {
    const where = {
      [Op.and]: [
        {
          [Op.or]: [
            { data_inicio_prevista: { [Op.ne]: null } },
            { data_fim_prevista: { [Op.ne]: null } }
          ]
        },
        {
          [Op.or]: [
            { data_inicio_prevista: { [Op.between]: [inicio, fim] } },
            { data_fim_prevista: { [Op.between]: [inicio, fim] } },
            {
              [Op.and]: [
                { data_inicio_prevista: { [Op.lte]: inicio } },
                { data_fim_prevista: { [Op.gte]: fim } }
              ]
            }
          ]
        }
      ]
    };

    if (filtros.responsavel_id) {
      where.responsavel_id = filtros.responsavel_id;
    }

    return await ChamadoTarefa.findAll({
      where,
      include: [
        { model: Usuario, as: 'responsavel', attributes: ['id', 'nome', 'email'] }
      ]
    });
  }
}

export default new ChamadoTarefaRepository();
