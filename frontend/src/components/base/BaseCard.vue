<template>
  <div :class="cardClasses">
    <!-- Header -->
    <div v-if="$slots.header || title" class="card-header">
      <slot name="header">
        <div class="card-title-wrapper">
          <h3 v-if="title" class="card-title">{{ title }}</h3>
          <p v-if="subtitle" class="card-subtitle">{{ subtitle }}</p>
        </div>
      </slot>
      <div v-if="$slots.actions" class="card-actions">
        <slot name="actions"></slot>
      </div>
    </div>

    <!-- Body -->
    <div v-if="$slots.default" class="card-body">
      <slot></slot>
    </div>

    <!-- Footer -->
    <div v-if="$slots.footer" class="card-footer">
      <slot name="footer"></slot>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  title: {
    type: String,
    default: null
  },
  subtitle: {
    type: String,
    default: null
  },
  elevated: {
    type: Boolean,
    default: false
  },
  hoverable: {
    type: Boolean,
    default: false
  },
  padding: {
    type: String,
    default: 'normal',
    validator: (value) => ['none', 'sm', 'normal', 'lg'].includes(value)
  },
  border: {
    type: String,
    default: null,
    validator: (value) => !value || ['primary', 'success', 'warning', 'danger', 'info'].includes(value)
  }
});

const cardClasses = computed(() => {
  return [
    'card',
    {
      'card-elevated': props.elevated,
      'card-hoverable': props.hoverable,
      [`card-padding-${props.padding}`]: props.padding !== 'normal',
      [`card-border-${props.border}`]: props.border
    }
  ];
});
</script>

<style scoped>
.card {
  background-color: var(--color-bg-primary);
  border: 1px solid var(--color-border-medium);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  transition: all var(--transition-base);
  overflow: hidden;
}

/* Variantes de elevação */
.card-elevated {
  box-shadow: var(--shadow-md);
  border: none;
}

.card-hoverable {
  cursor: pointer;
}

.card-hoverable:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}

.card-elevated.card-hoverable:hover {
  box-shadow: var(--shadow-lg);
  transform: translateY(-4px);
}

/* Header */
.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
  padding: var(--space-5) var(--space-6);
  border-bottom: 1px solid var(--color-border-medium);
  background-color: transparent;
}

.card-title-wrapper {
  flex: 1;
  min-width: 0;
}

.card-title {
  margin: 0;
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  line-height: var(--line-height-tight);
}

.card-subtitle {
  margin: var(--space-1) 0 0 0;
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  line-height: var(--line-height-normal);
}

.card-actions {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  flex-shrink: 0;
}

/* Body */
.card-body {
  padding: var(--space-6);
}

/* Footer */
.card-footer {
  padding: var(--space-5) var(--space-6);
  border-top: 1px solid var(--color-border-medium);
  background-color: var(--color-bg-secondary);
}

/* Variantes de padding */
.card-padding-none .card-header,
.card-padding-none .card-body,
.card-padding-none .card-footer {
  padding: 0;
}

.card-padding-sm .card-header,
.card-padding-sm .card-footer {
  padding: var(--space-3) var(--space-4);
}

.card-padding-sm .card-body {
  padding: var(--space-4);
}

.card-padding-lg .card-header,
.card-padding-lg .card-footer {
  padding: var(--space-6) var(--space-8);
}

.card-padding-lg .card-body {
  padding: var(--space-8);
}

/* Variantes de borda colorida */
.card-border-primary {
  border-left: 4px solid var(--color-primary);
}

.card-border-success {
  border-left: 4px solid var(--color-success-500);
}

.card-border-warning {
  border-left: 4px solid var(--color-warning-500);
}

.card-border-danger {
  border-left: 4px solid var(--color-danger-500);
}

.card-border-info {
  border-left: 4px solid var(--color-info-500);
}
</style>

