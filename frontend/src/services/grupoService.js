import http from '../api/http.js';

/**
 * Service de grupos
 * Centraliza todas as chamadas de API relacionadas a grupos
 */
class GrupoService {
  /**
   * Listar grupos
   */
  async listar(filtros = {}) {
    const params = new URLSearchParams();
    
    if (filtros.page) params.append('page', filtros.page);
    if (filtros.limit) params.append('limit', filtros.limit);
    if (filtros.search) params.append('search', filtros.search);
    if (filtros.ativo !== undefined) params.append('ativo', String(filtros.ativo));
    if (filtros.executor !== undefined) params.append('executor', String(filtros.executor));
    if (filtros.solicitante !== undefined) params.append('solicitante', String(filtros.solicitante));

    const response = await http.get(`/grupos?${params.toString()}`);
    return response.data;
  }

  /**
   * Buscar grupos do usuário logado
   */
  async buscarMeusGrupos() {
    const response = await http.get('/grupos/meus');
    return response.data;
  }

  /**
   * Buscar grupo por ID
   */
  async buscarPorId(id) {
    const response = await http.get(`/grupos/${id}`);
    return response.data;
  }

  /**
   * Criar grupo
   */
  async criar(dados) {
    const response = await http.post('/grupos', dados);
    return response.data;
  }

  /**
   * Atualizar grupo
   */
  async atualizar(id, dados) {
    const response = await http.put(`/grupos/${id}`, dados);
    return response.data;
  }

  /**
   * Deletar grupo
   */
  async deletar(id) {
    const response = await http.delete(`/grupos/${id}`);
    return response.data;
  }

  /**
   * Listar usuários de um grupo
   */
  async listarUsuarios(grupoId) {
    const response = await http.get(`/grupos/${grupoId}/usuarios`);
    return response.data;
  }

  /**
   * Adicionar usuário ao grupo
   */
  async adicionarUsuario(grupoId, usuarioId, papel = 'agente') {
    const response = await http.post(`/grupos/${grupoId}/usuarios`, {
      usuario_id: usuarioId,
      papel
    });
    return response.data;
  }

  /**
   * Remover usuário do grupo
   */
  async removerUsuario(grupoId, usuarioId) {
    const response = await http.delete(`/grupos/${grupoId}/usuarios/${usuarioId}`);
    return response.data;
  }
}

export default new GrupoService();

