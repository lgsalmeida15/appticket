import Chamado from '../models/Chamado.js';
import ChamadoTarefa from '../models/ChamadoTarefa.js';
import Usuario from '../models/Usuario.js';
import { Op } from 'sequelize';

/**
 * Repository para o endpoint agregado de calendário/Gantt.
 * Isola acesso direto ao Sequelize.
 */
class CalendarioRepository {
  /**
   * Chamados com prazo definido (ou já fechados) que caem dentro do
   * intervalo, usando data_abertura -> prazo/data_fechamento como período.
   */
  async buscarChamadosNoIntervalo(inicio, fim, filtros = {}) {
    const where = {
      [Op.or]: [
        { prazo: { [Op.between]: [inicio, fim] } },
        { data_abertura: { [Op.between]: [inicio, fim] } },
        {
          [Op.and]: [
            { data_abertura: { [Op.lte]: inicio } },
            {
              [Op.or]: [
                { prazo: { [Op.gte]: fim } },
                { prazo: null, data_fechamento: { [Op.gte]: fim } },
                { prazo: null, data_fechamento: null }
              ]
            }
          ]
        }
      ]
    };

    if (filtros.grupo_id) {
      where.grupo_id = filtros.grupo_id;
    }
    if (filtros.agente_id) {
      where.atribuido_a = filtros.agente_id;
    }

    return await Chamado.findAll({
      where,
      attributes: ['id', 'titulo', 'status', 'prioridade', 'grupo_id', 'atribuido_a', 'data_abertura', 'data_fechamento', 'prazo'],
      include: [{ model: Usuario, as: 'responsavel', attributes: ['id', 'nome'] }]
    });
  }

  /**
   * Tarefas com data_inicio_prevista/data_fim_prevista dentro do intervalo
   */
  async buscarTarefasNoIntervalo(inicio, fim, filtros = {}) {
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

    if (filtros.agente_id) {
      where.responsavel_id = filtros.agente_id;
    }

    const include = [{ model: Usuario, as: 'responsavel', attributes: ['id', 'nome'] }];

    if (filtros.grupo_id) {
      include.push({
        model: Chamado,
        as: 'chamado',
        attributes: ['id', 'grupo_id'],
        where: { grupo_id: filtros.grupo_id },
        required: true
      });
    } else {
      include.push({
        model: Chamado,
        as: 'chamado',
        attributes: ['id', 'grupo_id'],
        required: false
      });
    }

    return await ChamadoTarefa.findAll({ where, include });
  }
}

export default new CalendarioRepository();
