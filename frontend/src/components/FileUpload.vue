<template>
  <div class="file-upload">
    <label class="form-label">
      {{ label }}
      <span v-if="!required" class="text-muted">(opcional)</span>
    </label>

    <!-- Área de Upload -->
    <div 
      class="upload-area"
      :class="{ 'dragover': isDragging }"
      @drop.prevent="onDrop"
      @dragover.prevent="isDragging = true"
      @dragleave.prevent="isDragging = false"
      @paste="onPaste"
    >
      <input 
        ref="fileInput"
        type="file"
        multiple
        :accept="acceptedTypes"
        @change="onFileSelect"
        class="d-none"
      />

      <div class="text-center py-3">
        <i class="bi bi-cloud-arrow-up" style="font-size: 2rem;"></i>
        <p class="mb-2">
          Arraste arquivos aqui, cole (Ctrl+V) ou 
          <a href="#" @click.prevent="$refs.fileInput.click()" class="text-decoration-none">
            clique para selecionar
          </a>
        </p>
        <small class="text-muted">
          Máximo 5 arquivos, 10MB cada.
          <br>
          Formatos: Imagens, PDF, Word, Excel, ZIP
        </small>
      </div>
    </div>

    <!-- Lista de Arquivos -->
    <div v-if="files.length > 0" class="files-list mt-3">
      <div 
        v-for="(file, index) in files" 
        :key="index"
        class="file-item"
      >
        <!-- Preview se for imagem -->
        <div class="file-preview">
          <img 
            v-if="isImage(file)" 
            :src="file.preview" 
            alt="Preview"
            class="img-thumbnail"
          />
          <i v-else :class="getFileIcon(file)" class="file-icon"></i>
        </div>

        <div class="file-info">
          <div class="file-name">{{ file.name }}</div>
          <div class="file-size text-muted">{{ formatFileSize(file.size) }}</div>
        </div>

        <button 
          type="button"
          class="btn btn-sm btn-danger"
          @click="removeFile(index)"
        >
          <i class="bi bi-trash"></i>
        </button>
      </div>
    </div>

    <!-- Mensagem de Erro -->
    <div v-if="error" class="alert alert-danger mt-2">
      <i class="bi bi-exclamation-triangle me-2"></i>
      {{ error }}
    </div>
  </div>
</template>

<script setup>
import { ref, defineProps, defineEmits } from 'vue';

const props = defineProps({
  label: {
    type: String,
    default: 'Anexar Arquivos'
  },
  required: {
    type: Boolean,
    default: false
  },
  acceptedTypes: {
    type: String,
    default: 'image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.zip,.rar'
  },
  maxFiles: {
    type: Number,
    default: 5
  },
  maxFileSize: {
    type: Number,
    default: 10 * 1024 * 1024 // 10MB
  }
});

const emit = defineEmits(['update:files']);

const files = ref([]);
const isDragging = ref(false);
const error = ref(null);
const fileInput = ref(null);

// Selecionar arquivos via input
const onFileSelect = (event) => {
  addFiles(Array.from(event.target.files));
  event.target.value = ''; // Resetar input
};

// Arrastar e soltar
const onDrop = (event) => {
  isDragging.value = false;
  addFiles(Array.from(event.dataTransfer.files));
};

// Colar imagem do clipboard
const onPaste = (event) => {
  const items = event.clipboardData?.items;
  if (!items) return;

  const pastedFiles = [];
  for (let item of items) {
    if (item.kind === 'file') {
      pastedFiles.push(item.getAsFile());
    }
  }

  if (pastedFiles.length > 0) {
    addFiles(pastedFiles);
  }
};

// Adicionar arquivos
const addFiles = (newFiles) => {
  error.value = null;

  // Verificar limite de arquivos
  if (files.value.length + newFiles.length > props.maxFiles) {
    error.value = `Máximo de ${props.maxFiles} arquivos permitidos.`;
    return;
  }

  // Processar cada arquivo
  newFiles.forEach(file => {
    // Verificar tamanho
    if (file.size > props.maxFileSize) {
      error.value = `${file.name} excede o tamanho máximo de ${formatFileSize(props.maxFileSize)}.`;
      return;
    }

    // Criar preview se for imagem
    const fileData = {
      file,
      name: file.name,
      size: file.size,
      type: file.type,
      preview: null
    };

    if (isImage(fileData)) {
      const reader = new FileReader();
      reader.onload = (e) => {
        fileData.preview = e.target.result;
      };
      reader.readAsDataURL(file);
    }

    files.value.push(fileData);
  });

  emitFiles();
};

// Remover arquivo
const removeFile = (index) => {
  files.value.splice(index, 1);
  emitFiles();
};

// Emitir arquivos para o componente pai
const emitFiles = () => {
  emit('update:files', files.value.map(f => f.file));
};

// Verificar se é imagem
const isImage = (file) => {
  return file.type?.startsWith('image/');
};

// Ícone do arquivo
const getFileIcon = (file) => {
  const type = file.type || '';
  
  if (type.includes('pdf')) return 'bi bi-file-pdf text-danger';
  if (type.includes('word')) return 'bi bi-file-word text-primary';
  if (type.includes('excel') || type.includes('spreadsheet')) return 'bi bi-file-excel text-success';
  if (type.includes('zip') || type.includes('rar')) return 'bi bi-file-zip text-warning';
  if (type.includes('text')) return 'bi bi-file-text';
  
  return 'bi bi-file-earmark';
};

// Formatar tamanho do arquivo
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

// Expor método para limpar arquivos
defineExpose({
  clear: () => {
    files.value = [];
    error.value = null;
    emitFiles();
  }
});
</script>

<style scoped>
.upload-area {
  border: 2px dashed #dee2e6;
  border-radius: 0.375rem;
  padding: 1rem;
  background-color: #f8f9fa;
  cursor: pointer;
  transition: all 0.3s ease;
}

.upload-area:hover {
  border-color: #0d6efd;
  background-color: #e7f1ff;
}

.upload-area.dragover {
  border-color: #0d6efd;
  background-color: #cfe2ff;
}

.files-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.file-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem;
  border: 1px solid #dee2e6;
  border-radius: 0.375rem;
  background-color: #fff;
}

.file-preview {
  flex-shrink: 0;
  width: 50px;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.file-preview img {
  max-width: 50px;
  max-height: 50px;
  object-fit: cover;
}

.file-icon {
  font-size: 2rem;
}

.file-info {
  flex-grow: 1;
  min-width: 0;
}

.file-name {
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.file-size {
  font-size: 0.875rem;
}
</style>

