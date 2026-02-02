import BaseRepository from './BaseRepository.js';
import { SolutionCategory } from '../models/index.js';
import { Op } from 'sequelize';

class SolutionCategoryRepository extends BaseRepository {
  constructor() {
    super(SolutionCategory);
  }

  /**
   * Buscar categorias ativas
   * @returns {Promise<Array>}
   */
  async findActive() {
    return await this.model.findAll({
      where: { ativo: true },
      order: [
        ['categoria_nivel_1', 'ASC'],
        ['categoria_nivel_2', 'ASC'],
        ['categoria_nivel_3', 'ASC']
      ]
    });
  }

  /**
   * Buscar todas as categorias (incluindo inativas)
   * @returns {Promise<Array>}
   */
  async findAll() {
    return await this.model.findAll({
      order: [
        ['ativo', 'DESC'],
        ['categoria_nivel_1', 'ASC'],
        ['categoria_nivel_2', 'ASC'],
        ['categoria_nivel_3', 'ASC']
      ]
    });
  }

  /**
   * Buscar por ID
   * @param {number} id
   * @returns {Promise<Object|null>}
   */
  async findById(id) {
    return await this.model.findByPk(id);
  }

  /**
   * Criar nova categoria
   * @param {Object} dados
   * @returns {Promise<Object>}
   */
  async create(dados) {
    return await this.model.create(dados);
  }

  /**
   * Atualizar categoria
   * @param {number} id
   * @param {Object} dados
   * @returns {Promise<Object>}
   */
  async update(id, dados) {
    const categoria = await this.findById(id);
    if (!categoria) {
      throw new Error('Categoria não encontrada');
    }
    return await categoria.update(dados);
  }

  /**
   * Deletar categoria (hard delete)
   * @param {number} id
   * @returns {Promise<boolean>}
   */
  async delete(id) {
    const categoria = await this.findById(id);
    if (!categoria) {
      throw new Error('Categoria não encontrada');
    }
    await categoria.destroy();
    return true;
  }

  /**
   * Buscar categorias por nível 1
   * @param {string} nivel1
   * @returns {Promise<Array>}
   */
  async findByLevel1(nivel1) {
    return await this.model.findAll({
      where: { 
        categoria_nivel_1: nivel1,
        ativo: true
      },
      order: [
        ['categoria_nivel_2', 'ASC'],
        ['categoria_nivel_3', 'ASC']
      ]
    });
  }

  /**
   * Buscar categorias por nível 1 e 2
   * @param {string} nivel1
   * @param {string} nivel2
   * @returns {Promise<Array>}
   */
  async findByLevel1And2(nivel1, nivel2) {
    return await this.model.findAll({
      where: { 
        categoria_nivel_1: nivel1,
        categoria_nivel_2: nivel2,
        ativo: true
      },
      order: [['categoria_nivel_3', 'ASC']]
    });
  }

  /**
   * Buscar níveis 1 únicos
   * @returns {Promise<Array>}
   */
  async findUniqueLevel1() {
    const categorias = await this.model.findAll({
      attributes: ['categoria_nivel_1'],
      where: { ativo: true },
      group: ['categoria_nivel_1'],
      order: [['categoria_nivel_1', 'ASC']]
    });
    return categorias.map(c => c.categoria_nivel_1);
  }

  /**
   * Buscar níveis 2 únicos para um nível 1
   * @param {string} nivel1
   * @returns {Promise<Array>}
   */
  async findUniqueLevel2(nivel1) {
    const categorias = await this.model.findAll({
      attributes: ['categoria_nivel_2'],
      where: { 
        categoria_nivel_1: nivel1,
        ativo: true
      },
      group: ['categoria_nivel_2'],
      order: [['categoria_nivel_2', 'ASC']]
    });
    return categorias.map(c => c.categoria_nivel_2);
  }

  /**
   * Buscar níveis 3 únicos para um nível 1 e 2
   * @param {string} nivel1
   * @param {string} nivel2
   * @returns {Promise<Array>}
   */
  async findUniqueLevel3(nivel1, nivel2) {
    const categorias = await this.model.findAll({
      attributes: ['categoria_nivel_3'],
      where: { 
        categoria_nivel_1: nivel1,
        categoria_nivel_2: nivel2,
        ativo: true
      },
      group: ['categoria_nivel_3'],
      order: [['categoria_nivel_3', 'ASC']]
    });
    return categorias.map(c => c.categoria_nivel_3);
  }

  /**
   * Verificar se categoria já existe
   * @param {string} nivel1
   * @param {string} nivel2
   * @param {string} nivel3
   * @param {number} excludeId - ID para excluir da busca (útil para updates)
   * @returns {Promise<boolean>}
   */
  async exists(nivel1, nivel2, nivel3, excludeId = null) {
    const where = {
      categoria_nivel_1: nivel1,
      categoria_nivel_2: nivel2,
      categoria_nivel_3: nivel3
    };

    if (excludeId) {
      where.id = { [Op.ne]: excludeId };
    }

    const count = await this.model.count({ where });
    return count > 0;
  }
}

export default new SolutionCategoryRepository();

