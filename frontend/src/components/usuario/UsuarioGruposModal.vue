<template>
  <div
    class="modal fade"
    id="modalGrupos"
    tabindex="-1"
    ref="modalElement"
  >
    <div class="modal-dialog modal-lg">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">
            <i class="bi bi-diagram-3 me-2"></i>
            Gerenciar Grupos de {{ usuario?.nome }}
          </h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
        </div>
        <div class="modal-body">
          <!-- Adicionar Novo Grupo -->
          <div class="card mb-3">
            <div class="card-header bg-light">
              <h6 class="mb-0">
                <i class="bi bi-plus-circle me-2"></i>
                Adicionar ao Grupo
              </h6>
            </div>
            <div class="card-body">
              <div class="row g-3">
                <div class="col-md-6">
                  <label for="novoGrupo" class="form-label">Grupo</label>
                  <select 
                    v-model="novoGrupo.grupo_id" 
                    class="form-select" 
                    id="novoGrupo"
                    :disabled="gruposDisponiveis.length === 0 || !props.grupos || props.grupos.length === 0"
                  >
                    <option value="">
                      {{ gruposDisponiveis.length === 0 ? 'Nenhum grupo disponível' : 'Selecione um grupo' }}
                    </option>
                    <option 
                      v-for="grupo in gruposDisponiveis" 
                      :key="grupo.id" 
                      :value="grupo.id"
                    >
                      {{ grupo.nome }}
                    </option>
                  </select>
                  <div v-if="gruposDisponiveis.length === 0 && props.grupos && props.grupos.length > 0" class="form-text text-muted">
                    Todos os grupos já foram adicionados a este usuário
                  </div>
                  <div v-if="!props.grupos || props.grupos.length === 0" class="form-text text-warning">
                    <i class="bi bi-exclamation-triangle me-1"></i>
                    Nenhum grupo cadastrado no sistema
                  </div>
                </div>
                <div class="col-md-3">
                  <label for="novoPapel" class="form-label">Papel</label>
                  <select v-model="novoGrupo.papel" class="form-select" id="novoPapel">
                    <option value="agente">Agente</option>
                    <option value="gerente">Gerente</option>
                  </select>
                </div>
                <div class="col-md-3 d-flex align-items-end">
                  <button 
                    class="btn btn-success w-100" 
                    @click="handleAdicionar"
                    :disabled="!novoGrupo.grupo_id || novoGrupo.grupo_id === '' || adicionando"
                    type="button"
                  >
                    <span v-if="adicionando" class="spinner-border spinner-border-sm me-1"></span>
                    <i v-else class="bi bi-plus me-1"></i>
                    Adicionar
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Lista de Grupos do Usuário -->
          <div class="card">
            <div class="card-header bg-light">
              <h6 class="mb-0">
                <i class="bi bi-list-ul me-2"></i>
                Grupos Atuais
              </h6>
            </div>
            <div class="card-body">
              <div v-if="!gruposAtivosDoUsuario || gruposAtivosDoUsuario.length === 0" 
                class="text-center text-muted py-3"
              >
                <i class="bi bi-inbox fs-1 d-block mb-2"></i>
                <p>Este usuário ainda não pertence a nenhum grupo</p>
              </div>
              <div v-else class="list-group">
                <div 
                  v-for="grupo in gruposAtivosDoUsuario" 
                  :key="grupo.id"
                  class="list-group-item d-flex justify-content-between align-items-center"
                >
                  <div>
                    <i class="bi bi-diagram-3 me-2 text-primary"></i>
                    <strong>{{ grupo.nome }}</strong>
                    <span class="badge bg-info ms-2">
                      {{ grupo.usuario_grupo?.papel || 'agente' }}
                    </span>
                  </div>
                  <button 
                    class="btn btn-sm btn-outline-danger"
                    @click="handleRemover(grupo.id)"
                    :disabled="removendo === grupo.id"
                    title="Remover do grupo"
                  >
                    <span v-if="removendo === grupo.id" class="spinner-border spinner-border-sm"></span>
                    <i v-else class="bi bi-trash"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
            Fechar
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { Modal } from 'bootstrap';

const props = defineProps({
  usuario: {
    type: Object,
    default: null
  },
  grupos: {
    type: Array,
    default: () => []
  },
  adicionando: {
    type: Boolean,
    default: false
  },
  removendo: {
    type: [Number, null],
    default: null
  }
});

const emit = defineEmits(['adicionar', 'remover']);

const modalElement = ref(null);
let modalInstance = null;

const novoGrupo = ref({
  grupo_id: '',
  papel: 'agente'
});


// Grupos ativos do usuário (filtrando grupos e associações inativas)
const gruposAtivosDoUsuario = computed(() => {
  if (!props.usuario || !props.usuario.grupos || !Array.isArray(props.usuario.grupos)) {
    return [];
  }
  
  // Filtrar apenas grupos ativos com associações ativas
  return props.usuario.grupos.filter(g => {
    const grupoAtivo = g.ativo !== false && g.ativo !== 0;
    const associacao = g.usuario_grupo || g.UsuarioGrupo;
    const associacaoAtiva = associacao && associacao.ativo !== false && associacao.ativo !== 0;
    return grupoAtivo && associacaoAtiva;
  });
});

// Grupos disponíveis (que o usuário ainda não pertence)
const gruposDisponiveis = computed(() => {
  console.log('[gruposDisponiveis] Iniciando cálculo:', {
    grupos: props.grupos,
    gruposLength: props.grupos?.length,
    usuario: props.usuario,
    gruposDoUsuario: props.usuario?.grupos
  });
  
  // Se não houver grupos, retornar array vazio
  if (!props.grupos || !Array.isArray(props.grupos) || props.grupos.length === 0) {
    console.log('[gruposDisponiveis] Sem grupos ou array vazio');
    return [];
  }
  
  // Se não houver usuário, retornar todos os grupos ativos
  if (!props.usuario) {
    const gruposAtivos = props.grupos.filter(g => g.ativo !== false && g.ativo !== 0);
    console.log('[gruposDisponiveis] Sem usuário, retornando grupos ativos:', gruposAtivos.length);
    return gruposAtivos;
  }
  
  // Obter IDs dos grupos que o usuário já pertence (apenas grupos ativos)
  // Normalizar IDs para garantir comparação correta (string vs number)
  const idsGruposUsuario = gruposAtivosDoUsuario.value
    .map(g => {
      const id = Number(g.id);
      return isNaN(id) ? null : id;
    })
    .filter(id => id !== null && id > 0);
  
  console.log('[gruposDisponiveis] IDs dos grupos do usuário:', idsGruposUsuario);
  
  // Filtrar grupos: ativos e que o usuário ainda não pertence
  const gruposFiltrados = props.grupos.filter(g => {
    const grupoId = Number(g.id);
    const isAtivo = g.ativo !== false && g.ativo !== 0;
    const naoPertence = !idsGruposUsuario.includes(grupoId);
    const disponivel = isAtivo && naoPertence;
    
    console.log(`[gruposDisponiveis] Grupo ${g.nome} (ID: ${grupoId}):`, {
      isAtivo,
      naoPertence,
      disponivel
    });
    
    return disponivel;
  });
  
  console.log('[gruposDisponiveis] Resultado final:', gruposFiltrados.length, gruposFiltrados.map(g => ({ id: g.id, nome: g.nome })));
  
  return gruposFiltrados;
});

const handleAdicionar = () => {
  if (!novoGrupo.value.grupo_id) {
    alert('Por favor, selecione um grupo');
    return;
  }
  
  if (!props.usuario || !props.usuario.id) {
    alert('Erro: Usuário não identificado');
    return;
  }
  
  const dados = {
    grupo_id: parseInt(novoGrupo.value.grupo_id),
    papel: novoGrupo.value.papel || 'agente'
  };
  
  emit('adicionar', dados);
  
  // Não resetar aqui - será resetado após sucesso
};

const handleRemover = (grupoId) => {
  emit('remover', grupoId);
};

const show = () => {
  if (!modalInstance && modalElement.value) {
    modalInstance = new Modal(modalElement.value);
  }
  
  modalInstance?.show();
  
  // Resetar formulário ao abrir
  novoGrupo.value = {
    grupo_id: '',
    papel: 'agente'
  };
};

const hide = () => {
  modalInstance?.hide();
};

const clearForm = () => {
  novoGrupo.value = {
    grupo_id: '',
    papel: 'agente'
  };
};

// Watch para resetar quando usuário mudar
watch(() => props.usuario, () => {
  clearForm();
});

defineExpose({
  show,
  hide,
  clearForm
});
</script>

<style scoped>
.badge {
  font-weight: 500;
}
</style>

