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
                <router-link :to="`/chamados/view/${route.params.id}`">
                  <i class="bi bi-ticket-detailed me-1"></i>
                  {{ chamado ? `#${chamado.id}` : 'Chamado' }}
                </router-link>
              </li>
              <li class="breadcrumb-item active" aria-current="page">
                <i class="bi bi-pencil me-1"></i>
                Editar
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

      <!-- Formulário de Edição -->
      <div v-else-if="chamado" class="row">
        <div class="col-12">
          <!-- Card do Formulário -->
          <div class="card">
            <div class="card-header">
              <h4 class="mb-0">
                <i class="bi bi-pencil me-2"></i>
                Editar Chamado #{{ chamado.id }}
              </h4>
            </div>
            <div class="card-body">
              <!-- Alerta de Chamado Fechado -->
              <div v-if="chamado.status_fechamento === 'fechado'" class="alert alert-warning mb-4">
                <i class="bi bi-exclamation-triangle me-2"></i>
                <strong>Atenção:</strong> Este chamado está fechado e não pode ser editado. Para fazer alterações, é necessário reabrir o chamado primeiro.
              </div>

              <!-- Anexos Existentes -->
              <div v-if="chamado.campos_customizados?.anexos?.length" class="mb-4">
                <h6 class="text-muted mb-3">
                  <i class="bi bi-paperclip me-1"></i>
                  Anexos Existentes ({{ chamado.campos_customizados.anexos.length }})
                </h6>
                <div class="d-flex flex-wrap gap-2 mb-3 p-3 info-box rounded">
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
                <div class="alert alert-info mb-0">
                  <i class="bi bi-info-circle me-2"></i>
                  <small>Os anexos existentes serão mantidos. Você pode adicionar novos anexos abaixo.</small>
                </div>
              </div>

              <ChamadoFormularioValidado
                ref="formularioRef"
                :grupos="grupos"
                :grupos-executores="gruposExecutores"
                :usuarios="usuarios"
                :initial-values="formularioValues"
                :modo-edicao="true"
                @submit="salvarChamado"
              />

              <!-- Botões de Ação -->
              <div class="d-flex justify-content-between mt-4">
                <button 
                  type="button" 
                  class="btn btn-outline-secondary"
                  @click="cancelarEdicao"
                  :disabled="salvando"
                >
                  <i class="bi bi-x-lg me-1"></i>
                  Cancelar
                </button>
                <button 
                  type="button" 
                  class="btn btn-primary"
                  @click="submitForm"
                  :disabled="salvando"
                >
                  <span v-if="salvando" class="spinner-border spinner-border-sm me-2"></span>
                  <i v-else class="bi bi-check-circle me-2"></i>
                  {{ salvando ? 'Salvando...' : 'Salvar Alterações' }}
                </button>
              </div>
            </div>
          </div>

          <!-- Card de Informações Adicionais -->
          <div class="card mt-3">
            <div class="card-header">
              <h5 class="mb-0">
                <i class="bi bi-info-circle me-2"></i>
                Informações do Chamado
              </h5>
            </div>
            <div class="card-body">
              <div class="row">
                <div class="col-md-6">
                  <p class="mb-2">
                    <strong>Status:</strong>
                    <span :class="getBadgeStatus(chamado.status)" class="ms-2">
                      {{ formatarStatus(chamado.status) }}
                    </span>
                  </p>
                  <p class="mb-2">
                    <strong>Criado por:</strong> 
                    {{ chamado.criador?.nome || 'N/A' }}
                  </p>
                  <p class="mb-2">
                    <strong>Criado em:</strong> 
                    {{ formatarData(chamado.created_at) }}
                  </p>
                </div>
                <div class="col-md-6">
                  <p class="mb-2">
                    <strong>Atribuído a:</strong> 
                    {{ chamado.atribuido_a_usuario?.nome || 'Não atribuído' }}
                  </p>
                  <p class="mb-2">
                    <strong>Última atualização:</strong> 
                    {{ formatarData(chamado.updated_at) }}
                  </p>
                </div>
              </div>
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
import { useGruposStore } from '@/stores/grupos';
import { useUsuariosStore } from '@/stores/usuarios';
import { useAuthStore } from '@/stores/auth';
import { useChamados } from '@/composables/useChamados';
import LayoutPrincipal from '@/components/LayoutPrincipal.vue';
import LoadingSpinner from '@/components/shared/LoadingSpinner.vue';
import ErrorMessage from '@/components/shared/ErrorMessage.vue';
import ChamadoFormularioValidado from '@/components/chamado/ChamadoFormularioValidado.vue';

const route = useRoute();
const router = useRouter();
const chamadosStore = useChamadosStore();
const gruposStore = useGruposStore();
const usuariosStore = useUsuariosStore();
const authStore = useAuthStore();

const { 
  formatarData, 
  formatarStatus, 
  getBadgeStatus 
} = useChamados();

// Estados
const loading = ref(false);
const error = ref(null);
const chamado = ref(null);
const salvando = ref(false);
const formularioRef = ref(null);
const gruposExecutores = ref([]);
const usuarios = ref([]);

// Computed
const grupos = computed(() => gruposStore.grupos.filter(g => g.ativo !== false));

// Função auxiliar para formatar data para datetime-local
const formatarParaDateTimeLocal = (date) => {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  
  const ano = d.getFullYear();
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  const dia = String(d.getDate()).padStart(2, '0');
  const hora = String(d.getHours()).padStart(2, '0');
  const minuto = String(d.getMinutes()).padStart(2, '0');
  
  return `${ano}-${mes}-${dia}T${hora}:${minuto}`;
};

const formularioValues = computed(() => {
  if (!chamado.value) return null;
  
  return {
    titulo: chamado.value.titulo || '',
    descricao: chamado.value.descricao || '',
    tipo: chamado.value.tipo || 'incidente',
    prioridade: chamado.value.prioridade || 'media',
    grupo_id: chamado.value.grupo_id || '',
    grupo_executor_id: chamado.value.grupo_executor_id || '',
    solicitante_id: chamado.value.usuario_id || '',
    data_hora_inicio: chamado.value.data_hora_inicio ? formatarParaDateTimeLocal(chamado.value.data_hora_inicio) : ''
  };
});

const podeEditar = computed(() => {
  if (!chamado.value) return false;
  
  // ✅ Não permite editar chamados fechados
  if (chamado.value.status_fechamento === 'fechado') return false;
  
  // Admin pode editar tudo
  if (authStore.isAdmin) return true;
  // Gerente pode editar chamados do seu grupo
  if (authStore.isGerente) return true;
  // Criador pode editar seu próprio chamado se ainda estiver aberto
  // Verifica tanto usuario_id quanto criador.id para compatibilidade
  const criadorId = chamado.value.usuario_id || chamado.value.criador?.id || chamado.value.criado_por;
  const atribuidoId = chamado.value.atribuido_a;
  const podeEditar = (criadorId === authStore.user?.id || atribuidoId === authStore.user?.id) && 
                     ['novo', 'em_andamento', 'aguardando'].includes(chamado.value.status);
  return podeEditar;
});

// Funções
const carregarChamado = async () => {
  loading.value = true;
  error.value = null;
  
  try {
    const id = route.params.id;
    const chamadoCompleto = await chamadosStore.buscarChamado(id);
    chamado.value = chamadoCompleto;
    
    // Verificar se pode editar
    if (!podeEditar.value) {
      error.value = 'Você não tem permissão para editar este chamado';
      return;
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

const submitForm = () => {
  console.log('🔘 Botão "Salvar Alterações" clicado');
  if (formularioRef.value) {
    console.log('📝 Referência do formulário encontrada, chamando submitForm...');
    if (formularioRef.value.submitForm) {
      formularioRef.value.submitForm();
    } else {
      console.error('❌ Método submitForm não encontrado no formulário');
    }
  } else {
    console.error('❌ Referência do formulário não encontrada');
  }
};

const salvarChamado = async (formValues) => {
  if (!chamado.value) return;
  
  salvando.value = true;
  try {
    console.log('📝 Salvando chamado com dados:', formValues);
    
    // Preparar dados para atualização
    const dadosAtualizacao = {
      titulo: formValues.titulo,
      descricao: formValues.descricao,
      tipo: formValues.tipo,
      prioridade: formValues.prioridade,
      grupo_id: parseInt(formValues.grupo_id)
    };

    // Adicionar grupo executor se fornecido
    if (formValues.grupo_executor_id) {
      const grupoExecutorId = parseInt(formValues.grupo_executor_id);
      if (!isNaN(grupoExecutorId) && grupoExecutorId > 0) {
        dadosAtualizacao.grupo_executor_id = grupoExecutorId;
      }
    }

    // Adicionar solicitante_id se fornecido (apenas para admins)
    if (formValues.solicitante_id) {
      const solicitanteId = parseInt(formValues.solicitante_id);
      if (!isNaN(solicitanteId) && solicitanteId > 0) {
        dadosAtualizacao.solicitante_id = solicitanteId;
      }
    }

    // Adicionar data_hora_inicio se fornecido (apenas para admins)
    if (authStore.isAdmin && formValues.data_hora_inicio) {
      dadosAtualizacao.data_hora_inicio = formValues.data_hora_inicio;
    }
    
    // Adicionar arquivos se houver novos
    if (formValues.arquivos && formValues.arquivos.length > 0) {
      dadosAtualizacao.arquivos = formValues.arquivos;
      console.log('📎 Novos arquivos a serem enviados:', formValues.arquivos.length);
    }
    
    console.log('📤 Enviando atualização:', dadosAtualizacao);
    
    // Atualizar chamado
    const resultado = await chamadosStore.atualizarChamado(chamado.value.id, dadosAtualizacao);
    
    console.log('✅ Chamado atualizado com sucesso:', resultado);
    
    // Redirecionar para visualização
    router.push({ 
      name: 'chamado-view', 
      params: { id: chamado.value.id } 
    });
    
    alert('Chamado atualizado com sucesso!');
  } catch (err) {
    console.error('❌ Erro ao salvar chamado:', err);
    console.error('Resposta do erro:', err?.response?.data);
    
    let errorMessage = 'Erro ao salvar chamado. Verifique os dados e tente novamente.';
    
    if (err?.response?.data) {
      const data = err.response.data;
      if (data.error) {
        errorMessage = data.error.message || errorMessage;
        if (data.error.details) {
          console.error('Detalhes do erro:', data.error.details);
        }
      } else if (data.message) {
        errorMessage = data.message;
      }
    } else if (err?.message) {
      errorMessage = err.message;
    }
    
    alert(errorMessage);
  } finally {
    salvando.value = false;
  }
};

const cancelarEdicao = () => {
  if (confirm('Deseja cancelar a edição? As alterações não salvas serão perdidas.')) {
    router.push({ 
      name: 'chamado-view', 
      params: { id: chamado.value.id } 
    });
  }
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

// Lifecycle
onMounted(async () => {
  // Carregar grupos solicitantes
  try {
    if (authStore.isAdmin) {
      await gruposStore.listarGrupos({ limit: 1000, ativo: true });
    } else {
      await gruposStore.meusGrupos();
    }
  } catch (error) {
    console.error('Erro ao carregar grupos:', error);
  }

  // ✅ Carregar grupos executores (todos os usuários podem ver)
  try {
    gruposExecutores.value = await gruposStore.listarGruposExecutores();
  } catch (error) {
    console.error('Erro ao carregar grupos executores:', error);
  }

  // ✅ Carregar lista de usuários (apenas para admins, para campo solicitante)
  if (authStore.isAdmin) {
    try {
      const response = await usuariosStore.listarUsuarios({ 
        limit: 1000, 
        ativo: true 
      });
      usuarios.value = response.usuarios || [];
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
    }
  }
  
  await carregarChamado();
});
</script>

<style scoped>
.info-box {
  background-color: var(--color-bg-tertiary);
}
</style>

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
</style>

