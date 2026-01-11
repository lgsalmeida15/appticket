import { defineStore } from 'pinia';
import dashboardService from '../services/dashboardService.js';

export const useDashboardStore = defineStore('dashboard', {
  state: () => ({
    resumo: null,
    loading: false,
    error: null,
    filtros: {
      data_inicio: null,
      data_fim: null
    }
  }),

  getters: {
    totalChamados: (state) => state.resumo?.total_chamados || 0,
    chamadosPorStatus: (state) => state.resumo?.por_status || {},
    chamadosPorGrupo: (state) => state.resumo?.por_grupo || [],
    chamadosPorAgente: (state) => state.resumo?.por_agente || [],
    slaEstourados: (state) => state.resumo?.sla?.estourados || 0,
    slaDentro: (state) => state.resumo?.sla?.dentro || 0,
    horasTrabalhadas: (state) => state.resumo?.horas_trabalhadas || []
  },

  actions: {
    /**
     * Buscar resumo do dashboard
     */
    async buscarResumo(filtros = {}) {
      this.loading = true;
      this.error = null;

      try {
        // Mesclar filtros
        const filtrosCombinados = {
          ...this.filtros,
          ...filtros
        };

        const response = await dashboardService.buscarResumo(filtrosCombinados);
        this.resumo = response;
        this.filtros = filtrosCombinados;
        
        return response;
      } catch (error) {
        this.error = error.response?.data?.error?.message || error.message || 'Erro ao buscar resumo do dashboard';
        throw error;
      } finally {
        this.loading = false;
      }
    },

    /**
     * Definir filtros de data
     */
    definirFiltros(dataInicio, dataFim) {
      this.filtros.data_inicio = dataInicio;
      this.filtros.data_fim = dataFim;
    },

    /**
     * Limpar filtros
     */
    limparFiltros() {
      this.filtros = {
        data_inicio: null,
        data_fim: null
      };
    },

    /**
     * Limpar erro
     */
    clearError() {
      this.error = null;
    }
  }
});

