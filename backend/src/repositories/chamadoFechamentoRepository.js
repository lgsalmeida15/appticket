import BaseRepository from './BaseRepository.js';
import { ChamadoFechamento, SolutionCategory, Usuario } from '../models/index.js';

class ChamadoFechamentoRepository extends BaseRepository {
  constructor() {
    super(ChamadoFechamento);
  }

  /**
   * Buscar fechamento por ID do chamado
   * @param {number} chamadoId
   * @returns {Promise<Object|null>}
   */
  async findByChamadoId(chamadoId) {
    return await this.model.findOne({
      where: { chamado_id: chamadoId },
      include: [
        {
          model: SolutionCategory,
          as: 'categoria_solucao',
          attributes: ['id', 'categoria_nivel_1', 'categoria_nivel_2', 'categoria_nivel_3']
        },
        {
          model: Usuario,
          as: 'usuario_fechamento',
          attributes: ['id', 'nome', 'email']
        }
      ]
    });
  }

  /**
   * Criar fechamento
   * @param {Object} dados
   * @returns {Promise<Object>}
   */
  async create(dados) {
    const fechamento = await this.model.create(dados);
    return await this.findByChamadoId(fechamento.chamado_id);
  }

  /**
   * Verificar se chamado já possui fechamento
   * @param {number} chamadoId
   * @returns {Promise<boolean>}
   */
  async exists(chamadoId) {
    const count = await this.model.count({
      where: { chamado_id: chamadoId }
    });
    return count > 0;
  }

  /**
   * Buscar fechamentos por categoria de solução
   * @param {number} categoriaId
   * @returns {Promise<Array>}
   */
  async findByCategoria(categoriaId) {
    return await this.model.findAll({
      where: { categoria_solucao_id: categoriaId },
      include: [
        {
          model: SolutionCategory,
          as: 'categoria_solucao'
        },
        {
          model: Usuario,
          as: 'usuario_fechamento',
          attributes: ['id', 'nome', 'email']
        }
      ],
      order: [['created_at', 'DESC']]
    });
  }

  /**
   * Buscar fechamentos por usuário
   * @param {number} usuarioId
   * @returns {Promise<Array>}
   */
  async findByUsuario(usuarioId) {
    return await this.model.findAll({
      where: { usuario_fechamento_id: usuarioId },
      include: [
        {
          model: SolutionCategory,
          as: 'categoria_solucao'
        }
      ],
      order: [['created_at', 'DESC']]
    });
  }
}

export default new ChamadoFechamentoRepository();

