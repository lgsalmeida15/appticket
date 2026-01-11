<template>
  <div class="kanban-container">
    <!-- Loading -->
    <LoadingSpinner v-if="loading" text="Carregando chamados..." />

    <!-- Kanban Board -->
    <div v-else class="kanban-board">
      <div 
        v-for="coluna in colunas" 
        :key="coluna.status" 
        class="kanban-column"
      >
        <!-- Column Header -->
        <div class="column-header" :class="`header-${coluna.status}`">
          <div class="header-title">
            <i :class="`bi ${coluna.icon}`"></i>
            <span>{{ coluna.label }}</span>
          </div>
          <span class="column-count">{{ getChamadosPorStatus(coluna.status).length }}</span>
        </div>

        <!-- Column Body -->
        <div class="column-body">
          <!-- Empty State -->
          <div v-if="getChamadosPorStatus(coluna.status).length === 0" class="column-empty">
            <i :class="`bi ${coluna.icon}`"></i>
            <span>Nenhum chamado</span>
          </div>

          <!-- Cards -->
          <div 
            v-for="chamado in getChamadosPorStatus(coluna.status)" 
            :key="chamado.id"
            class="kanban-card"
            @click="$emit('visualizar', chamado)"
          >
            <!-- Card Header -->
            <div class="card-header-kanban">
              <span class="card-id">#{{ chamado.id }}</span>
              <span :class="['card-priority', `priority-${chamado.prioridade}`]">
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
            </div>

            <!-- Card Footer -->
            <div class="card-footer-kanban">
              <div class="card-user">
                <div class="user-avatar-small">
                  <i class="bi bi-person-fill"></i>
                </div>
                <span class="user-name-small">{{ chamado.criador?.nome || 'Sem atribuição' }}</span>
              </div>
              
              <div v-if="chamado.grupo" class="card-group">
                <i class="bi bi-diagram-3"></i>
                <span>{{ chamado.grupo.nome }}</span>
              </div>
            </div>

            <!-- SLA Indicator -->
            <div v-if="chamado.sla_estourado" class="sla-indicator sla-danger">
              <i class="bi bi-exclamation-triangle-fill"></i>
              <span>SLA Estourado</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useChamados } from '@/composables/useChamados';
import LoadingSpinner from '@/components/shared/LoadingSpinner.vue';

const { formatarTipo } = useChamados();

const props = defineProps({
  chamados: {
    type: Array,
    required: true,
    default: () => []
  },
  loading: {
    type: Boolean,
    default: false
  }
});

defineEmits(['visualizar']);

// Definição das colunas do Kanban
const colunas = [
  { 
    status: 'novo', 
    label: 'Novo', 
    icon: 'bi-inbox-fill',
    color: 'info'
  },
  { 
    status: 'em_andamento', 
    label: 'Em Andamento', 
    icon: 'bi-hourglass-split',
    color: 'warning'
  },
  { 
    status: 'aguardando', 
    label: 'Aguardando', 
    icon: 'bi-clock-history',
    color: 'secondary'
  },
  { 
    status: 'resolvido', 
    label: 'Resolvido', 
    icon: 'bi-check-circle',
    color: 'success'
  },
  { 
    status: 'fechado', 
    label: 'Fechado', 
    icon: 'bi-x-circle',
    color: 'gray'
  }
];

// Filtrar chamados por status
const getChamadosPorStatus = (status) => {
  return props.chamados.filter(chamado => chamado.status === status);
};
</script>

<style scoped>
.kanban-container {
  width: 100%;
  overflow-x: auto;
  padding-bottom: var(--space-4);
}

/* ========================================
   KANBAN BOARD
   ======================================== */
.kanban-board {
  display: flex;
  gap: var(--space-4);
  min-height: 600px;
  padding: var(--space-2);
}

/* ========================================
   KANBAN COLUMN
   ======================================== */
.kanban-column {
  flex: 0 0 320px;
  display: flex;
  flex-direction: column;
  background: var(--color-bg-secondary);
  border-radius: var(--radius-lg);
  overflow: hidden;
}

/* Column Header */
.column-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-4) var(--space-5);
  background: var(--color-bg-primary);
  border-bottom: 2px solid;
}

.header-novo {
  border-bottom-color: var(--color-info-500);
}

.header-em_andamento {
  border-bottom-color: var(--color-warning-500);
}

.header-aguardando {
  border-bottom-color: var(--color-gray-400);
}

.header-resolvido {
  border-bottom-color: var(--color-success-500);
}

.header-fechado {
  border-bottom-color: var(--color-gray-500);
}

.header-title {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  text-transform: uppercase;
  letter-spacing: var(--letter-spacing-wide);
}

.header-title i {
  font-size: 1rem;
}

.column-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 24px;
  height: 24px;
  padding: 0 var(--space-2);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  background: var(--color-gray-200);
  color: var(--color-text-secondary);
  border-radius: var(--radius-full);
}

/* Column Body */
.column-body {
  flex: 1;
  padding: var(--space-3);
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.column-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  padding: var(--space-8) var(--space-4);
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
}

.column-empty i {
  font-size: 2rem;
  opacity: 0.3;
}

/* ========================================
   KANBAN CARD
   ======================================== */
.kanban-card {
  background: var(--color-bg-primary);
  border: 1px solid var(--color-border-medium);
  border-radius: var(--radius-base);
  padding: var(--space-4);
  cursor: pointer;
  transition: all var(--transition-base);
  position: relative;
}

.kanban-card:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
  border-color: var(--color-primary);
}

/* Card Header */
.card-header-kanban {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-3);
}

.card-id {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  color: var(--color-primary);
  font-family: var(--font-mono);
}

.card-priority {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: var(--radius-sm);
}

.priority-baixa {
  background: var(--color-gray-100);
  color: var(--color-gray-600);
}

.priority-media {
  background: var(--color-info-100);
  color: var(--color-info-600);
}

.priority-alta {
  background: var(--color-warning-100);
  color: var(--color-warning-600);
}

.priority-urgente {
  background: var(--color-danger-100);
  color: var(--color-danger-600);
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}

/* Card Title */
.card-title-kanban {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  margin-bottom: var(--space-3);
  line-height: var(--line-height-tight);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* Card Meta */
.card-meta {
  margin-bottom: var(--space-3);
}

.meta-badge {
  display: inline-flex;
  align-items: center;
  padding: 2px var(--space-2);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  border-radius: var(--radius-sm);
}

.badge-incidente {
  background: var(--color-danger-50);
  color: var(--color-danger-700);
}

.badge-requisicao {
  background: var(--color-info-50);
  color: var(--color-info-700);
}

.badge-problema {
  background: var(--color-warning-50);
  color: var(--color-warning-700);
}

.badge-mudanca {
  background: var(--color-success-50);
  color: var(--color-success-700);
}

/* Card Footer */
.card-footer-kanban {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  padding-top: var(--space-3);
  border-top: 1px solid var(--color-border-light);
}

.card-user {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.user-avatar-small {
  width: 24px;
  height: 24px;
  border-radius: var(--radius-full);
  background: var(--color-primary-light);
  color: var(--color-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  flex-shrink: 0;
}

.user-name-small {
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.card-group {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--font-size-xs);
  color: var(--color-text-tertiary);
}

.card-group i {
  font-size: 0.875rem;
}

/* SLA Indicator */
.sla-indicator {
  position: absolute;
  top: var(--space-2);
  right: var(--space-2);
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 2px var(--space-2);
  font-size: 0.625rem;
  font-weight: var(--font-weight-semibold);
  border-radius: var(--radius-sm);
}

.sla-danger {
  background: var(--color-danger-500);
  color: white;
}

.sla-indicator i {
  font-size: 0.75rem;
}

/* ========================================
   SCROLLBAR CUSTOMIZADA PARA COLUNAS
   ======================================== */
.column-body::-webkit-scrollbar {
  width: 6px;
}

.column-body::-webkit-scrollbar-track {
  background: transparent;
}

.column-body::-webkit-scrollbar-thumb {
  background: var(--color-gray-300);
  border-radius: var(--radius-full);
}

.column-body::-webkit-scrollbar-thumb:hover {
  background: var(--color-gray-400);
}

/* ========================================
   RESPONSIVIDADE
   ======================================== */
@media (max-width: 1024px) {
  .kanban-column {
    flex: 0 0 280px;
  }
}

@media (max-width: 768px) {
  .kanban-board {
    flex-direction: column;
  }
  
  .kanban-column {
    flex: 1 1 auto;
    min-height: 400px;
  }
}
</style>

