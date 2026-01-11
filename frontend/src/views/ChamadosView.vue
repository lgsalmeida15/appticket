<template>
  <layout-principal>
    <template #header-actions>
      <button class="btn btn-primary" @click="irParaNovoChamado">
        <i class="bi bi-plus-circle"></i>
        Novo Chamado
      </button>
    </template>

    <div class="chamados-view">
      <!-- Estatísticas -->
      <ChamadoEstatisticas :estatisticas="estatisticas" />

      <!-- Filtros -->
      <ChamadoFiltros
        :filtros="filtros"
        :grupos="grupos"
        :usuarios="usuarios"
        :is-admin="isAdmin"
        @update:busca="handleBuscaUpdate"
        @toggle-filtro="toggleFiltro"
        @update:responsavel="handleResponsavelUpdate"
        @limpar-filtros="limparFiltros"
      />

      <!-- Lista de Chamados -->
      <ChamadoLista
        :chamados="chamados"
        :loading="loading"
        :pagination="pagination"
        @visualizar="visualizarChamado"
        @mudar-pagina="mudarPagina"
      />
    </div>
  </layout-principal>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useChamadosStore } from '@/stores/chamados';
import { useGruposStore } from '@/stores/grupos';
import { useUsuariosStore } from '@/stores/usuarios';
import { useAuthStore } from '@/stores/auth';
import LayoutPrincipal from '@/components/LayoutPrincipal.vue';
import ChamadoEstatisticas from '@/components/chamado/ChamadoEstatisticas.vue';
import ChamadoFiltros from '@/components/chamado/ChamadoFiltros.vue';
import ChamadoLista from '@/components/chamado/ChamadoLista.vue';

const router = useRouter();

const chamadosStore = useChamadosStore();
const gruposStore = useGruposStore();
const usuariosStore = useUsuariosStore();
const authStore = useAuthStore();

// Estados
const loading = computed(() => chamadosStore.loading);
const chamados = computed(() => chamadosStore.chamados);
const pagination = computed(() => chamadosStore.pagination);
const estatisticas = computed(() => chamadosStore.estatisticas);
const grupos = computed(() => gruposStore.grupos.filter(g => g.ativo !== false));
const usuarios = computed(() => usuariosStore.usuarios.filter(u => u.ativo !== false));
const isAdmin = computed(() => authStore.isAdmin);

// Carregar filtros do localStorage
const carregarFiltrosSalvos = () => {
  try {
    const filtrosSalvos = localStorage.getItem('chamados_filtros');
    if (filtrosSalvos) {
      const filtros = JSON.parse(filtrosSalvos);
      // Garantir que apenas status abertos estejam no array padrão
      if (!filtros.status || filtros.status.length === 0) {
        filtros.status = ['novo', 'em_andamento', 'aguardando'];
      } else {
        // Remover status fechados e aberto se estiverem presentes
        filtros.status = filtros.status.filter(s => 
          !['resolvido', 'fechado', 'cancelado', 'aberto'].includes(s)
        );
        // Se após filtrar não houver status, usar padrão
        if (filtros.status.length === 0) {
          filtros.status = ['novo', 'em_andamento', 'aguardando'];
        }
      }
      // Garantir que atribuido_a seja null se não existir
      if (filtros.atribuido_a === undefined) {
        filtros.atribuido_a = null;
      }
      return filtros;
    }
  } catch (error) {
    console.error('Erro ao carregar filtros salvos:', error);
  }
  return {
    search: '',
    status: ['novo', 'em_andamento', 'aguardando'], // Apenas status abertos por padrão
    prioridade: [],
    tipo: [],
    grupo_id: [],
    atribuido_a: null
  };
};

const filtros = ref(carregarFiltrosSalvos());

// Salvar filtros no localStorage sempre que mudarem
watch(filtros, (novosFiltros) => {
  try {
    localStorage.setItem('chamados_filtros', JSON.stringify(novosFiltros));
  } catch (error) {
    console.error('Erro ao salvar filtros:', error);
  }
}, { deep: true });

// Funções
const buscarChamados = async () => {
  try {
    // Filtrar apenas chamados abertos (excluir resolvido, fechado, cancelado e aberto)
    const statusAbertos = ['novo', 'em_andamento', 'aguardando'];
    
    // Preparar filtros, garantindo que sempre tenha status abertos por padrão
    const filtrosComStatus = {
      ...filtros.value
    };
    
    // Se não há filtro de status ou está vazio, aplicar filtro padrão de status abertos
    if (!filtros.value.status || filtros.value.status.length === 0) {
      filtrosComStatus.status = statusAbertos;
    }
    
    await chamadosStore.listarChamados(filtrosComStatus);
  } catch (err) {
    console.error('Erro ao buscar chamados:', err);
  }
};

const limparFiltros = () => {
  filtros.value = {
    search: '',
    status: ['novo', 'em_andamento', 'aguardando'], // Apenas status abertos por padrão
    prioridade: [],
    tipo: [],
    grupo_id: [],
    atribuido_a: null
  };
  buscarChamados();
};

const handleBuscaUpdate = (valor) => {
  filtros.value.search = valor;
  buscarChamados();
};

const handleResponsavelUpdate = (valor) => {
  filtros.value.atribuido_a = valor ? parseInt(valor) : null;
  buscarChamados();
};

const toggleFiltro = ({ campo, valor }) => {
  const statusAbertos = ['novo', 'em_andamento', 'aguardando'];
  
  const index = filtros.value[campo].indexOf(valor);
  if (index === -1) {
    filtros.value[campo].push(valor);
  } else {
    filtros.value[campo].splice(index, 1);
    
    // Se for status e ficar vazio, aplicar padrão de status abertos
    if (campo === 'status' && filtros.value[campo].length === 0) {
      filtros.value[campo] = [...statusAbertos];
    }
  }
  buscarChamados();
};

const carregarEstatisticas = async () => {
  try {
    await chamadosStore.buscarEstatisticas();
  } catch (err) {
    console.error('Erro ao carregar estatísticas:', err);
  }
};

const irParaNovoChamado = () => {
  router.push({ name: 'chamado-new' });
};

const visualizarChamado = async (chamado) => {
  router.push({ 
    name: 'chamado-view', 
    params: { id: chamado.id } 
  });
};

const mudarPagina = async (page) => {
  if (page < 1 || page > pagination.value.totalPages) return;
  filtros.value.page = page;
  await buscarChamados();
};

// Lifecycle
onMounted(async () => {
  try {
    // Carregar grupos
    if (authStore.isAgente) {
      await gruposStore.meusGrupos();
    } else {
      await gruposStore.listarGrupos({ limit: 1000, ativo: true });
    }
    
    // Carregar usuários apenas se for admin
    if (authStore.isAdmin) {
      await usuariosStore.listarUsuarios({ limit: 1000, ativo: true });
    }
    
    // Carregar chamados e estatísticas
    await Promise.all([
      buscarChamados(),
      carregarEstatisticas()
    ]);
  } catch (error) {
    console.error('Erro ao carregar dados iniciais:', error);
  }
});
</script>

<style scoped>
.chamados-view {
  max-width: 1200px;
  margin: 0 auto;
}
</style>
