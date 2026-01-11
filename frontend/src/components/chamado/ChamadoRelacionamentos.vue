<template>
  <div class="card mb-3">
    <div class="card-header d-flex justify-content-between align-items-center">
      <h5 class="mb-0">
        <i class="bi bi-diagram-3 me-2"></i>
        Relacionamentos
      </h5>
      <button
        v-if="podeAssociar && !chamado.pai"
        type="button"
        class="btn btn-sm btn-primary"
        @click="abrirModalAssociar"
        :disabled="loading"
      >
        <i class="bi bi-plus-circle me-1"></i>
        Associar Filho
      </button>
    </div>
    <div class="card-body">
      <LoadingSpinner v-if="loading" text="Carregando relacionamentos..." />

      <!-- Chamado Pai -->
      <div v-if="chamado.pai" class="mb-3">
        <h6 class="text-muted mb-2">
          <i class="bi bi-arrow-up-circle me-1"></i>
          Chamado Pai
        </h6>
        <div class="border rounded p-3 bg-light">
          <div class="d-flex justify-content-between align-items-start">
            <div>
              <router-link
                :to="{ name: 'chamado-view', params: { id: chamado.pai.id } }"
                class="text-decoration-none fw-bold"
              >
                <i class="bi bi-ticket-detailed me-1"></i>
                #{{ chamado.pai.id }} - {{ chamado.pai.titulo }}
              </router-link>
              <div class="mt-2 d-flex flex-wrap gap-2">
                <span :class="getBadgeStatus(chamado.pai.status)">
                  {{ formatarStatus(chamado.pai.status) }}
                </span>
                <span :class="getBadgePrioridade(chamado.pai.prioridade)">
                  {{ formatarPrioridade(chamado.pai.prioridade) }}
                </span>
              </div>
            </div>
            <button
              v-if="podeAssociar"
              type="button"
              class="btn btn-sm btn-outline-danger"
              @click="confirmarDesassociar"
              :disabled="desassociando"
              title="Desassociar deste chamado pai"
            >
              <span v-if="desassociando" class="spinner-border spinner-border-sm"></span>
              <i v-else class="bi bi-x-circle"></i>
            </button>
          </div>
        </div>
      </div>

      <!-- Chamados Filhos -->
      <div v-if="chamado.filhos && chamado.filhos.length > 0">
        <div class="d-flex justify-content-between align-items-center mb-2">
          <h6 class="text-muted mb-0">
            <i class="bi bi-arrow-down-circle me-1"></i>
            Chamados Filhos ({{ chamado.filhos.length }})
          </h6>
        </div>
        <div class="list-group">
          <div
            v-for="filho in chamado.filhos"
            :key="filho.id"
            class="list-group-item"
          >
            <div class="d-flex justify-content-between align-items-start">
              <div class="flex-grow-1">
                <router-link
                  :to="{ name: 'chamado-view', params: { id: filho.id } }"
                  class="text-decoration-none fw-bold"
                >
                  <i class="bi bi-ticket-detailed me-1"></i>
                  #{{ filho.id }} - {{ filho.titulo }}
                </router-link>
                <div class="mt-2 d-flex flex-wrap gap-2">
                  <span :class="getBadgeStatus(filho.status)">
                    {{ formatarStatus(filho.status) }}
                  </span>
                  <span :class="getBadgePrioridade(filho.prioridade)">
                    {{ formatarPrioridade(filho.prioridade) }}
                  </span>
                  <span :class="getBadgeTipo(filho.tipo)">
                    {{ formatarTipo(filho.tipo) }}
                  </span>
                </div>
                <div v-if="filho.criador" class="mt-1 small text-muted">
                  <i class="bi bi-person me-1"></i>
                  Criado por: {{ filho.criador.nome }}
                </div>
              </div>
              <button
                v-if="podeAssociar"
                type="button"
                class="btn btn-sm btn-outline-danger ms-2"
                @click="confirmarDesassociarFilho(filho)"
                :disabled="desassociando"
                title="Desassociar este chamado filho"
              >
                <span v-if="desassociando && filhoDesassociando === filho.id" class="spinner-border spinner-border-sm"></span>
                <i v-else class="bi bi-x-circle"></i>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-if="!loading && !chamado.pai && (!chamado.filhos || chamado.filhos.length === 0)" class="text-center text-muted py-4">
        <i class="bi bi-diagram-3 fs-1 d-block mb-2"></i>
        <p class="mb-0">Este chamado não possui relacionamentos</p>
        <button
          v-if="podeAssociar"
          type="button"
          class="btn btn-sm btn-outline-primary mt-3"
          @click="abrirModalAssociar"
        >
          <i class="bi bi-plus-circle me-1"></i>
          Associar Chamado Filho
        </button>
      </div>
    </div>
  </div>

  <!-- Modal para Associar Chamado -->
  <ModalAssociarChamado
    v-if="showModalAssociar"
    :chamado-pai="chamado"
    @associado="handleAssociado"
    @fechar="showModalAssociar = false"
  />
</template>

<script setup>
import { ref, computed } from 'vue';
import { useChamadosStore } from '@/stores/chamados';
import { useAuthStore } from '@/stores/auth';
import { useChamados } from '@/composables/useChamados';
import LoadingSpinner from '@/components/shared/LoadingSpinner.vue';
import ModalAssociarChamado from './ModalAssociarChamado.vue';

const props = defineProps({
  chamado: {
    type: Object,
    required: true
  },
  loading: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['atualizar']);

const chamadosStore = useChamadosStore();
const authStore = useAuthStore();
const { formatarStatus, formatarPrioridade, formatarTipo, getBadgeStatus, getBadgePrioridade, getBadgeTipo } = useChamados();

const showModalAssociar = ref(false);
const desassociando = ref(false);
const filhoDesassociando = ref(null);

const podeAssociar = computed(() => {
  return authStore.isAdmin || authStore.isGerente;
});

const abrirModalAssociar = () => {
  showModalAssociar.value = true;
};

const handleAssociado = async () => {
  showModalAssociar.value = false;
  emit('atualizar');
};

const confirmarDesassociar = () => {
  if (confirm(`Deseja realmente desassociar este chamado do chamado pai #${props.chamado.pai.id}?`)) {
    desassociarChamado();
  }
};

const confirmarDesassociarFilho = (filho) => {
  if (confirm(`Deseja realmente desassociar o chamado #${filho.id} deste chamado pai?`)) {
    desassociarFilho(filho);
  }
};

const desassociarChamado = async () => {
  if (!props.chamado.pai) return;
  
  desassociando.value = true;
  try {
    await chamadosStore.desassociarFilho(props.chamado.id);
    alert('Chamado desassociado com sucesso!');
    emit('atualizar');
  } catch (error) {
    const errorMessage = error?.response?.data?.error?.message 
      || error?.response?.data?.message 
      || error?.message 
      || 'Erro ao desassociar chamado';
    alert(errorMessage);
  } finally {
    desassociando.value = false;
  }
};

const desassociarFilho = async (filho) => {
  filhoDesassociando.value = filho.id;
  try {
    await chamadosStore.desassociarFilho(filho.id);
    alert('Chamado filho desassociado com sucesso!');
    emit('atualizar');
  } catch (error) {
    const errorMessage = error?.response?.data?.error?.message 
      || error?.response?.data?.message 
      || error?.message 
      || 'Erro ao desassociar chamado filho';
    alert(errorMessage);
  } finally {
    filhoDesassociando.value = null;
  }
};
</script>

<style scoped>
.list-group-item {
  transition: background-color 0.2s;
}

.list-group-item:hover {
  background-color: #f8f9fa;
}

.badge {
  font-size: 0.75rem;
}
</style>

