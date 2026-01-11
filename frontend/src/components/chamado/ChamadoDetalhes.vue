<template>
  <div class="modal fade" :id="modalId" ref="modalElement" tabindex="-1">
    <div class="modal-dialog modal-xl">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title" v-if="chamado">
            <i class="bi bi-ticket-detailed me-2"></i>
            #{{ chamado.id }} - {{ chamado.titulo }}
          </h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
        </div>
        <div class="modal-body" v-if="chamado">
          <div class="row">
            <div class="col-md-8">
              <!-- Descrição -->
              <div class="mb-4">
                <h6 class="text-muted mb-2">Descrição</h6>
                <p class="bg-light p-3 rounded">{{ chamado.descricao }}</p>
                
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

              <!-- Ações Administrativas (Admin/Gerente) -->
              <ChamadoAcoesAdministrativas 
                v-if="podeAdministrar"
                :chamado="chamado"
                :usuarios-admin="usuariosAdmin"
                :atualizando="atualizando"
                @atualizar="$emit('atualizar', $event)"
              />

              <!-- Comentários -->
              <ChamadoComentarios
                ref="comentariosRef"
                :comentarios="chamado.comentarios || []"
                :loading="loadingComentario"
                :pode-comentar="true"
                :pode-marcar-interno="podeMarcarInterno"
                @adicionar="$emit('adicionar-comentario', $event)"
              />
            </div>

            <!-- Painel Lateral com Informações -->
            <div class="col-md-4">
              <ChamadoInformacoesLateral :chamado="chamado" />
            </div>
          </div>
        </div>
        <div class="modal-footer d-flex justify-content-between">
          <button 
            v-if="podeAdministrar"
            type="button" 
            class="btn btn-danger"
            @click="$emit('deletar', chamado)"
          >
            <i class="bi bi-trash3-fill me-1"></i>
            Deletar Permanentemente
          </button>
          <div v-else></div>
          <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
            Fechar
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useChamados } from '@/composables/useChamados';
import ChamadoComentarios from './ChamadoComentarios.vue';
import ChamadoAcoesAdministrativas from './ChamadoAcoesAdministrativas.vue';
import ChamadoInformacoesLateral from './ChamadoInformacoesLateral.vue';

const { formatarData } = useChamados();
const modalElement = ref(null);
const comentariosRef = ref(null);

const props = defineProps({
  chamado: {
    type: Object,
    default: null
  },
  podeAdministrar: {
    type: Boolean,
    default: false
  },
  podeMarcarInterno: {
    type: Boolean,
    default: false
  },
  usuariosAdmin: {
    type: Array,
    default: () => []
  },
  atualizando: {
    type: Boolean,
    default: false
  },
  loadingComentario: {
    type: Boolean,
    default: false
  },
  modalId: {
    type: String,
    default: 'modalVisualizarChamado'
  }
});

defineEmits(['atualizar', 'adicionar-comentario', 'deletar']);

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

const limparComentario = () => {
  comentariosRef.value?.limpar?.();
};

defineExpose({ limparComentario });
</script>

