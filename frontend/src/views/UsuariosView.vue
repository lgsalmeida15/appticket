<template>
  <layout-principal>
    <template #header-actions>
      <button class="btn btn-primary" @click="abrirModalNovo">
        <i class="bi bi-plus-circle"></i>
        Novo Usuário
      </button>
    </template>

    <div class="usuarios-container">
      <!-- Filtros -->
      <div class="filters-card">
        <div class="search-wrapper">
          <i class="bi bi-search search-icon"></i>
          <input
            v-model="filtros.search"
            type="text"
            class="search-input"
            placeholder="Buscar por nome ou email..."
            @input="buscar"
          >
        </div>

        <div class="filters-row">
          <select v-model="filtros.tipo" class="form-select" @change="buscar">
            <option value="">Todos os tipos</option>
            <option value="admin">Admin</option>
            <option value="gerente">Gerente</option>
            <option value="agente">Agente</option>
          </select>

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
      <div v-if="usuariosStore.loading" class="loading-container">
        <div class="spinner-border text-primary"></div>
        <p>Carregando usuários...</p>
      </div>

      <!-- Erro -->
      <div v-else-if="usuariosStore.error" class="alert alert-danger">
        {{ usuariosStore.error }}
      </div>

      <!-- Lista de Usuários -->
      <div v-else class="usuarios-list">
        <div 
          v-for="usuario in usuariosStore.usuarios" 
          :key="usuario.id" 
          class="usuario-card"
        >
          <!-- Header do Card -->
          <div class="usuario-header">
            <div class="usuario-avatar">
              <i class="bi bi-person-fill"></i>
            </div>
            <div class="usuario-info">
              <h3 class="usuario-nome">{{ usuario.nome }}</h3>
              <p class="usuario-email">{{ usuario.email }}</p>
            </div>
            <div class="usuario-status">
              <span :class="['status-badge', usuario.ativo ? 'status-active' : 'status-inactive']">
                {{ usuario.ativo ? 'Ativo' : 'Inativo' }}
              </span>
            </div>
          </div>

          <!-- Body do Card -->
          <div class="usuario-body">
            <div class="usuario-meta">
              <div class="meta-item">
                <span class="meta-label">Tipo</span>
                <span :class="['meta-badge', `badge-${usuario.tipo}`]">
                  {{ tipoLabel(usuario.tipo) }}
                </span>
              </div>

              <div class="meta-item">
                <span class="meta-label">Grupos</span>
                <div class="grupos-list">
                  <span
                    v-for="grupo in usuario.grupos"
                    :key="grupo.id"
                    class="grupo-badge"
                    :title="`Papel: ${grupo.usuario_grupo?.papel || 'agente'}`"
                  >
                    {{ grupo.nome }}
                    <small>({{ grupo.usuario_grupo?.papel || 'agente' }})</small>
                  </span>
                  <span v-if="!usuario.grupos || usuario.grupos.length === 0" class="text-muted">
                    Nenhum grupo
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- Footer do Card -->
          <div class="usuario-footer">
            <button
              class="btn-action btn-action-info"
              @click="abrirModalGrupos(usuario)"
              title="Gerenciar Grupos"
            >
              <i class="bi bi-diagram-3"></i>
              Grupos
            </button>
            <button
              class="btn-action btn-action-primary"
              @click="abrirModalEditar(usuario)"
              title="Editar"
            >
              <i class="bi bi-pencil"></i>
              Editar
            </button>
            <button
              class="btn-action btn-action-danger"
              @click="confirmarDeletarUsuario(usuario)"
              title="Deletar Permanentemente"
              :disabled="usuario.id === authStore.currentUser.id"
            >
              <i class="bi bi-trash3"></i>
              Deletar
            </button>
          </div>
        </div>

        <!-- Empty State -->
        <div v-if="usuariosStore.usuarios.length === 0" class="empty-state">
          <i class="bi bi-people"></i>
          <p>Nenhum usuário encontrado</p>
        </div>
      </div>

      <!-- Paginação -->
      <nav v-if="usuariosStore.pagination.totalPages > 1" class="pagination-container">
        <ul class="pagination-modern">
          <li :class="{ disabled: usuariosStore.pagination.page === 1 }">
            <button 
              class="page-btn"
              @click="mudarPagina(usuariosStore.pagination.page - 1)"
              :disabled="usuariosStore.pagination.page === 1"
            >
              <i class="bi bi-chevron-left"></i>
              Anterior
            </button>
          </li>
          <li
            v-for="page in usuariosStore.pagination.totalPages"
            :key="page"
            :class="{ active: page === usuariosStore.pagination.page }"
          >
            <button class="page-number" @click="mudarPagina(page)">
              {{ page }}
            </button>
          </li>
          <li :class="{ disabled: usuariosStore.pagination.page === usuariosStore.pagination.totalPages }">
            <button 
              class="page-btn"
              @click="mudarPagina(usuariosStore.pagination.page + 1)"
              :disabled="usuariosStore.pagination.page === usuariosStore.pagination.totalPages"
            >
              Próxima
              <i class="bi bi-chevron-right"></i>
            </button>
          </li>
        </ul>
      </nav>
    </div>

    <!-- Modal de Formulário -->
    <UsuarioFormModal
      ref="usuarioFormModalRef"
      :modo-edicao="modoEdicao"
      :usuario="usuarioEditando"
      :loading="salvando"
      @submit="onSubmitUsuario"
    />

    <!-- Modal de Gerenciamento de Grupos -->
    <UsuarioGruposModal
      ref="usuarioGruposModalRef"
      :usuario="usuarioGerenciandoGrupos"
      :grupos="gruposStore.grupos"
      :adicionando="adicionandoGrupo"
      :removendo="removendoGrupo"
      @adicionar="adicionarGrupo"
      @remover="removerGrupoUsuario"
    />

    <!-- Modal Confirmar Exclusão -->
    <ConfirmDeleteModal
      :show="showDeleteModal"
      :item-type="deleteItem.type"
      :item-name="deleteItem.name"
      :warning-message="deleteItem.warning"
      @confirm="executarDeletarUsuario"
      @cancel="showDeleteModal = false"
    />
  </layout-principal>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useUsuariosStore } from '@/stores/usuarios';
import { useGruposStore } from '@/stores/grupos';
import { useAuthStore } from '@/stores/auth';
import LayoutPrincipal from '@/components/LayoutPrincipal.vue';
import UsuarioFormModal from '@/components/usuario/UsuarioFormModal.vue';
import UsuarioGruposModal from '@/components/usuario/UsuarioGruposModal.vue';
import ConfirmDeleteModal from '@/components/ConfirmDeleteModal.vue';

const usuariosStore = useUsuariosStore();
const gruposStore = useGruposStore();
const authStore = useAuthStore();

const usuarioFormModalRef = ref(null);
const usuarioGruposModalRef = ref(null);

const filtros = ref({
  search: '',
  tipo: '',
  ativo: '',
  page: 1,
  limit: 10
});

const modoEdicao = ref(false);
const usuarioEditando = ref(null);
const salvando = ref(false);

// Estado para gerenciamento de grupos
const usuarioGerenciandoGrupos = ref(null);
const adicionandoGrupo = ref(false);
const removendoGrupo = ref(null);

onMounted(async () => {
  await usuariosStore.listarUsuarios(filtros.value);
  await gruposStore.listarGrupos({ limit: 100 });
});

const tipoLabel = (tipo) => {
  const labels = {
    admin: 'Admin',
    gerente: 'Gerente',
    agente: 'Agente'
  };
  return labels[tipo] || tipo;
};

const buscar = async () => {
  filtros.value.page = 1;
  await usuariosStore.listarUsuarios(filtros.value);
};

const limparFiltros = async () => {
  filtros.value = {
    search: '',
    tipo: '',
    ativo: '',
    page: 1,
    limit: 10
  };
  await usuariosStore.listarUsuarios(filtros.value);
};

const mudarPagina = async (page) => {
  filtros.value.page = page;
  await usuariosStore.listarUsuarios(filtros.value);
};

const abrirModalNovo = () => {
  modoEdicao.value = false;
  usuarioEditando.value = null;
  usuarioFormModalRef.value?.clear();
  usuarioFormModalRef.value?.show();
};

const abrirModalEditar = (usuario) => {
  modoEdicao.value = true;
  usuarioEditando.value = usuario;
  usuarioFormModalRef.value?.show();
};

const onSubmitUsuario = async (values) => {
  salvando.value = true;

  try {
    const dadosEnvio = {
      nome: values.nome?.trim(),
      email: values.email?.trim().toLowerCase(),
      tipo: values.tipo || 'agente'
    };

    if (modoEdicao.value) {
      if (values.senha && values.senha.trim()) {
        dadosEnvio.password = values.senha;
      }
      if (values.ativo !== undefined && values.ativo !== null) {
        dadosEnvio.ativo = values.ativo === true || values.ativo === 'true';
      }
    } else {
      if (!values.senha || !values.senha.trim()) {
        alert('A senha é obrigatória para criar um usuário');
        salvando.value = false;
        return;
      }
      dadosEnvio.password = values.senha;
      if (values.ativo !== undefined && values.ativo !== null) {
        dadosEnvio.ativo = values.ativo === true || values.ativo === 'true';
      }
    }

    if (modoEdicao.value) {
      await usuariosStore.atualizarUsuario(usuarioEditando.value.id, dadosEnvio);
    } else {
      await usuariosStore.criarUsuario(dadosEnvio);
    }

    usuarioFormModalRef.value?.hide();
    await usuariosStore.listarUsuarios(filtros.value);
  } catch (error) {
    console.error('Erro ao salvar usuário:', error);
    
    let errorMessage = 'Erro ao salvar usuário';
    
    if (error?.response?.data?.error) {
      const errorData = error.response.data.error;
      
      if (errorData.details && Array.isArray(errorData.details) && errorData.details.length > 0) {
        const mensagens = errorData.details.map(detail => {
          const campo = detail.path || detail.field || '';
          return campo ? `${campo}: ${detail.message}` : detail.message;
        });
        errorMessage = mensagens.join('\n');
      } else {
        errorMessage = errorData.message || errorMessage;
      }
    } else if (error?.response?.data?.message) {
      errorMessage = error.response.data.message;
    } else if (usuariosStore.error) {
      errorMessage = usuariosStore.error;
    } else if (error?.message) {
      errorMessage = error.message;
    }
    
    alert(errorMessage);
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

const confirmarDeletarUsuario = (usuario) => {
  deleteItem.value = {
    type: 'Usuário',
    name: `${usuario.nome} (${usuario.email})`,
    warning: 'Se o usuário tiver chamados, comentários, históricos ou outros registros vinculados, a exclusão será bloqueada.',
    id: usuario.id
  };
  showDeleteModal.value = true;
};

const executarDeletarUsuario = async () => {
  try {
    await usuariosStore.deletarUsuario(deleteItem.value.id);
    showDeleteModal.value = false;
    await usuariosStore.listarUsuarios(filtros.value);
    alert('Usuário deletado permanentemente com sucesso!');
  } catch (error) {
    console.error('Erro ao deletar usuário:', error);
    
    if (error.response?.data?.code === 'USER_HAS_DEPENDENCIES') {
      const deps = error.response.data.dependencias;
      let mensagem = 'Não é possível deletar o usuário. Ele possui:\n\n';
      
      if (deps.chamadosCriados > 0) mensagem += `• ${deps.chamadosCriados} chamado(s) criado(s)\n`;
      if (deps.chamadosAtribuidos > 0) mensagem += `• ${deps.chamadosAtribuidos} chamado(s) atribuído(s)\n`;
      if (deps.comentarios > 0) mensagem += `• ${deps.comentarios} comentário(s)\n`;
      if (deps.historicos > 0) mensagem += `• ${deps.historicos} histórico(s)\n`;
      if (deps.timeTracking > 0) mensagem += `• ${deps.timeTracking} registro(s) de tempo\n`;
      if (deps.auditorias > 0) mensagem += `• ${deps.auditorias} registro(s) de auditoria\n`;
      
      alert(mensagem);
    } else {
      const errorMessage = error?.response?.data?.error?.message 
        || error?.response?.data?.message 
        || error.message 
        || 'Erro desconhecido';
      alert('Erro ao deletar usuário: ' + errorMessage);
    }
  }
};

// Funções de gerenciamento de grupos
const abrirModalGrupos = async (usuario) => {
  if (!usuario || !usuario.id) {
    alert('Erro: Usuário inválido');
    return;
  }
  
  try {
    await gruposStore.listarGrupos({ limit: 1000, ativo: true });
  } catch (err) {
    console.error('Erro ao carregar grupos:', err);
  }
  
  let usuarioAtualizado = null;
  try {
    usuarioAtualizado = await usuariosStore.buscarUsuario(usuario.id);
  } catch (err) {
    console.error('Erro ao buscar usuário:', err);
  }
  
  if (usuarioAtualizado && usuarioAtualizado.id === usuario.id) {
    usuarioGerenciandoGrupos.value = usuarioAtualizado;
  } else {
    usuarioGerenciandoGrupos.value = { ...usuario };
  }
  
  usuarioGruposModalRef.value?.show();
};

const adicionarGrupo = async (dados) => {
  if (!usuarioGerenciandoGrupos.value || !usuarioGerenciandoGrupos.value.id) {
    alert('Erro: Usuário não identificado');
    return;
  }
  
  if (!dados || !dados.grupo_id) {
    alert('Erro: Grupo não selecionado');
    return;
  }
  
  adicionandoGrupo.value = true;
  
  try {
    await usuariosStore.associarGrupo(
      usuarioGerenciandoGrupos.value.id, 
      dados.grupo_id, 
      dados.papel || 'agente'
    );
    
    const usuarioAtualizado = await usuariosStore.buscarUsuario(usuarioGerenciandoGrupos.value.id);
    usuarioGerenciandoGrupos.value = usuarioAtualizado;
    
    if (usuarioGruposModalRef.value && usuarioGruposModalRef.value.clearForm) {
      usuarioGruposModalRef.value.clearForm();
    }
    
    await usuariosStore.listarUsuarios(filtros.value);
  } catch (error) {
    console.error('Erro ao adicionar grupo:', error);
    
    const errorMessage = error?.response?.data?.error?.message || 
                        error?.response?.data?.message || 
                        usuariosStore.error ||
                        error?.message || 
                        'Erro ao adicionar grupo';
    alert(errorMessage);
  } finally {
    adicionandoGrupo.value = false;
  }
};

const removerGrupoUsuario = async (grupoId) => {
  if (!confirm('Deseja realmente remover este usuário do grupo?')) return;
  
  removendoGrupo.value = grupoId;
  
  try {
    await usuariosStore.removerGrupo(usuarioGerenciandoGrupos.value.id, grupoId);
    
    const usuarioAtualizado = await usuariosStore.buscarUsuario(usuarioGerenciandoGrupos.value.id);
    usuarioGerenciandoGrupos.value = usuarioAtualizado;
    
    await usuariosStore.listarUsuarios(filtros.value);
  } catch (error) {
    console.error('Erro ao remover grupo:', error);
    const errorMessage = error?.response?.data?.error?.message || 
                        error?.response?.data?.message ||
                        usuariosStore.error ||
                        error?.message || 
                        'Erro ao remover grupo';
    alert(errorMessage);
  } finally {
    removendoGrupo.value = null;
  }
};
</script>

<style scoped>
.usuarios-container {
  max-width: 1200px;
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

/* Usuarios List */
.usuarios-list {
  display: grid;
  gap: var(--space-4);
}

/* Usuario Card */
.usuario-card {
  background: var(--color-bg-primary);
  border: 1px solid var(--color-border-medium);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  transition: all var(--transition-base);
  overflow: hidden;
}

.usuario-card:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}

.usuario-header {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  padding: var(--space-5);
  border-bottom: 1px solid var(--color-border-light);
}

.usuario-avatar {
  width: 56px;
  height: 56px;
  border-radius: var(--radius-full);
  background: var(--color-primary-light);
  color: var(--color-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.75rem;
  flex-shrink: 0;
}

.usuario-info {
  flex: 1;
  min-width: 0;
}

.usuario-nome {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  margin: 0 0 var(--space-1) 0;
}

.usuario-email {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  margin: 0;
}

.usuario-status {
  flex-shrink: 0;
}

.status-badge {
  display: inline-flex;
  padding: var(--space-1) var(--space-3);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  border-radius: var(--radius-full);
}

.status-active {
  background: var(--color-success-50);
  color: var(--color-success-700);
}

.status-inactive {
  background: var(--color-danger-50);
  color: var(--color-danger-700);
}

/* Usuario Body */
.usuario-body {
  padding: var(--space-5);
}

.usuario-meta {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.meta-item {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.meta-label {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-tertiary);
  text-transform: uppercase;
  letter-spacing: var(--letter-spacing-wider);
}

.meta-badge {
  display: inline-flex;
  align-items: center;
  padding: var(--space-1) var(--space-3);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  border-radius: var(--radius-base);
  width: fit-content;
}

.badge-admin {
  background: var(--color-danger-100);
  color: var(--color-danger-700);
}

.badge-gerente {
  background: var(--color-warning-100);
  color: var(--color-warning-700);
}

.badge-agente {
  background: var(--color-info-100);
  color: var(--color-info-700);
}

.grupos-list {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}

.grupo-badge {
  display: inline-flex;
  align-items: center;
  padding: var(--space-1) var(--space-3);
  font-size: var(--font-size-xs);
  background: var(--color-gray-100);
  color: var(--color-gray-700);
  border-radius: var(--radius-base);
}

.grupo-badge small {
  margin-left: var(--space-1);
  opacity: 0.7;
}

/* Usuario Footer */
.usuario-footer {
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

.btn-action:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: var(--shadow-sm);
}

.btn-action:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-action-info {
  color: var(--color-info-600);
  border-color: var(--color-info-300);
}

.btn-action-info:hover:not(:disabled) {
  background: var(--color-info-50);
  border-color: var(--color-info-500);
}

.btn-action-primary {
  color: var(--color-primary);
  border-color: var(--color-brand-300);
}

.btn-action-primary:hover:not(:disabled) {
  background: var(--color-primary-light);
  border-color: var(--color-primary);
}

.btn-action-danger {
  color: var(--color-danger-600);
  border-color: var(--color-danger-300);
}

.btn-action-danger:hover:not(:disabled) {
  background: var(--color-danger-50);
  border-color: var(--color-danger-500);
}

/* Empty State */
.empty-state {
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
  .filters-row {
    flex-direction: column;
  }
  
  .usuario-footer {
    flex-wrap: wrap;
  }
  
  .btn-action {
    flex: 1 1 calc(50% - var(--space-1));
  }
}
</style>
