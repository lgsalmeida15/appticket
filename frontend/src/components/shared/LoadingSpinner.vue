<template>
  <div class="text-center py-5" :class="containerClass">
    <div 
      class="spinner-border" 
      :class="spinnerClass"
      role="status"
      :style="spinnerStyle"
    >
      <span class="visually-hidden">{{ text }}</span>
    </div>
    <p v-if="showText" class="text-muted mt-3 mb-0">
      {{ text }}
    </p>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  size: {
    type: String,
    default: 'normal', // 'small', 'normal', 'large'
    validator: (value) => ['small', 'normal', 'large'].includes(value)
  },
  variant: {
    type: String,
    default: 'primary', // Bootstrap colors
    validator: (value) => ['primary', 'secondary', 'success', 'danger', 'warning', 'info', 'light', 'dark'].includes(value)
  },
  text: {
    type: String,
    default: 'Carregando...'
  },
  showText: {
    type: Boolean,
    default: true
  },
  containerClass: {
    type: String,
    default: ''
  },
  fullScreen: {
    type: Boolean,
    default: false
  }
});

const spinnerClass = computed(() => {
  const sizeClasses = {
    small: 'spinner-border-sm',
    normal: '',
    large: ''
  };
  const variantClass = `text-${props.variant}`;
  return `${sizeClasses[props.size]} ${variantClass}`;
});

const spinnerStyle = computed(() => {
  if (props.size === 'large') {
    return { width: '3rem', height: '3rem' };
  }
  return {};
});
</script>

<style scoped>
.full-screen {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(255, 255, 255, 0.9);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>

