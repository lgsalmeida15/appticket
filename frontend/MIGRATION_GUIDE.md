# 🔄 Guia de Migração - Novo Design System

Este guia ajudará você a migrar componentes existentes para o novo Design System do AppTicket.

## 📋 Checklist de Migração

### ✅ Componentes Já Migrados

- [x] `LayoutPrincipal.vue` - Layout principal com sidebar
- [x] `ChamadosView.vue` - View de chamados
- [x] `ChamadoLista.vue` - Lista de chamados (cards modernos)
- [x] `ChamadoEstatisticas.vue` - Cards de estatísticas
- [x] `ChamadoFiltros.vue` - Filtros modernos
- [x] `ChamadoKanban.vue` - Visualização Kanban (novo)
- [x] `App.vue` - Bootstrap overrides

### 🔄 Componentes a Migrar

- [ ] `DashboardView.vue`
- [ ] `UsuariosView.vue`
- [ ] `GruposView.vue`
- [ ] `SLAView.vue`
- [ ] `AuditoriaView.vue`
- [ ] `ChamadoViewPage.vue`
- [ ] `ChamadoNewPage.vue`
- [ ] `ChamadoEditPage.vue`
- [ ] Componentes de formulário
- [ ] Modals

---

## 🎯 Padrões de Migração

### 1. Substituir Botões Bootstrap por BaseButton

**Antes:**
```vue
<button class="btn btn-primary" @click="handleClick">
  <i class="bi bi-plus-circle me-2"></i>
  Novo Item
</button>
```

**Depois:**
```vue
<BaseButton variant="primary" icon="plus-circle" @click="handleClick">
  Novo Item
</BaseButton>
```

### 2. Substituir Cards Bootstrap por BaseCard

**Antes:**
```vue
<div class="card">
  <div class="card-header">
    <h5>Título</h5>
  </div>
  <div class="card-body">
    Conteúdo
  </div>
</div>
```

**Depois:**
```vue
<BaseCard title="Título" elevated>
  Conteúdo
</BaseCard>
```

### 3. Substituir Badges Bootstrap por BaseBadge

**Antes:**
```vue
<span class="badge bg-success">Ativo</span>
<span class="badge bg-danger">Inativo</span>
```

**Depois:**
```vue
<BaseBadge variant="success">Ativo</BaseBadge>
<BaseBadge variant="danger">Inativo</BaseBadge>
```

### 4. Usar Tokens CSS em vez de Classes Bootstrap

**Antes:**
```vue
<style scoped>
.custom-element {
  padding: 1rem;
  margin-bottom: 1.5rem;
  background: #ffffff;
  border-radius: 8px;
  color: #333;
}
</style>
```

**Depois:**
```vue
<style scoped>
.custom-element {
  padding: var(--space-4);
  margin-bottom: var(--space-6);
  background: var(--color-bg-primary);
  border-radius: var(--radius-base);
  color: var(--color-text-primary);
}
</style>
```

### 5. Atualizar Estrutura de Layout

**Antes:**
```vue
<template>
  <layout-principal>
    <div class="container-fluid">
      <div class="row mb-4">
        <div class="col">
          <h2>Título da Página</h2>
        </div>
        <div class="col-auto">
          <button class="btn btn-primary">Ação</button>
        </div>
      </div>
      <!-- Conteúdo -->
    </div>
  </layout-principal>
</template>
```

**Depois:**
```vue
<template>
  <layout-principal>
    <template #header-actions>
      <BaseButton variant="primary">Ação</BaseButton>
    </template>
    
    <div class="page-container">
      <!-- Conteúdo -->
    </div>
  </layout-principal>
</template>

<style scoped>
.page-container {
  max-width: 1200px;
  margin: 0 auto;
}
</style>
```

---

## 📝 Exemplo Completo de Migração

### Antes (Bootstrap puro)

```vue
<template>
  <layout-principal>
    <div class="container-fluid">
      <div class="row mb-4">
        <div class="col">
          <h2><i class="bi bi-people me-2"></i>Usuários</h2>
        </div>
        <div class="col-auto">
          <button class="btn btn-primary" @click="novoUsuario">
            <i class="bi bi-plus-circle me-2"></i>
            Novo Usuário
          </button>
        </div>
      </div>

      <div class="card mb-4">
        <div class="card-body">
          <div class="row g-3">
            <div class="col-md-6">
              <input 
                v-model="busca" 
                type="text" 
                class="form-control" 
                placeholder="Buscar..."
              >
            </div>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-body">
          <table class="table">
            <thead>
              <tr>
                <th>Nome</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="user in usuarios" :key="user.id">
                <td>{{ user.nome }}</td>
                <td>
                  <span :class="user.ativo ? 'badge bg-success' : 'badge bg-danger'">
                    {{ user.ativo ? 'Ativo' : 'Inativo' }}
                  </span>
                </td>
                <td>
                  <button class="btn btn-sm btn-outline-primary" @click="editar(user)">
                    Editar
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </layout-principal>
</template>

<style scoped>
.table th {
  background-color: #f8f9fa;
}
</style>
```

### Depois (Design System)

```vue
<template>
  <layout-principal>
    <template #header-actions>
      <BaseButton variant="primary" icon="plus-circle" @click="novoUsuario">
        Novo Usuário
      </BaseButton>
    </template>

    <div class="usuarios-container">
      <!-- Filtros -->
      <BaseCard class="filters-card">
        <div class="search-wrapper">
          <i class="bi bi-search search-icon"></i>
          <input 
            v-model="busca" 
            type="text" 
            class="search-input" 
            placeholder="Buscar usuários..."
          >
        </div>
      </BaseCard>

      <!-- Lista -->
      <BaseCard elevated>
        <div class="usuarios-list">
          <div 
            v-for="user in usuarios" 
            :key="user.id" 
            class="usuario-item"
          >
            <div class="usuario-info">
              <h4 class="usuario-nome">{{ user.nome }}</h4>
              <p class="usuario-email">{{ user.email }}</p>
            </div>
            
            <div class="usuario-actions">
              <BaseBadge :variant="user.ativo ? 'success' : 'danger'">
                {{ user.ativo ? 'Ativo' : 'Inativo' }}
              </BaseBadge>
              
              <BaseButton 
                variant="outline-primary" 
                size="sm" 
                icon="pencil"
                @click="editar(user)"
              >
                Editar
              </BaseButton>
            </div>
          </div>
        </div>
      </BaseCard>
    </div>
  </layout-principal>
</template>

<script setup>
import { ref } from 'vue';
import { BaseButton, BaseCard, BaseBadge } from '@/components/base';

const busca = ref('');
const usuarios = ref([]);

const novoUsuario = () => {
  // Lógica
};

const editar = (user) => {
  // Lógica
};
</script>

<style scoped>
.usuarios-container {
  max-width: 1200px;
  margin: 0 auto;
}

.filters-card {
  margin-bottom: var(--space-6);
}

.search-wrapper {
  position: relative;
}

.search-icon {
  position: absolute;
  left: var(--space-4);
  top: 50%;
  transform: translateY(-50%);
  color: var(--color-text-tertiary);
}

.search-input {
  width: 100%;
  height: var(--input-height-base);
  padding: 0 var(--space-4) 0 var(--space-12);
  font-size: var(--font-size-sm);
  border: 1.5px solid var(--color-border-medium);
  border-radius: var(--radius-base);
  transition: all var(--transition-base);
}

.search-input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-primary-light);
}

.usuarios-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.usuario-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-4);
  border-radius: var(--radius-base);
  transition: background-color var(--transition-base);
}

.usuario-item:hover {
  background-color: var(--color-bg-tertiary);
}

.usuario-info {
  flex: 1;
}

.usuario-nome {
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  margin: 0 0 var(--space-1) 0;
}

.usuario-email {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  margin: 0;
}

.usuario-actions {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}
</style>
```

---

## 🎨 Paleta de Cores - Referência Rápida

### Quando usar cada cor:

- **Primary (Roxo)**: Ações principais, links, elementos de marca
- **Success (Verde)**: Confirmações, status positivo, sucesso
- **Warning (Amarelo)**: Avisos, atenção necessária, prioridade média
- **Danger (Vermelho)**: Erros, exclusões, prioridade alta, ações destrutivas
- **Info (Azul)**: Informações neutras, dicas, status em andamento
- **Gray**: Status neutro, elementos secundários, texto auxiliar

---

## 🚀 Próximos Passos

1. **Migrar views principais**
   - DashboardView
   - UsuariosView
   - GruposView

2. **Criar componentes de formulário**
   - BaseInput
   - BaseSelect
   - BaseTextarea
   - BaseCheckbox

3. **Melhorar componentes existentes**
   - Adicionar estados de loading
   - Melhorar feedback visual
   - Adicionar animações sutis

4. **Documentação**
   - Criar Storybook
   - Documentar padrões de uso
   - Criar exemplos interativos

---

## 💡 Dicas

- Sempre use os tokens CSS em vez de valores hardcoded
- Mantenha a consistência visual entre páginas
- Teste a responsividade em diferentes tamanhos de tela
- Use os componentes base sempre que possível
- Siga a hierarquia tipográfica definida

---

## 🆘 Problemas Comuns

### Estilos não aplicando

**Solução:** Verifique se os arquivos CSS estão sendo importados no `main.js` na ordem correta:

```javascript
import './assets/design-tokens.css';
import './assets/typography.css';
import './assets/global.css';
import './assets/main.css';
```

### Componentes base não encontrados

**Solução:** Importe corretamente:

```javascript
import { BaseButton, BaseCard, BaseBadge } from '@/components/base';
```

### Conflitos com Bootstrap

**Solução:** Os overrides do Bootstrap no `App.vue` devem resolver a maioria dos conflitos. Se persistir, use `!important` apenas quando necessário.

---

**Boa migração! 🎉**

