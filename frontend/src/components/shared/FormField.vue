<template>
  <div class="mb-3">
    <label v-if="label" :for="name" class="form-label">
      {{ label }}
      <span v-if="required" class="text-danger">*</span>
    </label>
    
    <slot :name="name" :field="field" :meta="meta">
      <input
        :id="name"
        v-model="field.value"
        v-bind="$attrs"
        :class="inputClass"
        @blur="field.handleBlur"
        @input="field.handleChange"
      />
    </slot>
    
    <ErrorMessage v-if="errorMessage || meta.touched && meta.valid === false" :message="errorMessage" />
  </div>
</template>

<script setup>
import { computed } from 'vue';
import ErrorMessage from './ErrorMessage.vue';

const props = defineProps({
  name: {
    type: String,
    required: true
  },
  label: {
    type: String,
    default: ''
  },
  field: {
    type: Object,
    required: true
  },
  meta: {
    type: Object,
    required: true
  },
  errorMessage: {
    type: String,
    default: ''
  },
  required: {
    type: Boolean,
    default: false
  }
});

const inputClass = computed(() => {
  const base = 'form-control';
  const hasError = props.errorMessage || (props.meta.touched && props.meta.valid === false);
  return hasError ? `${base} is-invalid` : base;
});
</script>

