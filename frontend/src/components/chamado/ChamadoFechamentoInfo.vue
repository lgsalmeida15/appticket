<template>
  <div v-if="fechamento" class="card border-success">
    <div class="card-header bg-success text-white">
      <h5 class="mb-0">
        <i class="bi bi-check-circle-fill me-2"></i>
        Informações de Fechamento
      </h5>
    </div>
    <div class="card-body">
      <!-- Data e Hora de Resolução -->
      <div class="mb-3">
        <label class="form-label fw-bold text-muted">Data e Hora de Resolução</label>
        <p class="mb-0">
          <i class="bi bi-calendar-check me-2"></i>
          {{ formatarDataHora(fechamento.data_hora_resolucao) }}
        </p>
      </div>

      <!-- Categoria de Solução -->
      <div class="mb-3">
        <label class="form-label fw-bold text-muted">Categoria de Solução</label>
        <div class="d-flex flex-column gap-1">
          <span class="badge bg-primary">
            Nível 1: {{ fechamento.categoria_solucao?.categoria_nivel_1 }}
          </span>
          <span class="badge bg-info">
            Nível 2: {{ fechamento.categoria_solucao?.categoria_nivel_2 }}
          </span>
          <span class="badge bg-secondary">
            Nível 3: {{ fechamento.categoria_solucao?.categoria_nivel_3 }}
          </span>
        </div>
      </div>

      <!-- Descrição do Fechamento -->
      <div class="mb-3">
        <label class="form-label fw-bold text-muted">Descrição do Fechamento</label>
        <div class="p-3 bg-light rounded">
          <p class="mb-0" style="white-space: pre-wrap;">{{ fechamento.descricao_fechamento }}</p>
        </div>
      </div>

      <!-- Usuário que Fechou -->
      <div class="mb-0">
        <label class="form-label fw-bold text-muted">Fechado por</label>
        <p class="mb-0">
          <i class="bi bi-person-fill me-2"></i>
          {{ fechamento.usuario_fechamento?.nome || 'N/A' }}
          <span class="text-muted ms-2">
            ({{ fechamento.usuario_fechamento?.email }})
          </span>
        </p>
        <small class="text-muted">
          Em {{ formatarDataHora(fechamento.created_at) }}
        </small>
      </div>
    </div>
  </div>
</template>

<script setup>
import { defineProps } from 'vue';

defineProps({
  fechamento: {
    type: Object,
    default: null
  }
});

const formatarDataHora = (data) => {
  if (!data) return 'N/A';
  try {
    const date = new Date(data);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    console.error('Erro ao formatar data:', error);
    return 'Data inválida';
  }
};
</script>

<style scoped>
.badge {
  font-size: 0.9rem;
  padding: 0.5em 0.8em;
  width: fit-content;
}

.bg-light {
  border: 1px solid #dee2e6;
}
</style>

