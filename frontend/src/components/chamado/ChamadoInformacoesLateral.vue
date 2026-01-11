<template>
  <div class="card bg-light">
    <div class="card-body">
      <h6 class="mb-3">
        <i class="bi bi-info-circle me-2"></i>
        Informações
      </h6>
      
      <div class="mb-3">
        <small class="text-muted d-block">Status</small>
        <span :class="getBadgeStatus(chamado.status)">
          {{ formatarStatus(chamado.status) }}
        </span>
      </div>

      <div class="mb-3">
        <small class="text-muted d-block">Prioridade</small>
        <span :class="getBadgePrioridade(chamado.prioridade)">
          {{ formatarPrioridade(chamado.prioridade) }}
        </span>
      </div>

      <div class="mb-3">
        <small class="text-muted d-block">Tipo</small>
        <span :class="getBadgeTipo(chamado.tipo)">
          {{ formatarTipo(chamado.tipo) }}
        </span>
      </div>

      <hr>

      <div class="mb-3">
        <small class="text-muted d-block">Grupo Solicitante</small>
        <strong>{{ chamado.grupo?.nome }}</strong>
      </div>

      <div class="mb-3" v-if="chamado.grupoExecutor">
        <small class="text-muted d-block">
          <i class="bi bi-gear me-1"></i>
          Grupo Executor
        </small>
        <strong class="text-success">{{ chamado.grupoExecutor.nome }}</strong>
        <small v-if="chamado.grupoExecutor.usuarios && chamado.grupoExecutor.usuarios.length > 0" class="d-block text-muted">
          {{ chamado.grupoExecutor.usuarios.length }} {{ chamado.grupoExecutor.usuarios.length === 1 ? 'membro' : 'membros' }}
        </small>
      </div>

      <div class="mb-3">
        <small class="text-muted d-block">Criado por</small>
        <strong>{{ chamado.criador?.nome }}</strong>
        <small class="d-block text-muted">{{ chamado.criador?.email }}</small>
      </div>

      <div class="mb-3">
        <small class="text-muted d-block">Responsável</small>
        <strong v-if="chamado.responsavel">
          {{ chamado.responsavel.nome }}
        </strong>
        <span v-else class="text-muted">Não atribuído</span>
      </div>

      <hr>

      <div class="mb-3">
        <small class="text-muted d-block">Data de Abertura</small>
        <strong>{{ formatarData(chamado.data_abertura) }}</strong>
      </div>

      <div class="mb-3" v-if="chamado.data_fechamento">
        <small class="text-muted d-block">Data de Fechamento</small>
        <strong>{{ formatarData(chamado.data_fechamento) }}</strong>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useChamados } from '@/composables/useChamados';

const { formatarData, formatarStatus, formatarPrioridade, formatarTipo, getBadgeStatus, getBadgePrioridade, getBadgeTipo } = useChamados();

defineProps({
  chamado: {
    type: Object,
    required: true
  }
});
</script>

