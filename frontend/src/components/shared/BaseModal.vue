<template>
  <Teleport to="body">
    <div
      v-if="show"
      class="modal fade show d-block"
      tabindex="-1"
      role="dialog"
      aria-modal="true"
      :aria-labelledby="titleId"
      @mousedown="onOverlayMousedown"
      @click="onOverlayClick"
    >
      <div
        class="modal-dialog"
        :class="dialogClass"
        ref="dialogRef"
        @mousedown.stop
        @click.stop
      >
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" :id="titleId">
              <slot name="header">{{ title }}</slot>
            </h5>
            <button type="button" class="btn-close" aria-label="Fechar" @click="solicitarFechar"></button>
          </div>
          <div class="modal-body">
            <slot />
          </div>
          <div v-if="$slots.footer" class="modal-footer">
            <slot name="footer" />
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
/**
 * Modal base reutilizável. Sempre renderiza via <Teleport to="body"> para
 * nunca ficar dentro de um .card (ou qualquer ancestral com transform/filter)
 * — um ancestral com transform cria um novo containing block e quebra
 * position: fixed, fazendo o modal encolher/piscar ao herdar o :hover do pai.
 *
 * Fecha pelo overlay só quando o mousedown E o click acontecem no próprio
 * overlay (não em algum filho) — evita fechar sozinho ao selecionar texto
 * dentro de um campo e soltar o mouse em cima do fundo escuro.
 */
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue';

const props = defineProps({
  show: { type: Boolean, default: false },
  title: { type: String, default: '' },
  size: { type: String, default: '' }, // '', 'sm', 'lg', 'xl'
  closeOnOverlay: { type: Boolean, default: true },
  closeOnEsc: { type: Boolean, default: true }
});

const emit = defineEmits(['fechar']);

const titleId = `base-modal-title-${Math.random().toString(36).slice(2, 10)}`;
const dialogClass = computed(() => [
  'modal-dialog-centered',
  props.size ? `modal-${props.size}` : ''
]);

const dialogRef = ref(null);
let mousedownNoOverlay = false;
let elementoFocadoAntes = null;

const onOverlayMousedown = (event) => {
  mousedownNoOverlay = event.target === event.currentTarget;
};

const onOverlayClick = (event) => {
  if (!props.closeOnOverlay) return;
  if (mousedownNoOverlay && event.target === event.currentTarget) {
    solicitarFechar();
  }
  mousedownNoOverlay = false;
};

const solicitarFechar = () => emit('fechar');

const handleKeydown = (event) => {
  if (props.closeOnEsc && event.key === 'Escape' && props.show) {
    solicitarFechar();
  }
};

const travarScrollEFocar = async () => {
  elementoFocadoAntes = document.activeElement;
  document.body.classList.add('modal-open');
  document.body.style.overflow = 'hidden';

  await nextTick();
  const primeiroFocavel = dialogRef.value?.querySelector(
    'input, textarea, select, [href], button:not(.btn-close)'
  );
  (primeiroFocavel || dialogRef.value)?.focus?.();
};

const destravarScrollERestaurarFoco = () => {
  document.body.classList.remove('modal-open');
  document.body.style.overflow = '';
  if (elementoFocadoAntes && document.body.contains(elementoFocadoAntes)) {
    elementoFocadoAntes.focus?.();
  }
  elementoFocadoAntes = null;
};

watch(() => props.show, (visivel) => {
  if (visivel) {
    travarScrollEFocar();
  } else {
    destravarScrollERestaurarFoco();
  }
});

onMounted(() => {
  document.addEventListener('keydown', handleKeydown);
  if (props.show) travarScrollEFocar();
});

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown);
  if (props.show) destravarScrollERestaurarFoco();
});
</script>

<style scoped>
.modal {
  background-color: rgba(0, 0, 0, 0.5);
}
</style>
