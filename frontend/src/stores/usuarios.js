import { defineStore } from 'pinia';
import usuarioService from '../services/usuarioService.js';

export const useUsuariosStore = defineStore('usuarios', {
  state: () => ({
    usuarios: [],
    usuario: null,
    loading: false,
    error: null,
    pagination: {
      page: 1,
      limit: 10,
      total: 0,
      totalPages: 0
    }
  }),

  getters: {
    usuariosAtivos: (state) => state.usuarios.filter(u => u.ativo),
    usuariosPorTipo: (state) => (tipo) => state.usuarios.filter(u => u.tipo === tipo)
  },

  actions: {
    /**
     * Listar usuários
     */
    async listarUsuarios(params = {}) {
      this.loading = true;
      this.error = null;

      try {
        const response = await usuarioService.listar(params);
        
        this.usuarios = response.usuarios || [];
        this.pagination = {
          page: response.page || 1,
          limit: params.limit || 10,
          total: response.total || 0,
          totalPages: response.totalPages || 0
        };

        return response;
      } catch (error) {
        this.error = error.response?.data?.error?.message || error.message || 'Erro ao listar usuários';
        throw error;
      } finally {
        this.loading = false;
      }
    },

    /**
     * Buscar usuário por ID
     */
    async buscarUsuario(id) {
      this.loading = true;
      this.error = null;

      try {
        const response = await usuarioService.buscarPorId(id);
        this.usuario = response.usuario || response;
        return this.usuario;
      } catch (error) {
        this.error = error.response?.data?.error?.message || error.message || 'Erro ao buscar usuário';
        throw error;
      } finally {
        this.loading = false;
      }
    },

    /**
     * Criar usuário
     */
    async criarUsuario(dados) {
      this.loading = true;
      this.error = null;

      try {
        const response = await usuarioService.criar(dados);
        const usuario = response.usuario || response;
        
        // Adicionar à lista se estiver na primeira página
        if (this.pagination.page === 1) {
          this.usuarios.unshift(usuario);
        }

        return usuario;
      } catch (error) {
        const errorMessage = error?.response?.data?.error?.message || 
                            error?.response?.data?.message ||
                            error?.message || 
                            'Erro ao criar usuário';
        this.error = errorMessage;
        console.error('Erro ao criar usuário:', error);
        throw error;
      } finally {
        this.loading = false;
      }
    },

    /**
     * Atualizar usuário
     */
    async atualizarUsuario(id, dados) {
      this.loading = true;
      this.error = null;

      try {
        const response = await usuarioService.atualizar(id, dados);
        const usuario = response.usuario || response;
        
        // Atualizar na lista
        const index = this.usuarios.findIndex(u => u.id === id);
        if (index !== -1) {
          this.usuarios[index] = usuario;
        }

        if (this.usuario && this.usuario.id === id) {
          this.usuario = usuario;
        }

        return usuario;
      } catch (error) {
        const errorMessage = error?.response?.data?.error?.message || 
                            error?.response?.data?.message ||
                            error?.message || 
                            'Erro ao atualizar usuário';
        this.error = errorMessage;
        console.error('Erro ao atualizar usuário:', error);
        throw error;
      } finally {
        this.loading = false;
      }
    },

    /**
     * Deletar usuário
     */
    async deletarUsuario(id) {
      this.loading = true;
      this.error = null;

      try {
        await usuarioService.deletar(id);
        
        // Remover da lista ou marcar como inativo
        const index = this.usuarios.findIndex(u => u.id === id);
        if (index !== -1) {
          this.usuarios[index].ativo = false;
        }

        return true;
      } catch (error) {
        this.error = error.response?.data?.error?.message || error.message || 'Erro ao deletar usuário';
        throw error;
      } finally {
        this.loading = false;
      }
    },

    /**
     * Associar usuário a grupo
     */
    async associarGrupo(usuarioId, grupoId, papel = 'agente') {
      this.loading = true;
      this.error = null;

      try {
        const response = await usuarioService.associarGrupo(usuarioId, grupoId, papel);
        const usuario = response.usuario || response;
        
        // Atualizar usuário na lista
        const index = this.usuarios.findIndex(u => u.id === usuarioId);
        if (index !== -1) {
          this.usuarios[index] = usuario;
        }

        if (this.usuario && this.usuario.id === usuarioId) {
          this.usuario = usuario;
        }

        return usuario;
      } catch (error) {
        const errorMessage = error?.response?.data?.error?.message || 
                            error?.response?.data?.message ||
                            error?.message || 
                            'Erro ao associar grupo';
        this.error = errorMessage;
        console.error('Erro ao associar grupo:', error);
        throw error;
      } finally {
        this.loading = false;
      }
    },

    /**
     * Remover usuário de grupo
     */
    async removerGrupo(usuarioId, grupoId) {
      this.loading = true;
      this.error = null;

      try {
        await usuarioService.removerGrupo(usuarioId, grupoId);
        
        // Atualizar usuário na lista
        if (this.usuario && this.usuario.id === usuarioId) {
          if (this.usuario.grupos) {
            this.usuario.grupos = this.usuario.grupos.filter(g => g.id !== grupoId);
          }
        }

        return true;
      } catch (error) {
        this.error = error.response?.data?.error?.message || error.message || 'Erro ao remover grupo';
        throw error;
      } finally {
        this.loading = false;
      }
    },

    /**
     * Limpar erro
     */
    clearError() {
      this.error = null;
    }
  }
});
