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
              <li class="breadcrumb-item active" aria-current="page">
                <i class="bi bi-ticket-detailed me-1"></i>
                {{ chamado ? `#${chamado.id} - ${chamado.titulo}` : 'Carregando...' }}
              </li>
            </ol>
          </nav>
        </div>
      </div>

      <!-- Loading -->
      <LoadingSpinner v-if="loading" text="Carregando chamado..." />

      <!-- Erro -->
      <ErrorMessage 
        v-else-if="error" 
        :message="error"
        @retry="carregarChamado"
      />

      <!-- Conteúdo do Chamado -->
      <div v-else-if="chamado" class="row">
        <div class="col-12">
          <!-- Cabeçalho com Título e Ações -->
          <div class="card mb-3">
            <div class="card-body">
              <div class="d-flex justify-content-between align-items-start">
                <div>
                  <h2 class="mb-2">
                    <i class="bi bi-ticket-detailed me-2"></i>
                    #{{ chamado.id }} - {{ chamado.titulo }}
                  </h2>
                  <div class="d-flex flex-wrap gap-2">
                    <span :class="getBadgeStatus(chamado.status)">
                      {{ formatarStatus(chamado.status) }}
                    </span>
                    <span 
                      v-if="chamado.status_fechamento === 'fechado'" 
                      class="badge bg-success"
                    >
                      <i class="bi bi-check-circle-fill me-1"></i>
                      FECHADO
                    </span>
                    <span :class="getBadgePrioridade(chamado.prioridade)">
                      {{ formatarPrioridade(chamado.prioridade) }}
                    </span>
                    <span :class="getBadgeTipo(chamado.tipo)">
                      {{ formatarTipo(chamado.tipo) }}
                    </span>
                    <span class="badge bg-secondary">
                      <i class="bi bi-diagram-3 me-1"></i>
                      {{ chamado.grupo?.nome }}
                    </span>
                    <span v-if="chamado.grupoExecutor" class="badge bg-success">
                      <i class="bi bi-gear me-1"></i>
                      Executor: {{ chamado.grupoExecutor.nome }}
                    </span>
                  </div>
                </div>
                <div class="d-flex gap-2">
                  <button 
                    v-if="podeEditar"
                    class="btn btn-primary"
                    @click="irParaEdicao"
                  >
                    <i class="bi bi-pencil me-1"></i>
                    Editar
                  </button>
                  <button 
                    class="btn btn-outline-secondary"
                    @click="voltarParaLista"
                  >
                    <i class="bi bi-arrow-left me-1"></i>
                    Voltar
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Conteúdo Principal -->
          <div class="row">
            <div class="col-lg-8">
              <!-- Descrição -->
              <div class="card mb-3">
                <div class="card-header">
                  <h5 class="mb-0">
                    <i class="bi bi-file-text me-2"></i>
                    Descrição
                  </h5>
                </div>
                <div class="card-body">
                  <p class="mb-0">{{ chamado.descricao }}</p>
                  
                  <!-- Anexos do Chamado -->
                  <div v-if="chamado.campos_customizados?.anexos?.length" class="mt-3">
                    <h6 class="text-muted mb-2">
                      <i class="bi bi-paperclip me-1"></i>
                      Anexos ({{ chamado.campos_customizados.anexos.length }})
                    </h6>
                    <div class="d-flex flex-wrap gap-2">
                      <a 
                        v-for="(anexo, index) in chamado.campos_customizados.anexos" 
                        :key="index"
                        :href="anexo.url" 
                        target="_blank"
                        class="btn btn-outline-secondary btn-sm"
                      >
                        <i :class="getFileIconClass(anexo.tipo)" class="me-1"></i>
                        {{ anexo.nome }}
                        <small class="text-muted ms-1">({{ formatFileSize(anexo.tamanho) }})</small>
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Relacionamentos (Parent/Child) -->
              <ChamadoRelacionamentos
                :chamado="chamado"
                :loading="loading"
                @atualizar="carregarChamado"
                class="mb-3"
              />

              <!-- Informações de Fechamento -->
              <ChamadoFechamentoInfo 
                v-if="chamado.status_fechamento === 'fechado' && fechamento"
                :fechamento="fechamento"
                class="mb-3"
              />

              <!-- Botão de Reabrir (apenas Admin) -->
              <div v-if="chamado.status_fechamento === 'fechado' && podeAdministrar" class="card mb-3 border-warning">
                <div class="card-body text-center">
                  <h6 class="text-warning mb-3">
                    <i class="bi bi-arrow-clockwise me-1"></i>
                    Reabrir Chamado
                  </h6>
                  <p class="text-muted small mb-3">
                    Esta ação irá remover o fechamento e reativar o chamado
                  </p>
                  <button 
                    type="button" 
                    class="btn btn-warning w-100"
                    @click="confirmarReabrirChamado"
                    :disabled="reabrindo"
                  >
                    <span v-if="reabrindo" class="spinner-border spinner-border-sm me-1"></span>
                    <i v-else class="bi bi-arrow-clockwise me-1"></i>
                    {{ reabrindo ? 'Reabrindo...' : 'Reabrir Chamado' }}
                  </button>
                </div>
              </div>

              <!-- Ações Administrativas (Admin/Gerente) -->
              <div v-if="podeAdministrar" class="card mb-3">
                <div class="card-header">
                  <h5 class="mb-0">
                    <i class="bi bi-gear me-2"></i>
                    Ações Administrativas
                  </h5>
                </div>
                <div class="card-body">
                  <ChamadoAcoesAdministrativas 
                    :chamado="chamado"
                    :usuarios-admin="usuariosAdmin"
                    :atualizando="atualizando"
                    @atualizar="atualizarChamado"
                  />
                </div>
              </div>

              <!-- Comentários -->
              <div class="card">
                <div class="card-header">
                  <h5 class="mb-0">
                    <i class="bi bi-chat-dots me-2"></i>
                    Comentários
                  </h5>
                </div>
                <div class="card-body">
                  <ChamadoComentarios
                    ref="comentariosRef"
                    :comentarios="chamado.comentarios || []"
                    :loading="loadingComentario"
                    :pode-comentar="podeComentar"
                    :pode-marcar-interno="podeMarcarInterno"
                    @adicionar="adicionarComentario"
                  />
                </div>
              </div>
            </div>

            <!-- Painel Lateral com Informações -->
            <div class="col-lg-4">
              <ChamadoInformacoesLateral :chamado="chamado" />
              
              <!-- Botão de Fechar Chamado -->
              <div v-if="podeFechar" class="card mt-3 border-success">
                <div class="card-body text-center">
                  <h6 class="text-success mb-3">
                    <i class="bi bi-check-circle me-1"></i>
                    Fechar Chamado
                  </h6>
                  <button 
                    type="button" 
                    class="btn btn-success w-100"
                    @click="irParaFechamento"
                  >
                    <i class="bi bi-check-circle-fill me-1"></i>
                    Fechar Chamado
                  </button>
                  <small class="text-muted d-block mt-2">
                    Registrar solução e encerrar
                  </small>
                </div>
              </div>

              <!-- Botão de Deletar para Admins -->
              <div v-if="podeAdministrar" class="card mt-3 border-danger">
                <div class="card-body text-center">
                  <h6 class="text-danger mb-3">
                    <i class="bi bi-exclamation-triangle me-1"></i>
                    Zona de Perigo
                  </h6>
                  <button 
                    type="button" 
                    class="btn btn-danger w-100"
                    @click="confirmarDeletarChamado"
                  >
                    <i class="bi bi-trash3-fill me-1"></i>
                    Deletar Permanentemente
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Alerta de Confirmação de Exclusão -->
      <transition name="fade">
        <div v-if="showDeleteAlert" class="delete-alert-overlay" @click="cancelarExclusao">
          <div class="container">
            <div class="row justify-content-center">
              <div class="col-lg-6 col-md-8">
                <div class="alert alert-danger shadow-lg border-0" role="alert" @click.stop>
                  <div class="d-flex align-items-center mb-3">
                    <i class="bi bi-exclamation-triangle-fill fs-1 me-3"></i>
                    <div>
                      <h4 class="alert-heading mb-1">Confirmar Exclusão Permanente</h4>
                      <p class="mb-0 small">Esta ação é IRREVERSÍVEL!</p>
                    </div>
                  </div>
                  
                  <hr>
                  
                  <div class="mb-3">
                    <p class="mb-2"><strong>Você está prestes a deletar permanentemente:</strong></p>
                    <div class="bg-white p-3 rounded border border-danger">
                      <p class="mb-1 text-danger fw-bold">{{ deleteItem.name }}</p>
                      <p class="mb-0 small text-muted">{{ deleteItem.warning }}</p>
                    </div>
                  </div>
                  
                  <div class="mb-3">
                    <label for="delete-confirmation-input" class="form-label fw-bold">
                      Para confirmar, digite "<span class="text-danger">DELETAR</span>" abaixo:
                    </label>
                    <input
                      id="delete-confirmation-input"
                      ref="deleteConfirmationInput"
                      v-model="deleteConfirmationText"
                      type="text"
                      class="form-control form-control-lg"
                      :class="{ 'is-invalid': deleteAttempted && !isDeleteConfirmed }"
                      placeholder="Digite DELETAR"
                      autocomplete="off"
                      @keyup.enter="executarDeletarChamado"
                    />
                    <div v-if="deleteAttempted && !isDeleteConfirmed" class="invalid-feedback">
                      Você deve digitar "DELETAR" para confirmar
                    </div>
                  </div>
                  
                  <div class="d-flex gap-2 justify-content-end">
                    <button
                      type="button"
                      class="btn btn-secondary"
                      @click="cancelarExclusao"
                    >
                      <i class="bi bi-x-lg me-1"></i>
                      Cancelar
                    </button>
                    <button
                      type="button"
                      class="btn btn-danger"
                      :disabled="!isDeleteConfirmed"
                      @click="executarDeletarChamado"
                    >
                      <i class="bi bi-trash3-fill me-1"></i>
                      Deletar Permanentemente
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </transition>
    </div>
  </layout-principal>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useChamadosStore } from '@/stores/chamados';
import { useUsuariosStore } from '@/stores/usuarios';
import { useAuthStore } from '@/stores/auth';
import { useChamados } from '@/composables/useChamados';
import LayoutPrincipal from '@/components/LayoutPrincipal.vue';
import LoadingSpinner from '@/components/shared/LoadingSpinner.vue';
import ErrorMessage from '@/components/shared/ErrorMessage.vue';
import ChamadoAcoesAdministrativas from '@/components/chamado/ChamadoAcoesAdministrativas.vue';
import ChamadoComentarios from '@/components/chamado/ChamadoComentarios.vue';
import ChamadoInformacoesLateral from '@/components/chamado/ChamadoInformacoesLateral.vue';
import ChamadoFechamentoInfo from '@/components/chamado/ChamadoFechamentoInfo.vue';
import ChamadoRelacionamentos from '@/components/chamado/ChamadoRelacionamentos.vue';

const route = useRoute();
const router = useRouter();
const chamadosStore = useChamadosStore();
const usuariosStore = useUsuariosStore();
const authStore = useAuthStore();

const { 
  formatarData, 
  formatarStatus, 
  formatarPrioridade, 
  formatarTipo, 
  getBadgeStatus, 
  getBadgePrioridade, 
  getBadgeTipo 
} = useChamados();

// Estados
const loading = ref(false);
const error = ref(null);
const chamado = ref(null);
const atualizando = ref(false);
const loadingComentario = ref(false);
const comentariosRef = ref(null);
const fechamento = ref(null);
const reabrindo = ref(false);

// Computed
const usuariosAdmin = computed(() => usuariosStore.usuarios.filter(u => u.tipo === 'admin'));
const podeAdministrar = computed(() => authStore.isAdmin);
const podeMarcarInterno = computed(() => authStore.isGerente || authStore.isAdmin);
const podeComentar = computed(() => {
  // ✅ Não permite comentários em chamados fechados
  return chamado.value?.status_fechamento !== 'fechado';
});
const podeEditar = computed(() => {
  if (!chamado.value) return false;
  // Admin pode editar tudo
  if (authStore.isAdmin) return true;
  // Gerente pode editar chamados do seu grupo
  if (authStore.isGerente) return true;
  // Criador ou responsável pode editar seu próprio chamado
  // Verifica tanto usuario_id quanto criador.id para compatibilidade
  const criadorId = chamado.value.usuario_id || chamado.value.criador?.id || chamado.value.criado_por;
  const atribuidoId = chamado.value.atribuido_a;
  return criadorId === authStore.user?.id || atribuidoId === authStore.user?.id;
});

const podeFechar = computed(() => {
  if (!chamado.value) return false;
  // Não pode fechar se já está fechado
  if (chamado.value.status_fechamento === 'fechado') return false;
  // Não pode fechar se está cancelado
  if (chamado.value.status === 'cancelado') return false;
  // Admin ou gerente podem fechar
  return authStore.isAdmin || authStore.isGerente;
});

// Funções
const carregarChamado = async () => {
  loading.value = true;
  error.value = null;
  
  try {
    const id = route.params.id;
    const chamadoCompleto = await chamadosStore.buscarChamado(id, {
      incluirComentarios: true,
      incluirHistorico: true,
      incluirRelacionamentos: true // Incluir relacionamentos parent/child
    });
    chamado.value = chamadoCompleto;

    // Carregar fechamento se existir
    if (chamado.value.status_fechamento === 'fechado') {
      await carregarFechamento();
    }
  } catch (err) {
    console.error('Erro ao carregar chamado:', err);
    error.value = err?.response?.data?.error?.message 
      || err?.response?.data?.message 
      || err.message 
      || 'Erro ao carregar chamado';
  } finally {
    loading.value = false;
  }
};

const carregarFechamento = async () => {
  try {
    const chamadoFechamentoService = (await import('@/services/chamadoFechamentoService')).default;
    fechamento.value = await chamadoFechamentoService.buscarFechamento(chamado.value.id);
  } catch (err) {
    console.error('Erro ao carregar fechamento:', err);
  }
};

const irParaFechamento = () => {
  router.push({ name: 'chamado-close', params: { id: chamado.value.id } });
};

const confirmarReabrirChamado = () => {
  if (confirm('Deseja realmente reabrir este chamado? O registro de fechamento será removido.')) {
    reabrirChamadoFechado();
  }
};

const reabrirChamadoFechado = async () => {
  if (!chamado.value) return;
  
  reabrindo.value = true;
  try {
    const chamadoFechamentoService = (await import('@/services/chamadoFechamentoService')).default;
    const resultado = await chamadoFechamentoService.reabrirChamado(chamado.value.id);
    
    alert(resultado.message || 'Chamado reaberto com sucesso!');
    
    // Recarregar chamado
    await carregarChamado();
  } catch (err) {
    console.error('Erro ao reabrir chamado:', err);
    const errorMessage = err?.response?.data?.error?.message 
      || err?.response?.data?.message 
      || err.message 
      || 'Erro ao reabrir chamado';
    alert(errorMessage);
  } finally {
    reabrindo.value = false;
  }
};

const atualizarChamado = async (dados) => {
  if (!chamado.value) return;
  
  atualizando.value = true;
  try {
    console.log('🔄 Atualizando chamado com dados:', dados);
    console.log('📦 Estado anterior - grupoExecutor:', chamado.value.grupoExecutor);
    
    const chamadoAtualizado = await chamadosStore.atualizarChamado(
      chamado.value.id,
      dados
    );
    
    console.log('✅ Chamado atualizado recebido:', chamadoAtualizado);
    console.log('📦 Novo grupoExecutor:', chamadoAtualizado?.grupoExecutor);
    
    // Atualizar chamado local com os dados retornados do backend
    // O backend já retorna o chamado completo com todas as relações
    chamado.value = {
      ...chamado.value,
      ...chamadoAtualizado,
      // Preservar dados que não vêm na atualização
      comentarios: chamado.value.comentarios,
      historico: chamado.value.historico
    };
    
    console.log('📦 Estado final - grupoExecutor:', chamado.value.grupoExecutor);
  } catch (err) {
    console.error('Erro ao atualizar chamado:', err);
    alert('Erro ao atualizar chamado: ' + (err.message || 'Erro desconhecido'));
  } finally {
    atualizando.value = false;
  }
};

const adicionarComentario = async (comentario) => {
  if (!chamado.value || !comentario.texto.trim()) return;
  
  loadingComentario.value = true;
  try {
    const dadosComentario = {
      texto: comentario.texto,
      interno: comentario.interno || false,
      anexos: comentario.arquivos || []
    };

    const novoComentario = await chamadosStore.adicionarComentarioComArquivos(
      chamado.value.id,
      dadosComentario
    );
    
    // Adicionar comentário à lista local
    if (!chamado.value.comentarios) {
      chamado.value.comentarios = [];
    }
    chamado.value.comentarios.push(novoComentario);
    
    // Limpar formulário de comentário
    if (comentariosRef.value) {
      comentariosRef.value.limpar?.();
    }
    
    // Recarregar chamado completo
    await carregarChamado();
  } catch (err) {
    console.error('Erro ao adicionar comentário:', err);
    alert('Erro ao adicionar comentário: ' + (err.message || 'Erro desconhecido'));
  } finally {
    loadingComentario.value = false;
  }
};

const voltarParaLista = () => {
  router.push({ name: 'chamados' });
};

const irParaEdicao = () => {
  router.push({ name: 'chamado-edit', params: { id: chamado.value.id } });
};

// Funções auxiliares para anexos
const getFileIconClass = (mimeType) => {
  if (!mimeType) return 'bi bi-file-earmark';
  if (mimeType.startsWith('image/')) return 'bi bi-file-image text-primary';
  if (mimeType.includes('pdf')) return 'bi bi-file-pdf text-danger';
  if (mimeType.includes('word')) return 'bi bi-file-word text-primary';
  if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return 'bi bi-file-excel text-success';
  if (mimeType.includes('zip') || mimeType.includes('rar')) return 'bi bi-file-zip text-warning';
  return 'bi bi-file-earmark';
};

const formatFileSize = (bytes) => {
  if (!bytes || bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

// Estados do alerta de exclusão
const showDeleteAlert = ref(false);
const deleteItem = ref({
  type: '',
  name: '',
  warning: '',
  id: null
});
const deleteConfirmationText = ref('');
const deleteAttempted = ref(false);
const deleteConfirmationInput = ref(null);

const isDeleteConfirmed = computed(() => {
  return deleteConfirmationText.value === 'DELETAR';
});

const confirmarDeletarChamado = () => {
  deleteItem.value = {
    type: 'Chamado',
    name: `#${chamado.value.id} - ${chamado.value.titulo}`,
    warning: 'Todos os comentários, históricos, anexos e registros de tempo serão perdidos permanentemente.',
    id: chamado.value.id
  };
  deleteConfirmationText.value = '';
  deleteAttempted.value = false;
  showDeleteAlert.value = true;
  
  setTimeout(() => {
    if (deleteConfirmationInput.value) {
      deleteConfirmationInput.value.focus();
    }
  }, 100);
};

const cancelarExclusao = () => {
  showDeleteAlert.value = false;
  deleteConfirmationText.value = '';
  deleteAttempted.value = false;
  deleteItem.value = {
    type: '',
    name: '',
    warning: '',
    id: null
  };
};

const executarDeletarChamado = async () => {
  deleteAttempted.value = true;
  
  if (!isDeleteConfirmed.value) {
    return;
  }
  
  try {
    await chamadosStore.deletarChamado(deleteItem.value.id);
    
    showDeleteAlert.value = false;
    deleteConfirmationText.value = '';
    deleteAttempted.value = false;
    
    // Redirecionar para a lista de chamados
    router.push({ name: 'chamados' });
    
    alert('Chamado deletado permanentemente com sucesso!');
  } catch (err) {
    console.error('Erro ao deletar chamado:', err);
    const errorMessage = err?.response?.data?.error?.message 
      || err?.response?.data?.message 
      || err.message 
      || 'Erro desconhecido';
    alert('Erro ao deletar chamado: ' + errorMessage);
  }
};

// Handler para tecla ESC
const handleDeleteAlertEscape = (event) => {
  if (event.key === 'Escape' && showDeleteAlert.value) {
    cancelarExclusao();
  }
};

// Lifecycle
onMounted(async () => {
  document.addEventListener('keydown', handleDeleteAlertEscape);
  
  // Carregar usuários apenas se for admin (gerentes não têm permissão)
  if (authStore.isAdmin) {
    try {
      await usuariosStore.listarUsuarios();
    } catch (error) {
      console.error('Erro ao carregar usuários (não crítico):', error);
      // Não impede o carregamento do chamado se falhar
    }
  }
  
  await carregarChamado();
});

onBeforeUnmount(() => {
  document.removeEventListener('keydown', handleDeleteAlertEscape);
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

.badge {
  font-size: 0.85rem;
  padding: 0.4em 0.8em;
}

/* Overlay do alerta de exclusão */
.delete-alert-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  z-index: 1090;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  overflow-y: auto;
}

.delete-alert-overlay .alert {
  margin: auto;
  max-width: 100%;
  animation: slideDown 0.3s ease-out;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-50px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Transição fade */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.fade-enter-active .alert {
  animation: slideDown 0.3s ease-out;
}

.fade-leave-active .alert {
  animation: slideUp 0.3s ease-in;
}

@keyframes slideUp {
  from {
    opacity: 1;
    transform: translateY(0);
  }
  to {
    opacity: 0;
    transform: translateY(-50px);
  }
}
</style>

