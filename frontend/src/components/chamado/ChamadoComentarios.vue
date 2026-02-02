<template>
  <div class="mb-4">
    <h6 class="text-muted mb-3">
      <i class="bi bi-chat-dots me-2"></i>
      Comentários
    </h6>
    
    <!-- Lista de Comentários -->
    <div v-if="comentariosOrdenados?.length" class="mb-3">
      <div 
        v-for="comentario in comentariosOrdenados" 
        :key="comentario.id"
        class="card mb-2"
        :class="{ 'border-warning': comentario.interno }"
      >
        <div class="card-body">
          <div class="d-flex justify-content-between mb-2">
            <div>
              <strong>{{ comentario.usuario?.nome }}</strong>
              <span v-if="comentario.interno" class="badge bg-warning ms-2">
                <i class="bi bi-lock me-1"></i>
                Interno
              </span>
            </div>
            <small class="text-muted">{{ formatarData(comentario.data_hora) }}</small>
          </div>
          <p class="mb-0">{{ comentario.texto }}</p>
          
          <!-- Anexos do Comentário -->
          <div v-if="comentario.anexos?.length" class="mt-2">
            <small class="text-muted">
              <i class="bi bi-paperclip me-1"></i>
              {{ comentario.anexos.length }} anexo(s):
            </small>
            <div class="d-flex flex-wrap gap-2 mt-1">
              <a 
                v-for="(anexo, index) in comentario.anexos" 
                :key="index"
                :href="anexo.url" 
                target="_blank"
                class="btn btn-outline-primary btn-sm"
              >
                <i :class="getFileIconClass(anexo.tipo)" class="me-1"></i>
                {{ anexo.nome }}
                <small class="text-muted ms-1">({{ formatFileSize(anexo.tamanho) }})</small>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div v-else class="text-muted text-center py-3">
      <i class="bi bi-chat-dots"></i>
      Nenhum comentário ainda
    </div>

    <!-- Mensagem de Chamado Fechado -->
    <div v-if="!podeComentar" class="alert alert-info mb-0">
      <i class="bi bi-info-circle me-2"></i>
      <strong>Chamado Fechado:</strong> Não é possível adicionar comentários ou anexos em chamados fechados.
    </div>

    <!-- Formulário de Novo Comentário -->
    <div class="card border-success" v-if="podeComentar">
      <div class="card-body">
        <form @submit.prevent="handleAdicionar">
          <div class="mb-3">
            <label class="form-label small">Adicionar Comentário</label>
            <textarea 
              v-model="novoComentario.texto" 
              class="form-control" 
              rows="3"
              placeholder="Digite seu comentário..."
              required
            ></textarea>
          </div>

          <FileUpload 
            ref="fileUploadRef"
            label="Anexar Arquivos/Imagens"
            @update:files="novoComentario.arquivos = $event"
          />

          <div class="form-check mt-3 mb-3" v-if="podeMarcarInterno">
            <input 
              v-model="novoComentario.interno" 
              class="form-check-input" 
              type="checkbox" 
              id="comentarioInterno"
            >
            <label class="form-check-label small" for="comentarioInterno">
              <i class="bi bi-lock me-1"></i>
              Comentário interno (visível apenas para equipe)
            </label>
          </div>
          <button 
            type="submit" 
            class="btn btn-success btn-sm"
            :disabled="loading || !novoComentario.texto.trim()"
          >
            <span v-if="loading" class="spinner-border spinner-border-sm me-2"></span>
            <i v-else class="bi bi-send me-2"></i>
            Enviar Comentário
          </button>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useChamados } from '@/composables/useChamados';
import FileUpload from '@/components/FileUpload.vue';

const { formatarData } = useChamados();

const props = defineProps({
  comentarios: {
    type: Array,
    default: () => []
  },
  loading: {
    type: Boolean,
    default: false
  },
  podeComentar: {
    type: Boolean,
    default: true
  },
  podeMarcarInterno: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['adicionar']);

const comentariosOrdenados = computed(() => {
  if (!props.comentarios) return [];
  return [...props.comentarios].sort((a, b) => {
    const dataA = new Date(a.data_hora || a.created_at);
    const dataB = new Date(b.data_hora || b.created_at);
    return dataA - dataB;
  });
});

const novoComentario = ref({
  texto: '',
  interno: false,
  arquivos: []
});

const fileUploadRef = ref(null);

const handleAdicionar = () => {
  if (!novoComentario.value.texto.trim()) return;
  
  // Emitir evento para adicionar comentário
  emit('adicionar', { ...novoComentario.value });
  
  // Limpar formulário após emitir
  limpar();
};

// Funções auxiliares
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

const limpar = () => {
  novoComentario.value = {
    texto: '',
    interno: false,
    arquivos: []
  };
  fileUploadRef.value?.clear();
};

defineExpose({ limpar });
</script>

