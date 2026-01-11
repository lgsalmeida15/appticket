import { computed, ref } from 'vue';
import { useChamadosStore } from '../stores/chamados.js';
import { useToast } from './useToast.js';

/**
 * Composable para lógica reutilizável de chamados
 */
export function useChamados() {
  const chamadosStore = useChamadosStore();
  const { success, error: showError } = useToast();

  /**
   * Formatar status para exibição
   */
  const formatarStatus = (status) => {
    const statusMap = {
      'novo': 'Novo',
      'em_andamento': 'Em Andamento',
      'aguardando': 'Aguardando',
      'resolvido': 'Resolvido',
      'fechado': 'Fechado',
      'cancelado': 'Cancelado'
    };
    return statusMap[status] || status;
  };

  /**
   * Formatar prioridade para exibição
   */
  const formatarPrioridade = (prioridade) => {
    const prioridadeMap = {
      'baixa': 'Baixa',
      'media': 'Média',
      'alta': 'Alta',
      'urgente': 'Urgente'
    };
    return prioridadeMap[prioridade] || prioridade;
  };

  /**
   * Formatar tipo para exibição
   */
  const formatarTipo = (tipo) => {
    const tipoMap = {
      'incidente': 'Incidente',
      'requisicao': 'Requisição',
      'problema': 'Problema',
      'mudanca': 'Mudança'
    };
    return tipoMap[tipo] || tipo;
  };

  /**
   * Obter badge completo para status
   */
  const getBadgeStatus = (status) => {
    const badges = {
      'novo': 'badge bg-info',
      'em_andamento': 'badge bg-warning',
      'aguardando': 'badge bg-info',
      'resolvido': 'badge bg-success',
      'fechado': 'badge bg-secondary',
      'cancelado': 'badge bg-danger'
    };
    return badges[status] || 'badge bg-secondary';
  };

  /**
   * Obter badge completo para prioridade
   */
  const getBadgePrioridade = (prioridade) => {
    const badges = {
      'baixa': 'badge bg-secondary',
      'media': 'badge bg-primary',
      'alta': 'badge bg-warning',
      'urgente': 'badge bg-danger'
    };
    return badges[prioridade] || 'badge bg-secondary';
  };

  /**
   * Obter badge completo para tipo
   */
  const getBadgeTipo = (tipo) => {
    const badges = {
      'incidente': 'badge bg-danger',
      'requisicao': 'badge bg-info',
      'problema': 'badge bg-warning',
      'mudanca': 'badge bg-success'
    };
    return badges[tipo] || 'badge bg-secondary';
  };

  /**
   * Obter classe CSS para status
   */
  const getStatusClass = (status) => {
    const classMap = {
      'novo': 'bg-info',
      'em_andamento': 'bg-warning',
      'aguardando': 'bg-warning',
      'resolvido': 'bg-success',
      'fechado': 'bg-secondary',
      'cancelado': 'bg-danger'
    };
    return classMap[status] || 'bg-secondary';
  };

  /**
   * Obter classe CSS para prioridade
   */
  const getPrioridadeClass = (prioridade) => {
    const classMap = {
      'baixa': 'bg-success',
      'media': 'bg-info',
      'alta': 'bg-warning',
      'urgente': 'bg-danger'
    };
    return classMap[prioridade] || 'bg-secondary';
  };

  /**
   * Formatar data
   */
  const formatarData = (data) => {
    if (!data) return '-';
    const date = new Date(data);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  /**
   * Formatar data relativa (há X tempo)
   */
  const formatarDataRelativa = (data) => {
    if (!data) return '-';
    const date = new Date(data);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Agora';
    if (diffMins < 60) return `Há ${diffMins} minuto${diffMins > 1 ? 's' : ''}`;
    if (diffHours < 24) return `Há ${diffHours} hora${diffHours > 1 ? 's' : ''}`;
    if (diffDays < 7) return `Há ${diffDays} dia${diffDays > 1 ? 's' : ''}`;
    return formatarData(data);
  };

  /**
   * Criar chamado com feedback
   */
  const criarChamadoComFeedback = async (dados) => {
    try {
      const chamado = await chamadosStore.criarChamado(dados);
      success('Chamado criado com sucesso!');
      return chamado;
    } catch (err) {
      showError(err.message || 'Erro ao criar chamado');
      throw err;
    }
  };

  /**
   * Atualizar chamado com feedback
   */
  const atualizarChamadoComFeedback = async (id, dados) => {
    try {
      const chamado = await chamadosStore.atualizarChamado(id, dados);
      success('Chamado atualizado com sucesso!');
      return chamado;
    } catch (err) {
      showError(err.message || 'Erro ao atualizar chamado');
      throw err;
    }
  };

  /**
   * Deletar chamado com feedback
   */
  const deletarChamadoComFeedback = async (id) => {
    try {
      await chamadosStore.deletarChamado(id);
      success('Chamado cancelado com sucesso!');
      return true;
    } catch (err) {
      showError(err.message || 'Erro ao cancelar chamado');
      throw err;
    }
  };

  return {
    // Store
    store: chamadosStore,
    
    // Computed da store
    chamados: computed(() => chamadosStore.chamados),
    chamado: computed(() => chamadosStore.chamado),
    loading: computed(() => chamadosStore.loading),
    error: computed(() => chamadosStore.error),
    pagination: computed(() => chamadosStore.pagination),
    
    // Formatação
    formatarStatus,
    formatarPrioridade,
    formatarTipo,
    getStatusClass,
    getPrioridadeClass,
    getBadgeStatus,
    getBadgePrioridade,
    getBadgeTipo,
    formatarData,
    formatarDataRelativa,
    
    // Ações com feedback
    criarChamadoComFeedback,
    atualizarChamadoComFeedback,
    deletarChamadoComFeedback
  };
}

