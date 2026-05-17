<template>
  <div class="kanban-container">
    <!-- Indicador de Sincronização Discreto -->
    <div v-if="loading" class="sync-indicator">
      <div class="sync-bar"></div>
    </div>

    <!-- Loading inicial (apenas quando não há dados e não é background) -->
    <div v-if="loading && !hasChamados && !isBackgroundLoading" class="kanban-loading">
      <LoadingSpinner text="Carregando quadro..." />
    </div>

    <!-- Kanban Board -->
    <div v-else class="kanban-board">
      <div 
        v-for="coluna in colunasComDados" 
        :key="coluna.id" 
        class="kanban-column"
      >
        <!-- Column Header -->
        <div class="column-header" :style="{ borderBottomColor: coluna.color }">
          <div class="header-title">
            <i :class="['bi', coluna.icon]"></i>
            <span>{{ coluna.label }}</span>
          </div>
          <span class="column-count">{{ coluna.totalCount }}</span>
        </div>

        <!-- Column Body -->
        <div 
          class="column-body custom-scrollbar"
          @scroll="handleScroll($event, coluna.id)"
        >
          <!-- Empty State -->
          <div v-if="coluna.totalCount === 0" class="column-empty">
            <i :class="['bi', coluna.icon]"></i>
            <span>Nenhum chamado</span>
          </div>

          <!-- Cards com Transição Suave -->
          <transition-group name="kanban-list" tag="div" class="cards-wrapper">
            <div 
              v-for="chamado in coluna.visiveis" 
              :key="chamado.id"
              class="kanban-card shadow-sm"
              @click="$emit('visualizar', chamado)"
            >
              <!-- Card Header -->
              <div class="card-header-kanban">
                <span class="card-id">#{{ chamado.id }}</span>
                <span :class="['card-priority', `priority-${chamado.prioridade}`]" :title="formatarPrioridade(chamado.prioridade)">
                  <i class="bi bi-flag-fill"></i>
                </span>
              </div>

              <!-- Card Title -->
              <h4 class="card-title-kanban">{{ chamado.titulo }}</h4>

              <!-- Card Meta -->
              <div class="card-meta">
                <span :class="['meta-badge', `badge-${chamado.tipo}`]">
                  {{ formatarTipo(chamado.tipo) }}
                </span>
                <span v-if="groupBy !== 'status'" :class="['status-badge-small', `status-${chamado.status}`]">
                  {{ formatarStatus(chamado.status) }}
                </span>
              </div>

              <!-- Card Footer -->
              <div class="card-footer-kanban">
                <div class="card-user">
                  <div class="user-avatar-small" :title="chamado.responsavel?.nome || 'Sem responsável'">
                    <i class="bi bi-person-fill"></i>
                  </div>
                  <span class="user-name-small">{{ chamado.responsavel?.nome || 'Não atribuído' }}</span>
                </div>
                
                <div v-if="chamado.grupo && groupBy !== 'grupo'" class="card-group">
                  <i class="bi bi-diagram-3"></i>
                  <span>{{ chamado.grupo.nome }}</span>
                </div>
              </div>

              <!-- SLA Indicator -->
              <div v-if="chamado.prazo && isSlaEstourado(chamado.prazo)" class="sla-indicator sla-danger">
                <i class="bi bi-clock-history"></i>
                <span>Atrasado</span>
              </div>
            </div>
          </transition-group>

          <!-- Lazy Load Indicator -->
          <div v-if="coluna.temMais" class="lazy-load-indicator">
            <div class="spinner-border spinner-border-sm text-primary"></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, shallowRef } from 'vue';
import { useChamados } from '@/composables/useChamados';
import LoadingSpinner from '@/components/shared/LoadingSpinner.vue';

const { formatarTipo, formatarStatus, formatarPrioridade } = useChamados();

const props = defineProps({
  chamados: {
    type: Array,
    required: true,
    default: () => []
  },
  loading: {
    type: Boolean,
    default: false
  },
  groupBy: {
    type: String,
    default: 'status'
  },
  grupos: {
    type: Array,
    default: () => []
  }
});

defineEmits(['visualizar']);

// Cache interno para evitar flicker
const internalChamados = shallowRef([]);
const isBackgroundLoading = ref(false);

// Monitorar carregamento para identificar se é background
watch(() => props.loading, (newVal) => {
  if (newVal && internalChamados.value.length > 0) {
    isBackgroundLoading.value = true;
  } else if (!newVal) {
    isBackgroundLoading.value = false;
  }
});

// Atualizar cache interno apenas quando os dados mudarem e não estiver "sumindo"
watch(() => props.chamados, (newVal) => {
  // Se recebemos dados novos (mesmo que vazios, se for o caso real), atualizamos o cache
  // O shallowRef ajuda na performance de comparação
  internalChamados.value = [...newVal];
}, { immediate: true });

const hasChamados = computed(() => internalChamados.value.length > 0);

// Estado para controle de paginação interna (Lazy Load)
const limitesVisiveis = ref({});
const CARGA_INICIAL = 15;
const INCREMENTO = 10;

// Resetar limites quando mudar o agrupamento
watch(() => props.groupBy, () => {
  limitesVisiveis.value = {};
});

// Definição das colunas base
const colunasBase = computed(() => {
  if (props.groupBy === 'status') {
    return [
      { id: 'novo', label: 'Novo', icon: 'bi-inbox-fill', color: 'var(--color-info-500)' },
      { id: 'em_andamento', label: 'Em Andamento', icon: 'bi-hourglass-split', color: 'var(--color-warning-500)' },
      { id: 'aguardando', label: 'Aguardando', icon: 'bi-clock-history', color: 'var(--color-gray-400)' },
      { id: 'resolvido', label: 'Resolvido', icon: 'bi-check-circle-fill', color: 'var(--color-success-500)' },
      { id: 'fechado', label: 'Fechado', icon: 'bi-archive-fill', color: 'var(--color-gray-600)' }
    ];
  }

  if (props.groupBy === 'prioridade') {
    return [
      { id: 'urgente', label: 'Urgente', icon: 'bi-exclamation-diamond-fill', color: 'var(--color-danger-600)' },
      { id: 'alta', label: 'Alta', icon: 'bi-caret-up-square-fill', color: 'var(--color-danger-400)' },
      { id: 'media', label: 'Média', icon: 'bi-dash-square-fill', color: 'var(--color-info-500)' },
      { id: 'baixa', label: 'Baixa', icon: 'bi-caret-down-square-fill', color: 'var(--color-gray-400)' }
    ];
  }

  if (props.groupBy === 'tipo') {
    return [
      { id: 'incidente', label: 'Incidente', icon: 'bi-lightning-fill', color: 'var(--color-danger-500)' },
      { id: 'requisicao', label: 'Requisição', icon: 'bi-file-earmark-text-fill', color: 'var(--color-info-500)' },
      { id: 'problema', label: 'Problema', icon: 'bi-shield-exclamation', color: 'var(--color-warning-500)' },
      { id: 'mudanca', label: 'Mudança', icon: 'bi-arrow-repeat', color: 'var(--color-success-500)' }
    ];
  }

  if (props.groupBy === 'grupo') {
    const colunas = props.grupos.map(g => ({
      id: g.id,
      label: g.nome,
      icon: 'bi-diagram-3-fill',
      color: 'var(--color-primary)'
    }));
    
    colunas.push({
      id: 'sem-grupo',
      label: 'Sem Grupo',
      icon: 'bi-question-circle',
      color: 'var(--color-gray-400)'
    });
    
    return colunas;
  }

  return [];
});

// Propriedade computada principal: Organiza tudo de uma vez para performance
const colunasComDados = computed(() => {
  const chamados = internalChamados.value;
  const groupBy = props.groupBy;
  
  return colunasBase.value.map(coluna => {
    // Filtrar chamados desta coluna
    const chamadosDaColuna = chamados.filter(c => {
      if (groupBy === 'status') return c.status === coluna.id;
      if (groupBy === 'prioridade') return c.prioridade === coluna.id;
      if (groupBy === 'tipo') return c.tipo === coluna.id;
      if (groupBy === 'grupo') {
        if (coluna.id === 'sem-grupo') return !c.grupo_id;
        return c.grupo_id === coluna.id;
      }
      return false;
    });

    const limite = limitesVisiveis.value[coluna.id] || CARGA_INICIAL;
    
    return {
      ...coluna,
      totalCount: chamadosDaColuna.length,
      visiveis: chamadosDaColuna.slice(0, limite),
      temMais: chamadosDaColuna.length > limite
    };
  });
});

// Handler de Scroll para Lazy Load
const handleScroll = (event, colunaId) => {
  const { scrollTop, scrollHeight, clientHeight } = event.target;
  
  if (scrollTop + clientHeight >= scrollHeight - 100) {
    const coluna = colunasComDados.value.find(c => c.id === colunaId);
    if (coluna && coluna.temMais) {
      const limiteAtual = limitesVisiveis.value[colunaId] || CARGA_INICIAL;
      limitesVisiveis.value[colunaId] = limiteAtual + INCREMENTO;
    }
  }
};

const isSlaEstourado = (prazo) => {
  if (!prazo) return false;
  return new Date(prazo) < new Date();
};
</script>

<style scoped>
.kanban-container {
  width: 100%;
  position: relative;
  overflow-x: auto;
  padding-bottom: var(--space-4);
  background-color: var(--color-bg-secondary);
  border-radius: var(--radius-lg);
}

/* Barra de sincronização discreta */
.sync-indicator {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 3px;
  z-index: 100;
  overflow: hidden;
}

.sync-bar {
  height: 100%;
  background: var(--color-primary);
  width: 30%;
  animation: sync-move 1.5s infinite linear;
}

@keyframes sync-move {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(400%); }
}

.kanban-loading {
  height: 400px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.kanban-board {
  display: flex;
  gap: var(--space-4);
  padding: var(--space-4);
  min-height: calc(100vh - 300px);
}

.kanban-column {
  flex: 0 0 320px;
  display: flex;
  flex-direction: column;
  background: var(--color-bg-tertiary);
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-border-medium);
  height: calc(100vh - 350px);
  transition: all 0.3s ease;
}

.column-header {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-4) var(--space-5);
  background: var(--color-bg-primary);
  border-bottom: 3px solid;
  border-top-left-radius: var(--radius-lg);
  border-top-right-radius: var(--radius-lg);
  z-index: 10;
}

.header-title {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--font-size-xs);
  font-weight: 700;
  color: var(--color-text-primary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.column-count {
  font-size: var(--font-size-xs);
  font-weight: 700;
  background: var(--color-bg-secondary);
  color: var(--color-text-secondary);
  padding: 2px 8px;
  border-radius: var(--radius-full);
}

.column-body {
  flex: 1;
  padding: var(--space-3);
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

/* Scrollbar Customizada */
.custom-scrollbar::-webkit-scrollbar {
  width: 5px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: var(--color-gray-300);
  border-radius: 10px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: var(--color-gray-400);
}

.cards-wrapper {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  min-height: 10px;
}

.kanban-card {
  background: var(--color-bg-primary);
  border: 1px solid var(--color-border-medium);
  border-radius: var(--radius-base);
  padding: var(--space-4);
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  position: relative;
  /* Importante para o transition-group não causar saltos */
  backface-visibility: hidden;
}

.kanban-card:hover {
  transform: translateY(-3px);
  box-shadow: var(--shadow-md) !important;
  border-color: var(--color-primary);
}

/* Animações do Kanban List - Otimizadas */
.kanban-list-enter-active,
.kanban-list-leave-active {
  transition: all 0.3s ease;
}
.kanban-list-enter-from {
  opacity: 0;
  transform: translateY(10px);
}
.kanban-list-leave-to {
  opacity: 0;
  transform: scale(0.95);
}
.kanban-list-move {
  transition: transform 0.4s ease;
}

.card-header-kanban {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-2);
}

.card-id {
  font-size: 0.7rem;
  font-weight: 700;
  color: var(--color-primary);
  font-family: var(--font-mono);
}

.card-priority {
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
}

.priority-baixa { background: var(--color-gray-100); color: var(--color-gray-500); }
.priority-media { background: var(--color-info-50); color: var(--color-info-600); }
.priority-alta { background: var(--color-warning-50); color: var(--color-warning-600); }
.priority-urgente { background: var(--color-danger-50); color: var(--color-danger-600); animation: pulse 2s infinite; }

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}

.card-title-kanban {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: var(--space-3);
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.card-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: var(--space-3);
}

.meta-badge, .status-badge-small {
  padding: 1px 6px;
  font-size: 0.65rem;
  font-weight: 700;
  border-radius: 4px;
  text-transform: uppercase;
}

.badge-incidente { background: var(--color-danger-50); color: var(--color-danger-700); }
.badge-requisicao { background: var(--color-info-50); color: var(--color-info-700); }
.badge-problema { background: var(--color-warning-50); color: var(--color-warning-700); }
.badge-mudanca { background: var(--color-success-50); color: var(--color-success-700); }

.card-footer-kanban {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding-top: var(--space-3);
  border-top: 1px solid var(--color-border-light);
}

.card-user {
  display: flex;
  align-items: center;
  gap: 8px;
}

.user-avatar-small {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: var(--color-primary-light);
  color: var(--color-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.7rem;
}

.user-name-small {
  font-size: 0.7rem;
  color: var(--color-text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.card-group {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.65rem;
  color: var(--color-text-tertiary);
}

.sla-indicator {
  position: absolute;
  top: 8px;
  right: 32px;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 2px 6px;
  font-size: 0.6rem;
  font-weight: 800;
  border-radius: 4px;
  text-transform: uppercase;
}

.sla-danger { background: var(--color-danger-600); color: white; }

.column-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 40px 20px;
  color: var(--color-text-muted);
  font-size: 0.8rem;
  opacity: 0.5;
}

.column-empty i { font-size: 2.5rem; }

.lazy-load-indicator {
  display: flex;
  justify-content: center;
  padding: 10px;
}

@media (max-width: 768px) {
  .kanban-board { flex-direction: column; }
  .kanban-column { flex: 1 1 auto; height: 400px; }
}
</style>
