import { defineStore } from 'pinia';
import grupoService from '../services/grupoService.js';

export const useGruposStore = defineStore('grupos', {
  state: () => ({
    grupos: [],
    grupo: null,
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
    gruposAtivos: (state) => state.grupos.filter(g => g.ativo)
  },

  actions: {
    /**
     * Listar grupos
     */
    async listarGrupos(params = {}) {
      this.loading = true;
      this.error = null;

      try {
        const response = await grupoService.listar(params);
        
        this.grupos = response.grupos || [];
        this.pagination = {
          page: response.page || 1,
          limit: params.limit || 10,
          total: response.total || 0,
          totalPages: response.totalPages || 0
        };

        return response;
      } catch (error) {
        this.error = error.response?.data?.error?.message || error.message || 'Erro ao listar grupos';
        throw error;
      } finally {
        this.loading = false;
      }
    },

    /**
     * Listar grupos executores (todos os usuários podem ver)
     */
    async listarGruposExecutores(params = {}) {
      this.loading = true;
      this.error = null;

      try {
        const response = await grupoService.listar({
          ...params,
          executor: true,
          ativo: true,
          limit: params.limit || 1000
        });
        
        // Não substituir this.grupos, apenas retornar a lista
        return response.grupos || [];
      } catch (error) {
        this.error = error.response?.data?.error?.message || error.message || 'Erro ao listar grupos executores';
        throw error;
      } finally {
        this.loading = false;
      }
    },

    /**
     * Buscar grupos do usuário logado
     */
    async meusGrupos() {
      this.loading = true;
      this.error = null;

      try {
        const response = await grupoService.buscarMeusGrupos();
        this.grupos = response.grupos || [];
        return this.grupos;
      } catch (error) {
        this.error = error.response?.data?.error?.message || error.message || 'Erro ao listar seus grupos';
        throw error;
      } finally {
        this.loading = false;
      }
    },

    /**
     * Buscar grupo por ID
     */
    async buscarGrupo(id) {
      this.loading = true;
      this.error = null;

      try {
        const response = await grupoService.buscarPorId(id);
        this.grupo = response.grupo || response;
        return this.grupo;
      } catch (error) {
        this.error = error.response?.data?.error?.message || error.message || 'Erro ao buscar grupo';
        throw error;
      } finally {
        this.loading = false;
      }
    },

    /**
     * Criar grupo
     */
    async criarGrupo(dados) {
      this.loading = true;
      this.error = null;

      try {
        const response = await grupoService.criar(dados);
        const grupo = response.grupo || response;
        
        // Adicionar à lista se estiver na primeira página
        if (this.pagination.page === 1) {
          this.grupos.unshift(grupo);
        }

        return grupo;
      } catch (error) {
        this.error = error.response?.data?.error?.message || error.message || 'Erro ao criar grupo';
        throw error;
      } finally {
        this.loading = false;
      }
    },

    /**
     * Atualizar grupo
     */
    async atualizarGrupo(id, dados) {
      this.loading = true;
      this.error = null;

      try {
        const response = await grupoService.atualizar(id, dados);
        const grupo = response.grupo || response;
        
        // Atualizar na lista
        const index = this.grupos.findIndex(g => g.id === id);
        if (index !== -1) {
          this.grupos[index] = grupo;
        }

        if (this.grupo && this.grupo.id === id) {
          this.grupo = grupo;
        }

        return grupo;
      } catch (error) {
        this.error = error.response?.data?.error?.message || error.message || 'Erro ao atualizar grupo';
        throw error;
      } finally {
        this.loading = false;
      }
    },

    /**
     * Deletar grupo
     */
    async deletarGrupo(id) {
      this.loading = true;
      this.error = null;

      try {
        await grupoService.deletar(id);
        
        // Remover da lista ou marcar como inativo
        const index = this.grupos.findIndex(g => g.id === id);
        if (index !== -1) {
          this.grupos[index].ativo = false;
        }

        return true;
      } catch (error) {
        this.error = error.response?.data?.error?.message || error.message || 'Erro ao deletar grupo';
        throw error;
      } finally {
        this.loading = false;
      }
    },

    /**
     * Listar usuários de um grupo
     */
    async listarUsuarios(grupoId) {
      try {
        const response = await grupoService.listarUsuarios(grupoId);
        return response.usuarios || [];
      } catch (error) {
        this.error = error.response?.data?.error?.message || error.message || 'Erro ao listar usuários do grupo';
        throw error;
      }
    },

    /**
     * Adicionar usuário ao grupo
     */
    async adicionarUsuario(grupoId, usuarioId, papel = 'agente') {
      this.loading = true;
      this.error = null;

      try {
        const response = await grupoService.adicionarUsuario(grupoId, usuarioId, papel);
        
        // Atualizar grupo na lista
        if (this.grupo && this.grupo.id === grupoId) {
          await this.buscarGrupo(grupoId);
        }

        return response.associacao || response;
      } catch (error) {
        this.error = error.response?.data?.error?.message || error.message || 'Erro ao adicionar usuário';
        throw error;
      } finally {
        this.loading = false;
      }
    },

    /**
     * Remover usuário do grupo
     */
    async removerUsuario(grupoId, usuarioId) {
      this.loading = true;
      this.error = null;

      try {
        await grupoService.removerUsuario(grupoId, usuarioId);
        
        // Atualizar grupo na lista
        if (this.grupo && this.grupo.id === grupoId) {
          if (this.grupo.usuarios) {
            this.grupo.usuarios = this.grupo.usuarios.filter(u => u.id !== usuarioId);
          }
        }

        return true;
      } catch (error) {
        this.error = error.response?.data?.error?.message || error.message || 'Erro ao remover usuário';
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
