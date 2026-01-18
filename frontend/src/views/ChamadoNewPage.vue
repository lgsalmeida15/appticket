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
                <i class="bi bi-plus-circle me-1"></i>
                Novo Chamado
              </li>
            </ol>
          </nav>
        </div>
      </div>

      <!-- Formulário de Criação -->
      <div class="row">
        <div class="col-12">
          <!-- Card do Formulário -->
          <div class="card">
            <div class="card-header">
              <h4 class="mb-0">
                <i class="bi bi-plus-circle me-2"></i>
                Criar Novo Chamado
              </h4>
            </div>
            <div class="card-body">
              <ChamadoFormularioValidado
                ref="formularioRef"
                :grupos="grupos"
                :grupos-executores="gruposExecutores"
                :usuarios="usuarios"
                :initial-values="novoChamado"
                :modo-edicao="false"
                @submit="criarChamado"
              />

              <!-- Botões de Ação -->
              <div class="d-flex justify-content-between mt-4">
                <button 
                  type="button" 
                  class="btn btn-outline-secondary"
                  @click="cancelarCriacao"
                  :disabled="criando"
                >
                  <i class="bi bi-x-lg me-1"></i>
                  Cancelar
                </button>
                <button 
                  type="button" 
                  class="btn btn-primary"
                  @click="submitForm"
                  :disabled="criando"
                >
                  <span v-if="criando" class="spinner-border spinner-border-sm me-2"></span>
                  <i v-else class="bi bi-check-circle me-2"></i>
                  {{ criando ? 'Criando...' : 'Criar Chamado' }}
                </button>
              </div>
            </div>
          </div>

          <!-- Card de Dicas -->
          <div class="card mt-3">
            <div class="card-header">
              <h5 class="mb-0">
                <i class="bi bi-lightbulb me-2"></i>
                Dicas para Criar um Bom Chamado
              </h5>
            </div>
            <div class="card-body">
              <ul class="mb-0">
                <li class="mb-2">
                  <strong>Título:</strong> Seja claro e objetivo. Exemplo: "Sistema travando ao gerar relatório"
                </li>
                <li class="mb-2">
                  <strong>Descrição:</strong> Forneça o máximo de detalhes possível, incluindo passos para reproduzir o problema
                </li>
                <li class="mb-2">
                  <strong>Grupo:</strong> Selecione o grupo responsável pela área do problema
                </li>
                <li class="mb-2">
                  <strong>Prioridade:</strong> Avalie o impacto real do problema no seu trabalho
                </li>
                <li>
                  <strong>Anexos:</strong> Adicione prints ou arquivos que ajudem a entender o problema
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  </layout-principal>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useChamadosStore } from '@/stores/chamados';
import { useGruposStore } from '@/stores/grupos';
import { useUsuariosStore } from '@/stores/usuarios';
import { useAuthStore } from '@/stores/auth';
import LayoutPrincipal from '@/components/LayoutPrincipal.vue';
import ChamadoFormularioValidado from '@/components/chamado/ChamadoFormularioValidado.vue';

const router = useRouter();
const chamadosStore = useChamadosStore();
const gruposStore = useGruposStore();
const usuariosStore = useUsuariosStore();
const authStore = useAuthStore();

// Estados
const criando = ref(false);
const formularioRef = ref(null);

// Estados para grupos
const gruposExecutores = ref([]);

// Estados para usuários (para campo solicitante)
const usuarios = ref([]);

// Computed
const grupos = computed(() => gruposStore.grupos.filter(g => g.ativo !== false));

// Valores iniciais do formulário
const novoChamado = ref({
  titulo: '',
  descricao: '',
  tipo: 'incidente',
  prioridade: 'media',
  grupo_id: '',
  grupo_executor_id: ''
});

// Funções
const submitForm = () => {
  console.log('🔘 Botão "Criar Chamado" clicado');
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

const criarChamado = async (formValues) => {
  criando.value = true;
  try {
    console.log('📝 Criando chamado com dados:', formValues);
    
    // Garantir que grupo_id seja um número válido
    const grupoId = parseInt(formValues.grupo_id);
    if (isNaN(grupoId) || grupoId <= 0) {
      throw new Error('Selecione um grupo válido');
    }
    
    // Preparar dados do chamado
    const dadosChamado = {
      titulo: formValues.titulo || '',
      descricao: formValues.descricao || '',
      tipo: formValues.tipo || 'incidente',
      prioridade: formValues.prioridade || 'media',
      grupo_id: grupoId,
      arquivos: formValues.arquivos || []
    };

    // Adicionar grupo executor se fornecido
    if (formValues.grupo_executor_id) {
      const grupoExecutorId = parseInt(formValues.grupo_executor_id);
      if (!isNaN(grupoExecutorId) && grupoExecutorId > 0) {
        dadosChamado.grupo_executor_id = grupoExecutorId;
      }
    }

    // Adicionar solicitante_id se fornecido (apenas para admins)
    if (formValues.solicitante_id) {
      const solicitanteId = parseInt(formValues.solicitante_id);
      if (!isNaN(solicitanteId) && solicitanteId > 0) {
        dadosChamado.solicitante_id = solicitanteId;
      }
    }

    // Adicionar data_hora_inicio se fornecido (apenas para admins)
    if (authStore.isAdmin && formValues.data_hora_inicio) {
      dadosChamado.data_hora_inicio = formValues.data_hora_inicio;
    }

    console.log('📤 Enviando chamado:', dadosChamado);

    // Criar chamado
    const chamadoCriado = await chamadosStore.criarChamadoComArquivos(dadosChamado);
    
    console.log('✅ Chamado criado com sucesso:', chamadoCriado);
    
    // Redirecionar para visualização do chamado criado
    router.push({ 
      name: 'chamado-view', 
      params: { id: chamadoCriado.id } 
    });
    
    alert('Chamado criado com sucesso!');
  } catch (err) {
    console.error('❌ Erro ao criar chamado:', err);
    console.error('Resposta completa do erro:', err?.response?.data);
    console.error('Status do erro:', err?.response?.status);
    
    // Tentar extrair mensagem de erro
    let errorMessage = 'Erro ao criar chamado. Verifique os dados e tente novamente.';
    let errorDetails = null;
    
    if (err?.response?.data) {
      const data = err.response.data;
      
      if (data.error) {
        errorMessage = data.error.message || errorMessage;
        errorDetails = data.error.details;
      } else if (data.message) {
        errorMessage = data.message;
      } else if (typeof data.error === 'string') {
        errorMessage = data.error;
      } else if (Array.isArray(data)) {
        errorMessage = data.map(e => e.message || e).join(', ');
      } else if (typeof data === 'string') {
        errorMessage = data;
      }
    } else if (err?.message) {
      errorMessage = err.message;
    }
    
    // Adicionar detalhes se houver
    if (errorDetails && Array.isArray(errorDetails) && errorDetails.length > 0) {
      const detailsText = errorDetails
        .map(d => `${d.path || 'campo'}: ${d.message || d}`)
        .join('\n');
      errorMessage += '\n\nDetalhes:\n' + detailsText;
      console.error('Detalhes da validação:', detailsText);
    }
    
    alert(errorMessage);
  } finally {
    criando.value = false;
  }
};

const cancelarCriacao = () => {
  if (confirm('Deseja cancelar a criação? Os dados não serão salvos.')) {
    router.push({ name: 'chamados' });
  }
};

// Lifecycle
onMounted(async () => {
  // Carregar grupos solicitantes
  try {
    if (authStore.isAdmin) {
      // Admin pode ver todos os grupos
      await gruposStore.listarGrupos({ limit: 1000, ativo: true });
    } else {
      // Demais usuários veem apenas os grupos aos quais pertencem
      await gruposStore.meusGrupos();
    }
    
    // Auto-selecionar grupo se o usuário tiver apenas 1
    if (grupos.value && grupos.value.length === 1) {
      novoChamado.value.grupo_id = grupos.value[0].id;
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

