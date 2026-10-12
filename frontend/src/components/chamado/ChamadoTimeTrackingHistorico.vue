<template>
  <div class="card mb-3">
    <div class="card-header d-flex justify-content-between align-items-center">
      <h5 class="mb-0">
        <i class="bi bi-stopwatch me-2"></i>
        Tempo Trabalhado
      </h5>
      <strong v-if="dados">
        <span v-if="dados.tem_sessao_ativa" class="live-dot" title="Sessão ativa"></span>
        {{ formatarMinutos(dados.total_minutos_ao_vivo) }}
      </strong>
    </div>
    <div class="card-body">
      <div v-if="loading" class="text-muted small">Carregando...</div>

      <div v-else-if="!dados || !dados.historico?.length" class="text-muted small">
        Nenhuma sessão de atendimento registrada ainda.
      </div>

      <ul v-else class="list-group list-group-flush">
        <li
          v-for="sessao in dados.historico"
          :key="sessao.id"
          class="list-group-item px-0 d-flex justify-content-between align-items-center"
        >
          <div>
            <strong>{{ sessao.usuario?.nome || 'Usuário desconhecido' }}</strong>
            <small class="d-block text-muted">
              {{ formatarData(sessao.inicio) }}
              <span v-if="sessao.fim"> até {{ formatarData(sessao.fim) }}</span>
              <span v-else class="text-success">· em andamento</span>
            </small>
            <small v-if="sessao.descricao" class="d-block text-muted">{{ sessao.descricao }}</small>
          </div>
          <span class="badge bg-secondary">
            {{ sessao.fim ? formatarMinutos(sessao.duracao_minutos) : 'ativo' }}
          </span>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup>
import { useChamados } from '@/composables/useChamados';
import { formatarMinutos } from '@/composables/useTimeTracking';

const { formatarData } = useChamados();

defineProps({
  dados: {
    type: Object,
    default: null
  },
  loading: {
    type: Boolean,
    default: false
  }
});
</script>

<style scoped>
.live-dot {
  display: inline-block;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--color-success-500);
  margin-right: 4px;
  animation: pulse-tempo-historico 1.5s infinite;
}

@keyframes pulse-tempo-historico {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}
</style>
