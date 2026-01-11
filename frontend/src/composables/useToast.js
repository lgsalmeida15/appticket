import { ref } from 'vue';

/**
 * Composable para exibir toasts/notificações
 * Pode ser integrado com uma biblioteca de toast no futuro
 */
export function useToast() {
  const toasts = ref([]);
  const toastIdCounter = ref(0);

  /**
   * Adicionar toast
   */
  const addToast = (message, type = 'info', duration = 5000) => {
    const id = ++toastIdCounter.value;
    const toast = {
      id,
      message,
      type, // 'success', 'error', 'warning', 'info'
      duration,
      visible: true
    };

    toasts.value.push(toast);

    // Remover automaticamente após duração
    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }

    return id;
  };

  /**
   * Remover toast
   */
  const removeToast = (id) => {
    const index = toasts.value.findIndex(t => t.id === id);
    if (index !== -1) {
      toasts.value.splice(index, 1);
    }
  };

  /**
   * Remover todos os toasts
   */
  const clearToasts = () => {
    toasts.value = [];
  };

  /**
   * Helpers para tipos comuns
   */
  const success = (message, duration = 5000) => addToast(message, 'success', duration);
  const error = (message, duration = 7000) => addToast(message, 'error', duration);
  const warning = (message, duration = 6000) => addToast(message, 'warning', duration);
  const info = (message, duration = 5000) => addToast(message, 'info', duration);

  return {
    toasts,
    addToast,
    removeToast,
    clearToasts,
    success,
    error,
    warning,
    info
  };
}

