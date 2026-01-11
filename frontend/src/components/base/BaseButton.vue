<template>
  <button 
    :class="buttonClasses" 
    :disabled="disabled || loading"
    :type="type"
    @click="handleClick"
  >
    <span v-if="loading" class="btn-spinner">
      <i class="bi bi-arrow-repeat spinner-icon"></i>
    </span>
    <i v-if="icon && !loading" :class="`bi bi-${icon}`"></i>
    <span v-if="$slots.default" class="btn-content">
      <slot></slot>
    </span>
  </button>
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
      'outline-primary',
      'outline-secondary',
      'ghost'
    ].includes(value)
  },
  size: {
    type: String,
    default: 'base',
    validator: (value) => ['sm', 'base', 'lg'].includes(value)
  },
  type: {
    type: String,
    default: 'button',
    validator: (value) => ['button', 'submit', 'reset'].includes(value)
  },
  disabled: {
    type: Boolean,
    default: false
  },
  loading: {
    type: Boolean,
    default: false
  },
  icon: {
    type: String,
    default: null
  },
  block: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['click']);

const buttonClasses = computed(() => {
  return [
    'btn',
    `btn-${props.variant}`,
    `btn-${props.size}`,
    {
      'btn-block': props.block,
      'btn-loading': props.loading
    }
  ];
});

const handleClick = (event) => {
  if (!props.disabled && !props.loading) {
    emit('click', event);
  }
};
</script>

<style scoped>
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  font-family: var(--font-primary);
  font-weight: var(--font-weight-medium);
  line-height: 1;
  border: none;
  border-radius: var(--radius-base);
  cursor: pointer;
  transition: all var(--transition-base);
  white-space: nowrap;
  user-select: none;
  position: relative;
}

.btn:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

/* Tamanhos */
.btn-sm {
  height: var(--button-height-sm);
  padding: 0 var(--space-3);
  font-size: var(--font-size-xs);
}

.btn-base {
  height: var(--button-height-base);
  padding: 0 var(--space-5);
  font-size: var(--font-size-sm);
}

.btn-lg {
  height: var(--button-height-lg);
  padding: 0 var(--space-8);
  font-size: var(--font-size-base);
}

/* Variantes de cor */
.btn-primary {
  background-color: var(--color-primary);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background-color: var(--color-primary-hover);
  box-shadow: var(--shadow-primary);
  transform: translateY(-1px);
}

.btn-primary:active:not(:disabled) {
  background-color: var(--color-primary-active);
  transform: translateY(0);
}

.btn-secondary {
  background-color: var(--color-gray-200);
  color: var(--color-text-primary);
}

.btn-secondary:hover:not(:disabled) {
  background-color: var(--color-gray-300);
}

.btn-success {
  background-color: var(--color-success-500);
  color: white;
}

.btn-success:hover:not(:disabled) {
  background-color: var(--color-success-600);
  box-shadow: 0 4px 12px rgba(34, 197, 94, 0.3);
}

.btn-danger {
  background-color: var(--color-danger-500);
  color: white;
}

.btn-danger:hover:not(:disabled) {
  background-color: var(--color-danger-600);
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
}

.btn-warning {
  background-color: var(--color-warning-500);
  color: white;
}

.btn-warning:hover:not(:disabled) {
  background-color: var(--color-warning-600);
}

.btn-info {
  background-color: var(--color-info-500);
  color: white;
}

.btn-info:hover:not(:disabled) {
  background-color: var(--color-info-600);
}

/* Variantes outline */
.btn-outline-primary {
  background-color: transparent;
  color: var(--color-primary);
  border: 1.5px solid var(--color-primary);
}

.btn-outline-primary:hover:not(:disabled) {
  background-color: var(--color-primary);
  color: white;
}

.btn-outline-secondary {
  background-color: transparent;
  color: var(--color-text-secondary);
  border: 1.5px solid var(--color-border-strong);
}

.btn-outline-secondary:hover:not(:disabled) {
  background-color: var(--color-gray-100);
  border-color: var(--color-gray-400);
}

/* Variante ghost */
.btn-ghost {
  background-color: transparent;
  color: var(--color-text-secondary);
}

.btn-ghost:hover:not(:disabled) {
  background-color: var(--color-bg-tertiary);
  color: var(--color-text-primary);
}

/* Estado disabled */
.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none !important;
}

/* Estado loading */
.btn-loading {
  cursor: wait;
}

.btn-spinner {
  display: flex;
  align-items: center;
  justify-content: center;
}

.spinner-icon {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* Botão block (largura total) */
.btn-block {
  width: 100%;
}

.btn-content {
  display: inline-flex;
  align-items: center;
}
</style>

