<template>
  <layout-principal>
    <template #header-actions>
      <button class="btn btn-primary" @click="abrirModalNovo">
        <i class="bi bi-plus-circle"></i>
        Novo Grupo
      </button>
    </template>

    <div class="grupos-container">
      <!-- Filtros -->
      <div class="filters-card">
        <div class="search-wrapper">
          <i class="bi bi-search search-icon"></i>
          <input
            v-model="filtros.search"
            type="text"
            class="search-input"
            placeholder="Buscar por nome ou descrição..."
            @input="buscar"
          >
        </div>

        <div class="filters-row">
          <select v-model="filtros.ativo" class="form-select" @change="buscar">
            <option value="">Todos os status</option>
            <option value="true">Ativos</option>
            <option value="false">Inativos</option>
          </select>

          <button class="btn btn-outline-secondary" @click="limparFiltros">
            <i class="bi bi-x-circle"></i>
            Limpar
          </button>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="gruposStore.loading" class="loading-container">
        <div class="spinner-border text-primary"></div>
        <p>Carregando grupos...</p>
      </div>

      <!-- Erro -->
      <div v-else-if="gruposStore.error" class="alert alert-danger">
        {{ gruposStore.error }}
      </div>

      <!-- Lista de Grupos -->
      <div v-else class="grupos-grid">
        <div
          v-for="grupo in gruposStore.grupos"
          :key="grupo.id"
          class="grupo-card"
        >
          <!-- Card Header -->
          <div class="grupo-header">
            <div class="header-left">
              <div class="grupo-icon">
                <i class="bi bi-diagram-3"></i>
              </div>
              <h3 class="grupo-nome">{{ grupo.nome }}</h3>
            </div>
            <span :class="['status-badge', grupo.ativo ? 'status-active' : 'status-inactive']">
              {{ grupo.ativo ? 'Ativo' : 'Inativo' }}
            </span>
          </div>

          <!-- Card Body -->
          <div class="grupo-body">
            <p v-if="grupo.descricao" class="grupo-descricao">
              {{ grupo.descricao }}
            </p>
            <p v-else class="grupo-descricao empty">
              Sem descrição
            </p>

            <div class="grupo-permissoes mb-2">
              <span v-if="grupo.solicitante" class="badge bg-info me-1">
                <i class="bi bi-plus-circle"></i> Solicitante
              </span>
              <span v-if="grupo.executor" class="badge bg-success">
                <i class="bi bi-gear"></i> Executor
              </span>
            </div>

            <div class="grupo-meta">
              <div class="meta-item">
                <i class="bi bi-people"></i>
                <span class="meta-value">{{ grupo.usuarios?.length || 0 }}</span>
                <span class="meta-label">Membros</span>
              </div>

            </div>

            <div v-if="grupo.usuarios && grupo.usuarios.length > 0" class="membros-list">
              <div class="membros-avatars">
                <div 
                  v-for="(user, index) in grupo.usuarios.slice(0, 3)" 
                  :key="user.id"
                  class="member-avatar"
                  :title="user.nome"
                >
                  <i class="bi bi-person-fill"></i>
                </div>
                <div v-if="grupo.usuarios.length > 3" class="member-more">
                  +{{ grupo.usuarios.length - 3 }}
                </div>
              </div>
              <p class="membros-names">
                {{ grupo.usuarios.slice(0, 3).map(u => u.nome).join(', ') }}
                <span v-if="grupo.usuarios.length > 3">e mais {{ grupo.usuarios.length - 3 }}</span>
              </p>
            </div>
          </div>

          <!-- Card Footer -->
          <div class="grupo-footer">
            <button
              class="btn-action btn-action-primary"
              @click="abrirModalEditar(grupo)"
            >
              <i class="bi bi-pencil"></i>
              Editar
            </button>
            <button
              class="btn-action btn-action-info"
              @click="verDetalhes(grupo)"
            >
              <i class="bi bi-eye"></i>
              Detalhes
            </button>
            <button
              class="btn-action btn-action-danger"
              @click="confirmarDeletarGrupo(grupo)"
            >
              <i class="bi bi-trash3"></i>
              Deletar
            </button>
          </div>
        </div>

        <!-- Empty State -->
        <div v-if="gruposStore.grupos.length === 0" class="empty-state">
          <i class="bi bi-diagram-3"></i>
          <p>Nenhum grupo encontrado</p>
        </div>
      </div>

      <!-- Paginação -->
      <nav v-if="gruposStore.pagination.totalPages > 1" class="pagination-container">
        <ul class="pagination-modern">
          <li :class="{ disabled: gruposStore.pagination.page === 1 }">
            <button 
              class="page-btn"
              @click="mudarPagina(gruposStore.pagination.page - 1)"
              :disabled="gruposStore.pagination.page === 1"
            >
              <i class="bi bi-chevron-left"></i>
              Anterior
            </button>
          </li>
          <li
            v-for="page in gruposStore.pagination.totalPages"
            :key="page"
            :class="{ active: page === gruposStore.pagination.page }"
          >
            <button class="page-number" @click="mudarPagina(page)">
              {{ page }}
            </button>
          </li>
          <li :class="{ disabled: gruposStore.pagination.page === gruposStore.pagination.totalPages }">
            <button 
              class="page-btn"
              @click="mudarPagina(gruposStore.pagination.page + 1)"
              :disabled="gruposStore.pagination.page === gruposStore.pagination.totalPages"
            >
              Próxima
              <i class="bi bi-chevron-right"></i>
            </button>
          </li>
        </ul>
      </nav>
    </div>

    <!-- Modal de Formulário -->
    <div
      class="modal fade"
      id="modalGrupo"
      tabindex="-1"
      ref="modalElement"
    >
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">
              {{ modoEdicao ? 'Editar Grupo' : 'Novo Grupo' }}
            </h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body">
            <form @submit.prevent="salvar">
              <div class="mb-3">
                <label for="nome" class="form-label">Nome *</label>
                <input
                  v-model="formulario.nome"
                  type="text"
                  class="form-control"
                  id="nome"
                  required
                >
              </div>

              <div class="mb-3">
                <label for="descricao" class="form-label">Descrição</label>
                <textarea
                  v-model="formulario.descricao"
                  class="form-control"
                  id="descricao"
                  rows="3"
                ></textarea>
              </div>

              <div class="mb-3">
                <label class="form-label d-block">Permissões do Grupo</label>
                <div class="form-check">
                  <input
                    v-model="formulario.solicitante"
                    type="checkbox"
                    class="form-check-input"
                    id="solicitante"
                  >
                  <label class="form-check-label" for="solicitante">
                    Solicitante (pode criar chamados)
                  </label>
                </div>
                <div class="form-check">
                  <input
                    v-model="formulario.executor"
                    type="checkbox"
                    class="form-check-input"
                    id="executor"
                  >
                  <label class="form-check-label" for="executor">
                    Executor (pode executar chamados)
                  </label>
                </div>
              </div>

              <div v-if="modoEdicao" class="mb-3">
                <div class="form-check">
                  <input
                    v-model="formulario.ativo"
                    type="checkbox"
                    class="form-check-input"
                    id="ativo"
                  >
                  <label class="form-check-label" for="ativo">
                    Grupo ativo
                  </label>
                </div>
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
              Cancelar
            </button>
            <button type="button" class="btn btn-primary" @click="salvar" :disabled="salvando">
              <span v-if="salvando" class="spinner-border spinner-border-sm me-2"></span>
              {{ modoEdicao ? 'Atualizar' : 'Criar' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal Confirmar Exclusão -->
    <ConfirmDeleteModal
      :show="showDeleteModal"
      :item-type="deleteItem.type"
      :item-name="deleteItem.name"
      :warning-message="deleteItem.warning"
      @confirm="executarDeletarGrupo"
      @cancel="showDeleteModal = false"
    />
  </layout-principal>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue';
import { useGruposStore } from '@/stores/grupos';
import LayoutPrincipal from '@/components/LayoutPrincipal.vue';
import ConfirmDeleteModal from '@/components/ConfirmDeleteModal.vue';
import { Modal } from 'bootstrap';

const gruposStore = useGruposStore();

const modalElement = ref(null);
let modalInstance = null;

const filtros = ref({
  search: '',
  ativo: '',
  page: 1,
  limit: 10
});

const formulario = ref({
  nome: '',
  descricao: '',
  solicitante: true,
  executor: true,
  ativo: true
});

const modoEdicao = ref(false);
const grupoEditando = ref(null);
const salvando = ref(false);

onMounted(async () => {
  await gruposStore.listarGrupos(filtros.value);
  await nextTick();
  if (modalElement.value) {
    modalInstance = new Modal(modalElement.value);
  }
});

const buscar = async () => {
  filtros.value.page = 1;
  await gruposStore.listarGrupos(filtros.value);
};

const limparFiltros = async () => {
  filtros.value = {
    search: '',
    ativo: '',
    page: 1,
    limit: 10
  };
  await gruposStore.listarGrupos(filtros.value);
};

const mudarPagina = async (page) => {
  filtros.value.page = page;
  await gruposStore.listarGrupos(filtros.value);
};

const abrirModalNovo = () => {
  modoEdicao.value = false;
  grupoEditando.value = null;
  formulario.value = {
    nome: '',
    descricao: '',
    solicitante: true,
    executor: true,
    ativo: true
  };
  modalInstance.show();
};

const abrirModalEditar = (grupo) => {
  modoEdicao.value = true;
  grupoEditando.value = grupo;
  formulario.value = {
    nome: grupo.nome,
    descricao: grupo.descricao || '',
    solicitante: grupo.solicitante !== undefined ? grupo.solicitante : true,
    executor: grupo.executor !== undefined ? grupo.executor : true,
    ativo: grupo.ativo
  };
  modalInstance.show();
};

const salvar = async () => {
  salvando.value = true;

  try {
    if (modoEdicao.value) {
      await gruposStore.atualizarGrupo(grupoEditando.value.id, formulario.value);
    } else {
      await gruposStore.criarGrupo(formulario.value);
    }

    modalInstance.hide();
    await gruposStore.listarGrupos(filtros.value);
  } catch (error) {
    alert(error.response?.data?.error?.message || 'Erro ao salvar grupo');
  } finally {
    salvando.value = false;
  }
};

// Estados do modal de exclusão
const showDeleteModal = ref(false);
const deleteItem = ref({
  type: '',
  name: '',
  warning: '',
  id: null
});

const confirmarDeletarGrupo = (grupo) => {
  deleteItem.value = {
    type: 'Grupo',
    name: grupo.nome,
    warning: 'Se o grupo tiver chamados vinculados, a exclusão será bloqueada. Todos os relacionamentos com usuários serão removidos permanentemente.',
    id: grupo.id
  };
  showDeleteModal.value = true;
};

const executarDeletarGrupo = async () => {
  try {
    await gruposStore.deletarGrupo(deleteItem.value.id);
    showDeleteModal.value = false;
    await gruposStore.listarGrupos(filtros.value);
    alert('Grupo deletado permanentemente com sucesso!');
  } catch (error) {
    console.error('Erro ao deletar grupo:', error);
    
    if (error.response?.data?.code === 'GRUPO_HAS_DEPENDENCIES') {
      const deps = error.response.data.dependencias;
      alert(`Não é possível deletar o grupo. Ele possui ${deps.chamados} chamado(s) vinculado(s).`);
    } else {
      const errorMessage = error?.response?.data?.error?.message 
        || error?.response?.data?.message 
        || error.message 
        || 'Erro desconhecido';
      alert('Erro ao deletar grupo: ' + errorMessage);
    }
  }
};

const verDetalhes = (grupo) => {
  alert(`Detalhes do grupo:\n\nID: ${grupo.id}\nNome: ${grupo.nome}\nMembros: ${grupo.usuarios?.length || 0}\nAtivo: ${grupo.ativo ? 'Sim' : 'Não'}`);
};
</script>

<style scoped>
.grupos-container {
  max-width: 1400px;
  margin: 0 auto;
}

/* Filters Card */
.filters-card {
  background: var(--color-bg-primary);
  border: 1px solid var(--color-border-medium);
  border-radius: var(--radius-lg);
  padding: var(--space-5);
  margin-bottom: var(--space-6);
  box-shadow: var(--shadow-sm);
}

.search-wrapper {
  position: relative;
  margin-bottom: var(--space-4);
}

.search-icon {
  position: absolute;
  left: var(--space-4);
  top: 50%;
  transform: translateY(-50%);
  color: var(--color-text-tertiary);
  font-size: 1.125rem;
}

.search-input {
  width: 100%;
  height: var(--input-height-base);
  padding: 0 var(--space-4) 0 var(--space-12);
  font-size: var(--font-size-sm);
  border: 1.5px solid var(--color-border-medium);
  border-radius: var(--radius-base);
  transition: all var(--transition-base);
}

.search-input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-primary-light);
}

.filters-row {
  display: flex;
  gap: var(--space-3);
}

/* Loading */
.loading-container {
  text-align: center;
  padding: var(--space-12) 0;
}

.loading-container p {
  margin-top: var(--space-4);
  color: var(--color-text-secondary);
}

/* Grupos Grid */
.grupos-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: var(--space-4);
}

/* Grupo Card */
.grupo-card {
  background: var(--color-bg-primary);
  border: 1px solid var(--color-border-medium);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  transition: all var(--transition-base);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.grupo-card:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-4px);
}

.grupo-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-5);
  border-bottom: 1px solid var(--color-border-light);
}

.header-left {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  flex: 1;
  min-width: 0;
}

.grupo-icon {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-base);
  background: var(--color-primary-light);
  color: var(--color-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  flex-shrink: 0;
}

.grupo-nome {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.status-badge {
  display: inline-flex;
  padding: var(--space-1) var(--space-3);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  border-radius: var(--radius-full);
  flex-shrink: 0;
}

.status-active {
  background: var(--color-success-50);
  color: var(--color-success-700);
}

.status-inactive {
  background: var(--color-danger-50);
  color: var(--color-danger-700);
}

/* Grupo Body */
.grupo-body {
  flex: 1;
  padding: var(--space-5);
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.grupo-descricao {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  line-height: var(--line-height-relaxed);
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.grupo-descricao.empty {
  font-style: italic;
  color: var(--color-text-muted);
}

.grupo-meta {
  display: flex;
  gap: var(--space-6);
  padding: var(--space-3) 0;
  border-top: 1px solid var(--color-border-light);
  border-bottom: 1px solid var(--color-border-light);
}

.meta-item {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

.meta-item i {
  font-size: 1.125rem;
  color: var(--color-text-tertiary);
}

.meta-value {
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
}

.meta-label {
  font-size: var(--font-size-xs);
}

.membros-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.membros-avatars {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.member-avatar {
  width: 32px;
  height: 32px;
  border-radius: var(--radius-full);
  background: var(--color-gray-200);
  color: var(--color-gray-600);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.875rem;
  border: 2px solid var(--color-bg-primary);
}

.member-more {
  width: 32px;
  height: 32px;
  border-radius: var(--radius-full);
  background: var(--color-primary-light);
  color: var(--color-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  border: 2px solid var(--color-bg-primary);
}

.membros-names {
  font-size: var(--font-size-xs);
  color: var(--color-text-tertiary);
  margin: 0;
  line-height: var(--line-height-normal);
}

/* Grupo Footer */
.grupo-footer {
  display: flex;
  gap: var(--space-2);
  padding: var(--space-4) var(--space-5);
  background: var(--color-bg-tertiary);
  border-top: 1px solid var(--color-border-light);
}

.btn-action {
  flex: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  height: var(--button-height-sm);
  padding: 0 var(--space-3);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-base);
  background: var(--color-bg-primary);
  cursor: pointer;
  transition: all var(--transition-base);
}

.btn-action:hover {
  transform: translateY(-1px);
  box-shadow: var(--shadow-sm);
}

.btn-action-primary {
  color: var(--color-primary);
  border-color: var(--color-brand-300);
}

.btn-action-primary:hover {
  background: var(--color-primary-light);
  border-color: var(--color-primary);
}

.btn-action-info {
  color: var(--color-info-600);
  border-color: var(--color-info-300);
}

.btn-action-info:hover {
  background: var(--color-info-50);
  border-color: var(--color-info-500);
}

.btn-action-danger {
  color: var(--color-danger-600);
  border-color: var(--color-danger-300);
}

.btn-action-danger:hover {
  background: var(--color-danger-50);
  border-color: var(--color-danger-500);
}

/* Empty State */
.empty-state {
  grid-column: 1 / -1;
  text-align: center;
  padding: var(--space-16) var(--space-8);
  color: var(--color-text-muted);
}

.empty-state i {
  font-size: 4rem;
  opacity: 0.3;
  margin-bottom: var(--space-4);
}

.empty-state p {
  font-size: var(--font-size-lg);
  margin: 0;
}

/* Paginação */
.pagination-container {
  margin-top: var(--space-6);
  display: flex;
  justify-content: center;
}

.pagination-modern {
  display: flex;
  gap: var(--space-2);
  list-style: none;
  padding: 0;
  margin: 0;
  align-items: center;
}

.page-btn,
.page-number {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  min-width: 40px;
  height: 40px;
  padding: 0 var(--space-3);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-secondary);
  background: var(--color-bg-primary);
  border: 1px solid var(--color-border-medium);
  border-radius: var(--radius-base);
  cursor: pointer;
  transition: all var(--transition-base);
}

.page-btn:hover:not(:disabled),
.page-number:hover:not(:disabled) {
  background: var(--color-bg-tertiary);
  color: var(--color-text-primary);
}

li.active .page-number {
  background: var(--color-primary);
  color: white;
  border-color: var(--color-primary);
}

.page-btn:disabled,
li.disabled .page-btn {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Responsividade */
@media (max-width: 768px) {
  .grupos-grid {
    grid-template-columns: 1fr;
  }
  
  .filters-row {
    flex-direction: column;
  }
}
</style>
