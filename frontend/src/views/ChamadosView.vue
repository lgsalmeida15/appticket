<template>
  <layout-principal>
    <template #header-actions>
      <div class="d-flex align-items-center gap-3">
        <!-- Visualização e Agrupamento -->
        <div class="view-controls d-flex align-items-center gap-3">
          <div class="d-flex align-items-center gap-2">
            <button 
              class="btn" 
              :class="viewMode === 'lista' ? 'btn-primary' : 'btn-outline-primary'"
              @click="toggleViewMode('lista')"
              title="Visualização em Lista"
            >
              <i class="bi bi-list-ul"></i>
              <span class="ms-2 d-none d-xl-inline">Lista</span>
            </button>
            <button 
              class="btn" 
              :class="viewMode === 'kanban' ? 'btn-primary' : 'btn-outline-primary'"
              @click="toggleViewMode('kanban')"
              title="Visualização em Kanban"
            >
              <i class="bi bi-columns-gap"></i>
              <span class="ms-2 d-none d-xl-inline">Kanban</span>
            </button>
          </div>

          <div v-if="viewMode === 'kanban'" class="kanban-group-selector">
            <select 
              class="form-select border-primary shadow-sm" 
              :value="kanbanGroupBy"
              @change="handleKanbanGroupByUpdate($event.target.value)"
            >
              <option value="status">Agrupar: Status</option>
              <option value="prioridade">Agrupar: Prioridade</option>
              <option value="tipo">Agrupar: Tipo</option>
              <option value="grupo">Agrupar: Grupo</option>
            </select>
          </div>
        </div>

        <div class="header-divider d-none d-sm-block"></div>

        <button class="btn btn-primary shadow-sm" @click="irParaNovoChamado">
          <i class="bi bi-plus-circle"></i>
          <span class="ms-1 d-none d-sm-inline">Novo Chamado</span>
        </button>
      </div>
    </template>

    <div class="chamados-view">
      <!-- Estatísticas -->
      <ChamadoEstatisticas :estatisticas="estatisticas" />

      <!-- Filtros -->
      <ChamadoFiltros
        :filtros="filtros"
        :grupos="grupos"
        :usuarios="usuariosResponsaveis"
        :is-admin="isAdmin"
        @update:busca="handleBuscaUpdate"
        @toggle-filtro="toggleFiltro"
        @update:responsavel="handleResponsavelUpdate"
        @limpar-filtros="limparFiltros"
      />

      <!-- Lista de Chamados -->
      <ChamadoLista
        v-if="viewMode === 'lista'"
        :chamados="chamados"
        :loading="loading"
        :pagination="pagination"
        @visualizar="visualizarChamado"
        @mudar-pagina="mudarPagina"
        @refresh="buscarChamados({ background: true })"
      />

      <!-- Kanban de Chamados -->
      <ChamadoKanban
        v-else
        :chamados="chamados"
        :loading="loading"
        :group-by="kanbanGroupBy"
        :grupos="grupos"
        @visualizar="visualizarChamado"
        @refresh="buscarChamados({ background: true })"
      />
    </div>
  </layout-principal>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useChamadosStore } from '@/stores/chamados';
import { useGruposStore } from '@/stores/grupos';
import { useUsuariosStore } from '@/stores/usuarios';
import { useAuthStore } from '@/stores/auth';
import LayoutPrincipal from '@/components/LayoutPrincipal.vue';
import ChamadoEstatisticas from '@/components/chamado/ChamadoEstatisticas.vue';
import ChamadoFiltros from '@/components/chamado/ChamadoFiltros.vue';
import ChamadoLista from '@/components/chamado/ChamadoLista.vue';
import ChamadoKanban from '@/components/chamado/ChamadoKanban.vue';

const router = useRouter();

const chamadosStore = useChamadosStore();
const gruposStore = useGruposStore();
const usuariosStore = useUsuariosStore();
const authStore = useAuthStore();

// Estados
const loading = computed(() => chamadosStore.loading);
const chamados = computed(() => chamadosStore.chamados);
const pagination = computed(() => chamadosStore.pagination);
const estatisticas = computed(() => chamadosStore.estatisticas);
const grupos = computed(() => gruposStore.grupos.filter(g => g.ativo !== false));

// Visualização e Agrupamento
const viewMode = ref(localStorage.getItem('chamados_view_mode') || 'lista');
const kanbanGroupBy = ref(localStorage.getItem('chamados_kanban_group_by') || 'status');

const toggleViewMode = (mode) => {
  viewMode.value = mode;
  localStorage.setItem('chamados_view_mode', mode);
  // Re-buscar chamados ao mudar de modo para ajustar o limite (10 vs 100)
  buscarChamados();
};

const handleKanbanGroupByUpdate = (value) => {
  kanbanGroupBy.value = value;
  localStorage.setItem('chamados_kanban_group_by', value);
};

// Filtrar usuários que pertencem a grupos executores
const usuariosResponsaveis = computed(() => {
  // Pegar todos os grupos que são executores
  const gruposExecutoresIds = grupos.value
    .filter(g => g.executor)
    .map(g => g.id);

  // Filtrar usuários que estão em pelo menos um desses grupos
  return usuariosStore.usuarios.filter(u => {
    if (u.ativo === false) return false;
    
    // Se o usuário tem a lista de grupos (carregada pelo backend)
    if (u.grupos && Array.isArray(u.grupos)) {
      return u.grupos.some(g => gruposExecutoresIds.includes(g.id));
    }
    
    // Fallback: se for admin, ele pode ser responsável
    if (u.tipo === 'admin') return true;

    return false;
  });
});

const isAdmin = computed(() => authStore.isAdmin);

// Timer para atualização automática
let refreshInterval = null;

const iniciarAutoRefresh = () => {
  // Limpar intervalo anterior se existir
  if (refreshInterval) clearInterval(refreshInterval);
  
  // Definir intervalo de 30 segundos
  refreshInterval = setInterval(() => {
    // Só atualizar se a página estiver visível e não estiver carregando
    if (!document.hidden && !loading.value) {
      console.log('🔄 Auto-refresh (background): Atualizando chamados...');
      buscarChamados({ background: true });
      carregarEstatisticas({ background: true });
    }
  }, 30000);
};

const pararAutoRefresh = () => {
  if (refreshInterval) {
    clearInterval(refreshInterval);
    refreshInterval = null;
  }
};

// Carregar filtros do localStorage
const carregarFiltrosSalvos = () => {
  try {
    const filtrosSalvos = localStorage.getItem('chamados_filtros');
    if (filtrosSalvos) {
      const filtros = JSON.parse(filtrosSalvos);
      // Garantir que apenas status abertos estejam no array padrão
      if (!filtros.status || filtros.status.length === 0) {
        filtros.status = ['novo', 'em_andamento', 'aguardando'];
      } else {
        // Remover status fechados e aberto se estiverem presentes
        filtros.status = filtros.status.filter(s => 
          !['resolvido', 'fechado', 'cancelado', 'aberto'].includes(s)
        );
        // Se após filtrar não houver status, usar padrão
        if (filtros.status.length === 0) {
          filtros.status = ['novo', 'em_andamento', 'aguardando'];
        }
      }
      // Garantir que atribuido_a seja null se não existir
      if (filtros.atribuido_a === undefined) {
        filtros.atribuido_a = null;
      }
      return filtros;
    }
  } catch (error) {
    console.error('Erro ao carregar filtros salvos:', error);
  }
  return {
    search: '',
    status: ['novo', 'em_andamento', 'aguardando'], // Apenas status abertos por padrão
    prioridade: [],
    tipo: [],
    grupo_id: [],
    atribuido_a: null
  };
};

const filtros = ref(carregarFiltrosSalvos());

// Salvar filtros no localStorage sempre que mudarem
watch(filtros, (novosFiltros) => {
  try {
    localStorage.setItem('chamados_filtros', JSON.stringify(novosFiltros));
  } catch (error) {
    console.error('Erro ao salvar filtros:', error);
  }
}, { deep: true });

// Funções
const buscarChamados = async (opcoes = {}) => {
  try {
    // Filtrar apenas chamados abertos (excluir resolvido, fechado, cancelado e aberto)
    const statusAbertos = ['novo', 'em_andamento', 'aguardando'];
    
    // Preparar filtros, garantindo que sempre tenha status abertos por padrão
    const filtrosComStatus = {
      ...filtros.value,
      ...opcoes,
      // Aumentar o limite se estiver no modo Kanban para ver mais chamados nas esteiras
      limit: viewMode.value === 'kanban' ? 100 : 10
    };
    
    // Se não há filtro de status ou está vazio, aplicar filtro padrão de status abertos
    if (!filtros.value.status || filtros.value.status.length === 0) {
      filtrosComStatus.status = statusAbertos;
    }
    
    await chamadosStore.listarChamados(filtrosComStatus);
  } catch (err) {
    console.error('Erro ao buscar chamados:', err);
  }
};

const limparFiltros = () => {
  filtros.value = {
    search: '',
    status: ['novo', 'em_andamento', 'aguardando'], // Apenas status abertos por padrão
    prioridade: [],
    tipo: [],
    grupo_id: [],
    atribuido_a: null
  };
  buscarChamados();
};

const handleBuscaUpdate = (valor) => {
  filtros.value.search = valor;
  buscarChamados();
};

const handleResponsavelUpdate = (valor) => {
  filtros.value.atribuido_a = valor ? parseInt(valor) : null;
  buscarChamados();
};

const toggleFiltro = ({ campo, valor }) => {
  const statusAbertos = ['novo', 'em_andamento', 'aguardando'];
  
  const index = filtros.value[campo].indexOf(valor);
  if (index === -1) {
    filtros.value[campo].push(valor);
  } else {
    filtros.value[campo].splice(index, 1);
    
    // Se for status e ficar vazio, aplicar padrão de status abertos
    if (campo === 'status' && filtros.value[campo].length === 0) {
      filtros.value[campo] = [...statusAbertos];
    }
  }
  buscarChamados();
};

const carregarEstatisticas = async (opcoes = {}) => {
  try {
    await chamadosStore.buscarEstatisticas(opcoes);
  } catch (err) {
    console.error('Erro ao carregar estatísticas:', err);
  }
};

const irParaNovoChamado = () => {
  router.push({ name: 'chamado-new' });
};

const visualizarChamado = async (chamado) => {
  router.push({ 
    name: 'chamado-view', 
    params: { id: chamado.id } 
  });
};

const mudarPagina = async (page) => {
  if (page < 1 || page > pagination.value.totalPages) return;
  filtros.value.page = page;
  await buscarChamados();
};

// Lifecycle
onMounted(async () => {
  try {
    // Carregar grupos
    if (authStore.isAgente) {
      await gruposStore.meusGrupos();
    } else {
      await gruposStore.listarGrupos({ limit: 1000, ativo: true });
    }
    
    // Carregar usuários com seus grupos para o filtro de responsáveis
    await usuariosStore.listarUsuarios({ limit: 1000, ativo: true, incluirGrupos: true });
    
    // Carregar chamados e estatísticas
    await Promise.all([
      buscarChamados(),
      carregarEstatisticas()
    ]);

    // Iniciar atualização automática
    iniciarAutoRefresh();
  } catch (error) {
    console.error('Erro ao carregar dados iniciais:', error);
  }
});

onUnmounted(() => {
  pararAutoRefresh();
});
</script>

<style scoped>
.chamados-view {
  width: 100%;
  max-width: 100%;
  margin: 0 auto;
  overflow-x: hidden;
}

.view-controls .btn {
  display: flex;
  align-items: center;
  height: var(--button-height-base);
  padding: 0 var(--space-4);
  font-weight: 600;
  transition: all 0.2s ease;
}

.view-controls .btn i {
  font-size: 1.1rem;
}

.kanban-group-selector .form-select {
  min-width: 180px;
  height: var(--button-height-base);
  cursor: pointer;
}

.header-divider {
  width: 1px;
  height: 24px;
  background-color: var(--color-border-medium);
}

[data-theme="dark"] .kanban-group-selector select {
  background-color: var(--color-bg-tertiary);
  color: var(--color-text-primary);
}
</style>
