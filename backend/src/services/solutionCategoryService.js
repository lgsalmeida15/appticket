import solutionCategoryRepository from '../repositories/solutionCategoryRepository.js';
import auditoriaService from './auditoriaService.js';
import AppError from '../utils/AppError.js';

class SolutionCategoryService {
  /**
   * Listar todas as categorias ativas
   * @returns {Promise<Array>}
   */
  async listarAtivas() {
    return await solutionCategoryRepository.findActive();
  }

  /**
   * Listar todas as categorias (incluindo inativas)
   * @returns {Promise<Array>}
   */
  async listarTodas() {
    return await solutionCategoryRepository.findAll();
  }

  /**
   * Buscar categoria por ID
   * @param {number} id
   * @returns {Promise<Object>}
   */
  async buscarPorId(id) {
    const categoria = await solutionCategoryRepository.findById(id);
    
    if (!categoria) {
      throw new AppError('Categoria de solução não encontrada', 404);
    }

    return categoria;
  }

  /**
   * Criar nova categoria
   * @param {Object} dados
   * @param {number} usuarioId
   * @param {Object} req
   * @returns {Promise<Object>}
   */
  async criar(dados, usuarioId = null, req = null) {
    const { categoria_nivel_1, categoria_nivel_2, categoria_nivel_3 } = dados;

    // Validar campos obrigatórios
    if (!categoria_nivel_1 || !categoria_nivel_2 || !categoria_nivel_3) {
      throw new AppError('Todos os níveis de categoria são obrigatórios', 400);
    }

    // Verificar se categoria já existe
    const existe = await solutionCategoryRepository.exists(
      categoria_nivel_1,
      categoria_nivel_2,
      categoria_nivel_3
    );

    if (existe) {
      throw new AppError('Esta combinação de categorias já existe', 409);
    }

    // Criar categoria
    const categoria = await solutionCategoryRepository.create({
      categoria_nivel_1: categoria_nivel_1.trim(),
      categoria_nivel_2: categoria_nivel_2.trim(),
      categoria_nivel_3: categoria_nivel_3.trim(),
      ativo: true
    });

    // Registrar auditoria
    if (usuarioId) {
      await auditoriaService.registrarCriacao(
        usuarioId,
        'solution_category',
        categoria.id,
        {
          categoria_nivel_1: categoria.categoria_nivel_1,
          categoria_nivel_2: categoria.categoria_nivel_2,
          categoria_nivel_3: categoria.categoria_nivel_3
        },
        req
      );
    }

    return categoria;
  }

  /**
   * Atualizar categoria
   * @param {number} id
   * @param {Object} dados
   * @param {number} usuarioId
   * @param {Object} req
   * @returns {Promise<Object>}
   */
  async atualizar(id, dados, usuarioId = null, req = null) {
    const categoria = await this.buscarPorId(id);

    const { categoria_nivel_1, categoria_nivel_2, categoria_nivel_3 } = dados;

    // Se está alterando os níveis, verificar duplicidade
    if (categoria_nivel_1 || categoria_nivel_2 || categoria_nivel_3) {
      const nivel1 = categoria_nivel_1 || categoria.categoria_nivel_1;
      const nivel2 = categoria_nivel_2 || categoria.categoria_nivel_2;
      const nivel3 = categoria_nivel_3 || categoria.categoria_nivel_3;

      const existe = await solutionCategoryRepository.exists(
        nivel1,
        nivel2,
        nivel3,
        id
      );

      if (existe) {
        throw new AppError('Esta combinação de categorias já existe', 409);
      }
    }

    // Dados anteriores para auditoria
    const dadosAnteriores = {
      categoria_nivel_1: categoria.categoria_nivel_1,
      categoria_nivel_2: categoria.categoria_nivel_2,
      categoria_nivel_3: categoria.categoria_nivel_3
    };

    // Atualizar categoria
    const categoriaAtualizada = await solutionCategoryRepository.update(id, {
      ...(categoria_nivel_1 && { categoria_nivel_1: categoria_nivel_1.trim() }),
      ...(categoria_nivel_2 && { categoria_nivel_2: categoria_nivel_2.trim() }),
      ...(categoria_nivel_3 && { categoria_nivel_3: categoria_nivel_3.trim() })
    });

    // Registrar auditoria
    if (usuarioId) {
      await auditoriaService.registrarAtualizacao(
        usuarioId,
        'solution_category',
        id,
        dadosAnteriores,
        {
          categoria_nivel_1: categoriaAtualizada.categoria_nivel_1,
          categoria_nivel_2: categoriaAtualizada.categoria_nivel_2,
          categoria_nivel_3: categoriaAtualizada.categoria_nivel_3
        },
        req
      );
    }

    return categoriaAtualizada;
  }

  /**
   * Desativar categoria
   * @param {number} id
   * @param {number} usuarioId
   * @param {Object} req
   * @returns {Promise<Object>}
   */
  async desativar(id, usuarioId = null, req = null) {
    const categoria = await this.buscarPorId(id);
    const resultado = await solutionCategoryRepository.deactivate(id);

    // Registrar auditoria
    if (usuarioId) {
      await auditoriaService.registrarAtualizacao(
        usuarioId,
        'solution_category',
        id,
        { ativo: true },
        { ativo: false },
        req
      );
    }

    return resultado;
  }

  /**
   * Ativar categoria
   * @param {number} id
   * @param {number} usuarioId
   * @param {Object} req
   * @returns {Promise<Object>}
   */
  async ativar(id, usuarioId = null, req = null) {
    const categoria = await this.buscarPorId(id);
    const resultado = await solutionCategoryRepository.activate(id);

    // Registrar auditoria
    if (usuarioId) {
      await auditoriaService.registrarAtualizacao(
        usuarioId,
        'solution_category',
        id,
        { ativo: false },
        { ativo: true },
        req
      );
    }

    return resultado;
  }

  /**
   * Buscar níveis 1 únicos
   * @returns {Promise<Array>}
   */
  async buscarNiveis1() {
    return await solutionCategoryRepository.findUniqueLevel1();
  }

  /**
   * Buscar níveis 2 para um nível 1
   * @param {string} nivel1
   * @returns {Promise<Array>}
   */
  async buscarNiveis2(nivel1) {
    if (!nivel1) {
      throw new AppError('Nível 1 é obrigatório', 400);
    }
    return await solutionCategoryRepository.findUniqueLevel2(nivel1);
  }

  /**
   * Buscar níveis 3 para um nível 1 e 2
   * @param {string} nivel1
   * @param {string} nivel2
   * @returns {Promise<Array>}
   */
  async buscarNiveis3(nivel1, nivel2) {
    if (!nivel1 || !nivel2) {
      throw new AppError('Níveis 1 e 2 são obrigatórios', 400);
    }
    return await solutionCategoryRepository.findUniqueLevel3(nivel1, nivel2);
  }

  /**
   * Buscar categorias completas por nível 1
   * @param {string} nivel1
   * @returns {Promise<Array>}
   */
  async buscarPorNivel1(nivel1) {
    if (!nivel1) {
      throw new AppError('Nível 1 é obrigatório', 400);
    }
    return await solutionCategoryRepository.findByLevel1(nivel1);
  }

  /**
   * Buscar categorias completas por nível 1 e 2
   * @param {string} nivel1
   * @param {string} nivel2
   * @returns {Promise<Array>}
   */
  async buscarPorNivel1E2(nivel1, nivel2) {
    if (!nivel1 || !nivel2) {
      throw new AppError('Níveis 1 e 2 são obrigatórios', 400);
    }
    return await solutionCategoryRepository.findByLevel1And2(nivel1, nivel2);
  }
}

export default new SolutionCategoryService();

