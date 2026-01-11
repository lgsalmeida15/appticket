<template>
  <div class="mb-4">
    <h6 class="text-muted mb-3">
      <i class="bi bi-gear me-2"></i>
      Ações Administrativas
    </h6>
    <div class="card border-primary">
      <div class="card-body">
        <div class="row g-3">
          <div class="col-md-4">
            <label class="form-label small">Status</label>
            <select 
              :value="edicao.status" 
              class="form-select form-select-sm"
              @change="handleUpdate('status', $event.target.value)"
            >
              <option value="novo">Novo</option>
              <option value="em_andamento">Em Andamento</option>
              <option value="aguardando">Aguardando</option>
              <option value="cancelado">Cancelado</option>
            </select>
          </div>

          <div class="col-md-4">
            <label class="form-label small">Prioridade</label>
            <select 
              :value="edicao.prioridade" 
              class="form-select form-select-sm"
              @change="handleUpdate('prioridade', $event.target.value)"
            >
              <option value="baixa">Baixa</option>
              <option value="media">Média</option>
              <option value="alta">Alta</option>
              <option value="urgente">Urgente</option>
            </select>
          </div>

          <div class="col-md-4">
            <label class="form-label small">Tipo</label>
            <select 
              :value="edicao.tipo" 
              class="form-select form-select-sm"
              @change="handleUpdate('tipo', $event.target.value)"
            >
              <option value="incidente">Incidente</option>
              <option value="requisicao">Requisição</option>
              <option value="problema">Problema</option>
              <option value="mudanca">Mudança</option>
            </select>
          </div>

          <div class="col-md-12">
            <label class="form-label small">Atribuir Responsável</label>
            <select 
              v-model="atribuidoLocal"
              class="form-select form-select-sm"
              @change="handleUpdateResponsavel"
            >
              <option :value="null">Sem responsável</option>
              <option v-for="usuario in usuariosDisponiveis" :key="usuario.id" :value="usuario.id">
                {{ usuario.nome }} ({{ usuario.email }})
              </option>
            </select>
            <small class="text-muted d-block mt-1">
              <i class="bi bi-info-circle me-1"></i>
              {{ grupoExecutorInfo }}
            </small>
          </div>
        </div>
        
        <div v-if="atualizando" class="mt-2 text-primary small">
          <span class="spinner-border spinner-border-sm me-2"></span>
          Salvando alterações...
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue';

const props = defineProps({
  chamado: {
    type: Object,
    required: true
  },
  usuariosAdmin: {
    type: Array,
    default: () => []
  },
  atualizando: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['atualizar']);

// Estado local para o responsável
const atribuidoLocal = ref(props.chamado.atribuido_a);

// Sincronizar com a prop quando ela mudar
watch(() => props.chamado.atribuido_a, (newVal) => {
  atribuidoLocal.value = newVal;
});

const edicao = computed(() => ({
  status: props.chamado.status,
  prioridade: props.chamado.prioridade,
  tipo: props.chamado.tipo,
  atribuido_a: props.chamado.atribuido_a
}));

// Se há grupo executor, mostrar usuários desse grupo; caso contrário, mostrar admins
const usuariosDisponiveis = computed(() => {
  if (props.chamado.grupoExecutor && props.chamado.grupoExecutor.usuarios && props.chamado.grupoExecutor.usuarios.length > 0) {
    return props.chamado.grupoExecutor.usuarios;
  }
  return props.usuariosAdmin;
});

// Informação do grupo executor
const grupoExecutorInfo = computed(() => {
  if (props.chamado.grupoExecutor && props.chamado.grupoExecutor.nome) {
    return `Usuários do grupo: ${props.chamado.grupoExecutor.nome}`;
  }
  return 'Apenas administradores podem ser atribuídos';
});

const handleUpdate = (campo, valor) => {
  emit('atualizar', { [campo]: valor });
};

const handleUpdateResponsavel = () => {
  emit('atualizar', { atribuido_a: atribuidoLocal.value });
};
</script>

