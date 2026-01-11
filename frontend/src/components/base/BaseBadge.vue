<template>
  <span :class="badgeClasses">
    <span v-if="dot" class="badge-dot"></span>
    <i v-if="icon" :class="`bi bi-${icon}`"></i>
    <span v-if="$slots.default" class="badge-content">
      <slot></slot>
    </span>
  </span>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  variant: {
    type: String,
    default: 'primary',
    validator: (value) => [
      'primary', 
      'secondary', 
      'success', 
      'danger', 
      'warning', 
      'info',
      'gray'
    ].includes(value)
  },
  size: {
    type: String,
    default: 'base',
    validator: (value) => ['sm', 'base', 'lg'].includes(value)
  },
  dot: {
    type: Boolean,
    default: false
  },
  icon: {
    type: String,
    default: null
  },
  outline: {
    type: Boolean,
    default: false
  }
});

const badgeClasses = computed(() => {
  return [
    'badge',
    `badge-${props.variant}`,
    `badge-${props.size}`,
    {
      'badge-outline': props.outline,
      'badge-with-dot': props.dot
    }
  ];
});
</script>

<style scoped>
.badge {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  padding: var(--space-1) var(--space-3);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  line-height: 1;
  border-radius: var(--radius-full);
  white-space: nowrap;
  transition: all var(--transition-base);
}

/* Tamanhos */
.badge-sm {
  padding: 2px var(--space-2);
  font-size: 0.625rem;
  gap: 2px;
}

.badge-base {
  padding: var(--space-1) var(--space-3);
  font-size: var(--font-size-xs);
}

.badge-lg {
  padding: var(--space-2) var(--space-4);
  font-size: var(--font-size-sm);
  gap: var(--space-2);
}

/* Variantes de cor */
.badge-primary {
  background-color: var(--color-brand-100);
  color: var(--color-brand-700);
}

.badge-primary.badge-outline {
  background-color: transparent;
  border: 1.5px solid var(--color-brand-300);
  color: var(--color-brand-700);
}

.badge-secondary {
  background-color: var(--color-gray-200);
  color: var(--color-gray-700);
}

.badge-secondary.badge-outline {
  background-color: transparent;
  border: 1.5px solid var(--color-gray-300);
  color: var(--color-gray-700);
}

.badge-success {
  background-color: var(--color-success-50);
  color: var(--color-success-700);
}

.badge-success.badge-outline {
  background-color: transparent;
  border: 1.5px solid var(--color-success-300);
  color: var(--color-success-700);
}

.badge-warning {
  background-color: var(--color-warning-50);
  color: var(--color-warning-700);
}

.badge-warning.badge-outline {
  background-color: transparent;
  border: 1.5px solid var(--color-warning-300);
  color: var(--color-warning-700);
}

.badge-danger {
  background-color: var(--color-danger-50);
  color: var(--color-danger-700);
}

.badge-danger.badge-outline {
  background-color: transparent;
  border: 1.5px solid var(--color-danger-300);
  color: var(--color-danger-700);
}

.badge-info {
  background-color: var(--color-info-50);
  color: var(--color-info-700);
}

.badge-info.badge-outline {
  background-color: transparent;
  border: 1.5px solid var(--color-info-300);
  color: var(--color-info-700);
}

.badge-gray {
  background-color: var(--color-gray-100);
  color: var(--color-gray-700);
}

.badge-gray.badge-outline {
  background-color: transparent;
  border: 1.5px solid var(--color-gray-300);
  color: var(--color-gray-700);
}

/* Badge com dot indicator */
.badge-dot {
  width: 6px;
  height: 6px;
  border-radius: var(--radius-full);
  background-color: currentColor;
  flex-shrink: 0;
}

.badge-with-dot {
  padding-left: var(--space-2);
}

/* Ícones */
.badge i {
  font-size: 0.875em;
}

.badge-content {
  display: inline-flex;
  align-items: center;
}
</style>

