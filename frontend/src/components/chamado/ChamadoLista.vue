<template>
  <div class="chamado-lista-container">
    <!-- Loading -->
    <LoadingSpinner v-if="loading" text="Carregando chamados..." />

    <!-- Lista vazia -->
    <EmptyState 
      v-else-if="!chamados.length"
      icon="bi-inbox"
      title="Nenhum chamado encontrado"
      message="Clique em 'Novo Chamado' para criar um."
    />

    <!-- Lista de Chamados - Estilo moderno -->
    <div v-else class="chamados-list">
      <div 
        v-for="chamado in chamados" 
        :key="chamado.id" 
        class="chamado-card"
        @click="$emit('visualizar', chamado)"
      >
        <!-- Header do card -->
        <div class="chamado-header">
          <div class="chamado-id">#{{ chamado.id }}</div>
          <div class="chamado-badges">
            <span :class="getBadgeTipo(chamado.tipo)" class="chamado-badge">
              {{ formatarTipo(chamado.tipo) }}
            </span>
            <span :class="getBadgePrioridade(chamado.prioridade)" class="chamado-badge">
              {{ formatarPrioridade(chamado.prioridade) }}
            </span>
          </div>
        </div>

        <!-- Título -->
        <h3 class="chamado-titulo">{{ chamado.titulo }}</h3>

        <!-- Metadados -->
        <div class="chamado-meta">
          <div class="meta-item">
            <i class="bi bi-diagram-3"></i>
            <span>{{ chamado.grupo?.nome || 'Sem grupo' }}</span>
          </div>
          <div v-if="chamado.grupoExecutor" class="meta-item text-success">
            <i class="bi bi-gear"></i>
            <span>Executor: {{ chamado.grupoExecutor.nome }}</span>
          </div>
          <div class="meta-item">
            <i class="bi bi-person"></i>
            <span>{{ chamado.criador?.nome || 'Desconhecido' }}</span>
          </div>
          <div class="meta-item">
            <i class="bi bi-calendar"></i>
            <span>{{ formatarData(chamado.created_at) }}</span>
          </div>
        </div>

        <!-- Footer -->
        <div class="chamado-footer">
          <span :class="getBadgeStatus(chamado.status)" class="status-badge">
            <i :class="getStatusIcon(chamado.status)"></i>
            {{ formatarStatus(chamado.status) }}
          </span>
          <button 
            class="btn-view"
            @click.stop="$emit('visualizar', chamado)"
          >
            Ver detalhes
            <i class="bi bi-arrow-right"></i>
          </button>
        </div>
      </div>

      <!-- Paginação -->
      <nav v-if="pagination.totalPages > 1" class="pagination-container">
        <ul class="pagination-modern">
          <li :class="{ disabled: pagination.page === 1 }">
            <button 
              class="page-btn"
              @click="$emit('mudar-pagina', pagination.page - 1)"
              :disabled="pagination.page === 1"
            >
              <i class="bi bi-chevron-left"></i>
              Anterior
            </button>
          </li>
          
          <li 
            v-for="page in paginationPages" 
            :key="page"
            :class="{ active: pagination.page === page }"
          >
            <button 
              class="page-number"
              @click="$emit('mudar-pagina', page)"
              :disabled="page === '...'"
            >
              {{ page }}
            </button>
          </li>
          
          <li :class="{ disabled: pagination.page === pagination.totalPages }">
            <button 
              class="page-btn"
              @click="$emit('mudar-pagina', pagination.page + 1)"
              :disabled="pagination.page === pagination.totalPages"
            >
              Próxima
              <i class="bi bi-chevron-right"></i>
            </button>
          </li>
        </ul>
      </nav>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useChamados } from '@/composables/useChamados';
import LoadingSpinner from '@/components/shared/LoadingSpinner.vue';
import EmptyState from '@/components/shared/EmptyState.vue';

const { 
  formatarData, 
  formatarStatus, 
  formatarPrioridade, 
  formatarTipo, 
  getBadgeStatus, 
  getBadgePrioridade, 
  getBadgeTipo 
} = useChamados();

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
  pagination: {
    type: Object,
    required: true,
    default: () => ({
      page: 1,
      totalPages: 0
    })
  }
});

defineEmits(['visualizar', 'mudar-pagina']);

// Ícones para cada status
const getStatusIcon = (status) => {
  const icons = {
    'novo': 'bi-inbox-fill',
    'em_andamento': 'bi-hourglass-split',
    'aguardando': 'bi-clock-history',
    'resolvido': 'bi-check-circle',
    'fechado': 'bi-x-circle',
    'cancelado': 'bi-slash-circle'
  };
  return icons[status] || 'bi-circle';
};

// Gerar páginas para paginação (com ellipsis)
const paginationPages = computed(() => {
  const total = props.pagination.totalPages;
  const current = props.pagination.page;
  const pages = [];
  
  if (total <= 7) {
    for (let i = 1; i <= total; i++) {
      pages.push(i);
    }
  } else {
    if (current <= 3) {
      pages.push(1, 2, 3, 4, '...', total);
    } else if (current >= total - 2) {
      pages.push(1, '...', total - 3, total - 2, total - 1, total);
    } else {
      pages.push(1, '...', current - 1, current, current + 1, '...', total);
    }
  }
  
  return pages;
});
</script>

<style scoped>
.chamado-lista-container {
  width: 100%;
}

.chamados-list {
  display: grid;
  gap: var(--space-4);
}

/* ========================================
   CHAMADO CARD - Design Moderno
   ======================================== */
.chamado-card {
  background: var(--color-bg-primary);
  border: 1px solid var(--color-border-medium);
  border-radius: var(--radius-lg);
  padding: var(--space-5);
  transition: all var(--transition-base);
  cursor: pointer;
  position: relative;
}

.chamado-card:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
  border-color: var(--color-primary);
}

.chamado-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 4px;
  height: 100%;
  background: var(--color-primary);
  border-radius: var(--radius-lg) 0 0 var(--radius-lg);
  opacity: 0;
  transition: opacity var(--transition-base);
}

.chamado-card:hover::before {
  opacity: 1;
}

/* Header */
.chamado-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-3);
}

.chamado-id {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-primary);
  font-family: var(--font-mono);
}

.chamado-badges {
  display: flex;
  gap: var(--space-2);
}

.chamado-badge {
  display: inline-flex;
  align-items: center;
  padding: var(--space-1) var(--space-3);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  border-radius: var(--radius-full);
}

/* Título */
.chamado-titulo {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  margin-bottom: var(--space-4);
  line-height: var(--line-height-tight);
}

/* Metadados */
.chamado-meta {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-4);
  margin-bottom: var(--space-4);
  padding-bottom: var(--space-4);
  border-bottom: 1px solid var(--color-border-light);
}

.meta-item {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

.meta-item i {
  font-size: 1rem;
  color: var(--color-text-tertiary);
}

/* Footer */
.chamado-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-4);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  border-radius: var(--radius-base);
}

.btn-view {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-4);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--color-primary);
  background: transparent;
  border: none;
  border-radius: var(--radius-base);
  cursor: pointer;
  transition: all var(--transition-base);
}

.btn-view:hover {
  background: var(--color-primary-light);
}

.btn-view i {
  transition: transform var(--transition-base);
}

.btn-view:hover i {
  transform: translateX(4px);
}

/* ========================================
   PAGINAÇÃO MODERNA
   ======================================== */
.pagination-container {
  margin-top: var(--space-6);
  display: flex;
  justify-content: center;
}

.pagination-modern {
  display: flex;
  gap: var(--space-2);
  list-style: none;
  padding: 0;
  margin: 0;
  align-items: center;
}

.page-btn,
.page-number {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  min-width: 40px;
  height: 40px;
  padding: 0 var(--space-3);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-secondary);
  background: var(--color-bg-primary);
  border: 1px solid var(--color-border-medium);
  border-radius: var(--radius-base);
  cursor: pointer;
  transition: all var(--transition-base);
}

.page-btn:hover:not(:disabled),
.page-number:hover:not(:disabled) {
  background: var(--color-bg-tertiary);
  color: var(--color-text-primary);
  border-color: var(--color-border-strong);
}

.page-number.active,
li.active .page-number {
  background: var(--color-primary);
  color: white;
  border-color: var(--color-primary);
}

.page-btn:disabled,
.page-number:disabled,
li.disabled .page-btn {
  opacity: 0.5;
  cursor: not-allowed;
  background: var(--color-bg-secondary);
}

/* ========================================
   RESPONSIVIDADE
   ======================================== */
@media (max-width: 768px) {
  .chamado-card {
    padding: var(--space-4);
  }
  
  .chamado-titulo {
    font-size: var(--font-size-base);
  }
  
  .chamado-meta {
    gap: var(--space-3);
  }
  
  .chamado-footer {
    flex-direction: column;
    gap: var(--space-3);
    align-items: flex-start;
  }
  
  .pagination-modern {
    flex-wrap: wrap;
  }
}
</style>
