<template>
  <layout-principal>
    <template #header-actions>
      <div class="filters-header">
        <input
          type="date"
          v-model="filtros.data_inicio"
          class="form-control"
          @change="buscarResumo"
        />
        <input
          type="date"
          v-model="filtros.data_fim"
          class="form-control"
          @change="buscarResumo"
        />
        <button
          v-if="temFiltrosAtivos"
          class="btn btn-outline-secondary"
          @click="limparFiltros"
        >
          <i class="bi bi-x-circle"></i>
          Limpar Filtros
        </button>
      </div>
    </template>

    <div class="dashboard-container">
      <LoadingSpinner v-if="loading" text="Carregando dados do dashboard..." />

      <ErrorMessage v-else-if="error" :message="error" />

      <div v-else-if="resumo">
        <!-- Cards de Métricas -->
        <div class="metrics-grid">
          <div class="metric-card metric-primary">
            <div class="metric-icon">
              <i class="bi bi-clipboard-data"></i>
            </div>
            <div class="metric-content">
              <div class="metric-label">Total de Chamados</div>
              <div class="metric-value">{{ resumo.total_chamados || 0 }}</div>
            </div>
          </div>

          <div class="metric-card metric-info">
            <div class="metric-icon">
              <i class="bi bi-inbox"></i>
            </div>
            <div class="metric-content">
              <div class="metric-label">Novos</div>
              <div class="metric-value">{{ resumo.por_status?.novo || 0 }}</div>
            </div>
          </div>

          <div class="metric-card metric-success">
            <div class="metric-icon">
              <i class="bi bi-check-circle"></i>
            </div>
            <div class="metric-content">
              <div class="metric-label">Resolvidos</div>
              <div class="metric-value">{{ resumo.por_status?.resolvido || 0 }}</div>
            </div>
          </div>
        </div>

        <!-- Gráficos -->
        <div class="charts-grid">
          <!-- Chamados por Status -->
          <div class="chart-card">
            <div class="chart-header">
              <h3>Chamados por Status</h3>
            </div>
            <div class="chart-body">
              <canvas ref="statusChartCanvas"></canvas>
            </div>
          </div>

          <!-- Chamados por Grupo -->
          <div class="chart-card">
            <div class="chart-header">
              <h3>Chamados por Grupo</h3>
            </div>
            <div class="chart-body">
              <div class="table-responsive">
                <table class="table">
                  <thead>
                    <tr>
                      <th>Grupo</th>
                      <th class="text-end">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="item in resumo.por_grupo" :key="item.grupo_id">
                      <td>{{ item.grupo_nome || 'Sem Grupo' }}</td>
                      <td class="text-end"><strong>{{ item.total }}</strong></td>
                    </tr>
                    <tr v-if="!resumo.por_grupo || resumo.por_grupo.length === 0">
                      <td colspan="2" class="text-center text-muted">Nenhum dado disponível</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <!-- Chamados por Agente -->
          <div class="chart-card">
            <div class="chart-header">
              <h3>Chamados por Agente</h3>
            </div>
            <div class="chart-body">
              <div class="table-responsive">
                <table class="table">
                  <thead>
                    <tr>
                      <th>Agente</th>
                      <th class="text-end">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="item in resumo.por_agente" :key="item.agente_id">
                      <td>{{ item.agente_nome || 'Sem Agente' }}</td>
                      <td class="text-end"><strong>{{ item.total }}</strong></td>
                    </tr>
                    <tr v-if="!resumo.por_agente || resumo.por_agente.length === 0">
                      <td colspan="2" class="text-center text-muted">Nenhum dado disponível</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <!-- Horas Trabalhadas -->
          <div v-if="resumo.horas_trabalhadas && resumo.horas_trabalhadas.length > 0" class="chart-card full-width">
            <div class="chart-header">
              <h3>Horas Trabalhadas por Agente</h3>
            </div>
            <div class="chart-body">
              <div class="table-responsive">
                <table class="table">
                  <thead>
                    <tr>
                      <th>Agente</th>
                      <th class="text-end">Horas Trabalhadas</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="item in resumo.horas_trabalhadas" :key="item.agente_id">
                      <td>{{ item.agente_nome }}</td>
                      <td class="text-end"><strong>{{ formatarHoras(item.horas) }}</strong></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-else class="empty-state">
        <i class="bi bi-inbox"></i>
        <p>Nenhum dado disponível para exibir.</p>
      </div>
    </div>
  </layout-principal>
</template>

<script setup>
import { ref, onMounted, computed, nextTick, onUnmounted } from 'vue';
import { useDashboardStore } from '../stores/dashboard.js';
import LoadingSpinner from '@/components/shared/LoadingSpinner.vue';
import ErrorMessage from '@/components/shared/ErrorMessage.vue';
import LayoutPrincipal from '@/components/LayoutPrincipal.vue';

// Chart.js será carregado dinamicamente se disponível
let Chart = null;
let ChartRegistered = false;

const loadChart = async () => {
  if (!Chart) {
    try {
      const chartModule = await import('chart.js/auto');
      Chart = chartModule.Chart || chartModule.default?.Chart;
      if (Chart && !ChartRegistered) {
        Chart.register();
        ChartRegistered = true;
      }
    } catch (error) {
      console.warn('Chart.js não disponível:', error);
    }
  }
  return Chart;
};

const dashboardStore = useDashboardStore();

const statusChartCanvas = ref(null);
let statusChart = null;

const loading = computed(() => dashboardStore.loading);
const error = computed(() => dashboardStore.error);
const resumo = computed(() => dashboardStore.resumo);

const filtros = ref({
  data_inicio: null,
  data_fim: null
});

const temFiltrosAtivos = computed(() => {
  return filtros.value.data_inicio || filtros.value.data_fim;
});

const buscarResumo = async () => {
  const filtrosObj = {};
  if (filtros.value.data_inicio) filtrosObj.data_inicio = filtros.value.data_inicio;
  if (filtros.value.data_fim) filtrosObj.data_fim = filtros.value.data_fim;
  
  await dashboardStore.buscarResumo(filtrosObj);
  
  if (resumo.value) {
    await nextTick();
    atualizarGraficos();
  }
};

const limparFiltros = () => {
  filtros.value = {
    data_inicio: null,
    data_fim: null
  };
  dashboardStore.limparFiltros();
  buscarResumo();
};

const formatarHoras = (horas) => {
  if (!horas) return '0h';
  const h = Math.floor(horas);
  const m = Math.floor((horas - h) * 60);
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
};

const atualizarGraficos = async () => {
  const ChartLib = await loadChart();
  if (!ChartLib) return;

  // Gráfico de Status
  if (statusChartCanvas.value && resumo.value?.por_status) {
    const statusData = resumo.value.por_status;
    const labels = Object.keys(statusData);
    const values = Object.values(statusData);

    if (statusChart) {
      statusChart.destroy();
    }

    statusChart = new ChartLib(statusChartCanvas.value, {
      type: 'doughnut',
      data: {
        labels: labels.map(s => s.charAt(0).toUpperCase() + s.slice(1).replace('_', ' ')),
        datasets: [{
          data: values,
          backgroundColor: [
            '#3b82f6', // azul - novo
            '#f59e0b', // amarelo - em_andamento
            '#a3a3a3', // cinza - aguardando
            '#22c55e', // verde - resolvido
            '#737373', // cinza escuro - fechado
            '#ef4444'  // vermelho - cancelado
          ]
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: {
            position: 'bottom'
          }
        }
      }
    });
  }
};

onMounted(async () => {
  await buscarResumo();
});

// Cleanup
onUnmounted(() => {
  if (statusChart) statusChart.destroy();
});
</script>

<style scoped>
.dashboard-container {
  max-width: 1400px;
  margin: 0 auto;
}

/* Header Filters */
.filters-header {
  display: flex;
  gap: var(--space-2);
  align-items: center;
}

.filters-header .form-control {
  max-width: 180px;
}

/* Metrics Grid */
.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: var(--space-4);
  margin-bottom: var(--space-6);
}

.metric-card {
  background: var(--color-bg-primary);
  border: 1px solid var(--color-border-medium);
  border-radius: var(--radius-lg);
  padding: var(--space-5);
  display: flex;
  align-items: center;
  gap: var(--space-4);
  transition: all var(--transition-base);
  position: relative;
  overflow: hidden;
}

.metric-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 4px;
  height: 100%;
  background: currentColor;
}

.metric-card:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}

.metric-icon {
  width: 56px;
  height: 56px;
  border-radius: var(--radius-base);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.75rem;
  flex-shrink: 0;
  transition: transform var(--transition-base);
}

.metric-card:hover .metric-icon {
  transform: scale(1.1);
}

.metric-content {
  flex: 1;
}

.metric-label {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-secondary);
  margin-bottom: var(--space-1);
  text-transform: uppercase;
  letter-spacing: var(--letter-spacing-wide);
}

.metric-value {
  font-size: var(--font-size-3xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
  line-height: 1;
}

/* Metric Variants */
.metric-primary {
  color: var(--color-primary);
}

.metric-primary .metric-icon {
  background: var(--color-primary-light);
  color: var(--color-primary);
}

.metric-info {
  color: var(--color-info-600);
}

.metric-info .metric-icon {
  background: var(--color-info-50);
  color: var(--color-info-600);
}

.metric-success {
  color: var(--color-success-600);
}

.metric-success .metric-icon {
  background: var(--color-success-50);
  color: var(--color-success-600);
}

.metric-danger {
  color: var(--color-danger-600);
}

.metric-danger .metric-icon {
  background: var(--color-danger-50);
  color: var(--color-danger-600);
}

/* Charts Grid */
.charts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(500px, 1fr));
  gap: var(--space-4);
}

.chart-card {
  background: var(--color-bg-primary);
  border: 1px solid var(--color-border-medium);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  overflow: hidden;
}

.chart-card.full-width {
  grid-column: 1 / -1;
}

.chart-header {
  padding: var(--space-5) var(--space-6);
  border-bottom: 1px solid var(--color-border-medium);
}

.chart-header h3 {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  margin: 0;
}

.chart-body {
  padding: var(--space-6);
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: var(--space-16) var(--space-8);
  color: var(--color-text-muted);
}

.empty-state i {
  font-size: 4rem;
  opacity: 0.3;
  margin-bottom: var(--space-4);
}

.empty-state p {
  font-size: var(--font-size-lg);
  margin: 0;
}

/* Responsividade */
@media (max-width: 1024px) {
  .charts-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .metrics-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .filters-header {
    flex-direction: column;
    width: 100%;
  }
  
  .filters-header .form-control,
  .filters-header .btn {
    max-width: 100%;
    width: 100%;
  }
  
  .metric-value {
    font-size: var(--font-size-2xl);
  }
}

@media (max-width: 480px) {
  .metrics-grid {
    grid-template-columns: 1fr;
  }
}
</style>
