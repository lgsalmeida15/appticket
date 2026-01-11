import http from '../api/http.js';

/**
 * Serviço para gerenciar categorias de solução
 */
class SolutionCategoryService {
  /**
   * Listar categorias ativas
   */
  async listarAtivas() {
    const response = await http.get('/solution-categories/active');
    return response.data.categorias;
  }

  /**
   * Listar todas as categorias (incluindo inativas)
   */
  async listarTodas() {
    const response = await http.get('/solution-categories');
    return response.data.categorias;
  }

  /**
   * Buscar categoria por ID
   */
  async buscarPorId(id) {
    const response = await http.get(`/solution-categories/${id}`);
    return response.data.categoria;
  }

  /**
   * Criar nova categoria
   */
  async criar(dados) {
    const response = await http.post('/solution-categories', dados);
    return response.data.categoria;
  }

  /**
   * Atualizar categoria
   */
  async atualizar(id, dados) {
    const response = await http.put(`/solution-categories/${id}`, dados);
    return response.data.categoria;
  }

  /**
   * Desativar categoria
   */
  async desativar(id) {
    const response = await http.patch(`/solution-categories/${id}/deactivate`);
    return response.data.categoria;
  }

  /**
   * Ativar categoria
   */
  async ativar(id) {
    const response = await http.patch(`/solution-categories/${id}/activate`);
    return response.data.categoria;
  }

  /**
   * Buscar níveis 1 únicos
   */
  async buscarNiveis1() {
    const response = await http.get('/solution-categories/levels/1');
    return response.data.niveis;
  }

  /**
   * Buscar níveis 2 para um nível 1
   */
  async buscarNiveis2(nivel1) {
    const response = await http.get('/solution-categories/levels/2', {
      params: { nivel1 }
    });
    return response.data.niveis;
  }

  /**
   * Buscar níveis 3 para um nível 1 e 2
   */
  async buscarNiveis3(nivel1, nivel2) {
    const response = await http.get('/solution-categories/levels/3', {
      params: { nivel1, nivel2 }
    });
    return response.data.niveis;
  }
}

export default new SolutionCategoryService();

