import { ref } from 'vue';

/**
 * Composable para gerenciar estados de loading
 */
export function useLoading() {
  const loading = ref(false);
  const loadingMessage = ref('');

  /**
   * Iniciar loading
   */
  const startLoading = (message = 'Carregando...') => {
    loading.value = true;
    loadingMessage.value = message;
  };

  /**
   * Parar loading
   */
  const stopLoading = () => {
    loading.value = false;
    loadingMessage.value = '';
  };

  /**
   * Executar função assíncrona com loading automático
   */
  const withLoading = async (asyncFn, message = 'Carregando...') => {
    try {
      startLoading(message);
      const result = await asyncFn();
      return result;
    } finally {
      stopLoading();
    }
  };

  return {
    loading,
    loadingMessage,
    startLoading,
    stopLoading,
    withLoading
  };
}

