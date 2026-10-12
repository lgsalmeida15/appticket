import { ref, onMounted, onUnmounted } from 'vue';

/**
 * Formata minutos para um texto curto tipo "3h42" (ou "42min" se < 1h)
 */
export function formatarMinutos(minutos) {
  const total = Math.max(0, Math.floor(minutos || 0));
  const horas = Math.floor(total / 60);
  const mins = total % 60;

  if (horas === 0) {
    return `${mins}min`;
  }

  return `${horas}h${String(mins).padStart(2, '0')}`;
}

/**
 * Calcula os minutos decorridos desde um timestamp de início até agora
 */
export function calcularElapsedAoVivo(inicio) {
  if (!inicio) return 0;
  const inicioMs = new Date(inicio).getTime();
  return Math.max(0, Math.floor((Date.now() - inicioMs) / (1000 * 60)));
}

/**
 * Composable que expõe um ref "tick" atualizado a cada intervalo, para
 * forçar recomputo reativo de exibições "ao vivo" sem repolling no backend.
 */
export function useLiveTick(intervaloMs = 30000) {
  const tick = ref(Date.now());
  let intervalId = null;

  onMounted(() => {
    intervalId = setInterval(() => {
      tick.value = Date.now();
    }, intervaloMs);
  });

  onUnmounted(() => {
    if (intervalId) clearInterval(intervalId);
  });

  return { tick };
}
