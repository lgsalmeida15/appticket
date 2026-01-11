import http from '../api/http.js';

/**
 * Service de usuários
 * Centraliza todas as chamadas de API relacionadas a usuários
 */
class UsuarioService {
  /**
   * Listar usuários
   */
  async listar(filtros = {}) {
    const params = new URLSearchParams();
    
    if (filtros.page) params.append('page', filtros.page);
    if (filtros.limit) params.append('limit', filtros.limit);
    if (filtros.search) params.append('search', filtros.search);
    if (filtros.tipo) params.append('tipo', filtros.tipo);
    if (filtros.ativo !== undefined) params.append('ativo', filtros.ativo);

    const response = await http.get(`/usuarios?${params.toString()}`);
    return response.data;
  }

  /**
   * Buscar usuário por ID
   */
  async buscarPorId(id) {
    const response = await http.get(`/usuarios/${id}`);
    return response.data;
  }

  /**
   * Criar usuário
   */
  async criar(dados) {
    const response = await http.post('/usuarios', dados);
    return response.data;
  }

  /**
   * Atualizar usuário
   */
  async atualizar(id, dados) {
    const response = await http.put(`/usuarios/${id}`, dados);
    return response.data;
  }

  /**
   * Deletar usuário
   */
  async deletar(id) {
    const response = await http.delete(`/usuarios/${id}`);
    return response.data;
  }

  /**
   * Associar usuário a grupo
   */
  async associarGrupo(usuarioId, grupoId, papel = 'agente') {
    const response = await http.post(`/usuarios/${usuarioId}/grupos`, {
      grupo_id: grupoId,
      papel
    });
    return response.data;
  }

  /**
   * Remover usuário de grupo
   */
  async removerGrupo(usuarioId, grupoId) {
    const response = await http.delete(`/usuarios/${usuarioId}/grupos/${grupoId}`);
    return response.data;
  }

  /**
   * Atualizar papel do usuário em grupo
   */
  async atualizarPapelGrupo(usuarioId, grupoId, papel) {
    const response = await http.patch(`/usuarios/${usuarioId}/grupos/${grupoId}`, { papel });
    return response.data;
  }
}

export default new UsuarioService();

