<template>
  <form @submit="onSubmit">
    <div class="mb-3">
      <label class="form-label">
        Título <span class="text-danger">*</span>
      </label>
      <Field
        name="titulo"
        v-model="values.titulo"
        type="text"
        class="form-control"
        :class="{ 'is-invalid': errors.titulo }"
        placeholder="Descreva brevemente o problema"
      />
      <ErrorMessage name="titulo" />
    </div>

    <div class="mb-3">
      <label class="form-label">
        Descrição <span class="text-danger">*</span>
      </label>
      <Field
        name="descricao"
        v-model="values.descricao"
        as="textarea"
        class="form-control"
        :class="{ 'is-invalid': errors.descricao }"
        rows="4"
        placeholder="Descreva detalhadamente o problema ou solicitação"
      />
      <ErrorMessage name="descricao" />
    </div>

    <div class="row">
      <div class="col-md-6 mb-3">
        <label class="form-label">
          Grupo <span class="text-danger">*</span>
        </label>
        <Field
          name="grupo_id"
          v-model="values.grupo_id"
          as="select"
          class="form-select"
          :class="{ 'is-invalid': errors.grupo_id }"
        >
          <option value="">{{ gruposAtivos.length === 0 ? 'Nenhum grupo disponível' : 'Selecione o grupo' }}</option>
          <option v-for="grupo in gruposAtivos" :key="grupo.id" :value="grupo.id">
            {{ grupo.nome }}
          </option>
        </Field>
        <div v-if="gruposAtivos.length === 0" class="form-text text-warning">
          <i class="bi bi-exclamation-triangle me-1"></i>
          Você não está associado a nenhum grupo ativo. Contate o administrador.
        </div>
        <ErrorMessage name="grupo_id" />
      </div>

      <div class="col-md-6 mb-3">
        <label class="form-label">Tipo</label>
        <Field
          name="tipo"
          v-model="values.tipo"
          as="select"
          class="form-select"
        >
          <option value="incidente">Incidente</option>
          <option value="requisicao">Requisição</option>
          <option value="problema">Problema</option>
          <option value="mudanca">Mudança</option>
        </Field>
      </div>
    </div>

    <div class="row">
      <div class="col-md-6 mb-3">
        <label class="form-label">Prioridade</label>
        <Field
          name="prioridade"
          v-model="values.prioridade"
          as="select"
          class="form-select"
        >
          <option value="baixa">Baixa</option>
          <option value="media">Média</option>
          <option value="alta">Alta</option>
          <option value="urgente">Urgente</option>
        </Field>
      </div>
    </div>

    <FileUpload 
      ref="fileUploadRef"
      label="Anexar Arquivos/Imagens"
      @update:files="handleFilesUpdate"
    />

    <ErrorMessageComponent v-if="error" :message="error" />
  </form>
</template>

<script setup>
import { ref, watch, onMounted, computed } from 'vue';
import { useForm, Field, ErrorMessage } from 'vee-validate';
import { criarChamadoSchema } from '@/validators/schemas/chamadoSchema.js';
import FileUpload from '@/components/FileUpload.vue';
import ErrorMessageComponent from '@/components/shared/ErrorMessage.vue';

const props = defineProps({
  modelValue: {
    type: Object,
    required: true,
    default: () => ({
      titulo: '',
      descricao: '',
      tipo: 'incidente',
      prioridade: 'media',
      grupo_id: ''
    })
  },
  grupos: {
    type: Array,
    default: () => []
  },
  error: {
    type: String,
    default: null
  }
});

const gruposAtivos = computed(() => {
  if (!props.grupos || !Array.isArray(props.grupos)) {
    return [];
  }
  
  return props.grupos.filter(g => g && g.ativo !== false);
});

const emit = defineEmits(['update:modelValue', 'submit', 'update:files']);

const { handleSubmit, values, errors, setValues } = useForm({
  validationSchema: criarChamadoSchema,
  initialValues: props.modelValue
});

const fileUploadRef = ref(null);
const arquivos = ref([]);

watch(() => props.modelValue, (newVal) => {
  setValues(newVal);
}, { deep: true });

watch(values, (newVal) => {
  emit('update:modelValue', newVal);
}, { deep: true });

const handleFilesUpdate = (files) => {
  arquivos.value = files;
  emit('update:files', files);
};

const onSubmit = handleSubmit((formValues) => {
  emit('submit', { ...formValues, arquivos: arquivos.value });
}, (errors) => {
  console.log('Erros de validação:', errors);
});

const clear = () => {
  setValues({
    titulo: '',
    descricao: '',
    tipo: 'incidente',
    prioridade: 'media',
    grupo_id: ''
  });
  arquivos.value = [];
  fileUploadRef.value?.clear();
};

defineExpose({ clear, onSubmit });
</script>

