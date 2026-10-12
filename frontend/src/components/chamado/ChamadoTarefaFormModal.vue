<template>
  <BaseModal :show="show" @fechar="fechar">
    <template #header>
      <i class="bi bi-list-task me-2"></i>
      {{ tarefa ? 'Editar Tarefa' : 'Nova Tarefa' }}
    </template>

    <form id="form-tarefa" @submit.prevent="salvar">
      <div v-if="erro" class="alert alert-danger">{{ erro }}</div>

      <div class="mb-3">
        <label class="form-label">Título</label>
        <input v-model="form.titulo" type="text" class="form-control" required maxlength="200" />
      </div>

      <div class="mb-3">
        <label class="form-label">Descrição</label>
        <textarea v-model="form.descricao" class="form-control" rows="3"></textarea>
      </div>

      <div class="mb-3" v-if="usuarios?.length">
        <label class="form-label">Responsável</label>
        <select v-model="form.responsavel_id" class="form-select">
          <option :value="null">Sem responsável</option>
          <option v-for="u in usuarios" :key="u.id" :value="u.id">{{ u.nome }}</option>
        </select>
      </div>

      <div class="row g-3">
        <div class="col-6">
          <label class="form-label">Início previsto</label>
          <input v-model="form.data_inicio_prevista" type="date" class="form-control" />
        </div>
        <div class="col-6">
          <label class="form-label">Fim previsto</label>
          <input v-model="form.data_fim_prevista" type="date" class="form-control" />
        </div>
      </div>
      <small class="text-muted d-block mt-2">
        <i class="bi bi-info-circle me-1"></i>
        Essas datas são opcionais — só aparecem no calendário/Gantt se preenchidas.
      </small>
    </form>

    <template #footer>
      <button type="button" class="btn btn-secondary" @click="fechar">Cancelar</button>
      <button type="submit" form="form-tarefa" class="btn btn-primary" :disabled="loading">
        <span v-if="loading" class="spinner-border spinner-border-sm me-1"></span>
        {{ loading ? 'Salvando...' : 'Salvar' }}
      </button>
    </template>
  </BaseModal>
</template>

<script setup>
import { ref, watch } from 'vue';
import BaseModal from '@/components/shared/BaseModal.vue';

const props = defineProps({
  show: { type: Boolean, default: false },
  tarefa: { type: Object, default: null },
  usuarios: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
  erro: { type: String, default: null }
});

const emit = defineEmits(['fechar', 'salvar']);

const formVazio = () => ({
  titulo: '',
  descricao: '',
  responsavel_id: null,
  data_inicio_prevista: '',
  data_fim_prevista: ''
});

const form = ref(formVazio());

watch(() => props.tarefa, (tarefa) => {
  if (tarefa) {
    form.value = {
      titulo: tarefa.titulo,
      descricao: tarefa.descricao || '',
      responsavel_id: tarefa.responsavel_id || null,
      data_inicio_prevista: tarefa.data_inicio_prevista || '',
      data_fim_prevista: tarefa.data_fim_prevista || ''
    };
  } else {
    form.value = formVazio();
  }
}, { immediate: true });

const fechar = () => {
  emit('fechar');
};

const salvar = () => {
  const dados = {
    titulo: form.value.titulo,
    descricao: form.value.descricao || null,
    responsavel_id: form.value.responsavel_id || null,
    data_inicio_prevista: form.value.data_inicio_prevista || null,
    data_fim_prevista: form.value.data_fim_prevista || null
  };
  emit('salvar', dados);
};
</script>
