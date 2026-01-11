<template>
  <div v-if="show" class="alert alert-danger d-flex align-items-center" role="alert">
    <i class="bi bi-exclamation-triangle-fill me-2 fs-5"></i>
    <div>
      <strong v-if="title">{{ title }}</strong>
      <div v-if="message" :class="{ 'mt-1': title }">
        {{ message }}
      </div>
      <div v-if="errors && errors.length" class="mt-2">
        <ul class="mb-0 ps-3">
          <li v-for="(error, index) in errors" :key="index">{{ error }}</li>
        </ul>
      </div>
    </div>
    <button 
      v-if="dismissible" 
      type="button" 
      class="btn-close ms-auto" 
      @click="$emit('dismiss')"
      aria-label="Fechar"
    ></button>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  title: {
    type: String,
    default: 'Erro'
  },
  message: {
    type: String,
    default: ''
  },
  errors: {
    type: Array,
    default: () => []
  },
  dismissible: {
    type: Boolean,
    default: false
  },
  show: {
    type: Boolean,
    default: true
  }
});

defineEmits(['dismiss']);
</script>

<style scoped>
.alert {
  border-left: 4px solid #dc3545;
}
</style>

