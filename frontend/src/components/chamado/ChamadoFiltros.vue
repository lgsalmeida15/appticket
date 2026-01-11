<template>
  <div class="filtros-container">
    <div class="filtros-card">
      <!-- Busca -->
      <div class="search-wrapper">
        <i class="bi bi-search search-icon"></i>
        <input 
          type="text" 
          :value="filtros.search" 
          class="search-input" 
          placeholder="Buscar por título, ID ou descrição..."
          @input="handleBusca"
        >
        <span v-if="filtros.search" class="search-clear" @click="clearSearch">
          <i class="bi bi-x-circle"></i>
        </span>
      </div>

      <!-- Filtros em linha -->
      <div class="filters-row">
        <!-- Status -->
        <div class="filter-dropdown">
          <button 
            class="filter-button" 
            type="button" 
            data-bs-toggle="dropdown"
            data-bs-auto-close="outside"
          >
            <i class="bi bi-circle-fill"></i>
            <span>Status</span>
            <span v-if="filtros.status.length" class="filter-count">{{ filtros.status.length }}</span>
            <i class="bi bi-chevron-down"></i>
          </button>
          <ul class="dropdown-menu filter-menu">
            <li v-for="opcao in opcoesStatus" :key="opcao.value">
              <label class="filter-option">
                <input 
                  type="checkbox" 
                  :checked="isFiltroAtivo('status', opcao.value)"
                  @change="toggleFiltro('status', opcao.value)"
                >
                <span :class="['option-badge', opcao.badgeClass]">
                  {{ opcao.label }}
                </span>
              </label>
            </li>
          </ul>
        </div>

        <!-- Prioridade -->
        <div class="filter-dropdown">
          <button 
            class="filter-button" 
            type="button" 
            data-bs-toggle="dropdown"
            data-bs-auto-close="outside"
          >
            <i class="bi bi-flag-fill"></i>
            <span>Prioridade</span>
            <span v-if="filtros.prioridade.length" class="filter-count">{{ filtros.prioridade.length }}</span>
            <i class="bi bi-chevron-down"></i>
          </button>
          <ul class="dropdown-menu filter-menu">
            <li v-for="opcao in opcoesPrioridade" :key="opcao.value">
              <label class="filter-option">
                <input 
                  type="checkbox" 
                  :checked="isFiltroAtivo('prioridade', opcao.value)"
                  @change="toggleFiltro('prioridade', opcao.value)"
                >
                <span :class="['option-badge', opcao.badgeClass]">
                  {{ opcao.label }}
                </span>
              </label>
            </li>
          </ul>
        </div>

        <!-- Tipo -->
        <div class="filter-dropdown">
          <button 
            class="filter-button" 
            type="button" 
            data-bs-toggle="dropdown"
            data-bs-auto-close="outside"
          >
            <i class="bi bi-tag-fill"></i>
            <span>Tipo</span>
            <span v-if="filtros.tipo.length" class="filter-count">{{ filtros.tipo.length }}</span>
            <i class="bi bi-chevron-down"></i>
          </button>
          <ul class="dropdown-menu filter-menu">
            <li v-for="opcao in opcoesTipo" :key="opcao.value">
              <label class="filter-option">
                <input 
                  type="checkbox" 
                  :checked="isFiltroAtivo('tipo', opcao.value)"
                  @change="toggleFiltro('tipo', opcao.value)"
                >
                <span :class="['option-badge', opcao.badgeClass]">
                  {{ opcao.label }}
                </span>
              </label>
            </li>
          </ul>
        </div>

        <!-- Grupo -->
        <div class="filter-dropdown">
          <button 
            class="filter-button" 
            type="button" 
            data-bs-toggle="dropdown"
            data-bs-auto-close="outside"
          >
            <i class="bi bi-diagram-3-fill"></i>
            <span>Grupo</span>
            <span v-if="filtros.grupo_id.length" class="filter-count">{{ filtros.grupo_id.length }}</span>
            <i class="bi bi-chevron-down"></i>
          </button>
          <ul class="dropdown-menu filter-menu scrollable">
            <li v-for="grupo in grupos" :key="grupo.id">
              <label class="filter-option">
                <input 
                  type="checkbox" 
                  :checked="isFiltroAtivo('grupo_id', grupo.id)"
                  @change="toggleFiltro('grupo_id', grupo.id)"
                >
                <span class="option-label">{{ grupo.nome }}</span>
              </label>
            </li>
          </ul>
        </div>

        <!-- Botão Limpar -->
        <button 
          v-if="contarFiltrosAtivos > 0"
          class="clear-filters-button" 
          @click="limparFiltros"
          title="Limpar todos os filtros"
        >
          <i class="bi bi-x-circle"></i>
          Limpar
        </button>
      </div>

      <!-- Tags de Filtros Ativos -->
      <div v-if="contarFiltrosAtivos > 0" class="active-filters">
        <span class="active-filters-label">
          <i class="bi bi-funnel-fill"></i>
          Filtros ativos:
        </span>
        
        <!-- Tags de Status -->
        <button 
          v-for="status in filtros.status" 
          :key="'status-' + status"
          class="filter-tag tag-status"
          @click="toggleFiltro('status', status)"
        >
          {{ formatarStatus(status) }}
          <i class="bi bi-x"></i>
        </button>
        
        <!-- Tags de Prioridade -->
        <button 
          v-for="prioridade in filtros.prioridade" 
          :key="'prioridade-' + prioridade"
          class="filter-tag tag-prioridade"
          @click="toggleFiltro('prioridade', prioridade)"
        >
          {{ formatarPrioridade(prioridade) }}
          <i class="bi bi-x"></i>
        </button>
        
        <!-- Tags de Tipo -->
        <button 
          v-for="tipo in filtros.tipo" 
          :key="'tipo-' + tipo"
          class="filter-tag tag-tipo"
          @click="toggleFiltro('tipo', tipo)"
        >
          {{ formatarTipo(tipo) }}
          <i class="bi bi-x"></i>
        </button>
        
        <!-- Tags de Grupo -->
        <button 
          v-for="grupoId in filtros.grupo_id" 
          :key="'grupo-' + grupoId"
          class="filter-tag tag-grupo"
          @click="toggleFiltro('grupo_id', grupoId)"
        >
          {{ grupos.find(g => g.id === grupoId)?.nome }}
          <i class="bi bi-x"></i>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useChamados } from '@/composables/useChamados';

const { formatarStatus, formatarPrioridade, formatarTipo } = useChamados();

const props = defineProps({
  filtros: {
    type: Object,
    required: true,
    default: () => ({
      search: '',
      status: [],
      prioridade: [],
      tipo: [],
      grupo_id: []
    })
  },
  grupos: {
    type: Array,
    default: () => []
  }
});

const emit = defineEmits(['update:busca', 'toggle-filtro', 'limpar-filtros']);

const handleBusca = (event) => {
  emit('update:busca', event.target.value);
};

const clearSearch = () => {
  emit('update:busca', '');
};

const opcoesStatus = [
  { value: 'novo', label: 'Novo', badgeClass: 'badge-info' },
  { value: 'em_andamento', label: 'Em Andamento', badgeClass: 'badge-warning' },
  { value: 'aguardando', label: 'Aguardando', badgeClass: 'badge-info' }
];

const opcoesPrioridade = [
  { value: 'baixa', label: 'Baixa', badgeClass: 'badge-gray' },
  { value: 'media', label: 'Média', badgeClass: 'badge-info' },
  { value: 'alta', label: 'Alta', badgeClass: 'badge-warning' },
  { value: 'urgente', label: 'Urgente', badgeClass: 'badge-danger' }
];

const opcoesTipo = [
  { value: 'incidente', label: 'Incidente', badgeClass: 'badge-danger' },
  { value: 'requisicao', label: 'Requisição', badgeClass: 'badge-info' },
  { value: 'problema', label: 'Problema', badgeClass: 'badge-warning' },
  { value: 'mudanca', label: 'Mudança', badgeClass: 'badge-success' }
];

const isFiltroAtivo = (campo, valor) => {
  return props.filtros[campo].includes(valor);
};

const toggleFiltro = (campo, valor) => {
  emit('toggle-filtro', { campo, valor });
};

const limparFiltros = () => {
  emit('limpar-filtros');
};

const contarFiltrosAtivos = computed(() => {
  let count = 0;
  count += props.filtros.status.length;
  count += props.filtros.prioridade.length;
  count += props.filtros.tipo.length;
  count += props.filtros.grupo_id.length;
  return count;
});
</script>

<style scoped>
.filtros-container {
  margin-bottom: var(--space-6);
}

.filtros-card {
  background: var(--color-bg-primary);
  border: 1px solid var(--color-border-medium);
  border-radius: var(--radius-lg);
  padding: var(--space-5);
  box-shadow: var(--shadow-sm);
}

/* ========================================
   BUSCA
   ======================================== */
.search-wrapper {
  position: relative;
  margin-bottom: var(--space-4);
}

.search-icon {
  position: absolute;
  left: var(--space-4);
  top: 50%;
  transform: translateY(-50%);
  color: var(--color-text-tertiary);
  font-size: 1.125rem;
  pointer-events: none;
}

.search-input {
  width: 100%;
  height: var(--input-height-lg);
  padding: 0 var(--space-12) 0 var(--space-12);
  font-size: var(--font-size-base);
  color: var(--color-text-primary);
  background: var(--color-bg-secondary);
  border: 1.5px solid var(--color-border-medium);
  border-radius: var(--radius-base);
  transition: all var(--transition-base);
}

.search-input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-primary-light);
  background: var(--color-bg-primary);
}

.search-input::placeholder {
  color: var(--color-text-muted);
}

.search-clear {
  position: absolute;
  right: var(--space-4);
  top: 50%;
  transform: translateY(-50%);
  color: var(--color-text-tertiary);
  font-size: 1.125rem;
  cursor: pointer;
  transition: color var(--transition-base);
}

.search-clear:hover {
  color: var(--color-text-primary);
}

/* ========================================
   FILTROS ROW
   ======================================== */
.filters-row {
  display: flex;
  gap: var(--space-2);
  flex-wrap: wrap;
  align-items: center;
}

.filter-dropdown {
  position: relative;
}

.filter-button {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  height: var(--button-height-base);
  padding: 0 var(--space-4);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-secondary);
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border-medium);
  border-radius: var(--radius-base);
  cursor: pointer;
  transition: all var(--transition-base);
}

.filter-button:hover {
  background: var(--color-bg-tertiary);
  border-color: var(--color-border-strong);
  color: var(--color-text-primary);
}

.filter-button i:first-child {
  font-size: 0.875rem;
}

.filter-button i:last-child {
  font-size: 0.75rem;
  margin-left: auto;
}

.filter-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  height: 20px;
  padding: 0 6px;
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  background: var(--color-primary);
  color: white;
  border-radius: var(--radius-full);
}

.clear-filters-button {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  height: var(--button-height-base);
  padding: 0 var(--space-4);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--color-danger-600);
  background: var(--color-danger-50);
  border: 1px solid var(--color-danger-200);
  border-radius: var(--radius-base);
  cursor: pointer;
  transition: all var(--transition-base);
}

.clear-filters-button:hover {
  background: var(--color-danger-100);
  border-color: var(--color-danger-300);
}

/* ========================================
   FILTER MENU
   ======================================== */
.filter-menu {
  min-width: 200px;
  padding: var(--space-2);
  background: var(--color-bg-primary);
  border: 1px solid var(--color-border-medium);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  z-index: var(--z-dropdown);
}

.filter-menu.scrollable {
  max-height: 300px;
  overflow-y: auto;
}

.filter-option {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-2) var(--space-3);
  cursor: pointer;
  border-radius: var(--radius-base);
  transition: background-color var(--transition-base);
  margin: 0;
}

.filter-option:hover {
  background: var(--color-bg-tertiary);
}

.filter-option input[type="checkbox"] {
  width: 16px;
  height: 16px;
  border: 1.5px solid var(--color-border-strong);
  border-radius: 4px;
  cursor: pointer;
}

.option-badge {
  display: inline-flex;
  align-items: center;
  padding: 2px var(--space-2);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  border-radius: var(--radius-sm);
}

.badge-primary {
  background: var(--color-brand-100);
  color: var(--color-brand-700);
}

.badge-success {
  background: var(--color-success-50);
  color: var(--color-success-700);
}

.badge-warning {
  background: var(--color-warning-50);
  color: var(--color-warning-700);
}

.badge-danger {
  background: var(--color-danger-50);
  color: var(--color-danger-700);
}

.badge-info {
  background: var(--color-info-50);
  color: var(--color-info-700);
}

.badge-gray {
  background: var(--color-gray-100);
  color: var(--color-gray-700);
}

.option-label {
  font-size: var(--font-size-sm);
  color: var(--color-text-primary);
}

/* ========================================
   ACTIVE FILTERS
   ======================================== */
.active-filters {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  align-items: center;
  margin-top: var(--space-4);
  padding-top: var(--space-4);
  border-top: 1px solid var(--color-border-light);
}

.active-filters-label {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-tertiary);
  text-transform: uppercase;
  letter-spacing: var(--letter-spacing-wider);
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.filter-tag {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-1) var(--space-3);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  border-radius: var(--radius-full);
  cursor: pointer;
  transition: all var(--transition-base);
  border: none;
}

.filter-tag:hover {
  transform: translateY(-1px);
  box-shadow: var(--shadow-sm);
}

.filter-tag i {
  font-size: 0.875rem;
}

.tag-status {
  background: var(--color-brand-100);
  color: var(--color-brand-700);
}

.tag-status:hover {
  background: var(--color-brand-200);
}

.tag-prioridade {
  background: var(--color-warning-100);
  color: var(--color-warning-700);
}

.tag-prioridade:hover {
  background: var(--color-warning-200);
}

.tag-tipo {
  background: var(--color-info-100);
  color: var(--color-info-700);
}

.tag-tipo:hover {
  background: var(--color-info-200);
}

.tag-grupo {
  background: var(--color-gray-200);
  color: var(--color-gray-700);
}

.tag-grupo:hover {
  background: var(--color-gray-300);
}

/* ========================================
   RESPONSIVIDADE
   ======================================== */
@media (max-width: 768px) {
  .filtros-card {
    padding: var(--space-4);
  }
  
  .filters-row {
    flex-direction: column;
    align-items: stretch;
  }
  
  .filter-button,
  .clear-filters-button {
    width: 100%;
    justify-content: space-between;
  }
}
</style>
