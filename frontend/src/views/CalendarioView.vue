<template>
  <layout-principal>
    <div class="container-fluid">
      <div class="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
        <h2 class="mb-0">
          <i class="bi bi-calendar3 me-2"></i>
          Agenda
        </h2>

        <div class="d-flex gap-2 align-items-center flex-wrap">
          <select v-model="filtroGrupoId" class="form-select form-select-sm" style="width: auto;" @change="recarregar">
            <option :value="null">Todos os grupos</option>
            <option v-for="g in grupos" :key="g.id" :value="g.id">{{ g.nome }}</option>
          </select>

          <select v-if="authStore.isAdmin" v-model="filtroAgenteId" class="form-select form-select-sm" style="width: auto;" @change="recarregar">
            <option :value="null">Todos os agentes</option>
            <option v-for="u in usuarios" :key="u.id" :value="u.id">{{ u.nome }}</option>
          </select>

          <div class="btn-group btn-group-sm" role="group">
            <button
              type="button"
              class="btn"
              :class="modo === 'mes' ? 'btn-primary' : 'btn-outline-primary'"
              @click="modo = 'mes'"
            >
              <i class="bi bi-calendar-month me-1"></i>Mês
            </button>
            <button
              type="button"
              class="btn"
              :class="modo === 'gantt' ? 'btn-primary' : 'btn-outline-primary'"
              @click="modo = 'gantt'"
            >
              <i class="bi bi-bar-chart-steps me-1"></i>Gantt
            </button>
          </div>
        </div>
      </div>

      <LoadingSpinner v-if="loading" text="Carregando agenda..." />

      <template v-else>
        <!-- VISÃO MÊS -->
        <div v-if="modo === 'mes'" class="card">
          <div class="card-header d-flex justify-content-between align-items-center">
            <button class="btn btn-sm btn-outline-secondary" @click="mesAnterior">
              <i class="bi bi-chevron-left"></i>
            </button>
            <strong>{{ labelMes }}</strong>
            <button class="btn btn-sm btn-outline-secondary" @click="proximoMes">
              <i class="bi bi-chevron-right"></i>
            </button>
          </div>
          <div class="card-body p-2">
            <div class="mes-grid-header">
              <div v-for="dia in diasSemana" :key="dia" class="mes-grid-header-dia">{{ dia }}</div>
            </div>
            <div class="mes-grid">
              <div
                v-for="dia in diasDoGrid"
                :key="dia.iso"
                class="mes-grid-dia"
                :class="{ 'mes-grid-dia-outro-mes': !dia.noMesAtual, 'mes-grid-dia-hoje': dia.hoje }"
              >
                <div class="mes-grid-dia-numero">{{ dia.numero }}</div>
                <div class="mes-grid-eventos">
                  <router-link
                    v-for="evento in eventosPorDia(dia.iso)"
                    :key="`${evento.tipo}-${evento.id}`"
                    :to="linkEvento(evento)"
                    class="mes-grid-evento"
                    :class="`evento-${evento.tipo} evento-status-${evento.status}`"
                    :title="evento.titulo"
                  >
                    <i :class="evento.tipo === 'tarefa' ? 'bi bi-list-task' : 'bi bi-ticket-detailed'"></i>
                    {{ evento.titulo }}
                  </router-link>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- VISÃO GANTT -->
        <div v-else class="card">
          <div class="card-body">
            <div v-if="!eventos.length" class="text-center text-muted py-5">
              <i class="bi bi-bar-chart-steps fs-1 d-block mb-2"></i>
              Nenhum chamado ou tarefa com data neste período
            </div>
            <div v-else ref="ganttContainer" class="gantt-container"></div>
          </div>
        </div>
      </template>
    </div>
  </layout-principal>
</template>

<script setup>
import { ref, computed, watch, onMounted, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval,
  addMonths, subMonths, format, isSameMonth, isSameDay, isWithinInterval, parseISO
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import LayoutPrincipal from '@/components/LayoutPrincipal.vue';
import LoadingSpinner from '@/components/shared/LoadingSpinner.vue';
import calendarioService from '@/services/calendarioService.js';
import { useGruposStore } from '@/stores/grupos';
import { useUsuariosStore } from '@/stores/usuarios';
import { useAuthStore } from '@/stores/auth';

const router = useRouter();
const authStore = useAuthStore();
const gruposStore = useGruposStore();
const usuariosStore = useUsuariosStore();

const loading = ref(false);
const eventos = ref([]);
const modo = ref('mes');
const mesAtual = ref(new Date());
const filtroGrupoId = ref(null);
const filtroAgenteId = ref(null);

const grupos = computed(() => gruposStore.grupos.filter(g => g.ativo !== false));
const usuarios = computed(() => usuariosStore.usuarios);

const diasSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

const labelMes = computed(() => format(mesAtual.value, 'MMMM yyyy', { locale: ptBR }));

const diasDoGrid = computed(() => {
  const inicioMes = startOfMonth(mesAtual.value);
  const fimMes = endOfMonth(mesAtual.value);
  const inicioGrid = startOfWeek(inicioMes);
  const fimGrid = endOfWeek(fimMes);
  const hoje = new Date();

  return eachDayOfInterval({ start: inicioGrid, end: fimGrid }).map((data) => ({
    iso: format(data, 'yyyy-MM-dd'),
    numero: format(data, 'd'),
    noMesAtual: isSameMonth(data, mesAtual.value),
    hoje: isSameDay(data, hoje)
  }));
});

const eventosPorDia = (diaIso) => {
  const dia = parseISO(diaIso);
  return eventos.value.filter((e) => {
    if (!e.inicio || !e.fim) return false;
    try {
      return isWithinInterval(dia, { start: parseISO(String(e.inicio).slice(0, 10)), end: parseISO(String(e.fim).slice(0, 10)) });
    } catch {
      return false;
    }
  });
};

const linkEvento = (evento) => {
  const chamadoId = evento.tipo === 'chamado' ? evento.id : evento.chamado_id;
  return { name: 'chamado-view', params: { id: chamadoId } };
};

const mesAnterior = () => { mesAtual.value = subMonths(mesAtual.value, 1); recarregar(); };
const proximoMes = () => { mesAtual.value = addMonths(mesAtual.value, 1); recarregar(); };

const intervaloConsulta = computed(() => {
  // Busca uma janela mais larga que o mês visível, para a visão Gantt
  // conseguir mostrar itens próximos sem precisar recarregar a cada troca.
  const inicio = subMonths(startOfMonth(mesAtual.value), 1);
  const fim = addMonths(endOfMonth(mesAtual.value), 1);
  return { inicio, fim };
});

const recarregar = async () => {
  loading.value = true;
  try {
    const { inicio, fim } = intervaloConsulta.value;
    const resultado = await calendarioService.buscarEventos({
      inicio: format(inicio, 'yyyy-MM-dd'),
      fim: format(fim, 'yyyy-MM-dd'),
      grupoId: filtroGrupoId.value,
      agenteId: filtroAgenteId.value
    });
    eventos.value = resultado.eventos || [];
    await nextTick();
    if (modo.value === 'gantt') montarGantt();
  } catch (err) {
    console.error('Erro ao carregar agenda:', err);
  } finally {
    loading.value = false;
  }
};

let ganttInstance = null;
const ganttContainer = ref(null);

const montarGantt = async () => {
  if (!eventos.value.length) return;
  const { default: Gantt } = await import('frappe-gantt');
  // O pacote não expõe o CSS via "exports" para subpath imports; mantemos uma
  // cópia local em src/assets (atualizar manualmente se a lib for atualizada).
  await import('@/assets/frappe-gantt.css');

  const tasks = eventos.value
    .filter(e => e.inicio && e.fim)
    .map((e) => ({
      id: `${e.tipo}-${e.id}`,
      name: `${e.tipo === 'tarefa' ? '📋 ' : '🎫 '}${e.titulo}`,
      start: String(e.inicio).slice(0, 10),
      end: String(e.fim).slice(0, 10),
      progress: ['concluida', 'resolvido', 'fechado'].includes(e.status) ? 100 : 0,
      custom_class: `gantt-${e.tipo} gantt-status-${e.status}`
    }));

  if (!ganttContainer.value) return;
  ganttContainer.value.innerHTML = '';

  ganttInstance = new Gantt(ganttContainer.value, tasks, {
    view_mode: 'Week',
    language: 'pt',
    on_click: (task) => {
      const [tipo, id] = task.id.split('-');
      const evento = eventos.value.find(e => e.tipo === tipo && String(e.id) === id);
      if (!evento) return;
      const chamadoId = evento.tipo === 'chamado' ? evento.id : evento.chamado_id;
      router.push({ name: 'chamado-view', params: { id: chamadoId } });
    }
  });
};

watch(modo, async (novo) => {
  if (novo === 'gantt') {
    await nextTick();
    montarGantt();
  }
});

onMounted(async () => {
  try {
    await gruposStore.listarGrupos({ limit: 1000, ativo: true });
  } catch (err) {
    console.error('Erro ao carregar grupos (não crítico):', err);
  }
  if (authStore.isAdmin) {
    try {
      await usuariosStore.listarUsuarios();
    } catch (err) {
      console.error('Erro ao carregar usuários (não crítico):', err);
    }
  }
  await recarregar();
});
</script>

<style scoped>
.mes-grid-header {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  text-align: center;
  font-weight: 600;
  font-size: 0.8rem;
  color: var(--color-text-secondary, #6c757d);
  padding: 4px 0;
}

.mes-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 2px;
}

.mes-grid-dia {
  min-height: 100px;
  border: 1px solid var(--color-border-light, #e9ecef);
  border-radius: 4px;
  padding: 4px;
}

.mes-grid-dia-outro-mes {
  opacity: 0.4;
}

.mes-grid-dia-hoje {
  background: var(--color-primary-light, #e7f1ff);
  border-color: var(--color-primary, #0d6efd);
}

.mes-grid-dia-numero {
  font-size: 0.75rem;
  font-weight: 600;
  margin-bottom: 4px;
}

.mes-grid-eventos {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.mes-grid-evento {
  display: block;
  font-size: 0.7rem;
  padding: 1px 4px;
  border-radius: 3px;
  text-decoration: none;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.evento-chamado {
  background: #e7f1ff;
  color: #0d6efd;
}

.evento-tarefa {
  background: #fff3cd;
  color: #997404;
}

.gantt-container {
  overflow-x: auto;
}
</style>

<style>
/* Frappe Gantt renderiza SVG fora do escopo do scoped style — precisa global */
.gantt .bar-wrapper.gantt-chamado .bar {
  fill: #0d6efd;
}
.gantt .bar-wrapper.gantt-tarefa .bar {
  fill: #ffc107;
}
.gantt .bar-wrapper.gantt-status-fechado .bar,
.gantt .bar-wrapper.gantt-status-concluida .bar,
.gantt .bar-wrapper.gantt-status-resolvido .bar {
  fill: #198754;
}
</style>
