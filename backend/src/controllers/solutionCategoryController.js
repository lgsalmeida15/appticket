import solutionCategoryService from '../services/solutionCategoryService.js';

/**
 * Listar todas as categorias ativas
 */
export const listarCategoriasAtivas = async (req, res, next) => {
  try {
    const categorias = await solutionCategoryService.listarAtivas();
    res.json({ categorias });
  } catch (error) {
    next(error);
  }
};

/**
 * Listar todas as categorias (incluindo inativas)
 */
export const listarTodasCategorias = async (req, res, next) => {
  try {
    const categorias = await solutionCategoryService.listarTodas();
    res.json({ categorias });
  } catch (error) {
    next(error);
  }
};

/**
 * Buscar categoria por ID
 */
export const buscarCategoria = async (req, res, next) => {
  try {
    const { id } = req.params;
    const idNum = parseInt(id);
    if (isNaN(idNum) || idNum <= 0) {
      const error = new Error('ID inválido');
      error.statusCode = 400;
      error.code = 'INVALID_ID';
      throw error;
    }
    const categoria = await solutionCategoryService.buscarPorId(idNum);
    res.json({ categoria });
  } catch (error) {
    next(error);
  }
};

/**
 * Criar nova categoria
 */
export const criarCategoria = async (req, res, next) => {
  try {
    // Validação obrigatória - validator sempre deve executar
    if (!req.validatedData) {
      const error = new Error('Dados não validados');
      error.statusCode = 400;
      error.code = 'VALIDATION_REQUIRED';
      throw error;
    }
    const dados = req.validatedData;
    const categoria = await solutionCategoryService.criar(dados, req.usuario.id, req);
    
    res.status(201).json({
      message: 'Categoria criada com sucesso',
      categoria
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Atualizar categoria
 */
export const atualizarCategoria = async (req, res, next) => {
  try {
    const { id } = req.params;
    const idNum = parseInt(id);
    if (isNaN(idNum) || idNum <= 0) {
      const error = new Error('ID inválido');
      error.statusCode = 400;
      error.code = 'INVALID_ID';
      throw error;
    }
    // Validação obrigatória - validator sempre deve executar
    if (!req.validatedData) {
      const error = new Error('Dados não validados');
      error.statusCode = 400;
      error.code = 'VALIDATION_REQUIRED';
      throw error;
    }
    const dados = req.validatedData;
    
    const categoria = await solutionCategoryService.atualizar(idNum, dados, req.usuario.id, req);
    
    res.json({
      message: 'Categoria atualizada com sucesso',
      categoria
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Desativar categoria
 */
export const desativarCategoria = async (req, res, next) => {
  try {
    const { id } = req.params;
    const idNum = parseInt(id);
    if (isNaN(idNum) || idNum <= 0) {
      const error = new Error('ID inválido');
      error.statusCode = 400;
      error.code = 'INVALID_ID';
      throw error;
    }
    const categoria = await solutionCategoryService.desativar(idNum, req.usuario.id, req);
    
    res.json({
      message: 'Categoria desativada com sucesso',
      categoria
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Ativar categoria
 */
export const ativarCategoria = async (req, res, next) => {
  try {
    const { id } = req.params;
    const idNum = parseInt(id);
    if (isNaN(idNum) || idNum <= 0) {
      const error = new Error('ID inválido');
      error.statusCode = 400;
      error.code = 'INVALID_ID';
      throw error;
    }
    const categoria = await solutionCategoryService.ativar(idNum, req.usuario.id, req);
    
    res.json({
      message: 'Categoria ativada com sucesso',
      categoria
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Buscar níveis 1 únicos
 */
export const buscarNiveis1 = async (req, res, next) => {
  try {
    const niveis = await solutionCategoryService.buscarNiveis1();
    res.json({ niveis });
  } catch (error) {
    next(error);
  }
};

/**
 * Buscar níveis 2 para um nível 1
 */
export const buscarNiveis2 = async (req, res, next) => {
  try {
    const { nivel1 } = req.query;
    const niveis = await solutionCategoryService.buscarNiveis2(nivel1);
    res.json({ niveis });
  } catch (error) {
    next(error);
  }
};

/**
 * Buscar níveis 3 para um nível 1 e 2
 */
export const buscarNiveis3 = async (req, res, next) => {
  try {
    const { nivel1, nivel2 } = req.query;
    const niveis = await solutionCategoryService.buscarNiveis3(nivel1, nivel2);
    res.json({ niveis });
  } catch (error) {
    next(error);
  }
};

export default {
  listarCategoriasAtivas,
  listarTodasCategorias,
  buscarCategoria,
  criarCategoria,
  atualizarCategoria,
  desativarCategoria,
  ativarCategoria,
  buscarNiveis1,
  buscarNiveis2,
  buscarNiveis3
};

