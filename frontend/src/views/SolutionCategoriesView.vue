<template>
  <layout-principal>
    <div class="container-fluid">
      <!-- Header -->
      <div class="row mb-4">
        <div class="col-12">
          <div class="d-flex justify-content-between align-items-center">
            <h1 class="h3 mb-0">
              <i class="bi bi-tags me-2"></i>
              Categorias de Solução
            </h1>
            <button 
              class="btn btn-primary"
              @click="abrirModalNova"
            >
              <i class="bi bi-plus-lg me-1"></i>
              Nova Categoria
            </button>
          </div>
        </div>
      </div>

      <!-- Loading -->
      <LoadingSpinner v-if="loading" text="Carregando categorias..." />

      <!-- Erro -->
      <ErrorMessage 
        v-else-if="error" 
        :message="error"
        @retry="carregarCategorias"
      />

      <!-- Tabela de Categorias -->
      <div v-else class="row">
        <div class="col-12">
          <!-- Busca -->
          <div class="card mb-3">
            <div class="card-body py-2">
              <div class="input-group">
                <span class="input-group-text bg-transparent border-end-0">
                  <i class="bi bi-search text-muted"></i>
                </span>
                <input 
                  v-model="searchQuery"
                  type="text" 
                  class="form-control border-start-0" 
                  placeholder="Pesquisar categorias (Nível 1, 2 ou 3)..."
                />
                <button 
                  v-if="searchQuery"
                  class="btn btn-outline-secondary border-start-0" 
                  type="button"
                  @click="searchQuery = ''"
                >
                  <i class="bi bi-x-lg"></i>
                </button>
              </div>
            </div>
          </div>

          <div v-if="categoriasHierarquicas.length === 0" class="card">
            <div class="card-body text-center text-muted py-5">
              <i class="bi bi-search display-4 mb-3 d-block"></i>
              Nenhuma categoria encontrada para sua busca.
            </div>
          </div>

          <!-- Acordeão Hierárquico -->
          <div v-else class="hierarquia-container">
            <div 
              v-for="n1 in categoriasHierarquicas" 
              :key="n1.nome" 
              class="card mb-2 border-primary-subtle"
            >
              <div 
                class="card-header bg-light d-flex justify-content-between align-items-center cursor-pointer"
                @click="toggleNode(`n1-${n1.nome}`)"
              >
                <div class="d-flex align-items-center">
                  <i 
                    :class="isExpanded(`n1-${n1.nome}`) ? 'bi bi-chevron-down' : 'bi bi-chevron-right'"
                    class="me-2 text-primary"
                  ></i>
                  <span class="fw-bold text-primary">
                    <i class="bi bi-folder2-open me-2"></i>
                    {{ n1.nome }}
                  </span>
                  <span class="badge bg-primary-subtle text-primary ms-2 rounded-pill">
                    {{ n1.niveis2.length }} subníveis
                  </span>
                </div>
              </div>

              <div v-if="isExpanded(`n1-${n1.nome}`)" class="card-body p-0 border-top">
                <div 
                  v-for="n2 in n1.niveis2" 
                  :key="n2.nome" 
                  class="border-bottom last-child-border-0"
                >
                  <div 
                    class="d-flex justify-content-between align-items-center p-2 ps-4 bg-light-subtle cursor-pointer hover-bg"
                    @click="toggleNode(`n2-${n1.nome}-${n2.nome}`)"
                  >
                    <div class="d-flex align-items-center">
                      <i 
                        :class="isExpanded(`n2-${n1.nome}-${n2.nome}`) ? 'bi bi-chevron-down' : 'bi bi-chevron-right'"
                        class="me-2 text-secondary"
                      ></i>
                      <span class="fw-semibold">
                        <i class="bi bi-folder2 me-2"></i>
                        {{ n2.nome }}
                      </span>
                      <span class="badge bg-secondary-subtle text-secondary ms-2 rounded-pill">
                        {{ n2.niveis3.length }} itens
                      </span>
                    </div>
                  </div>

                  <div v-if="isExpanded(`n2-${n1.nome}-${n2.nome}`)" class="ps-5 pe-3 py-2 bg-white">
                    <div class="table-responsive">
                      <table class="table table-sm table-hover mb-0">
                        <thead>
                          <tr class="table-light">
                            <th>Nível 3 (Categoria Final)</th>
                            <th width="100">Status</th>
                            <th width="120" class="text-end">Ações</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr v-for="n3 in n2.niveis3" :key="n3.id">
                            <td class="align-middle">
                              <i class="bi bi-tag me-2 text-muted"></i>
                              {{ n3.categoria_nivel_3 }}
                            </td>
                            <td class="align-middle">
                              <span 
                                :class="n3.ativo ? 'badge bg-success' : 'badge bg-secondary'"
                                class="rounded-pill"
                              >
                                {{ n3.ativo ? 'Ativo' : 'Inativo' }}
                              </span>
                            </td>
                            <td class="text-end">
                              <div class="btn-group">
                                <button 
                                  class="btn btn-sm btn-outline-primary"
                                  @click.stop="abrirModalEditar(n3)"
                                  title="Editar"
                                >
                                  <i class="bi bi-pencil"></i>
                                </button>
                                <button 
                                  class="btn btn-sm btn-outline-danger"
                                  @click.stop="excluirCategoria(n3.id)"
                                  title="Excluir"
                                >
                                  <i class="bi bi-trash"></i>
                                </button>
                              </div>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Modal de Criar/Editar -->
      <div 
        v-if="showModal" 
        class="modal fade show d-block" 
        tabindex="-1"
        @click.self="fecharModal"
      >
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">
                {{ modalEditando ? 'Editar Categoria' : 'Nova Categoria' }}
              </h5>
              <button 
                type="button" 
                class="btn-close" 
                @click="fecharModal"
              ></button>
            </div>
            <div class="modal-body">
              <form @submit.prevent="salvarCategoria">
                <!-- Nível 1 -->
                <div class="mb-3">
                  <label for="nivel1" class="form-label">
                    Categoria Nível 1 <span class="text-danger">*</span>
                  </label>
                  <div class="input-group">
                    <select
                      id="nivel1"
                      v-model="form.categoria_nivel_1"
                      class="form-select"
                      :class="{ 'is-invalid': formErrors.categoria_nivel_1 }"
                      required
                      @change="onNivel1Change"
                    >
                      <option value="">Selecione um Nível 1</option>
                      <option v-for="n1 in niveis1" :key="n1" :value="n1">{{ n1 }}</option>
                      <option value="__novo__">+ Criar novo Nível 1</option>
                    </select>
                    <button 
                      v-if="form.categoria_nivel_1 === '__novo__'"
                      type="button"
                      class="btn btn-outline-secondary"
                      @click="form.categoria_nivel_1 = ''"
                    >
                      <i class="bi bi-x-lg"></i>
                    </button>
                  </div>
                  
                  <input
                    v-if="form.categoria_nivel_1 === '__novo__'"
                    v-model="novoNivel1"
                    type="text"
                    class="form-control mt-2"
                    placeholder="Digite o nome do novo Nível 1"
                    required
                  />

                  <div v-if="formErrors.categoria_nivel_1" class="invalid-feedback d-block">
                    {{ formErrors.categoria_nivel_1 }}
                  </div>
                </div>

                <!-- Nível 2 -->
                <div class="mb-3">
                  <label for="nivel2" class="form-label">
                    Categoria Nível 2 <span class="text-danger">*</span>
                  </label>
                  <div class="input-group">
                    <select
                      id="nivel2"
                      v-model="form.categoria_nivel_2"
                      class="form-select"
                      :class="{ 'is-invalid': formErrors.categoria_nivel_2 }"
                      :disabled="!form.categoria_nivel_1 || (form.categoria_nivel_1 === '__novo__' && !novoNivel1)"
                      required
                      @change="onNivel2Change"
                    >
                      <option value="">Selecione um Nível 2</option>
                      <option v-for="n2 in niveis2" :key="n2" :value="n2">{{ n2 }}</option>
                      <option value="__novo__">+ Criar novo Nível 2</option>
                    </select>
                    <button 
                      v-if="form.categoria_nivel_2 === '__novo__'"
                      type="button"
                      class="btn btn-outline-secondary"
                      @click="form.categoria_nivel_2 = ''"
                    >
                      <i class="bi bi-x-lg"></i>
                    </button>
                  </div>

                  <input
                    v-if="form.categoria_nivel_2 === '__novo__'"
                    v-model="novoNivel2"
                    type="text"
                    class="form-control mt-2"
                    placeholder="Digite o nome do novo Nível 2"
                    required
                  />

                  <div v-if="formErrors.categoria_nivel_2" class="invalid-feedback d-block">
                    {{ formErrors.categoria_nivel_2 }}
                  </div>
                </div>

                <!-- Nível 3 -->
                <div class="mb-3">
                  <label for="nivel3" class="form-label">
                    Categoria Nível 3 <span class="text-danger">*</span>
                  </label>
                  <div class="input-group">
                    <select
                      id="nivel3"
                      v-model="form.categoria_nivel_3"
                      class="form-select"
                      :class="{ 'is-invalid': formErrors.categoria_nivel_3 }"
                      :disabled="!form.categoria_nivel_2 || (form.categoria_nivel_2 === '__novo__' && !novoNivel2)"
                      required
                    >
                      <option value="">Selecione um Nível 3</option>
                      <option v-for="n3 in niveis3" :key="n3" :value="n3">{{ n3 }}</option>
                      <option value="__novo__">+ Criar novo Nível 3</option>
                    </select>
                    <button 
                      v-if="form.categoria_nivel_3 === '__novo__'"
                      type="button"
                      class="btn btn-outline-secondary"
                      @click="form.categoria_nivel_3 = ''"
                    >
                      <i class="bi bi-x-lg"></i>
                    </button>
                  </div>

                  <input
                    v-if="form.categoria_nivel_3 === '__novo__'"
                    v-model="novoNivel3"
                    type="text"
                    class="form-control mt-2"
                    placeholder="Digite o nome do novo Nível 3"
                    required
                  />

                  <div v-if="formErrors.categoria_nivel_3" class="invalid-feedback d-block">
                    {{ formErrors.categoria_nivel_3 }}
                  </div>
                </div>

                <div class="d-flex gap-2 justify-content-end">
                  <button 
                    type="button" 
                    class="btn btn-secondary"
                    @click="fecharModal"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit" 
                    class="btn btn-primary"
                    :disabled="salvando"
                  >
                    <span v-if="salvando" class="spinner-border spinner-border-sm me-1"></span>
                    {{ salvando ? 'Salvando...' : 'Salvar' }}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
      <div v-if="showModal" class="modal-backdrop fade show"></div>
    </div>
  </layout-principal>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import LayoutPrincipal from '@/components/LayoutPrincipal.vue';
import LoadingSpinner from '@/components/shared/LoadingSpinner.vue';
import ErrorMessage from '@/components/shared/ErrorMessage.vue';
import solutionCategoryService from '@/services/solutionCategoryService';

// Estados
const loading = ref(false);
const error = ref(null);
const categorias = ref([]);
const searchQuery = ref('');
const expandedNodes = ref(new Set());

const toggleNode = (id) => {
  if (expandedNodes.value.has(id)) {
    expandedNodes.value.delete(id);
  } else {
    expandedNodes.value.add(id);
  }
};

const isExpanded = (id) => expandedNodes.value.has(id);

// Lógica de agrupamento hierárquico
const categoriasHierarquicas = computed(() => {
  const tree = [];
  const query = searchQuery.value.toLowerCase().trim();

  // Agrupar categorias
  const n1Map = new Map();

  categorias.value.forEach(cat => {
    if (!n1Map.has(cat.categoria_nivel_1)) {
      n1Map.set(cat.categoria_nivel_1, {
        nome: cat.categoria_nivel_1,
        niveis2: new Map(),
        matches: false
      });
    }
    const n1 = n1Map.get(cat.categoria_nivel_1);

    if (!n1.niveis2.has(cat.categoria_nivel_2)) {
      n1.niveis2.set(cat.categoria_nivel_2, {
        nome: cat.categoria_nivel_2,
        niveis3: [],
        matches: false
      });
    }
    const n2 = n1.niveis2.get(cat.categoria_nivel_2);

    const matchesN3 = cat.categoria_nivel_3.toLowerCase().includes(query);
    const matchesN2 = cat.categoria_nivel_2.toLowerCase().includes(query);
    const matchesN1 = cat.categoria_nivel_1.toLowerCase().includes(query);

    const match = matchesN1 || matchesN2 || matchesN3;

    n2.niveis3.push({
      ...cat,
      match
    });

    if (match) {
      n1.matches = true;
      n2.matches = true;
    }
  });

  // Converter Maps para Arrays e ordenar
  const result = Array.from(n1Map.values())
    .map(n1 => ({
      ...n1,
      niveis2: Array.from(n1.niveis2.values())
        .map(n2 => ({
          ...n2,
          niveis3: n2.niveis3.sort((a, b) => a.categoria_nivel_3.localeCompare(b.categoria_nivel_3))
        }))
        .sort((a, b) => a.nome.localeCompare(b.nome))
    }))
    .sort((a, b) => a.nome.localeCompare(b.nome));

  // Filtrar se houver busca
  if (query) {
    return result.filter(n1 => {
      const n1Matches = n1.nome.toLowerCase().includes(query);
      const filteredN2 = n1.niveis2.filter(n2 => {
        const n2Matches = n2.nome.toLowerCase().includes(query);
        const filteredN3 = n2.niveis3.filter(n3 => n3.categoria_nivel_3.toLowerCase().includes(query));
        
        if (n1Matches || n2Matches || filteredN3.length > 0) {
          // Auto-expandir se houver match
          expandedNodes.value.add(`n1-${n1.nome}`);
          if (n2Matches || filteredN3.length > 0) {
            expandedNodes.value.add(`n2-${n1.nome}-${n2.nome}`);
          }
          return true;
        }
        return false;
      });

      return n1Matches || filteredN2.length > 0;
    });
  }

  return result;
});

const showModal = ref(false);
const modalEditando = ref(false);
const salvando = ref(false);
const categoriaEditando = ref(null);

const niveis1 = ref([]);
const niveis2 = ref([]);
const niveis3 = ref([]);

const novoNivel1 = ref('');
const novoNivel2 = ref('');
const novoNivel3 = ref('');

const form = ref({
  categoria_nivel_1: '',
  categoria_nivel_2: '',
  categoria_nivel_3: ''
});

const formErrors = ref({
  categoria_nivel_1: '',
  categoria_nivel_2: '',
  categoria_nivel_3: ''
});

// Funções
const carregarNiveis1 = async () => {
  try {
    niveis1.value = await solutionCategoryService.buscarNiveis1();
  } catch (err) {
    console.error('Erro ao carregar níveis 1:', err);
  }
};

const carregarNiveis2 = async (nivel1) => {
  if (!nivel1 || nivel1 === '__novo__') {
    niveis2.value = [];
    return;
  }
  try {
    niveis2.value = await solutionCategoryService.buscarNiveis2(nivel1);
  } catch (err) {
    console.error('Erro ao carregar níveis 2:', err);
  }
};

const carregarNiveis3 = async (nivel1, nivel2) => {
  if (!nivel1 || nivel1 === '__novo__' || !nivel2 || nivel2 === '__novo__') {
    niveis3.value = [];
    return;
  }
  try {
    niveis3.value = await solutionCategoryService.buscarNiveis3(nivel1, nivel2);
  } catch (err) {
    console.error('Erro ao carregar níveis 3:', err);
  }
};

const onNivel1Change = () => {
  form.value.categoria_nivel_2 = '';
  form.value.categoria_nivel_3 = '';
  novoNivel1.value = '';
  novoNivel2.value = '';
  novoNivel3.value = '';
  if (form.value.categoria_nivel_1 && form.value.categoria_nivel_1 !== '__novo__') {
    carregarNiveis2(form.value.categoria_nivel_1);
  } else {
    niveis2.value = [];
    niveis3.value = [];
  }
};

const onNivel2Change = () => {
  form.value.categoria_nivel_3 = '';
  novoNivel2.value = '';
  novoNivel3.value = '';
  if (form.value.categoria_nivel_2 && form.value.categoria_nivel_2 !== '__novo__') {
    const n1 = form.value.categoria_nivel_1 === '__novo__' ? novoNivel1.value : form.value.categoria_nivel_1;
    carregarNiveis3(n1, form.value.categoria_nivel_2);
  } else {
    niveis3.value = [];
  }
};

const carregarCategorias = async () => {
  loading.value = true;
  error.value = null;
  
  try {
    categorias.value = await solutionCategoryService.listarTodas();
  } catch (err) {
    console.error('Erro ao carregar categorias:', err);
    error.value = err?.response?.data?.error?.message 
      || err?.response?.data?.message 
      || err.message 
      || 'Erro ao carregar categorias';
  } finally {
    loading.value = false;
  }
};

const abrirModalNova = () => {
  modalEditando.value = false;
  categoriaEditando.value = null;
  form.value = {
    categoria_nivel_1: '',
    categoria_nivel_2: '',
    categoria_nivel_3: ''
  };
  novoNivel1.value = '';
  novoNivel2.value = '';
  novoNivel3.value = '';
  niveis2.value = [];
  niveis3.value = [];
  formErrors.value = {
    categoria_nivel_1: '',
    categoria_nivel_2: '',
    categoria_nivel_3: ''
  };
  showModal.value = true;
  carregarNiveis1();
};

const abrirModalEditar = async (categoria) => {
  modalEditando.value = true;
  categoriaEditando.value = categoria;
  
  // Primeiro carrega as opções do nível 1
  await carregarNiveis1();
  
  form.value = {
    categoria_nivel_1: categoria.categoria_nivel_1,
    categoria_nivel_2: categoria.categoria_nivel_2,
    categoria_nivel_3: categoria.categoria_nivel_3
  };
  
  // Carrega opções dependentes
  await carregarNiveis2(categoria.categoria_nivel_1);
  await carregarNiveis3(categoria.categoria_nivel_1, categoria.categoria_nivel_2);
  
  novoNivel1.value = '';
  novoNivel2.value = '';
  novoNivel3.value = '';
  
  formErrors.value = {
    categoria_nivel_1: '',
    categoria_nivel_2: '',
    categoria_nivel_3: ''
  };
  showModal.value = true;
};

const fecharModal = () => {
  showModal.value = false;
  modalEditando.value = false;
  categoriaEditando.value = null;
  form.value = {
    categoria_nivel_1: '',
    categoria_nivel_2: '',
    categoria_nivel_3: ''
  };
  novoNivel1.value = '';
  novoNivel2.value = '';
  novoNivel3.value = '';
  niveis2.value = [];
  niveis3.value = [];
  formErrors.value = {
    categoria_nivel_1: '',
    categoria_nivel_2: '',
    categoria_nivel_3: ''
  };
};

const validarForm = () => {
  let valido = true;
  formErrors.value = {
    categoria_nivel_1: '',
    categoria_nivel_2: '',
    categoria_nivel_3: ''
  };

  const n1 = form.value.categoria_nivel_1 === '__novo__' ? novoNivel1.value : form.value.categoria_nivel_1;
  const n2 = form.value.categoria_nivel_2 === '__novo__' ? novoNivel2.value : form.value.categoria_nivel_2;
  const n3 = form.value.categoria_nivel_3 === '__novo__' ? novoNivel3.value : form.value.categoria_nivel_3;

  if (!n1 || n1.trim().length < 2) {
    formErrors.value.categoria_nivel_1 = 'Categoria nível 1 deve ter no mínimo 2 caracteres';
    valido = false;
  }

  if (!n2 || n2.trim().length < 2) {
    formErrors.value.categoria_nivel_2 = 'Categoria nível 2 deve ter no mínimo 2 caracteres';
    valido = false;
  }

  if (!n3 || n3.trim().length < 2) {
    formErrors.value.categoria_nivel_3 = 'Categoria nível 3 deve ter no mínimo 2 caracteres';
    valido = false;
  }

  return valido;
};

const salvarCategoria = async () => {
  if (!validarForm()) return;

  salvando.value = true;
  
  const dadosParaSalvar = {
    categoria_nivel_1: form.value.categoria_nivel_1 === '__novo__' ? novoNivel1.value.trim() : form.value.categoria_nivel_1,
    categoria_nivel_2: form.value.categoria_nivel_2 === '__novo__' ? novoNivel2.value.trim() : form.value.categoria_nivel_2,
    categoria_nivel_3: form.value.categoria_nivel_3 === '__novo__' ? novoNivel3.value.trim() : form.value.categoria_nivel_3
  };
  
  try {
    if (modalEditando.value) {
      await solutionCategoryService.atualizar(categoriaEditando.value.id, dadosParaSalvar);
      alert('Categoria atualizada com sucesso!');
    } else {
      await solutionCategoryService.criar(dadosParaSalvar);
      alert('Categoria criada com sucesso!');
    }
    
    fecharModal();
    await carregarCategorias();
  } catch (err) {
    console.error('Erro ao salvar categoria:', err);
    const errorMessage = err?.response?.data?.error?.message 
      || err?.response?.data?.message 
      || err.message 
      || 'Erro ao salvar categoria';
    alert(errorMessage);
  } finally {
    salvando.value = false;
  }
};

const excluirCategoria = async (id) => {
  if (!confirm('Deseja realmente excluir esta categoria permanentemente?')) return;
  
  try {
    await solutionCategoryService.excluir(id);
    alert('Categoria excluída com sucesso!');
    await carregarCategorias();
  } catch (err) {
    console.error('Erro ao excluir categoria:', err);
    const errorMessage = err?.response?.data?.error?.message 
      || err?.response?.data?.message 
      || err.message 
      || 'Erro ao excluir categoria';
    alert(errorMessage);
  }
};

// Lifecycle
onMounted(() => {
  carregarCategorias();
});
</script>

<style scoped>
.modal.show {
  background-color: rgba(0, 0, 0, 0.5);
}

.badge {
  font-size: 0.85rem;
  padding: 0.4em 0.8em;
}

.cursor-pointer {
  cursor: pointer;
}

.hover-bg:hover {
  background-color: rgba(0, 0, 0, 0.03) !important;
}

.hierarquia-container {
  max-width: 100%;
}

.last-child-border-0:last-child {
  border-bottom: 0 !important;
}

.bg-light-subtle {
  background-color: #f8f9fa;
}

/* Transições suaves para expansão */
.card-body {
  transition: all 0.3s ease;
}

.btn-group .btn {
  padding: 0.25rem 0.5rem;
}
</style>

