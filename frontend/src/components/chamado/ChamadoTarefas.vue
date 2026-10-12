<template>
  <div class="card mb-3">
    <div class="card-header d-flex justify-content-between align-items-center">
      <h5 class="mb-0">
        <i class="bi bi-list-task me-2"></i>
        Tarefas
        <span v-if="tarefasAtivas.length" class="badge bg-primary ms-2">{{ tarefasAtivas.length }}</span>
      </h5>
      <button
        v-if="podeGerenciar"
        type="button"
        class="btn btn-sm btn-primary"
        @click="abrirNovaTarefa"
        :disabled="chamadoFechado"
      >
        <i class="bi bi-plus-circle me-1"></i>
        Nova Tarefa
      </button>
    </div>
    <div class="card-body">
      <LoadingSpinner v-if="loading" text="Carregando tarefas..." />

      <div v-else-if="!tarefas.length" class="text-center text-muted py-3">
        <i class="bi bi-list-task fs-1 d-block mb-2"></i>
        Nenhuma tarefa criada ainda
      </div>

      <div v-else class="list-group list-group-flush">
        <div v-for="tarefa in tarefas" :key="tarefa.id" class="list-group-item px-0">
          <div class="d-flex justify-content-between align-items-start">
            <div class="flex-grow-1" style="cursor: pointer;" @click="toggleExpandir(tarefa.id)">
              <div class="d-flex align-items-center gap-2">
                <i :class="expandida === tarefa.id ? 'bi bi-chevron-down' : 'bi bi-chevron-right'" class="text-muted"></i>
                <strong :class="{ 'text-decoration-line-through text-muted': tarefa.status === 'cancelada' }">
                  {{ tarefa.titulo }}
                </strong>
                <span class="badge" :class="badgeStatus(tarefa.status)">{{ formatarStatusTarefa(tarefa.status) }}</span>
                <span v-if="tempos[tarefa.id]?.tem_sessao_ativa" class="tarefa-live-dot" title="Cronômetro ativo"></span>
              </div>
              <div class="small text-muted mt-1 ms-4">
                <span v-if="tarefa.responsavel"><i class="bi bi-person me-1"></i>{{ tarefa.responsavel.nome }}</span>
                <span v-if="tarefa.data_inicio_prevista || tarefa.data_fim_prevista" class="ms-3">
                  <i class="bi bi-calendar-range me-1"></i>
                  {{ tarefa.data_inicio_prevista || '?' }} → {{ tarefa.data_fim_prevista || '?' }}
                </span>
                <span v-if="tempos[tarefa.id]" class="ms-3">
                  <i class="bi bi-stopwatch me-1"></i>
                  {{ formatarMinutos(tempos[tarefa.id].total_minutos_ao_vivo) }}
                </span>
              </div>
            </div>

            <div class="d-flex align-items-center gap-2">
              <button
                v-if="tarefa.status !== 'cancelada' && tarefa.status !== 'concluida' && (tarefa.status === 'pendente' || tarefa.status === 'em_andamento') && !tempos[tarefa.id]?.tem_sessao_ativa"
                class="btn btn-sm btn-outline-success"
                title="Iniciar"
                :disabled="loadingAcao === tarefa.id"
                @click.stop="handleAcaoTempo(tarefa, 'play')"
              >
                <span v-if="loadingAcao === tarefa.id" class="spinner-border spinner-border-sm"></span>
                <i v-else class="bi bi-play-fill"></i>
              </button>
              <button
                v-if="tempos[tarefa.id]?.tem_sessao_ativa"
                class="btn btn-sm btn-outline-warning"
                title="Pausar"
                :disabled="loadingAcao === tarefa.id"
                @click.stop="handleAcaoTempo(tarefa, 'pause')"
              >
                <span v-if="loadingAcao === tarefa.id" class="spinner-border spinner-border-sm"></span>
                <i v-else class="bi bi-pause-fill"></i>
              </button>

              <div v-if="podeGerenciar && tarefa.status !== 'cancelada'" class="dropdown">
                <button class="btn btn-sm btn-outline-secondary" data-bs-toggle="dropdown" @click.stop>
                  <i class="bi bi-three-dots-vertical"></i>
                </button>
                <ul class="dropdown-menu dropdown-menu-end">
                  <li><a class="dropdown-item" href="#" @click.prevent="abrirEditarTarefa(tarefa)">Editar</a></li>
                  <li v-if="tarefa.status !== 'concluida'">
                    <a class="dropdown-item" href="#" @click.prevent="mudarStatus(tarefa, 'concluida')">Marcar como concluída</a>
                  </li>
                  <li><hr class="dropdown-divider"></li>
                  <li><a class="dropdown-item text-danger" href="#" @click.prevent="confirmarCancelar(tarefa)">Cancelar tarefa</a></li>
                </ul>
              </div>
            </div>
          </div>

          <!-- Detalhe expandido: descrição + comentários -->
          <div v-if="expandida === tarefa.id" class="ms-4 mt-3 ps-3 border-start">
            <p v-if="tarefa.descricao" class="small text-preserve-format">{{ tarefa.descricao }}</p>

            <h6 class="small text-muted mb-2">Comentários</h6>
            <div v-if="comentarios[tarefa.id]?.length" class="mb-2">
              <div v-for="c in comentarios[tarefa.id]" :key="c.id" class="small mb-2">
                <strong>{{ c.usuario?.nome }}</strong>
                <span class="text-muted ms-1">{{ formatarData(c.data_hora) }}</span>
                <div>{{ c.texto }}</div>
              </div>
            </div>
            <div v-else class="small text-muted mb-2">Nenhum comentário ainda</div>

            <form v-if="tarefa.status !== 'cancelada'" class="d-flex gap-2" @submit.prevent="handleComentar(tarefa)">
              <input
                v-model="novoComentarioTexto[tarefa.id]"
                type="text"
                class="form-control form-control-sm"
                placeholder="Comentar na tarefa..."
              />
              <button type="submit" class="btn btn-sm btn-outline-primary" :disabled="!novoComentarioTexto[tarefa.id]?.trim()">
                <i class="bi bi-send"></i>
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>

    <ChamadoTarefaFormModal
      :show="showForm"
      :tarefa="tarefaEditando"
      :usuarios="usuarios"
      :loading="salvandoForm"
      :erro="erroForm"
      @fechar="showForm = false"
      @salvar="salvarTarefa"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useChamadoTarefasStore } from '@/stores/chamadoTarefas';
import { useChamados } from '@/composables/useChamados';
import { formatarMinutos } from '@/composables/useTimeTracking';
import LoadingSpinner from '@/components/shared/LoadingSpinner.vue';
import ChamadoTarefaFormModal from './ChamadoTarefaFormModal.vue';

const { formatarData } = useChamados();

const props = defineProps({
  chamadoId: { type: [Number, String], required: true },
  chamadoFechado: { type: Boolean, default: false },
  podeGerenciar: { type: Boolean, default: true },
  usuarios: { type: Array, default: () => [] }
});

const emit = defineEmits(['mudou-tarefas-ativas']);

const store = useChamadoTarefasStore();
const tarefas = computed(() => store.tarefas);
const tarefasAtivas = computed(() => store.tarefasAtivas);
const loading = computed(() => store.loading);

const expandida = ref(null);
const tempos = ref({});
const comentarios = ref({});
const novoComentarioTexto = ref({});
const loadingAcao = ref(null);

const showForm = ref(false);
const tarefaEditando = ref(null);
const salvandoForm = ref(false);
const erroForm = ref(null);

const badgeStatus = (status) => {
  const map = {
    pendente: 'bg-secondary',
    em_andamento: 'bg-warning text-dark',
    concluida: 'bg-success',
    cancelada: 'bg-light text-muted'
  };
  return map[status] || 'bg-secondary';
};

const formatarStatusTarefa = (status) => {
  const map = {
    pendente: 'Pendente',
    em_andamento: 'Em Andamento',
    concluida: 'Concluída',
    cancelada: 'Cancelada'
  };
  return map[status] || status;
};

const carregarTempos = async () => {
  for (const tarefa of tarefas.value) {
    if (tarefa.status === 'cancelada') continue;
    try {
      const dados = await store.buscarHistoricoTempo(props.chamadoId, tarefa.id);
      tempos.value = { ...tempos.value, [tarefa.id]: dados };
    } catch (err) {
      console.error('Erro ao carregar tempo da tarefa', tarefa.id, err);
    }
  }
  emit('mudou-tarefas-ativas');
};

const carregar = async () => {
  await store.listarTarefas(props.chamadoId);
  await carregarTempos();
};

const toggleExpandir = async (tarefaId) => {
  if (expandida.value === tarefaId) {
    expandida.value = null;
    return;
  }
  expandida.value = tarefaId;
  if (!comentarios.value[tarefaId]) {
    comentarios.value[tarefaId] = await store.listarComentarios(props.chamadoId, tarefaId);
  }
};

const handleComentar = async (tarefa) => {
  const texto = novoComentarioTexto.value[tarefa.id]?.trim();
  if (!texto) return;
  const comentario = await store.adicionarComentario(props.chamadoId, tarefa.id, { texto });
  comentarios.value[tarefa.id] = [...(comentarios.value[tarefa.id] || []), comentario];
  novoComentarioTexto.value[tarefa.id] = '';
};

const handleAcaoTempo = async (tarefa, acao) => {
  loadingAcao.value = tarefa.id;
  try {
    await store.alternarAtendimentoTarefa(props.chamadoId, tarefa.id, acao);
    const dados = await store.buscarHistoricoTempo(props.chamadoId, tarefa.id);
    tempos.value = { ...tempos.value, [tarefa.id]: dados };
    emit('mudou-tarefas-ativas');
  } catch (err) {
    alert(err?.response?.data?.error?.message || err.message || 'Erro ao alternar cronômetro da tarefa');
  } finally {
    loadingAcao.value = null;
  }
};

const mudarStatus = async (tarefa, status) => {
  await store.atualizarTarefa(props.chamadoId, tarefa.id, { status });
};

const confirmarCancelar = async (tarefa) => {
  if (!confirm(`Cancelar a tarefa "${tarefa.titulo}"? O tempo já registrado continua contando no total do chamado.`)) return;
  await store.cancelarTarefa(props.chamadoId, tarefa.id);
  emit('mudou-tarefas-ativas');
};

const abrirNovaTarefa = () => {
  tarefaEditando.value = null;
  erroForm.value = null;
  showForm.value = true;
};

const abrirEditarTarefa = (tarefa) => {
  tarefaEditando.value = tarefa;
  erroForm.value = null;
  showForm.value = true;
};

const salvarTarefa = async (dados) => {
  salvandoForm.value = true;
  erroForm.value = null;
  try {
    if (tarefaEditando.value) {
      await store.atualizarTarefa(props.chamadoId, tarefaEditando.value.id, dados);
    } else {
      await store.criarTarefa(props.chamadoId, dados);
      emit('mudou-tarefas-ativas');
    }
    showForm.value = false;
  } catch (err) {
    erroForm.value = err?.response?.data?.error?.message || err.message || 'Erro ao salvar tarefa';
  } finally {
    salvandoForm.value = false;
  }
};

let refreshInterval = null;
onMounted(async () => {
  await carregar();
  refreshInterval = setInterval(carregarTempos, 30000);
});
onUnmounted(() => {
  if (refreshInterval) clearInterval(refreshInterval);
});
</script>

<style scoped>
.tarefa-live-dot {
  display: inline-block;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--color-success-500, #198754);
  animation: tarefa-pulse 1.5s infinite;
}

@keyframes tarefa-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}
</style>
