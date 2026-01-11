# 🎨 Design System - AppTicket SaaS

Sistema de design profissional inspirado em ferramentas SaaS B2B top de mercado como Linear, Zendesk, Jira, Notion e Vercel.

## 📋 Índice

- [Visão Geral](#visão-geral)
- [Tipografia](#tipografia)
- [Cores](#cores)
- [Espaçamentos](#espaçamentos)
- [Componentes Base](#componentes-base)
- [Layout](#layout)
- [Como Usar](#como-usar)

---

## 🎯 Visão Geral

O Design System do AppTicket foi criado para proporcionar uma experiência visual consistente, moderna e profissional em toda a aplicação. Todos os tokens de design estão centralizados em arquivos CSS reutilizáveis.

### Arquitetura

```
frontend/src/assets/
├── design-tokens.css    # Tokens de design (cores, espaçamentos, etc)
├── typography.css       # Sistema tipográfico completo
├── global.css          # Estilos globais e componentes base
└── main.css            # Estilos personalizados legados
```

---

## ✍️ Tipografia

### Font Family

```css
--font-primary: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
--font-mono: 'JetBrains Mono', 'Fira Code', 'Courier New', monospace;
```

### Escala de Tamanhos

Baseada em escala modular (1.250 - Major Third):

```css
--font-size-xs: 0.75rem;      /* 12px */
--font-size-sm: 0.875rem;     /* 14px */
--font-size-base: 1rem;       /* 16px */
--font-size-md: 1.125rem;     /* 18px */
--font-size-lg: 1.25rem;      /* 20px */
--font-size-xl: 1.5rem;       /* 24px */
--font-size-2xl: 1.875rem;    /* 30px */
--font-size-3xl: 2.25rem;     /* 36px */
--font-size-4xl: 3rem;        /* 48px */
```

### Font Weights

```css
--font-weight-normal: 400;
--font-weight-medium: 500;
--font-weight-semibold: 600;
--font-weight-bold: 700;
```

### Uso em HTML

```html
<h1>Título Principal</h1>
<h2>Título Secundário</h2>
<p class="text-lg">Texto grande</p>
<p class="text-base">Texto normal</p>
<p class="text-sm">Texto pequeno</p>
<span class="text-xs text-muted">Texto auxiliar</span>
```

---

## 🎨 Cores

### Brand Colors (Roxo)

```css
--color-primary: #7e22ce;
--color-primary-hover: #6b21a8;
--color-primary-active: #581c87;
--color-primary-light: #e9d5ff;
```

### Cores Neutras

```css
--color-gray-50: #fafafa;
--color-gray-100: #f5f5f5;
--color-gray-200: #e5e5e5;
--color-gray-300: #d4d4d4;
--color-gray-400: #a3a3a3;
--color-gray-500: #737373;
--color-gray-600: #525252;
--color-gray-700: #404040;
--color-gray-800: #262626;
--color-gray-900: #171717;
```

### Cores Semânticas

```css
/* Success (Verde) */
--color-success-50: #f0fdf4;
--color-success-500: #22c55e;
--color-success-600: #16a34a;
--color-success-700: #15803d;

/* Warning (Amarelo) */
--color-warning-50: #fffbeb;
--color-warning-500: #f59e0b;
--color-warning-600: #d97706;
--color-warning-700: #b45309;

/* Danger (Vermelho) */
--color-danger-50: #fef2f2;
--color-danger-500: #ef4444;
--color-danger-600: #dc2626;
--color-danger-700: #b91c1c;

/* Info (Azul) */
--color-info-50: #eff6ff;
--color-info-500: #3b82f6;
--color-info-600: #2563eb;
--color-info-700: #1d4ed8;
```

### Cores de Texto

```css
--color-text-primary: #171717;
--color-text-secondary: #525252;
--color-text-tertiary: #737373;
--color-text-muted: #a3a3a3;
```

### Cores de Background

```css
--color-bg-primary: #ffffff;
--color-bg-secondary: #fafafa;
--color-bg-tertiary: #f5f5f5;
```

---

## 📏 Espaçamentos

Sistema baseado em múltiplos de 4px:

```css
--space-0: 0;
--space-1: 0.25rem;   /* 4px */
--space-2: 0.5rem;    /* 8px */
--space-3: 0.75rem;   /* 12px */
--space-4: 1rem;      /* 16px */
--space-5: 1.25rem;   /* 20px */
--space-6: 1.5rem;    /* 24px */
--space-8: 2rem;      /* 32px */
--space-10: 2.5rem;   /* 40px */
--space-12: 3rem;     /* 48px */
--space-16: 4rem;     /* 64px */
--space-20: 5rem;     /* 80px */
--space-24: 6rem;     /* 96px */
```

---

## 🧩 Componentes Base

### BaseButton

Botão reutilizável com múltiplas variantes.

```vue
<BaseButton variant="primary" size="base" @click="handleClick">
  Salvar
</BaseButton>

<BaseButton variant="outline-primary" icon="plus-circle">
  Adicionar
</BaseButton>

<BaseButton variant="danger" :loading="isLoading">
  Excluir
</BaseButton>
```

**Props:**
- `variant`: primary | secondary | success | danger | warning | info | outline-primary | outline-secondary | ghost
- `size`: sm | base | lg
- `icon`: nome do ícone Bootstrap Icons
- `loading`: boolean
- `disabled`: boolean
- `block`: boolean (largura total)

### BaseCard

Card moderno com header, body e footer.

```vue
<BaseCard title="Título do Card" subtitle="Subtítulo opcional" elevated hoverable>
  <template #actions>
    <BaseButton variant="ghost" icon="three-dots"></BaseButton>
  </template>
  
  <!-- Conteúdo -->
  <p>Conteúdo do card</p>
  
  <template #footer>
    <BaseButton variant="primary">Confirmar</BaseButton>
  </template>
</BaseCard>
```

**Props:**
- `title`: string
- `subtitle`: string
- `elevated`: boolean (sombra elevada)
- `hoverable`: boolean (efeito hover)
- `padding`: none | sm | normal | lg
- `border`: primary | success | warning | danger | info

### BaseBadge

Badge para indicadores de status.

```vue
<BaseBadge variant="success">Ativo</BaseBadge>
<BaseBadge variant="warning" dot>Em andamento</BaseBadge>
<BaseBadge variant="primary" icon="check-circle">Concluído</BaseBadge>
<BaseBadge variant="danger" outline>Urgente</BaseBadge>
```

**Props:**
- `variant`: primary | secondary | success | danger | warning | info | gray
- `size`: sm | base | lg
- `dot`: boolean (adiciona ponto indicador)
- `icon`: nome do ícone Bootstrap Icons
- `outline`: boolean (versão outline)

---

## 🏗️ Layout

### LayoutPrincipal

Layout principal com sidebar fixa e header superior.

```vue
<template>
  <LayoutPrincipal>
    <template #header-actions>
      <BaseButton variant="primary" icon="plus-circle">
        Novo Item
      </BaseButton>
    </template>
    
    <!-- Conteúdo da página -->
    <div class="page-content">
      <!-- Seu conteúdo aqui -->
    </div>
  </LayoutPrincipal>
</template>
```

**Características:**
- Sidebar fixa com navegação
- Header superior sticky
- Responsivo (sidebar colapsa em mobile)
- Menu de usuário integrado
- Suporte a permissões (menu admin)

### Estrutura de Página Recomendada

```vue
<template>
  <LayoutPrincipal>
    <template #header-actions>
      <!-- Ações do header -->
    </template>
    
    <div class="page-container">
      <!-- Estatísticas (se aplicável) -->
      <div class="stats-section">
        <!-- Cards de estatísticas -->
      </div>
      
      <!-- Filtros (se aplicável) -->
      <div class="filters-section">
        <!-- Componente de filtros -->
      </div>
      
      <!-- Conteúdo principal -->
      <div class="main-section">
        <!-- Lista, tabela, kanban, etc -->
      </div>
    </div>
  </LayoutPrincipal>
</template>

<style scoped>
.page-container {
  max-width: 1200px;
  margin: 0 auto;
}
</style>
```

---

## 🚀 Como Usar

### 1. Importar Componentes Base

```javascript
import { BaseButton, BaseCard, BaseBadge } from '@/components/base';
```

### 2. Usar Tokens CSS

```vue
<style scoped>
.custom-element {
  padding: var(--space-4);
  background: var(--color-bg-primary);
  border-radius: var(--radius-base);
  color: var(--color-text-primary);
  font-size: var(--font-size-sm);
  transition: all var(--transition-base);
}

.custom-element:hover {
  box-shadow: var(--shadow-md);
}
</style>
```

### 3. Classes Utilitárias

```html
<!-- Tipografia -->
<p class="text-lg font-semibold">Texto grande e semi-negrito</p>
<span class="text-sm text-muted">Texto pequeno e discreto</span>

<!-- Cores -->
<div class="text-primary">Texto roxo</div>
<div class="text-success">Texto verde</div>
<div class="text-danger">Texto vermelho</div>

<!-- Utilitários -->
<div class="cursor-pointer">Elemento clicável</div>
<div class="truncate">Texto com ellipsis</div>
```

---

## 🎯 Boas Práticas

### ✅ Faça

- Use os tokens de design (variáveis CSS) sempre que possível
- Mantenha consistência visual usando os componentes base
- Siga a hierarquia tipográfica definida
- Use as cores semânticas para feedback (success, warning, danger)
- Aplique espaçamentos consistentes usando os tokens

### ❌ Evite

- Valores hardcoded de cores, espaçamentos ou fontes
- Criar componentes customizados sem necessidade
- Misturar diferentes escalas de espaçamento
- Usar cores fora da paleta definida
- Estilos inline (exceto quando absolutamente necessário)

---

## 📱 Responsividade

O design system é mobile-first e totalmente responsivo:

```css
/* Breakpoints */
@media (max-width: 480px)  { /* Mobile */ }
@media (max-width: 768px)  { /* Tablet */ }
@media (max-width: 1024px) { /* Desktop pequeno */ }
@media (max-width: 1440px) { /* Desktop médio */ }
```

---

## 🔮 Futuro

### Planejado

- [ ] Modo escuro (dark mode)
- [ ] Temas customizáveis
- [ ] Mais componentes base (Input, Select, Modal, etc)
- [ ] Animações e micro-interações
- [ ] Documentação interativa (Storybook)

---

## 📚 Referências

Design inspirado em:
- [Linear](https://linear.app)
- [Zendesk](https://www.zendesk.com)
- [Jira Service Management](https://www.atlassian.com/software/jira/service-management)
- [Notion](https://www.notion.so)
- [Vercel Dashboard](https://vercel.com)

---

**Desenvolvido com ❤️ para o AppTicket**

