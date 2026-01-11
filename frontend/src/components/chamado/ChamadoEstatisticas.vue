<template>
  <div class="estatisticas-grid" v-if="estatisticas">
    <!-- Card Novos -->
    <div class="stat-card stat-card-primary">
      <div class="stat-icon">
        <i class="bi bi-inbox-fill"></i>
      </div>
      <div class="stat-content">
        <div class="stat-label">Novos</div>
        <div class="stat-value">{{ estatisticas.por_status?.novo || 0 }}</div>
      </div>
    </div>

    <!-- Card Em Andamento -->
    <div class="stat-card stat-card-warning">
      <div class="stat-icon">
        <i class="bi bi-hourglass-split"></i>
      </div>
      <div class="stat-content">
        <div class="stat-label">Em Andamento</div>
        <div class="stat-value">{{ estatisticas.por_status?.em_andamento || 0 }}</div>
      </div>
    </div>

    <!-- Card Aguardando -->
    <div class="stat-card stat-card-info">
      <div class="stat-icon">
        <i class="bi bi-clock-history"></i>
      </div>
      <div class="stat-content">
        <div class="stat-label">Aguardando</div>
        <div class="stat-value">{{ estatisticas.por_status?.aguardando || 0 }}</div>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  estatisticas: {
    type: Object,
    default: null
  }
});
</script>

<style scoped>
.estatisticas-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: var(--space-4);
  margin-bottom: var(--space-6);
}

.stat-card {
  background: var(--color-bg-primary);
  border: 1px solid var(--color-border-medium);
  border-radius: var(--radius-lg);
  padding: var(--space-5);
  display: flex;
  align-items: center;
  gap: var(--space-4);
  transition: all var(--transition-base);
  position: relative;
  overflow: hidden;
}

.stat-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 4px;
  height: 100%;
  background: currentColor;
  opacity: 0.3;
}

.stat-card:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}

.stat-icon {
  width: 56px;
  height: 56px;
  border-radius: var(--radius-base);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.75rem;
  flex-shrink: 0;
  transition: all var(--transition-base);
}

.stat-card:hover .stat-icon {
  transform: scale(1.1);
}

.stat-content {
  flex: 1;
  min-width: 0;
}

.stat-label {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-secondary);
  margin-bottom: var(--space-1);
  text-transform: uppercase;
  letter-spacing: var(--letter-spacing-wide);
}

.stat-value {
  font-size: var(--font-size-3xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
  line-height: 1;
}

/* Variantes de cor */
.stat-card-primary {
  color: var(--color-info-600);
}

.stat-card-primary .stat-icon {
  background: var(--color-info-50);
  color: var(--color-info-600);
}

.stat-card-warning {
  color: var(--color-warning-600);
}

.stat-card-warning .stat-icon {
  background: var(--color-warning-50);
  color: var(--color-warning-600);
}

.stat-card-success {
  color: var(--color-success-600);
}

.stat-card-success .stat-icon {
  background: var(--color-success-50);
  color: var(--color-success-600);
}

.stat-card-info {
  color: var(--color-info-600);
}

.stat-card-info .stat-icon {
  background: var(--color-info-50);
  color: var(--color-info-600);
}

/* Responsividade */
@media (max-width: 768px) {
  .estatisticas-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: var(--space-3);
  }
  
  .stat-value {
    font-size: var(--font-size-2xl);
  }
  
  .stat-icon {
    width: 48px;
    height: 48px;
    font-size: 1.5rem;
  }
}

@media (max-width: 480px) {
  .estatisticas-grid {
    grid-template-columns: 1fr;
  }
}
</style>
