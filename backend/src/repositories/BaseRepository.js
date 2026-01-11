/**
 * Classe Base Repository
 * Fornece métodos comuns para todos os repositories
 */
class BaseRepository {
  constructor(model) {
    this.model = model;
  }

  /**
   * Criar novo registro
   * @param {Object} dados - Dados para criação
   * @returns {Promise<Object>} Instância criada
   */
  async criar(dados) {
    const instance = await this.model.create(dados);
    return instance;
  }

  /**
   * Buscar por ID
   * @param {Number} id - ID do registro
   * @param {Object} opcoes - Opções de busca (include, attributes, etc)
   * @returns {Promise<Object|null>} Instância encontrada ou null
   */
  async buscarPorId(id, opcoes = {}) {
    const { include, attributes, ...outrasOpcoes } = opcoes;
    
    const options = {
      where: { id: parseInt(id) },
      ...outrasOpcoes
    };

    if (include) {
      options.include = include;
    }

    if (attributes) {
      options.attributes = attributes;
    }

    const instance = await this.model.findOne(options);
    return instance;
  }

  /**
   * Atualizar registro
   * @param {Number} id - ID do registro
   * @param {Object} dados - Dados para atualização
   * @returns {Promise<Array>} [numeroDeLinhasAfetadas, registrosAtualizados]
   */
  async atualizar(id, dados) {
    const [affectedRows] = await this.model.update(dados, {
      where: { id: parseInt(id) },
      returning: true
    });

    // Buscar registro atualizado
    const atualizado = await this.buscarPorId(id);
    return atualizado;
  }

  /**
   * Deletar registro (soft delete ou hard delete)
   * @param {Number} id - ID do registro
   * @param {Boolean} hardDelete - Se true, remove do banco; se false, soft delete
   * @returns {Promise<Number>} Número de linhas deletadas
   */
  async deletar(id, hardDelete = false) {
    if (hardDelete) {
      return await this.model.destroy({
        where: { id: parseInt(id) },
        force: true
      });
    } else {
      // Soft delete (assumindo campo 'ativo' ou 'deleted_at')
      if (this.model.rawAttributes.ativo) {
        return await this.atualizar(id, { ativo: false });
      } else {
        return await this.atualizar(id, { deleted_at: new Date() });
      }
    }
  }

  /**
   * Listar registros com paginação
   * @param {Object} filtros - Filtros where
   * @param {Object} paginacao - { page, limit }
   * @param {Object} opcoes - Outras opções (include, order, etc)
   * @returns {Promise<Object>} { registros, total, page, totalPages }
   */
  async listar(filtros = {}, paginacao = {}, opcoes = {}) {
    const page = paginacao.page || 1;
    const limit = paginacao.limit || 10;
    const offset = (page - 1) * limit;

    const { whereCustom = {}, include, order, attributes, ...outrasOpcoes } = opcoes;

    const where = {
      ...filtros,
      ...whereCustom
    };

    const queryOptions = {
      where,
      limit,
      offset,
      ...outrasOpcoes
    };

    if (include) {
      queryOptions.include = include;
    }

    if (order) {
      queryOptions.order = order;
    }

    if (attributes) {
      queryOptions.attributes = attributes;
    }

    const { count, rows } = await this.model.findAndCountAll(queryOptions);

    return {
      registros: rows,
      total: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit)
    };
  }

  /**
   * Contar total de registros
   * @param {Object} filtros - Filtros where
   * @returns {Promise<Number>} Total de registros
   */
  async contarTotal(filtros = {}) {
    return await this.model.count({ where: filtros });
  }

  /**
   * Verificar se existe registro com determinado critério
   * @param {Object} criterio - Critério de busca
   * @returns {Promise<Boolean>} true se existe
   */
  async existe(criterio) {
    const count = await this.model.count({ where: criterio });
    return count > 0;
  }

  /**
   * Normalizar entidade para JSON
   * @param {Object} entidade - Instância do Sequelize
   * @returns {Object} Objeto JSON normalizado
   */
  normalizarEntidade(entidade) {
    if (!entidade) return null;
    return entidade.toJSON ? entidade.toJSON() : entidade;
  }

  /**
   * Normalizar array de entidades
   * @param {Array} entidades - Array de instâncias
   * @returns {Array} Array de objetos JSON
   */
  normalizarEntidades(entidades) {
    if (!Array.isArray(entidades)) return [];
    return entidades.map(e => this.normalizarEntidade(e));
  }
}

export default BaseRepository;

