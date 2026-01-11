<template>
  <teleport to="body">
    <div v-if="show" class="modal-backdrop fade show" @click="cancel"></div>
    <div
      v-if="show"
      class="modal fade show d-block"
      tabindex="-1"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-delete-modal-title"
      aria-describedby="confirm-delete-modal-description"
    >
      <div class="modal-dialog modal-dialog-centered" role="document" @click.stop>
        <div class="modal-content border-danger">
          <div class="modal-header bg-danger text-white">
            <h5 id="confirm-delete-modal-title" class="modal-title">
              <i class="bi bi-exclamation-triangle-fill me-2"></i>
              Confirmar Exclusão Permanente
            </h5>
            <button
              type="button"
              class="btn-close btn-close-white"
              @click="cancel"
              aria-label="Fechar"
            ></button>
          </div>
          <div class="modal-body">
            <div class="alert alert-danger mb-3">
              <i class="bi bi-exclamation-triangle me-2"></i>
              <strong>ATENÇÃO: Esta ação é IRREVERSÍVEL!</strong>
            </div>

            <p id="confirm-delete-modal-description" class="mb-3">
              Você está prestes a deletar <strong>permanentemente</strong>:
            </p>

            <div class="card bg-light mb-3">
              <div class="card-body">
                <h6 class="card-title text-danger mb-2">{{ itemType }}</h6>
                <p class="card-text mb-0">
                  <strong>{{ itemName }}</strong>
                </p>
              </div>
            </div>

            <p class="text-danger mb-3">
              <i class="bi bi-x-circle me-1"></i>
              {{ warningMessage }}
            </p>

            <div v-if="requireConfirmation">
              <label for="delete-confirmation-input" class="form-label fw-bold">
                Para confirmar, digite "<span class="text-danger">DELETAR</span>" abaixo:
              </label>
              <input
                id="delete-confirmation-input"
                ref="inputRef"
                v-model="confirmationText"
                type="text"
                class="form-control"
                :class="{ 'is-invalid': attemptedConfirm && !isConfirmed }"
                placeholder="Digite DELETAR"
                autocomplete="off"
                aria-required="true"
                aria-describedby="delete-confirmation-help"
                @keyup.enter="confirm"
                @click.stop
              />
              <div 
                v-if="attemptedConfirm && !isConfirmed" 
                id="delete-confirmation-help" 
                class="invalid-feedback"
              >
                Você deve digitar "DELETAR" para confirmar
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button
              type="button"
              class="btn btn-secondary"
              aria-label="Cancelar exclusão"
              @click="cancel"
            >
              <i class="bi bi-x-lg me-1"></i>
              Cancelar
            </button>
            <button
              type="button"
              class="btn btn-danger"
              :disabled="requireConfirmation && !isConfirmed"
              :aria-label="requireConfirmation && !isConfirmed ? 'Digite DELETAR para habilitar' : 'Confirmar exclusão permanente'"
              @click="confirm"
            >
              <i class="bi bi-trash3-fill me-1"></i>
              Deletar Permanentemente
            </button>
          </div>
        </div>
      </div>
    </div>
  </teleport>
</template>

<script>
import { ref, computed, watch, nextTick, onBeforeUnmount } from 'vue';

export default {
  name: 'ConfirmDeleteModal',
  props: {
    show: {
      type: Boolean,
      default: false
    },
    itemType: {
      type: String,
      required: true
    },
    itemName: {
      type: String,
      required: true
    },
    warningMessage: {
      type: String,
      default: 'Todos os dados relacionados serão perdidos permanentemente.'
    },
    requireConfirmation: {
      type: Boolean,
      default: true
    }
  },
  emits: ['confirm', 'cancel'],
  setup(props, { emit }) {
    const confirmationText = ref('');
    const attemptedConfirm = ref(false);
    const inputRef = ref(null);

    const isConfirmed = computed(() => {
      if (!props.requireConfirmation) return true;
      return confirmationText.value === 'DELETAR';
    });

    const confirm = (event) => {
      // Prevenir propagação do evento
      if (event) {
        event.preventDefault();
        event.stopPropagation();
      }
      
      if (props.requireConfirmation) {
        attemptedConfirm.value = true;
        if (!isConfirmed.value) {
          return;
        }
      }
      
      // Remover foco de qualquer elemento antes de confirmar
      if (document.activeElement && document.activeElement !== document.body) {
        document.activeElement.blur();
      }
      
      emit('confirm');
      resetModal();
    };

    const cancel = (event) => {
      // Prevenir propagação do evento
      if (event) {
        event.preventDefault();
        event.stopPropagation();
      }
      
      // Remover foco de qualquer elemento antes de fechar
      if (document.activeElement && document.activeElement !== document.body) {
        document.activeElement.blur();
      }
      
      emit('cancel');
      resetModal();
    };

    const resetModal = () => {
      confirmationText.value = '';
      attemptedConfirm.value = false;
    };

    // Handler para tecla ESC
    const handleEscape = (event) => {
      if (event.key === 'Escape' && props.show) {
        cancel(event);
      }
    };

    // Adicionar listener de teclado quando o modal estiver visível
    watch(() => props.show, (newVal) => {
      if (newVal) {
        resetModal();
        // Adicionar listener ESC
        document.addEventListener('keydown', handleEscape);
        
        // Focar no input após o modal estar visível
        nextTick(() => {
          if (inputRef.value) {
            inputRef.value.focus();
          }
        });
      } else {
        // Remover listener ESC
        document.removeEventListener('keydown', handleEscape);
        
        // Quando fechar, remover foco de qualquer elemento
        nextTick(() => {
          if (document.activeElement && document.activeElement !== document.body) {
            document.activeElement.blur();
          }
        });
      }
    });

    // Cleanup ao desmontar componente
    onBeforeUnmount(() => {
      document.removeEventListener('keydown', handleEscape);
    });

    return {
      confirmationText,
      attemptedConfirm,
      isConfirmed,
      inputRef,
      confirm,
      cancel
    };
  }
};
</script>

<style scoped>
.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  z-index: 1090;
  width: 100vw;
  height: 100vh;
  background-color: rgba(0, 0, 0, 0.7);
}

.modal.show {
  display: block;
  position: fixed;
  top: 0;
  left: 0;
  z-index: 1100;
  width: 100%;
  height: 100%;
  overflow-x: hidden;
  overflow-y: auto;
  outline: 0;
}

.modal-dialog {
  position: relative;
  width: auto;
  margin: 1.75rem auto;
  pointer-events: none;
  z-index: 1101;
}

.modal-content {
  position: relative;
  display: flex;
  flex-direction: column;
  width: 100%;
  pointer-events: auto;
  background-color: #fff;
  background-clip: padding-box;
  border: 2px solid rgba(220, 53, 69, 0.5);
  border-radius: 0.5rem;
  outline: 0;
  box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.5);
  z-index: 1102;
}

.card {
  border-left: 4px solid #dc3545;
}

/* Garantir que elementos interativos sejam clicáveis */
input,
button,
.btn {
  pointer-events: auto !important;
  z-index: 1103;
  position: relative;
}

.modal-header,
.modal-body,
.modal-footer {
  pointer-events: auto;
  position: relative;
  z-index: 1102;
}
</style>

