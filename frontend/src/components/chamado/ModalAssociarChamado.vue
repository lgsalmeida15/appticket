<template>
  <div
    v-if="show"
    class="modal fade show"
    :class="{ 'd-block': show }"
    tabindex="-1"
    @click.self="fechar"
    style="background-color: rgba(0,0,0,0.5);"
  >
    <div class="modal-dialog modal-lg">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h5 class="modal-title">
            <i class="bi bi-link-45deg me-2"></i>
            Associar Chamado Filho
          </h5>
          <button type="button" class="btn-close" @click="fechar"></button>
        </div>
        <div class="modal-body">
          <div v-if="!chamadoPai" class="alert alert-warning">
            Chamado pai não informado
          </div>

          <div v-else>
            <div class="alert alert-info">
              <i class="bi bi-info-circle me-2"></i>
              <strong>Chamado Pai:</strong> #{{ chamadoPai.id }} - {{ chamadoPai.titulo }}
            </div>

            <!-- Busca de Chamado -->
            <div class="mb-3">
              <label for="buscaChamado" class="form-label">
                <i class="bi bi-search me-1"></i>
                Buscar Chamado para Associar
              </label>
              <div class="input-group">
                <input
                  id="buscaChamado"
                  v-model="busca"
                  type="text"
                  class="form-control"
                  placeholder="Digite o ID ou título do chamado..."
                  @input="buscarChamados"
                  @keyup.enter="buscarChamados"
                />
                <button
                  class="btn btn-primary"
                  type="button"
                  @click="buscarChamados"
                  :disabled="buscando || !busca.trim()"
                >
                  <span v-if="buscando" class="spinner-border spinner-border-sm"></span>
                  <i v-else class="bi bi-search"></i>
                </button>
              </div>
              <small class="text-muted">
                Busque por ID do chamado ou palavras do título
              </small>
            </div>

            <!-- Mensagem de Erro -->
            <div v-if="erro" class="alert alert-danger">
              <i class="bi bi-exclamation-triangle me-2"></i>
              {{ erro }}
            </div>

            <!-- Resultados da Busca -->
            <div v-if="chamadosDisponiveis.length > 0" class="mb-3">
              <h6 class="mb-2">Chamados Disponíveis para Associar:</h6>
              <div class="list-group" style="max-height: 400px; overflow-y: auto;">
                <button
                  v-for="chamado in chamadosDisponiveis"
                  :key="chamado.id"
                  type="button"
                  class="list-group-item list-group-item-action"
                  :class="{ active: chamadoSelecionado?.id === chamado.id }"
                  @click="selecionarChamado(chamado)"
                >
                  <div class="d-flex justify-content-between align-items-start">
                    <div>
                      <div class="fw-bold">
                        #{{ chamado.id }} - {{ chamado.titulo }}
                      </div>
                      <div class="mt-1 d-flex flex-wrap gap-2">
                        <span :class="getBadgeStatus(chamado.status)">
                          {{ formatarStatus(chamado.status) }}
                        </span>
                        <span :class="getBadgePrioridade(chamado.prioridade)">
                          {{ formatarPrioridade(chamado.prioridade) }}
                        </span>
                        <span :class="getBadgeTipo(chamado.tipo)">
                          {{ formatarTipo(chamado.tipo) }}
                        </span>
                      </div>
                      <div class="mt-1 small text-muted">
                        <i class="bi bi-people me-1"></i>
                        {{ chamado.grupo?.nome }}
                        <span v-if="chamado.criador" class="ms-2">
                          <i class="bi bi-person me-1"></i>
                          {{ chamado.criador.nome }}
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              </div>
            </div>

            <!-- Mensagem quando não há resultados -->
            <div v-if="buscou && chamadosDisponiveis.length === 0 && !buscando" class="alert alert-warning">
              <i class="bi bi-search me-2"></i>
              Nenhum chamado disponível encontrado. Verifique se:
              <ul class="mb-0 mt-2">
                <li>O chamado não está associado a outro chamado pai</li>
                <li>O chamado não possui filhos associados</li>
                <li>O chamado não é o próprio chamado pai</li>
              </ul>
            </div>

            <!-- Loading -->
            <div v-if="buscando" class="text-center py-4">
              <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Buscando...</span>
              </div>
              <p class="text-muted mt-2">Buscando chamados...</p>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" @click="fechar">
            Cancelar
          </button>
          <button
            type="button"
            class="btn btn-primary"
            @click="associarChamado"
            :disabled="!chamadoSelecionado || associando"
          >
            <span v-if="associando" class="spinner-border spinner-border-sm me-1"></span>
            <i v-else class="bi bi-link-45deg me-1"></i>
            {{ associando ? 'Associando...' : 'Associar Chamado' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useChamadosStore } from '@/stores/chamados';
import { useChamados } from '@/composables/useChamados';

const props = defineProps({
  chamadoPai: {
    type: Object,
    required: true
  },
  show: {
    type: Boolean,
    default: true
  }
});

const emit = defineEmits(['associado', 'fechar']);

const chamadosStore = useChamadosStore();
const { formatarStatus, formatarPrioridade, formatarTipo, getBadgeStatus, getBadgePrioridade, getBadgeTipo } = useChamados();

const busca = ref('');
const buscando = ref(false);
const associando = ref(false);
const buscou = ref(false);
const erro = ref(null);
const chamadosDisponiveis = ref([]);
const chamadoSelecionado = ref(null);

const buscarChamados = async () => {
  if (!busca.value.trim()) {
    erro.value = 'Digite um termo para buscar';
    return;
  }

  buscando.value = true;
  erro.value = null;
  chamadosDisponiveis.value = [];
  chamadoSelecionado.value = null;
  buscou.value = false;

  try {
    // Buscar chamados por ID ou título
    const filtros = {};
    
    // Se for número, buscar por ID
    const id = parseInt(busca.value);
    if (!isNaN(id)) {
      filtros.numero_chamado = id;
    } else {
      filtros.search = busca.value;
    }

    const resultado = await chamadosStore.listarChamados({
      ...filtros,
      limit: 50 // Limitar resultados
    });

    // Filtrar chamados que podem ser associados
    const disponiveis = resultado.chamados.filter(chamado => {
      // Não pode ser o próprio chamado pai
      if (chamado.id === props.chamadoPai.id) return false;
      
      // Não pode já ter pai (verificar se tem chamado_pai_id ou campo pai)
      if (chamado.chamado_pai_id || chamado.pai) return false;
      
      // Não pode ter filhos (não pode ser pai) - se tiver filhos, não pode ser filho
      // Isso será validado pelo backend, mas verificamos aqui também
      if (chamado.filhos && chamado.filhos.length > 0) return false;
      
      // Não pode estar fechado ou cancelado (opcional, mas faz sentido)
      if (chamado.status === 'cancelado' || chamado.status_fechamento === 'fechado') {
        // Mesmo assim, permitir associar se necessário
        // return false;
      }
      
      return true;
    });

    chamadosDisponiveis.value = disponiveis;
    buscou.value = true;

    if (disponiveis.length === 0) {
      erro.value = 'Nenhum chamado disponível para associar encontrado com este critério de busca.';
    }
  } catch (error) {
    console.error('Erro ao buscar chamados:', error);
    erro.value = error?.response?.data?.error?.message 
      || error?.response?.data?.message 
      || error?.message 
      || 'Erro ao buscar chamados';
  } finally {
    buscando.value = false;
  }
};

const selecionarChamado = (chamado) => {
  chamadoSelecionado.value = chamado;
};

const associarChamado = async () => {
  if (!chamadoSelecionado.value || !props.chamadoPai) {
    erro.value = 'Selecione um chamado para associar';
    return;
  }

  associando.value = true;
  erro.value = null;

  try {
    await chamadosStore.associarFilho(
      props.chamadoPai.id,
      chamadoSelecionado.value.id
    );

    alert('Chamado associado com sucesso!');
    emit('associado');
    resetar();
  } catch (error) {
    console.error('Erro ao associar chamado:', error);
    erro.value = error?.response?.data?.error?.message 
      || error?.response?.data?.message 
      || error?.message 
      || 'Erro ao associar chamado';
  } finally {
    associando.value = false;
  }
};

const fechar = () => {
  resetar();
  emit('fechar');
};

const resetar = () => {
  busca.value = '';
  buscando.value = false;
  associando.value = false;
  buscou.value = false;
  erro.value = null;
  chamadosDisponiveis.value = [];
  chamadoSelecionado.value = null;
};
</script>

<style scoped>
.modal {
  z-index: 1055;
}

.list-group-item {
  cursor: pointer;
  transition: background-color 0.2s;
}

.list-group-item:hover {
  background-color: #f8f9fa;
}

.list-group-item.active {
  background-color: #0d6efd;
  border-color: #0d6efd;
  color: white;
}

.badge {
  font-size: 0.75rem;
}
</style>

