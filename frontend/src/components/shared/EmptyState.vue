<template>
  <div class="text-center py-5" :class="containerClass">
    <i :class="iconClass" :style="iconStyle"></i>
    <h5 v-if="title" class="mt-3 mb-2">{{ title }}</h5>
    <p v-if="message" class="text-muted mb-4">{{ message }}</p>
    <slot name="actions">
      <button 
        v-if="showActionButton && actionText" 
        class="btn btn-primary"
        @click="$emit('action')"
      >
        <i v-if="actionIcon" :class="actionIcon" class="me-2"></i>
        {{ actionText }}
      </button>
    </slot>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  icon: {
    type: String,
    default: 'bi-inbox'
  },
  iconSize: {
    type: String,
    default: '4rem' // CSS size value
  },
  iconColor: {
    type: String,
    default: '#6c757d' // Bootstrap text-muted color
  },
  title: {
    type: String,
    default: ''
  },
  message: {
    type: String,
    default: 'Nenhum item encontrado.'
  },
  actionText: {
    type: String,
    default: ''
  },
  actionIcon: {
    type: String,
    default: ''
  },
  showActionButton: {
    type: Boolean,
    default: false
  },
  containerClass: {
    type: String,
    default: ''
  }
});

defineEmits(['action']);

const iconClass = computed(() => {
  return `bi ${props.icon} text-muted`;
});

const iconStyle = computed(() => {
  return {
    fontSize: props.iconSize,
    color: props.iconColor
  };
});
</script>

<style scoped>
/* Empty state styling */
</style>

