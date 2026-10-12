import { defineStore } from 'pinia';
import chamadoTarefaService from '../services/chamadoTarefaService.js';

export const useChamadoTarefasStore = defineStore('chamadoTarefas', {
  state: () => ({
    tarefas: [],
    loading: false,
    error: null
  }),

  getters: {
    tarefasAtivas: (state) => state.tarefas.filter(t => t.status !== 'cancelada'),
    temTarefaAtiva: (state) => state.tarefas.some(t => t.status !== 'cancelada')
  },

  actions: {
    async listarTarefas(chamadoId) {
      this.loading = true;
      this.error = null;
      try {
        const response = await chamadoTarefaService.listar(chamadoId);
        this.tarefas = response.tarefas || [];
        return this.tarefas;
      } catch (error) {
        this.error = error.response?.data?.error?.message || error.message || 'Erro ao listar tarefas';
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async criarTarefa(chamadoId, dados) {
      try {
        const response = await chamadoTarefaService.criar(chamadoId, dados);
        this.tarefas.push(response.tarefa);
        return response.tarefa;
      } catch (error) {
        this.error = error.response?.data?.error?.message || error.message || 'Erro ao criar tarefa';
        throw error;
      }
    },

    async atualizarTarefa(chamadoId, tarefaId, dados) {
      try {
        const response = await chamadoTarefaService.atualizar(chamadoId, tarefaId, dados);
        const index = this.tarefas.findIndex(t => t.id === tarefaId);
        if (index !== -1) this.tarefas[index] = response.tarefa;
        return response.tarefa;
      } catch (error) {
        this.error = error.response?.data?.error?.message || error.message || 'Erro ao atualizar tarefa';
        throw error;
      }
    },

    async cancelarTarefa(chamadoId, tarefaId) {
      try {
        const response = await chamadoTarefaService.cancelar(chamadoId, tarefaId);
        const index = this.tarefas.findIndex(t => t.id === tarefaId);
        if (index !== -1) this.tarefas[index] = response.tarefa;
        return response.tarefa;
      } catch (error) {
        this.error = error.response?.data?.error?.message || error.message || 'Erro ao cancelar tarefa';
        throw error;
      }
    },

    async alternarAtendimentoTarefa(chamadoId, tarefaId, acao) {
      try {
        const response = acao === 'play'
          ? await chamadoTarefaService.iniciarContagem(chamadoId, tarefaId)
          : await chamadoTarefaService.pararContagem(chamadoId, tarefaId);
        return response.registro;
      } catch (error) {
        this.error = error.response?.data?.error?.message || error.message || 'Erro ao alternar atendimento da tarefa';
        throw error;
      }
    },

    async buscarHistoricoTempo(chamadoId, tarefaId) {
      return await chamadoTarefaService.buscarHistoricoTempo(chamadoId, tarefaId);
    },

    async listarComentarios(chamadoId, tarefaId) {
      const response = await chamadoTarefaService.listarComentarios(chamadoId, tarefaId);
      return response.comentarios || [];
    },

    async adicionarComentario(chamadoId, tarefaId, dados) {
      const response = await chamadoTarefaService.adicionarComentario(chamadoId, tarefaId, dados);
      return response.comentario;
    },

    clearError() {
      this.error = null;
    }
  }
});
