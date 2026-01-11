<template>
  <div
    class="modal fade"
    id="modalUsuario"
    tabindex="-1"
    ref="modalElement"
  >
    <div class="modal-dialog modal-lg">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">
            {{ modoEdicao ? 'Editar Usuário' : 'Novo Usuário' }}
          </h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
        </div>
        <div class="modal-body">
          <form @submit.prevent="onSubmit">
            <div class="mb-3">
              <label for="nome" class="form-label">Nome <span class="text-danger">*</span></label>
              <Field
                id="nome"
                name="nome"
                type="text"
                v-model="values.nome"
                class="form-control"
                :class="{ 'is-invalid': errors.nome }"
              />
              <ErrorMessage v-if="errors.nome" :message="errors.nome" />
            </div>

            <div class="mb-3">
              <label for="email" class="form-label">Email <span class="text-danger">*</span></label>
              <Field
                id="email"
                name="email"
                type="email"
                v-model="values.email"
                class="form-control"
                :class="{ 'is-invalid': errors.email }"
              />
              <ErrorMessage v-if="errors.email" :message="errors.email" />
            </div>

            <div class="mb-3">
              <label for="password" class="form-label">
                Senha {{ modoEdicao ? '(deixe em branco para não alterar)' : '<span class="text-danger">*</span>' }}
              </label>
              <Field
                id="password"
                name="senha"
                type="password"
                v-model="values.senha"
                class="form-control"
                :class="{ 'is-invalid': errors.senha }"
              />
              <ErrorMessage v-if="errors.senha" :message="errors.senha" />
            </div>

            <div class="mb-3">
              <label for="tipo" class="form-label">Tipo <span class="text-danger">*</span></label>
              <Field
                id="tipo"
                name="tipo"
                as="select"
                v-model="values.tipo"
                class="form-select"
                :class="{ 'is-invalid': errors.tipo }"
              >
                <option value="agente">Agente</option>
                <option value="gerente">Gerente</option>
                <option value="admin">Admin</option>
              </Field>
              <ErrorMessage v-if="errors.tipo" :message="errors.tipo" />
            </div>

            <div v-if="modoEdicao" class="mb-3">
              <div class="form-check">
                <input
                  v-model="values.ativo"
                  type="checkbox"
                  class="form-check-input"
                  id="ativo"
                >
                <label class="form-check-label" for="ativo">
                  Usuário ativo
                </label>
              </div>
            </div>
          </form>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
            Cancelar
          </button>
          <button type="button" class="btn btn-primary" @click="onSubmit" :disabled="loading">
            <span v-if="loading" class="spinner-border spinner-border-sm me-2"></span>
            {{ modoEdicao ? 'Atualizar' : 'Criar' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, onUnmounted } from 'vue';
import { useForm, Field, ErrorMessage } from 'vee-validate';
import { criarUsuarioSchema, atualizarUsuarioSchema } from '@/validators/schemas/usuarioSchema.js';
import { Modal } from 'bootstrap';

const props = defineProps({
  modoEdicao: {
    type: Boolean,
    default: false
  },
  usuario: {
    type: Object,
    default: null
  },
  loading: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['submit', 'close']);

const modalElement = ref(null);
let modalInstance = null;

// Formulário com validação dinâmica baseado no modo
const getValidationSchema = () => {
  return props.modoEdicao ? atualizarUsuarioSchema : criarUsuarioSchema;
};

const { handleSubmit, values, errors, setValues, resetForm } = useForm({
  validationSchema: getValidationSchema,
  initialValues: {
    nome: '',
    email: '',
    senha: '',
    tipo: 'agente',
    ativo: true
  }
});

// Watch para atualizar valores quando usuário mudar
watch(() => props.usuario, (novoUsuario) => {
  if (novoUsuario && props.modoEdicao) {
    setValues({
      nome: novoUsuario.nome || '',
      email: novoUsuario.email || '',
      senha: '',
      tipo: novoUsuario.tipo || 'agente',
      ativo: novoUsuario.ativo !== false
    });
  }
}, { immediate: true });

const onSubmit = handleSubmit((formValues) => {
  emit('submit', formValues);
});

const show = () => {
  if (!modalInstance && modalElement.value) {
    modalInstance = new Modal(modalElement.value);
  }
  
  // Garantir que os valores sejam atualizados antes de mostrar o modal
  if (props.modoEdicao && props.usuario) {
    setValues({
      nome: props.usuario.nome || '',
      email: props.usuario.email || '',
      senha: '',
      tipo: props.usuario.tipo || 'agente',
      ativo: props.usuario.ativo !== false
    });
  } else {
    resetForm();
  }
  
  modalInstance?.show();
};

const hide = () => {
  modalInstance?.hide();
};

const clear = () => {
  resetForm();
};

// Watch para modo de edição mudar
watch(() => props.modoEdicao, () => {
  // Reset form quando mudar modo
  resetForm();
});

// Resetar formulário quando modal for fechado
onMounted(() => {
  if (modalElement.value) {
    modalElement.value.addEventListener('hidden.bs.modal', () => {
      resetForm();
      emit('close');
    });
  }
});

onUnmounted(() => {
  if (modalElement.value) {
    modalElement.value.removeEventListener('hidden.bs.modal', () => {});
  }
});

defineExpose({
  show,
  hide,
  clear
});
</script>

<style scoped>
.form-label {
  font-weight: 500;
}
</style>

