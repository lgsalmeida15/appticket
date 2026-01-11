import { defineStore } from 'pinia';
import chamadoService from '../services/chamadoService.js';

export const useChamadosStore = defineStore('chamados', {
  state: () => ({
    chamados: [],
    chamado: null,
    comentarios: [],
    estatisticas: null,
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
    chamadosNovos: (state) => state.chamados.filter(c => c.status === 'novo'),
    chamadosEmAndamento: (state) => state.chamados.filter(c => c.status === 'em_andamento'),
    chamadosPorStatus: (state) => (status) => state.chamados.filter(c => c.status === status),
    chamadosPorPrioridade: (state) => (prioridade) => state.chamados.filter(c => c.prioridade === prioridade)
  },

  actions: {
    /**
     * Listar chamados com filtros e paginação
     */
    async listarChamados(params = {}) {
      this.loading = true;
      this.error = null;

      try {
        const response = await chamadoService.listar(params);
        
        this.chamados = response.chamados || [];
        this.pagination = {
          page: response.page || 1,
          limit: params.limit || 10,
          total: response.total || 0,
          totalPages: response.totalPages || 0
        };

        return response;
      } catch (error) {
        this.error = error.response?.data?.error?.message || error.message || 'Erro ao listar chamados';
        throw error;
      } finally {
        this.loading = false;
      }
    },

    /**
     * Buscar chamado por ID
     */
    async buscarChamado(id, opcoes = {}) {
      this.loading = true;
      this.error = null;

      try {
        const response = await chamadoService.buscarPorId(id, opcoes);
        this.chamado = response.chamado;
        this.comentarios = response.chamado?.comentarios || [];
        return response.chamado;
      } catch (error) {
        this.error = error.response?.data?.error?.message || error.message || 'Erro ao buscar chamado';
        throw error;
      } finally {
        this.loading = false;
      }
    },

    /**
     * Criar novo chamado
     */
    async criarChamado(dados) {
      this.loading = true;
      this.error = null;

      try {
        const response = await chamadoService.criar(dados);
        
        // Adicionar à lista se estiver na primeira página
        if (this.pagination.page === 1 && response.chamado) {
          this.chamados.unshift(response.chamado);
        }

        return response.chamado || response;
      } catch (error) {
        this.error = error.response?.data?.error?.message || error.message || 'Erro ao criar chamado';
        throw error;
      } finally {
        this.loading = false;
      }
    },

    /**
     * Criar chamado com arquivos (usa FormData)
     */
    async criarChamadoComArquivos(dados) {
      this.loading = true;
      this.error = null;

      try {
        const response = await chamadoService.criar(dados);
        
        // Adicionar à lista se estiver na primeira página
        if (this.pagination.page === 1 && response.chamado) {
          this.chamados.unshift(response.chamado);
        }

        return response.chamado || response;
      } catch (error) {
        this.error = error.response?.data?.error?.message || error.message || 'Erro ao criar chamado';
        throw error;
      } finally {
        this.loading = false;
      }
    },

    /**
     * Atualizar chamado
     */
    async atualizarChamado(id, dados) {
      this.loading = true;
      this.error = null;

      try {
        const response = await chamadoService.atualizar(id, dados);
        const chamadoAtualizado = response.chamado || response;
        
        console.log('🏪 Store recebeu chamado atualizado:', {
          id: chamadoAtualizado.id,
          grupoExecutor: chamadoAtualizado.grupoExecutor,
          grupo_executor_id: chamadoAtualizado.grupo_executor_id
        });
        
        // Atualizar na lista
        const index = this.chamados.findIndex(c => c.id === id);
        if (index !== -1) {
          this.chamados[index] = chamadoAtualizado;
        }

        // Atualizar chamado atual se for o mesmo
        if (this.chamado && this.chamado.id === id) {
          const comentarios = this.chamado.comentarios || [];
          const historico = this.chamado.historico || [];
          this.chamado = { ...chamadoAtualizado, comentarios, historico };
        }

        return chamadoAtualizado;
      } catch (error) {
        this.error = error.response?.data?.error?.message || error.message || 'Erro ao atualizar chamado';
        throw error;
      } finally {
        this.loading = false;
      }
    },

    /**
     * Deletar chamado (cancelar)
     */
    async deletarChamado(id) {
      this.loading = true;
      this.error = null;

      try {
        await chamadoService.deletar(id);
        
        // Atualizar status na lista
        const index = this.chamados.findIndex(c => c.id === id);
        if (index !== -1) {
          this.chamados[index].status = 'cancelado';
        }

        return true;
      } catch (error) {
        this.error = error.response?.data?.error?.message || error.message || 'Erro ao cancelar chamado';
        throw error;
      } finally {
        this.loading = false;
      }
    },

    /**
     * Adicionar comentário
     */
    async adicionarComentario(chamadoId, dados) {
      this.loading = true;
      this.error = null;

      try {
        const response = await chamadoService.adicionarComentario(chamadoId, dados);
        const comentario = response.comentario || response;
        
        // Adicionar à lista de comentários se já estiver carregada
        if (this.chamado && this.chamado.id === chamadoId) {
          if (!this.chamado.comentarios) {
            this.chamado.comentarios = [];
          }
          this.chamado.comentarios.push(comentario);
          this.comentarios.push(comentario);
        }
        
        return comentario;
      } catch (error) {
        this.error = error.response?.data?.error?.message || error.message || 'Erro ao adicionar comentário';
        throw error;
      } finally {
        this.loading = false;
      }
    },

    /**
     * Adicionar comentário com arquivos
     */
    async adicionarComentarioComArquivos(chamadoId, dados) {
      this.loading = true;
      this.error = null;

      try {
        const response = await chamadoService.adicionarComentario(chamadoId, dados);
        const comentario = response.comentario || response;
        
        // Adicionar à lista de comentários
        if (this.chamado && this.chamado.id === chamadoId) {
          if (!this.chamado.comentarios) {
            this.chamado.comentarios = [];
          }
          this.chamado.comentarios.push(comentario);
          this.comentarios.push(comentario);
        }
        
        return comentario;
      } catch (error) {
        this.error = error.response?.data?.error?.message || error.message || 'Erro ao adicionar comentário';
        throw error;
      } finally {
        this.loading = false;
      }
    },

    /**
     * Listar comentários de um chamado
     */
    async listarComentarios(chamadoId) {
      this.loading = true;
      this.error = null;

      try {
        const response = await chamadoService.listarComentarios(chamadoId);
        this.comentarios = response.comentarios || [];
        return this.comentarios;
      } catch (error) {
        this.error = error.response?.data?.error?.message || error.message || 'Erro ao listar comentários';
        throw error;
      } finally {
        this.loading = false;
      }
    },

    /**
     * Buscar estatísticas
     */
    async buscarEstatisticas() {
      this.loading = true;
      this.error = null;

      try {
        const response = await chamadoService.buscarEstatisticas();
        this.estatisticas = response;
        return response;
      } catch (error) {
        this.error = error.response?.data?.error?.message || error.message || 'Erro ao buscar estatísticas';
        throw error;
      } finally {
        this.loading = false;
      }
    },

    /**
     * Iniciar contagem de tempo
     */
    async iniciarContagem(chamadoId, descricao = null) {
      try {
        const response = await chamadoService.iniciarContagem(chamadoId, descricao);
        return response.registro || response;
      } catch (error) {
        this.error = error.response?.data?.error?.message || error.message || 'Erro ao iniciar contagem';
        throw error;
      }
    },

    /**
     * Parar contagem de tempo
     */
    async pararContagem(chamadoId) {
      try {
        const response = await chamadoService.pararContagem(chamadoId);
        return response.registro || response;
      } catch (error) {
        this.error = error.response?.data?.error?.message || error.message || 'Erro ao parar contagem';
        throw error;
      }
    },

    /**
     * Buscar histórico de time tracking
     */
    async buscarHistoricoTimeTracking(chamadoId) {
      try {
        const response = await chamadoService.buscarHistoricoTimeTracking(chamadoId);
        return response;
      } catch (error) {
        this.error = error.response?.data?.error?.message || error.message || 'Erro ao buscar histórico';
        throw error;
      }
    },

    /**
     * Associar chamado filho a um chamado pai
     */
    async associarFilho(chamadoPaiId, chamadoFilhoId) {
      this.loading = true;
      this.error = null;

      try {
        const response = await chamadoService.associarFilho(chamadoPaiId, chamadoFilhoId);
        
        // Recarregar chamado atual se for o pai ou o filho
        if (this.chamado && (this.chamado.id === chamadoPaiId || this.chamado.id === chamadoFilhoId)) {
          await this.buscarChamado(this.chamado.id, { 
            incluirRelacionamentos: true,
            incluirComentarios: this.chamado.comentarios ? true : false,
            incluirHistorico: this.chamado.historico ? true : false
          });
        }
        
        return response;
      } catch (error) {
        this.error = error.response?.data?.error?.message || error.message || 'Erro ao associar chamado';
        throw error;
      } finally {
        this.loading = false;
      }
    },

    /**
     * Desassociar chamado filho do seu pai
     */
    async desassociarFilho(chamadoFilhoId) {
      this.loading = true;
      this.error = null;

      try {
        const response = await chamadoService.desassociarFilho(chamadoFilhoId);
        
        // Recarregar chamado atual se for o filho
        // Também precisamos recarregar se o chamado atual é pai de algum filho que foi desassociado
        if (this.chamado) {
          await this.buscarChamado(this.chamado.id, { 
            incluirRelacionamentos: true,
            incluirComentarios: this.chamado.comentarios ? true : false,
            incluirHistorico: this.chamado.historico ? true : false
          });
        }
        
        return response;
      } catch (error) {
        this.error = error.response?.data?.error?.message || error.message || 'Erro ao desassociar chamado';
        throw error;
      } finally {
        this.loading = false;
      }
    },

    /**
     * Listar todos os filhos de um chamado pai
     */
    async listarFilhos(chamadoPaiId) {
      this.loading = true;
      this.error = null;

      try {
        const response = await chamadoService.listarFilhos(chamadoPaiId);
        return response.filhos || [];
      } catch (error) {
        this.error = error.response?.data?.error?.message || error.message || 'Erro ao listar filhos';
        throw error;
      } finally {
        this.loading = false;
      }
    },

    /**
     * Verificar se um chamado pai pode ser encerrado
     */
    async verificarPodeEncerrar(chamadoId) {
      try {
        const response = await chamadoService.verificarPodeEncerrar(chamadoId);
        return response;
      } catch (error) {
        this.error = error.response?.data?.error?.message || error.message || 'Erro ao verificar se pode encerrar';
        throw error;
      }
    },

    /**
     * Limpar erro
     */
    clearError() {
      this.error = null;
    },

    /**
     * Limpar chamado atual
     */
    clearChamado() {
      this.chamado = null;
      this.comentarios = [];
    }
  }
});
