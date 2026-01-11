<template>
  <layout-principal>
    <template #header-actions>
      <button class="btn btn-secondary" @click="irParaChamados">
        <i class="bi bi-arrow-left"></i>
        Voltar para Chamados
      </button>
    </template>

    <div class="consultas-chamados-view">
      <div class="page-header">
        <h1 class="page-title">
          <i class="bi bi-search"></i>
          Consulta de Chamados
        </h1>
        <p class="page-subtitle">
          Pesquise chamados por data, número, grupo, executor ou solicitante
        </p>
      </div>

      <!-- Filtros Avançados -->
      <div class="filtros-avancados-card">
        <div class="filtros-header">
          <h2>
            <i class="bi bi-funnel"></i>
            Filtros de Consulta
          </h2>
          <button 
            v-if="contarFiltrosAtivos > 0"
            class="btn-clear-all"
            @click="limparFiltros"
          >
            <i class="bi bi-x-circle"></i>
            Limpar Todos
          </button>
        </div>

        <div class="filtros-grid">
          <!-- Número do Chamado -->
          <div class="filtro-group">
            <label class="filtro-label">
              <i class="bi bi-hash"></i>
              Número do Chamado
            </label>
            <input
              v-model="filtros.numero_chamado"
              type="number"
              class="filtro-input"
              placeholder="Digite o número do chamado"
              @input="debounceBuscar"
            >
          </div>

          <!-- Data Início -->
          <div class="filtro-group">
            <label class="filtro-label">
              <i class="bi bi-calendar-event"></i>
              Data Início
            </label>
            <input
              v-model="filtros.data_inicio"
              type="date"
              class="filtro-input"
              @change="debounceBuscar"
            >
          </div>

          <!-- Data Fim -->
          <div class="filtro-group">
            <label class="filtro-label">
              <i class="bi bi-calendar-check"></i>
              Data Fim
            </label>
            <input
              v-model="filtros.data_fim"
              type="date"
              class="filtro-input"
              @change="debounceBuscar"
            >
          </div>

          <!-- Grupo -->
          <div class="filtro-group">
            <label class="filtro-label">
              <i class="bi bi-diagram-3"></i>
              Grupo
            </label>
            <select
              v-model="filtros.grupo_id"
              class="filtro-select"
              @change="debounceBuscar"
            >
              <option value="">Todos os grupos</option>
              <option
                v-for="grupo in grupos"
                :key="grupo.id"
                :value="grupo.id"
              >
                {{ grupo.nome }}
              </option>
            </select>
          </div>

          <!-- Grupo Executor -->
          <div class="filtro-group">
            <label class="filtro-label">
              <i class="bi bi-gear"></i>
              Grupo Executor
            </label>
            <select
              v-model="filtros.grupo_executor_id"
              class="filtro-select"
              @change="debounceBuscar"
            >
              <option value="">Todos os executores</option>
              <option
                v-for="grupo in grupos"
                :key="grupo.id"
                :value="grupo.id"
              >
                {{ grupo.nome }}
              </option>
            </select>
          </div>

          <!-- Solicitante -->
          <div class="filtro-group">
            <label class="filtro-label">
              <i class="bi bi-person"></i>
              Solicitante
            </label>
            <select
              v-model="filtros.usuario_id"
              class="filtro-select"
              @change="debounceBuscar"
            >
              <option value="">Todos os solicitantes</option>
              <option
                v-for="usuario in usuarios"
                :key="usuario.id"
                :value="usuario.id"
              >
                {{ usuario.nome }} ({{ usuario.email }})
              </option>
            </select>
          </div>

          <!-- Status -->
          <div class="filtro-group">
            <label class="filtro-label">
              <i class="bi bi-circle-fill"></i>
              Status
            </label>
            <select
              v-model="filtros.status"
              class="filtro-select"
              @change="debounceBuscar"
            >
              <option value="">Todos os status</option>
              <option value="novo">Novo</option>
              <option value="em_andamento">Em Andamento</option>
              <option value="aguardando">Aguardando</option>
              <option value="resolvido">Resolvido</option>
              <option value="fechado">Fechado</option>
              <option value="cancelado">Cancelado</option>
            </select>
          </div>

          <!-- Busca Textual -->
          <div class="filtro-group full-width">
            <label class="filtro-label">
              <i class="bi bi-search"></i>
              Buscar por Título ou Descrição
            </label>
            <input
              v-model="filtros.search"
              type="text"
              class="filtro-input"
              placeholder="Digite palavras-chave para buscar no título ou descrição"
              @input="debounceBuscar"
            >
          </div>
        </div>

        <!-- Botão Buscar -->
        <div class="filtros-actions">
          <button 
            class="btn btn-primary"
            @click="buscarChamados"
            :disabled="loading"
          >
            <i class="bi bi-search"></i>
            {{ loading ? 'Buscando...' : 'Buscar Chamados' }}
          </button>
        </div>
      </div>

      <!-- Resultados -->
      <div class="resultados-container">
        <div v-if="!loading && chamados.length > 0" class="resultados-header">
          <h3>
            Resultados da Busca
            <span class="resultados-count">({{ pagination.total }} chamado{{ pagination.total !== 1 ? 's' : '' }})</span>
          </h3>
        </div>

        <!-- Lista de Chamados -->
        <ChamadoLista
          :chamados="chamados"
          :loading="loading"
          :pagination="pagination"
          @visualizar="visualizarChamado"
          @mudar-pagina="mudarPagina"
        />
      </div>
    </div>
  </layout-principal>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useChamadosStore } from '@/stores/chamados';
import { useGruposStore } from '@/stores/grupos';
import { useUsuariosStore } from '@/stores/usuarios';
import { useAuthStore } from '@/stores/auth';
import LayoutPrincipal from '@/components/LayoutPrincipal.vue';
import ChamadoLista from '@/components/chamado/ChamadoLista.vue';

const router = useRouter();

const chamadosStore = useChamadosStore();
const gruposStore = useGruposStore();
const usuariosStore = useUsuariosStore();
const authStore = useAuthStore();

// Estados
const loading = computed(() => chamadosStore.loading);
const chamados = computed(() => chamadosStore.chamados);
const pagination = computed(() => chamadosStore.pagination);
const grupos = computed(() => gruposStore.grupos.filter(g => g.ativo !== false));
const usuarios = computed(() => usuariosStore.usuarios.filter(u => u.ativo !== false));

// Filtros
const filtros = ref({
  numero_chamado: '',
  data_inicio: '',
  data_fim: '',
  grupo_id: '',
  grupo_executor_id: '',
  usuario_id: '',
  status: '',
  search: ''
});

// Debounce para busca automática
let debounceTimer = null;
const debounceBuscar = () => {
  if (debounceTimer) {
    clearTimeout(debounceTimer);
  }
  debounceTimer = setTimeout(() => {
    buscarChamados();
  }, 500);
};

// Contar filtros ativos
const contarFiltrosAtivos = computed(() => {
  let count = 0;
  if (filtros.value.numero_chamado) count++;
  if (filtros.value.data_inicio) count++;
  if (filtros.value.data_fim) count++;
  if (filtros.value.grupo_id) count++;
  if (filtros.value.grupo_executor_id) count++;
  if (filtros.value.usuario_id) count++;
  if (filtros.value.status) count++;
  if (filtros.value.search) count++;
  return count;
});

// Funções
const buscarChamados = async () => {
  try {
    // Preparar filtros para a API (remover campos vazios)
    const filtrosApi = {
      page: filtros.value.page || 1,
      limit: 20
    };

    // Busca por número do chamado tem prioridade
    if (filtros.value.numero_chamado) {
      filtrosApi.numero_chamado = filtros.value.numero_chamado;
      // Quando busca por número, não usar busca textual
    } else if (filtros.value.search) {
      // Só aplicar busca textual se não houver busca por número
      filtrosApi.search = filtros.value.search;
    }

    if (filtros.value.data_inicio) {
      filtrosApi.data_inicio = filtros.value.data_inicio;
    }
    if (filtros.value.data_fim) {
      filtrosApi.data_fim = filtros.value.data_fim;
    }
    if (filtros.value.grupo_id) {
      filtrosApi.grupo_id = parseInt(filtros.value.grupo_id);
    }
    if (filtros.value.grupo_executor_id) {
      filtrosApi.grupo_executor_id = parseInt(filtros.value.grupo_executor_id);
    }
    if (filtros.value.usuario_id) {
      filtrosApi.usuario_id = parseInt(filtros.value.usuario_id);
    }
    if (filtros.value.status) {
      filtrosApi.status = filtros.value.status;
    }

    await chamadosStore.listarChamados(filtrosApi);
  } catch (err) {
    console.error('Erro ao buscar chamados:', err);
  }
};

const limparFiltros = () => {
  filtros.value = {
    numero_chamado: '',
    data_inicio: '',
    data_fim: '',
    grupo_id: '',
    grupo_executor_id: '',
    usuario_id: '',
    status: '',
    search: ''
  };
  buscarChamados();
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

const irParaChamados = () => {
  router.push({ name: 'chamados' });
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
    
    // Carregar usuários
    await usuariosStore.listarUsuarios({ limit: 1000, ativo: true });
    
    // Buscar chamados inicialmente (vazio, sem filtros)
    await buscarChamados();
  } catch (error) {
    console.error('Erro ao carregar dados iniciais:', error);
  }
});
</script>

<style scoped>
.consultas-chamados-view {
  max-width: 1400px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: var(--space-6);
}

.page-title {
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
  margin-bottom: var(--space-2);
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.page-title i {
  color: var(--color-primary);
}

.page-subtitle {
  font-size: var(--font-size-base);
  color: var(--color-text-secondary);
}

/* ========================================
   FILTROS AVANÇADOS
   ======================================== */
.filtros-avancados-card {
  background: var(--color-bg-primary);
  border: 1px solid var(--color-border-medium);
  border-radius: var(--radius-lg);
  padding: var(--space-6);
  margin-bottom: var(--space-6);
  box-shadow: var(--shadow-sm);
}

.filtros-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-5);
  padding-bottom: var(--space-4);
  border-bottom: 1px solid var(--color-border-light);
}

.filtros-header h2 {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.filtros-header h2 i {
  color: var(--color-primary);
}

.btn-clear-all {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-4);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--color-danger-600);
  background: var(--color-danger-50);
  border: 1px solid var(--color-danger-200);
  border-radius: var(--radius-base);
  cursor: pointer;
  transition: all var(--transition-base);
}

.btn-clear-all:hover {
  background: var(--color-danger-100);
  border-color: var(--color-danger-300);
}

.filtros-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: var(--space-4);
  margin-bottom: var(--space-5);
}

.filtro-group {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.filtro-group.full-width {
  grid-column: 1 / -1;
}

.filtro-label {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-secondary);
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.filtro-label i {
  color: var(--color-primary);
  font-size: 0.875rem;
}

.filtro-input,
.filtro-select {
  width: 100%;
  height: var(--input-height-base);
  padding: 0 var(--space-4);
  font-size: var(--font-size-base);
  color: var(--color-text-primary);
  background: var(--color-bg-secondary);
  border: 1.5px solid var(--color-border-medium);
  border-radius: var(--radius-base);
  transition: all var(--transition-base);
}

.filtro-input:focus,
.filtro-select:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-primary-light);
  background: var(--color-bg-primary);
}

.filtros-actions {
  display: flex;
  justify-content: flex-end;
  padding-top: var(--space-4);
  border-top: 1px solid var(--color-border-light);
}

/* ========================================
   RESULTADOS
   ======================================== */
.resultados-container {
  margin-top: var(--space-6);
}

.resultados-header {
  margin-bottom: var(--space-5);
}

.resultados-header h3 {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.resultados-count {
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-normal);
  color: var(--color-text-secondary);
}

/* ========================================
   RESPONSIVIDADE
   ======================================== */
@media (max-width: 768px) {
  .filtros-avancados-card {
    padding: var(--space-4);
  }

  .filtros-grid {
    grid-template-columns: 1fr;
  }

  .filtros-header {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--space-3);
  }

  .filtros-actions {
    justify-content: stretch;
  }

  .filtros-actions .btn {
    width: 100%;
  }
}
</style>

