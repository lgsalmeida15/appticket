<template>
  <form @submit="onSubmit">
    <div class="mb-3">
      <label for="titulo" class="form-label">
        Título <span class="text-danger">*</span>
      </label>
      <Field
        id="titulo"
        name="titulo"
        v-model="values.titulo"
        type="text"
        class="form-control"
        :class="{ 'is-invalid': errors.titulo }"
        placeholder="Descreva brevemente o problema"
      />
      <ErrorMessage v-if="errors.titulo" :message="errors.titulo" />
    </div>

    <div class="mb-3">
      <label for="descricao" class="form-label">
        Descrição <span class="text-danger">*</span>
      </label>
      <Field
        id="descricao"
        name="descricao"
        v-model="values.descricao"
        as="textarea"
        class="form-control"
        :class="{ 'is-invalid': errors.descricao }"
        rows="4"
        placeholder="Descreva detalhadamente o problema ou solicitação"
      />
      <ErrorMessage v-if="errors.descricao" :message="errors.descricao" />
    </div>

    <div class="row">
      <div class="col-md-6 mb-3">
        <label for="grupo_id" class="form-label">
          Grupo <span class="text-danger">*</span>
        </label>
        <Field
          id="grupo_id"
          name="grupo_id"
          v-model="values.grupo_id"
          as="select"
          class="form-select"
          :class="{ 'is-invalid': errors.grupo_id }"
        >
          <option value="">Selecione o grupo</option>
          <option v-for="grupo in grupos" :key="grupo.id" :value="grupo.id">
            {{ grupo.nome }}
          </option>
        </Field>
        <ErrorMessage v-if="errors.grupo_id" :message="errors.grupo_id" />
      </div>

      <div class="col-md-6 mb-3">
        <label for="grupo_executor_id" class="form-label">
          Grupo Executor
        </label>
        <Field
          id="grupo_executor_id"
          name="grupo_executor_id"
          v-model="values.grupo_executor_id"
          as="select"
          class="form-select"
        >
          <option value="">Nenhum grupo executor</option>
          <option v-for="grupo in gruposExecutores" :key="grupo.id" :value="grupo.id">
            {{ grupo.nome }}
          </option>
        </Field>
      </div>
    </div>

    <div class="row">
      <div class="col-md-6 mb-3">
        <label for="tipo" class="form-label">Tipo</label>
        <Field
          id="tipo"
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
        <label for="prioridade" class="form-label">Prioridade</label>
        <Field
          id="prioridade"
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

    <!-- Campo Solicitante (apenas para administradores) -->
    <div class="row" v-if="isAdmin">
      <div class="col-md-6 mb-3">
        <label for="solicitante_id" class="form-label">
          Solicitante
          <small class="text-muted">(opcional)</small>
        </label>
        <Field
          id="solicitante_id"
          name="solicitante_id"
          v-model="values.solicitante_id"
          as="select"
          class="form-select"
          :class="{ 'is-invalid': errors.solicitante_id }"
        >
          <option value="">Usuário autenticado (padrão)</option>
          <option 
            v-for="usuario in usuariosAtivos" 
            :key="usuario.id" 
            :value="usuario.id"
          >
            {{ usuario.nome }} ({{ usuario.email }})
          </option>
        </Field>
        <small class="form-text text-muted">
          Selecione um usuário diferente para criar o chamado no nome dele. Deixe em branco para criar no seu nome.
        </small>
        <ErrorMessage v-if="errors.solicitante_id" :message="errors.solicitante_id" />
      </div>

      <!-- Campo Data/Hora de Início (apenas para administradores) -->
      <div class="col-md-6 mb-3">
        <label for="data_hora_inicio" class="form-label">
          Data/Hora de Início
          <small class="text-muted">(opcional)</small>
        </label>
        <Field
          id="data_hora_inicio"
          name="data_hora_inicio"
          v-model="values.data_hora_inicio"
          type="datetime-local"
          class="form-control"
          :class="{ 'is-invalid': errors.data_hora_inicio }"
          :max="formatarParaDateTimeLocal(new Date())"
        />
        <small class="form-text text-muted">
          Deixe vazio para usar a data/hora atual. Não pode ser data futura.
        </small>
        <ErrorMessage v-if="errors.data_hora_inicio" :message="errors.data_hora_inicio" />
      </div>
    </div>

    <FileUpload 
      ref="fileUploadRef"
      label="Anexar Arquivos/Imagens"
      @update:files="handleFilesUpdate"
    />

    <div class="alert alert-danger mt-3" v-if="submitError">
      <i class="bi bi-exclamation-triangle me-2"></i>
      {{ submitError }}
    </div>
  </form>
</template>

<script setup>
import { ref, watch, computed } from 'vue';
import { useForm, Field, ErrorMessage } from 'vee-validate';
import { criarChamadoSchema, editarChamadoSchema } from '@/validators/schemas/chamadoSchema.js';
import FileUpload from '@/components/FileUpload.vue';
import ErrorMessageComponent from '@/components/shared/ErrorMessage.vue';
import { useAuthStore } from '@/stores/auth';

const props = defineProps({
  grupos: {
    type: Array,
    default: () => []
  },
  gruposExecutores: {
    type: Array,
    default: null
  },
  usuarios: {
    type: Array,
    default: () => []
  },
  initialValues: {
    type: Object,
    default: () => ({
      titulo: '',
      descricao: '',
      tipo: 'incidente',
      prioridade: 'media',
      grupo_id: '',
      grupo_executor_id: '',
      solicitante_id: '',
      data_hora_inicio: ''
    })
  },
  modoEdicao: {
    type: Boolean,
    default: false
  }
});

const authStore = useAuthStore();

// Computed para verificar se é admin
const isAdmin = computed(() => authStore.isAdmin);

// Computed para filtrar apenas usuários ativos
const usuariosAtivos = computed(() => {
  return props.usuarios.filter(u => u.ativo !== false);
});

// ✅ Usar gruposExecutores da prop se fornecida, senão filtrar dos grupos
const gruposExecutores = computed(() => {
  if (props.gruposExecutores && props.gruposExecutores.length > 0) {
    return props.gruposExecutores;
  }
  return props.grupos.filter(grupo => grupo.executor === true);
});

const emit = defineEmits(['submit', 'update:files']);

const { handleSubmit, values, errors, setFieldValue, setValues } = useForm({
  validationSchema: props.modoEdicao ? editarChamadoSchema : criarChamadoSchema,
  initialValues: props.initialValues
});

const fileUploadRef = ref(null);
const arquivos = ref([]);
const submitError = ref(null);

watch(() => props.initialValues, (newVal) => {
  setValues(newVal);
}, { deep: true });

const handleFilesUpdate = (files) => {
  arquivos.value = files;
  emit('update:files', files);
};

const onSubmit = handleSubmit((formValues) => {
  console.log('✅ Formulário validado com sucesso:', formValues);
  submitError.value = null;
  emit('submit', { ...formValues, arquivos: arquivos.value });
}, (errors) => {
  console.error('❌ Erros de validação:', errors);
  submitError.value = 'Por favor, corrija os erros no formulário';
});

// Método para acionar o submit externamente
const submitForm = () => {
  console.log('📋 Método submitForm chamado');
  console.log('📊 Valores atuais do formulário:', values);
  console.log('⚠️ Erros atuais:', errors);
  onSubmit();
};

// Função auxiliar para formatar data para datetime-local
const formatarParaDateTimeLocal = (date) => {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  
  const ano = d.getFullYear();
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  const dia = String(d.getDate()).padStart(2, '0');
  const hora = String(d.getHours()).padStart(2, '0');
  const minuto = String(d.getMinutes()).padStart(2, '0');
  
  return `${ano}-${mes}-${dia}T${hora}:${minuto}`;
};

const clear = () => {
  setValues({
    titulo: '',
    descricao: '',
    tipo: 'incidente',
    prioridade: 'media',
    grupo_id: '',
    grupo_executor_id: '',
    prioridade: 'media',
    grupo_id: ''
  });
  arquivos.value = [];
  fileUploadRef.value?.clear();
  submitError.value = null;
};

defineExpose({ clear, onSubmit, submitForm });
</script>

