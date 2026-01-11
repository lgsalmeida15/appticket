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
          <div class="card">
            <div class="card-body">
              <div class="table-responsive">
                <table class="table table-hover">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Nível 1</th>
                      <th>Nível 2</th>
                      <th>Nível 3</th>
                      <th>Status</th>
                      <th class="text-end">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-if="categorias.length === 0">
                      <td colspan="6" class="text-center text-muted py-4">
                        Nenhuma categoria cadastrada
                      </td>
                    </tr>
                    <tr v-for="categoria in categorias" :key="categoria.id">
                      <td>{{ categoria.id }}</td>
                      <td>{{ categoria.categoria_nivel_1 }}</td>
                      <td>{{ categoria.categoria_nivel_2 }}</td>
                      <td>{{ categoria.categoria_nivel_3 }}</td>
                      <td>
                        <span 
                          :class="categoria.ativo ? 'badge bg-success' : 'badge bg-secondary'"
                        >
                          {{ categoria.ativo ? 'Ativo' : 'Inativo' }}
                        </span>
                      </td>
                      <td class="text-end">
                        <button 
                          class="btn btn-sm btn-outline-primary me-1"
                          @click="abrirModalEditar(categoria)"
                          title="Editar"
                        >
                          <i class="bi bi-pencil"></i>
                        </button>
                        <button 
                          v-if="categoria.ativo"
                          class="btn btn-sm btn-outline-warning"
                          @click="desativarCategoria(categoria.id)"
                          title="Desativar"
                        >
                          <i class="bi bi-x-circle"></i>
                        </button>
                        <button 
                          v-else
                          class="btn btn-sm btn-outline-success"
                          @click="ativarCategoria(categoria.id)"
                          title="Ativar"
                        >
                          <i class="bi bi-check-circle"></i>
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
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
                <div class="mb-3">
                  <label for="nivel1" class="form-label">
                    Categoria Nível 1 <span class="text-danger">*</span>
                  </label>
                  <input
                    id="nivel1"
                    v-model="form.categoria_nivel_1"
                    type="text"
                    class="form-control"
                    :class="{ 'is-invalid': formErrors.categoria_nivel_1 }"
                    placeholder="Ex: Problema Resolvido"
                    required
                  />
                  <div v-if="formErrors.categoria_nivel_1" class="invalid-feedback">
                    {{ formErrors.categoria_nivel_1 }}
                  </div>
                </div>

                <div class="mb-3">
                  <label for="nivel2" class="form-label">
                    Categoria Nível 2 <span class="text-danger">*</span>
                  </label>
                  <input
                    id="nivel2"
                    v-model="form.categoria_nivel_2"
                    type="text"
                    class="form-control"
                    :class="{ 'is-invalid': formErrors.categoria_nivel_2 }"
                    placeholder="Ex: Hardware"
                    required
                  />
                  <div v-if="formErrors.categoria_nivel_2" class="invalid-feedback">
                    {{ formErrors.categoria_nivel_2 }}
                  </div>
                </div>

                <div class="mb-3">
                  <label for="nivel3" class="form-label">
                    Categoria Nível 3 <span class="text-danger">*</span>
                  </label>
                  <input
                    id="nivel3"
                    v-model="form.categoria_nivel_3"
                    type="text"
                    class="form-control"
                    :class="{ 'is-invalid': formErrors.categoria_nivel_3 }"
                    placeholder="Ex: Substituição de componente"
                    required
                  />
                  <div v-if="formErrors.categoria_nivel_3" class="invalid-feedback">
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
import { ref, onMounted } from 'vue';
import LayoutPrincipal from '@/components/LayoutPrincipal.vue';
import LoadingSpinner from '@/components/shared/LoadingSpinner.vue';
import ErrorMessage from '@/components/shared/ErrorMessage.vue';
import solutionCategoryService from '@/services/solutionCategoryService';

// Estados
const loading = ref(false);
const error = ref(null);
const categorias = ref([]);
const showModal = ref(false);
const modalEditando = ref(false);
const salvando = ref(false);
const categoriaEditando = ref(null);

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
  formErrors.value = {
    categoria_nivel_1: '',
    categoria_nivel_2: '',
    categoria_nivel_3: ''
  };
  showModal.value = true;
};

const abrirModalEditar = (categoria) => {
  modalEditando.value = true;
  categoriaEditando.value = categoria;
  form.value = {
    categoria_nivel_1: categoria.categoria_nivel_1,
    categoria_nivel_2: categoria.categoria_nivel_2,
    categoria_nivel_3: categoria.categoria_nivel_3
  };
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

  if (!form.value.categoria_nivel_1 || form.value.categoria_nivel_1.trim().length < 2) {
    formErrors.value.categoria_nivel_1 = 'Categoria nível 1 deve ter no mínimo 2 caracteres';
    valido = false;
  }

  if (!form.value.categoria_nivel_2 || form.value.categoria_nivel_2.trim().length < 2) {
    formErrors.value.categoria_nivel_2 = 'Categoria nível 2 deve ter no mínimo 2 caracteres';
    valido = false;
  }

  if (!form.value.categoria_nivel_3 || form.value.categoria_nivel_3.trim().length < 2) {
    formErrors.value.categoria_nivel_3 = 'Categoria nível 3 deve ter no mínimo 2 caracteres';
    valido = false;
  }

  return valido;
};

const salvarCategoria = async () => {
  if (!validarForm()) return;

  salvando.value = true;
  
  try {
    if (modalEditando.value) {
      await solutionCategoryService.atualizar(categoriaEditando.value.id, form.value);
      alert('Categoria atualizada com sucesso!');
    } else {
      await solutionCategoryService.criar(form.value);
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

const desativarCategoria = async (id) => {
  if (!confirm('Deseja realmente desativar esta categoria?')) return;
  
  try {
    await solutionCategoryService.desativar(id);
    alert('Categoria desativada com sucesso!');
    await carregarCategorias();
  } catch (err) {
    console.error('Erro ao desativar categoria:', err);
    const errorMessage = err?.response?.data?.error?.message 
      || err?.response?.data?.message 
      || err.message 
      || 'Erro ao desativar categoria';
    alert(errorMessage);
  }
};

const ativarCategoria = async (id) => {
  try {
    await solutionCategoryService.ativar(id);
    alert('Categoria ativada com sucesso!');
    await carregarCategorias();
  } catch (err) {
    console.error('Erro ao ativar categoria:', err);
    const errorMessage = err?.response?.data?.error?.message 
      || err?.response?.data?.message 
      || err.message 
      || 'Erro ao ativar categoria';
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
</style>

