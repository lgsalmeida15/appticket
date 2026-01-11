<template>
  <layout-principal>
    <div class="container-fluid">
      <!-- Header com Breadcrumb -->
      <div class="row mb-4">
        <div class="col-12">
          <nav aria-label="breadcrumb">
            <ol class="breadcrumb">
              <li class="breadcrumb-item">
                <router-link to="/chamados">
                  <i class="bi bi-list-task me-1"></i>
                  Chamados
                </router-link>
              </li>
              <li class="breadcrumb-item">
                <router-link :to="`/chamados/view/${chamadoId}`">
                  <i class="bi bi-ticket-detailed me-1"></i>
                  #{{ chamadoId }}
                </router-link>
              </li>
              <li class="breadcrumb-item active" aria-current="page">
                Fechar Chamado
              </li>
            </ol>
          </nav>
        </div>
      </div>

      <!-- Loading -->
      <LoadingSpinner v-if="loading" text="Carregando informações..." />

      <!-- Erro -->
      <ErrorMessage 
        v-else-if="error" 
        :message="error"
        @retry="carregarDados"
      />

      <!-- Formulário de Fechamento -->
      <div v-else class="row justify-content-center">
        <div class="col-lg-8">
          <div class="card">
            <div class="card-header bg-primary text-white">
              <h4 class="mb-0">
                <i class="bi bi-check-circle me-2"></i>
                Fechar Chamado #{{ chamado?.id }}
              </h4>
            </div>
            <div class="card-body">
              <!-- Informações do Chamado -->
              <div class="alert alert-info mb-4">
                <h5 class="alert-heading">
                  <i class="bi bi-info-circle me-2"></i>
                  {{ chamado?.titulo }}
                </h5>
                <hr>
                <p class="mb-2"><strong>Descrição:</strong> {{ chamado?.descricao }}</p>
                <p class="mb-2"><strong>Status:</strong> {{ formatarStatus(chamado?.status) }}</p>
                <p class="mb-0"><strong>Prioridade:</strong> {{ formatarPrioridade(chamado?.prioridade) }}</p>
              </div>

              <!-- Formulário -->
              <form @submit.prevent="fecharChamado">
                <!-- Data e Hora de Resolução -->
                <div class="mb-3">
                  <label for="dataResolucao" class="form-label">
                    Data e Hora de Resolução <span class="text-danger">*</span>
                  </label>
                  <input
                    id="dataResolucao"
                    v-model="form.data_hora_resolucao"
                    type="datetime-local"
                    class="form-control"
                    :class="{ 'is-invalid': formErrors.data_hora_resolucao }"
                    required
                  />
                  <div v-if="formErrors.data_hora_resolucao" class="invalid-feedback">
                    {{ formErrors.data_hora_resolucao }}
                  </div>
                  <small class="form-text text-muted">
                    Preenchido automaticamente com a data/hora atual
                  </small>
                </div>

                <!-- Categoria Nível 1 -->
                <div class="mb-3">
                  <label for="nivel1" class="form-label">
                    Categoria Nível 1 <span class="text-danger">*</span>
                  </label>
                  <select
                    id="nivel1"
                    v-model="form.nivel1"
                    class="form-select"
                    :class="{ 'is-invalid': formErrors.nivel1 }"
                    required
                    @change="onNivel1Change"
                  >
                    <option value="">Selecione...</option>
                    <option v-for="nivel in niveis1" :key="nivel" :value="nivel">
                      {{ nivel }}
                    </option>
                  </select>
                  <div v-if="formErrors.nivel1" class="invalid-feedback">
                    {{ formErrors.nivel1 }}
                  </div>
                </div>

                <!-- Categoria Nível 2 -->
                <div class="mb-3">
                  <label for="nivel2" class="form-label">
                    Categoria Nível 2 <span class="text-danger">*</span>
                  </label>
                  <select
                    id="nivel2"
                    v-model="form.nivel2"
                    class="form-select"
                    :class="{ 'is-invalid': formErrors.nivel2 }"
                    :disabled="!form.nivel1 || loadingNiveis2"
                    required
                    @change="onNivel2Change"
                  >
                    <option value="">Selecione...</option>
                    <option v-for="nivel in niveis2" :key="nivel" :value="nivel">
                      {{ nivel }}
                    </option>
                  </select>
                  <div v-if="formErrors.nivel2" class="invalid-feedback">
                    {{ formErrors.nivel2 }}
                  </div>
                </div>

                <!-- Categoria Nível 3 -->
                <div class="mb-3">
                  <label for="nivel3" class="form-label">
                    Categoria Nível 3 <span class="text-danger">*</span>
                  </label>
                  <select
                    id="nivel3"
                    v-model="form.categoria_solucao_id"
                    class="form-select"
                    :class="{ 'is-invalid': formErrors.categoria_solucao_id }"
                    :disabled="!form.nivel2 || loadingNiveis3"
                    required
                  >
                    <option value="">Selecione...</option>
                    <option 
                      v-for="categoria in categoriasFiltradas" 
                      :key="categoria.id" 
                      :value="categoria.id"
                    >
                      {{ categoria.categoria_nivel_3 }}
                    </option>
                  </select>
                  <div v-if="formErrors.categoria_solucao_id" class="invalid-feedback">
                    {{ formErrors.categoria_solucao_id }}
                  </div>
                </div>

                <!-- Descrição do Fechamento -->
                <div class="mb-4">
                  <label for="descricao" class="form-label">
                    Descrição do Fechamento <span class="text-danger">*</span>
                  </label>
                  <textarea
                    id="descricao"
                    v-model="form.descricao_fechamento"
                    class="form-control"
                    :class="{ 'is-invalid': formErrors.descricao_fechamento }"
                    rows="5"
                    placeholder="Descreva a solução aplicada ou o motivo do fechamento..."
                    required
                  ></textarea>
                  <div v-if="formErrors.descricao_fechamento" class="invalid-feedback">
                    {{ formErrors.descricao_fechamento }}
                  </div>
                  <small class="form-text text-muted">
                    Mínimo de 10 caracteres
                  </small>
                </div>

                <!-- Botões -->
                <div class="d-flex gap-2 justify-content-end">
                  <button 
                    type="button" 
                    class="btn btn-secondary"
                    @click="cancelar"
                  >
                    <i class="bi bi-x-lg me-1"></i>
                    Cancelar
                  </button>
                  <button 
                    type="submit" 
                    class="btn btn-success"
                    :disabled="fechando"
                  >
                    <span v-if="fechando" class="spinner-border spinner-border-sm me-1"></span>
                    <i v-else class="bi bi-check-circle me-1"></i>
                    {{ fechando ? 'Fechando...' : 'Confirmar Fechamento' }}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  </layout-principal>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useChamadosStore } from '@/stores/chamados';
import { useChamados } from '@/composables/useChamados';
import LayoutPrincipal from '@/components/LayoutPrincipal.vue';
import LoadingSpinner from '@/components/shared/LoadingSpinner.vue';
import ErrorMessage from '@/components/shared/ErrorMessage.vue';
import solutionCategoryService from '@/services/solutionCategoryService';
import chamadoFechamentoService from '@/services/chamadoFechamentoService';

const route = useRoute();
const router = useRouter();
const chamadosStore = useChamadosStore();
const { formatarStatus, formatarPrioridade } = useChamados();

// Estados
const loading = ref(false);
const error = ref(null);
const fechando = ref(false);
const chamado = ref(null);
const chamadoId = ref(parseInt(route.params.id));

const categorias = ref([]);
const niveis1 = ref([]);
const niveis2 = ref([]);
const loadingNiveis2 = ref(false);
const loadingNiveis3 = ref(false);

const form = ref({
  data_hora_resolucao: '',
  nivel1: '',
  nivel2: '',
  categoria_solucao_id: '',
  descricao_fechamento: ''
});

const formErrors = ref({
  data_hora_resolucao: '',
  nivel1: '',
  nivel2: '',
  categoria_solucao_id: '',
  descricao_fechamento: ''
});

// Computed
const categoriasFiltradas = computed(() => {
  if (!form.value.nivel1 || !form.value.nivel2) return [];
  
  return categorias.value.filter(c => 
    c.categoria_nivel_1 === form.value.nivel1 &&
    c.categoria_nivel_2 === form.value.nivel2
  );
});

// Funções
const carregarDados = async () => {
  loading.value = true;
  error.value = null;
  
  try {
    // Carregar chamado
    const chamadoCompleto = await chamadosStore.buscarChamado(chamadoId.value);
    chamado.value = chamadoCompleto;

    // Verificar se pode fechar
    const verificacao = await chamadoFechamentoService.verificarPodeFechamento(chamadoId.value);
    if (!verificacao.pode_fechar) {
      error.value = verificacao.motivo;
      return;
    }

    // Carregar categorias
    categorias.value = await solutionCategoryService.listarAtivas();
    niveis1.value = await solutionCategoryService.buscarNiveis1();

    // Preencher data/hora atual
    const agora = new Date();
    const offset = agora.getTimezoneOffset() * 60000;
    const localISOTime = new Date(agora - offset).toISOString().slice(0, 16);
    form.value.data_hora_resolucao = localISOTime;
  } catch (err) {
    console.error('Erro ao carregar dados:', err);
    error.value = err?.response?.data?.error?.message 
      || err?.response?.data?.message 
      || err.message 
      || 'Erro ao carregar dados';
  } finally {
    loading.value = false;
  }
};

const onNivel1Change = async () => {
  form.value.nivel2 = '';
  form.value.categoria_solucao_id = '';
  niveis2.value = [];
  
  if (!form.value.nivel1) return;
  
  loadingNiveis2.value = true;
  try {
    niveis2.value = await solutionCategoryService.buscarNiveis2(form.value.nivel1);
  } catch (err) {
    console.error('Erro ao carregar níveis 2:', err);
  } finally {
    loadingNiveis2.value = false;
  }
};

const onNivel2Change = () => {
  form.value.categoria_solucao_id = '';
};

const validarForm = () => {
  let valido = true;
  formErrors.value = {
    data_hora_resolucao: '',
    nivel1: '',
    nivel2: '',
    categoria_solucao_id: '',
    descricao_fechamento: ''
  };

  if (!form.value.data_hora_resolucao) {
    formErrors.value.data_hora_resolucao = 'Data e hora de resolução são obrigatórias';
    valido = false;
  }

  if (!form.value.nivel1) {
    formErrors.value.nivel1 = 'Selecione a categoria nível 1';
    valido = false;
  }

  if (!form.value.nivel2) {
    formErrors.value.nivel2 = 'Selecione a categoria nível 2';
    valido = false;
  }

  if (!form.value.categoria_solucao_id) {
    formErrors.value.categoria_solucao_id = 'Selecione a categoria nível 3';
    valido = false;
  }

  if (!form.value.descricao_fechamento || form.value.descricao_fechamento.trim().length < 10) {
    formErrors.value.descricao_fechamento = 'Descrição deve ter no mínimo 10 caracteres';
    valido = false;
  }

  return valido;
};

const fecharChamado = async () => {
  if (!validarForm()) return;

  fechando.value = true;
  
  try {
    const dados = {
      data_hora_resolucao: new Date(form.value.data_hora_resolucao).toISOString(),
      categoria_solucao_id: parseInt(form.value.categoria_solucao_id),
      descricao_fechamento: form.value.descricao_fechamento.trim()
    };

    await chamadoFechamentoService.fecharChamado(chamadoId.value, dados);
    
    alert('Chamado fechado com sucesso!');
    router.push({ name: 'chamado-view', params: { id: chamadoId.value } });
  } catch (err) {
    console.error('Erro ao fechar chamado:', err);
    const errorMessage = err?.response?.data?.error?.message 
      || err?.response?.data?.message 
      || err.message 
      || 'Erro ao fechar chamado';
    alert(errorMessage);
  } finally {
    fechando.value = false;
  }
};

const cancelar = () => {
  router.push({ name: 'chamado-view', params: { id: chamadoId.value } });
};

// Lifecycle
onMounted(() => {
  carregarDados();
});
</script>

<style scoped>
.breadcrumb {
  background-color: transparent;
  padding: 0;
}

.breadcrumb-item a {
  text-decoration: none;
  color: #0d6efd;
}

.breadcrumb-item a:hover {
  text-decoration: underline;
}
</style>

