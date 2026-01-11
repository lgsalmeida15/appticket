import { ref, computed } from 'vue';

/**
 * Composable para gerenciar filtros de listagem
 */
export function useFiltros(filtrosIniciais = {}) {
  const filtros = ref({
    page: 1,
    limit: 10,
    search: '',
    ...filtrosIniciais
  });

  /**
   * Atualizar filtro
   */
  const atualizarFiltro = (nome, valor) => {
    filtros.value[nome] = valor;
    // Resetar página quando filtrar
    if (nome !== 'page' && nome !== 'limit') {
      filtros.value.page = 1;
    }
  };

  /**
   * Atualizar múltiplos filtros
   */
  const atualizarFiltros = (novosFiltros) => {
    filtros.value = {
      ...filtros.value,
      ...novosFiltros
    };
    // Resetar página
    if (!novosFiltros.page) {
      filtros.value.page = 1;
    }
  };

  /**
   * Limpar filtros
   */
  const limparFiltros = () => {
    filtros.value = {
      page: 1,
      limit: filtros.value.limit,
      search: '',
      ...filtrosIniciais
    };
  };

  /**
   * Verificar se há filtros ativos
   */
  const temFiltrosAtivos = computed(() => {
    return Object.keys(filtros.value).some(key => {
      const valor = filtros.value[key];
      if (key === 'page' || key === 'limit') return false;
      if (Array.isArray(valor)) return valor.length > 0;
      return valor !== '' && valor !== null && valor !== undefined;
    });
  });

  /**
   * Ir para página
   */
  const irParaPagina = (page) => {
    filtros.value.page = page;
  };

  /**
   * Próxima página
   */
  const proximaPagina = () => {
    filtros.value.page++;
  };

  /**
   * Página anterior
   */
  const paginaAnterior = () => {
    if (filtros.value.page > 1) {
      filtros.value.page--;
    }
  };

  return {
    filtros,
    atualizarFiltro,
    atualizarFiltros,
    limparFiltros,
    temFiltrosAtivos,
    irParaPagina,
    proximaPagina,
    paginaAnterior
  };
}

