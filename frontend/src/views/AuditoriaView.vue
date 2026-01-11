<template>
  <layout-principal>
    <div class="auditoria-container">
      <!-- Filtros -->
      <div class="filters-card">
        <div class="filters-grid">
          <div class="filter-group">
            <label class="filter-label">Usuário ID</label>
            <input
              v-model="filtros.usuario_id"
              type="number"
              class="form-control"
              placeholder="ID do usuário"
            />
          </div>

          <div class="filter-group">
            <label class="filter-label">Entidade</label>
            <select v-model="filtros.entidade" class="form-select">
              <option value="">Todas</option>
              <option value="Chamado">Chamado</option>
              <option value="Usuario">Usuário</option>
              <option value="Grupo">Grupo</option>
              <option value="SLA">SLA</option>
            </select>
          </div>

          <div class="filter-group">
            <label class="filter-label">Ação</label>
            <select v-model="filtros.acao" class="form-select">
              <option value="">Todas</option>
              <option value="login">Login</option>
              <option value="logout">Logout</option>
              <option value="criar">Criar</option>
              <option value="atualizar">Atualizar</option>
              <option value="deletar">Deletar</option>
            </select>
          </div>

          <div class="filter-group">
            <label class="filter-label">Data Início</label>
            <input
              v-model="filtros.data_inicio"
              type="date"
              class="form-control"
            />
          </div>

          <div class="filter-group">
            <label class="filter-label">Data Fim</label>
            <input
              v-model="filtros.data_fim"
              type="date"
              class="form-control"
            />
          </div>

          <div class="filter-actions">
            <label class="filter-label">&nbsp;</label>
            <button class="btn btn-primary" @click="buscarLogs">
              <i class="bi bi-search"></i>
              Buscar
            </button>
            <button class="btn btn-outline-secondary" @click="limparFiltros">
              <i class="bi bi-x-circle"></i>
              Limpar
            </button>
          </div>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="loading-container">
        <div class="spinner-border text-primary"></div>
        <p>Carregando logs...</p>
      </div>

      <!-- Erro -->
      <div v-else-if="error" class="alert alert-danger">
        {{ error }}
      </div>

      <!-- Tabela de Logs -->
      <div v-else class="logs-table-container">
        <table class="table">
          <thead>
            <tr>
              <th>Data/Hora</th>
              <th>Usuário</th>
              <th>Entidade</th>
              <th>ID Entidade</th>
              <th>Ação</th>
              <th>Detalhes</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="log in logs" :key="log.id">
              <td>
                <div class="log-time">
                  <i class="bi bi-clock"></i>
                  {{ formatarData(log.data) }}
                </div>
              </td>
              <td>
                <div class="log-user">
                  <strong>{{ log.usuario?.nome || `ID: ${log.usuario_id}` }}</strong>
                  <small v-if="log.usuario?.email">{{ log.usuario.email }}</small>
                </div>
              </td>
              <td>
                <span class="entity-badge">{{ log.entidade }}</span>
              </td>
              <td>{{ log.entidade_id || '-' }}</td>
              <td>
                <span :class="['action-badge', getAcaoClass(log.acao)]">
                  {{ formatarAcao(log.acao) }}
                </span>
              </td>
              <td>
                <button
                  class="btn btn-sm btn-outline-primary"
                  @click="verDetalhes(log)"
                >
                  <i class="bi bi-eye"></i>
                  Ver Detalhes
                </button>
              </td>
            </tr>
            <tr v-if="logs.length === 0">
              <td colspan="6" class="empty-cell">
                <div class="empty-state">
                  <i class="bi bi-journal-text"></i>
                  <p>Nenhum log encontrado</p>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <!-- Paginação -->
        <div v-if="pagination.totalPages > 1" class="pagination-footer">
          <div class="pagination-info">
            Mostrando {{ (pagination.page - 1) * pagination.limit + 1 }} a
            {{ Math.min(pagination.page * pagination.limit, pagination.total) }}
            de {{ pagination.total }} registros
          </div>

          <nav class="pagination-container">
            <ul class="pagination-modern">
              <li :class="{ disabled: pagination.page === 1 }">
                <button
                  class="page-btn"
                  @click="irParaPagina(pagination.page - 1)"
                  :disabled="pagination.page === 1"
                >
                  <i class="bi bi-chevron-left"></i>
                  Anterior
                </button>
              </li>
              <li
                v-for="page in pagination.totalPages"
                :key="page"
                :class="{ active: page === pagination.page }"
              >
                <button class="page-number" @click="irParaPagina(page)">
                  {{ page }}
                </button>
              </li>
              <li :class="{ disabled: pagination.page === pagination.totalPages }">
                <button
                  class="page-btn"
                  @click="irParaPagina(pagination.page + 1)"
                  :disabled="pagination.page === pagination.totalPages"
                >
                  Próxima
                  <i class="bi bi-chevron-right"></i>
                </button>
              </li>
            </ul>
          </nav>
        </div>
      </div>

      <!-- Modal Detalhes -->
      <div class="modal fade" id="modalDetalhes" tabindex="-1" ref="modalDetalhes">
        <div class="modal-dialog modal-lg">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">Detalhes do Log</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body" v-if="logSelecionado">
              <div class="details-grid">
                <div class="detail-item">
                  <strong>Data/Hora:</strong>
                  <p>{{ formatarData(logSelecionado.data) }}</p>
                </div>
                <div class="detail-item">
                  <strong>Usuário:</strong>
                  <p>{{ logSelecionado.usuario?.nome || `ID: ${logSelecionado.usuario_id}` }}</p>
                </div>
                <div class="detail-item">
                  <strong>Entidade:</strong>
                  <p>{{ logSelecionado.entidade }}</p>
                </div>
                <div class="detail-item">
                  <strong>ID Entidade:</strong>
                  <p>{{ logSelecionado.entidade_id || '-' }}</p>
                </div>
              </div>

              <div class="detail-item full-width">
                <strong>Ação:</strong>
                <p>
                  <span :class="['action-badge', getAcaoClass(logSelecionado.acao)]">
                    {{ formatarAcao(logSelecionado.acao) }}
                  </span>
                </p>
              </div>

              <div class="detail-item full-width" v-if="logSelecionado.dados_anteriores">
                <strong>Dados Anteriores:</strong>
                <pre class="json-preview"><code>{{ formatarJSON(logSelecionado.dados_anteriores) }}</code></pre>
              </div>

              <div class="detail-item full-width" v-if="logSelecionado.dados_novos">
                <strong>Dados Novos:</strong>
                <pre class="json-preview"><code>{{ formatarJSON(logSelecionado.dados_novos) }}</code></pre>
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
    </div>
  </layout-principal>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { Modal } from 'bootstrap';
import auditoriaService from '../services/auditoriaService.js';
import LayoutPrincipal from '@/components/LayoutPrincipal.vue';

const loading = ref(false);
const error = ref(null);
const logs = ref([]);
const logSelecionado = ref(null);

const pagination = ref({
  page: 1,
  limit: 20,
  total: 0,
  totalPages: 0
});

const filtros = ref({
  usuario_id: '',
  entidade: '',
  acao: '',
  data_inicio: '',
  data_fim: ''
});

const modalDetalhes = ref(null);
let modalInstance = null;

const buscarLogs = async () => {
  loading.value = true;
  error.value = null;
  
  try {
    const params = {
      page: pagination.value.page,
      limit: pagination.value.limit,
      ...filtros.value
    };
    
    Object.keys(params).forEach(key => {
      if (params[key] === '' || params[key] === null) {
        delete params[key];
      }
    });
    
    const response = await auditoriaService.listar(params);
    logs.value = response.logs || [];
    pagination.value = {
      page: response.page || 1,
      limit: response.limit || 20,
      total: response.total || 0,
      totalPages: response.totalPages || 0
    };
  } catch (err) {
    error.value = err.response?.data?.error?.message || err.message || 'Erro ao buscar logs';
  } finally {
    loading.value = false;
  }
};

const limparFiltros = () => {
  filtros.value = {
    usuario_id: '',
    entidade: '',
    acao: '',
    data_inicio: '',
    data_fim: ''
  };
  pagination.value.page = 1;
  buscarLogs();
};

const irParaPagina = (page) => {
  pagination.value.page = page;
  buscarLogs();
};

const verDetalhes = (log) => {
  logSelecionado.value = log;
  if (modalInstance) {
    modalInstance.show();
  }
};

const formatarData = (data) => {
  if (!data) return '-';
  const date = new Date(data);
  return date.toLocaleString('pt-BR');
};

const formatarAcao = (acao) => {
  const map = {
    login: 'Login',
    logout: 'Logout',
    criar: 'Criar',
    atualizar: 'Atualizar',
    deletar: 'Deletar'
  };
  return map[acao] || acao;
};

const getAcaoClass = (acao) => {
  const map = {
    login: 'action-success',
    logout: 'action-secondary',
    criar: 'action-primary',
    atualizar: 'action-info',
    deletar: 'action-danger'
  };
  return map[acao] || 'action-secondary';
};

const formatarJSON = (obj) => {
  if (!obj) return '';
  return JSON.stringify(obj, null, 2);
};

onMounted(async () => {
  if (modalDetalhes.value) {
    modalInstance = new Modal(modalDetalhes.value);
  }
  
  await buscarLogs();
});
</script>

<style scoped>
.auditoria-container {
  max-width: 1400px;
  margin: 0 auto;
}

/* Filters Card */
.filters-card {
  background: var(--color-bg-primary);
  border: 1px solid var(--color-border-medium);
  border-radius: var(--radius-lg);
  padding: var(--space-5);
  margin-bottom: var(--space-6);
  box-shadow: var(--shadow-sm);
}

.filters-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--space-4);
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.filter-actions {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.filter-actions .btn {
  width: 100%;
}

.filter-label {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-secondary);
}

/* Loading */
.loading-container {
  text-align: center;
  padding: var(--space-12) 0;
}

.loading-container p {
  margin-top: var(--space-4);
  color: var(--color-text-secondary);
}

/* Table Container */
.logs-table-container {
  background: var(--color-bg-primary);
  border: 1px solid var(--color-border-medium);
  border-radius: var(--radius-lg);
  overflow: hidden;
  box-shadow: var(--shadow-sm);
}

/* Table Styles */
.log-time {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

.log-time i {
  color: var(--color-text-tertiary);
}

.log-user {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.log-user strong {
  font-size: var(--font-size-sm);
  color: var(--color-text-primary);
}

.log-user small {
  font-size: var(--font-size-xs);
  color: var(--color-text-tertiary);
}

.entity-badge {
  display: inline-flex;
  padding: var(--space-1) var(--space-3);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  background: var(--color-gray-100);
  color: var(--color-gray-700);
  border-radius: var(--radius-base);
}

.action-badge {
  display: inline-flex;
  padding: var(--space-1) var(--space-3);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  border-radius: var(--radius-full);
}

.action-success {
  background: var(--color-success-50);
  color: var(--color-success-700);
}

.action-secondary {
  background: var(--color-gray-100);
  color: var(--color-gray-700);
}

.action-primary {
  background: var(--color-brand-100);
  color: var(--color-brand-700);
}

.action-info {
  background: var(--color-info-50);
  color: var(--color-info-700);
}

.action-danger {
  background: var(--color-danger-50);
  color: var(--color-danger-700);
}

/* Empty State */
.empty-cell {
  padding: 0 !important;
}

.empty-state {
  text-align: center;
  padding: var(--space-12) var(--space-8);
  color: var(--color-text-muted);
}

.empty-state i {
  font-size: 3rem;
  opacity: 0.3;
  margin-bottom: var(--space-3);
}

.empty-state p {
  font-size: var(--font-size-base);
  margin: 0;
}

/* Pagination Footer */
.pagination-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-4) var(--space-6);
  border-top: 1px solid var(--color-border-medium);
  background: var(--color-bg-tertiary);
}

.pagination-info {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

.pagination-container {
  display: flex;
  justify-content: center;
}

.pagination-modern {
  display: flex;
  gap: var(--space-2);
  list-style: none;
  padding: 0;
  margin: 0;
  align-items: center;
}

.page-btn,
.page-number {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  min-width: 40px;
  height: 40px;
  padding: 0 var(--space-3);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-secondary);
  background: var(--color-bg-primary);
  border: 1px solid var(--color-border-medium);
  border-radius: var(--radius-base);
  cursor: pointer;
  transition: all var(--transition-base);
}

.page-btn:hover:not(:disabled),
.page-number:hover:not(:disabled) {
  background: var(--color-bg-tertiary);
  color: var(--color-text-primary);
}

li.active .page-number {
  background: var(--color-primary);
  color: white;
  border-color: var(--color-primary);
}

.page-btn:disabled,
li.disabled .page-btn {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Modal Details */
.details-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-4);
  margin-bottom: var(--space-4);
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.detail-item.full-width {
  grid-column: 1 / -1;
}

.detail-item strong {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-secondary);
}

.detail-item p {
  margin: 0;
  color: var(--color-text-primary);
}

.json-preview {
  background: var(--color-bg-tertiary);
  padding: var(--space-4);
  border-radius: var(--radius-base);
  max-height: 300px;
  overflow-y: auto;
  font-size: var(--font-size-sm);
  font-family: var(--font-mono);
  line-height: var(--line-height-relaxed);
}

.json-preview code {
  color: var(--color-text-primary);
  background: transparent;
}

/* Responsividade */
@media (max-width: 768px) {
  .filters-grid {
    grid-template-columns: 1fr;
  }
  
  .pagination-footer {
    flex-direction: column;
    gap: var(--space-4);
    align-items: flex-start;
  }
  
  .details-grid {
    grid-template-columns: 1fr;
  }
}
</style>
