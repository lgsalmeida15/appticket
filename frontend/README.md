# Frontend - AppTicket

Interface web do sistema de gerenciamento de chamados.

## 🚀 Tecnologias

- Vue.js 3 (Composition API)
- Vue Router
- Pinia (State Management)
- Bootstrap 5
- Bootstrap Icons
- Axios
- Vite

## 📁 Estrutura

```
frontend/
├── public/              # Arquivos estáticos
├── src/
│   ├── assets/         # CSS, imagens
│   ├── components/     # Componentes reutilizáveis
│   ├── router/         # Configuração de rotas
│   ├── stores/         # Stores do Pinia
│   ├── views/          # Páginas/Views
│   ├── App.vue         # Componente raiz
│   └── main.js         # Entry point
├── index.html
├── vite.config.js
└── package.json
```

## 🛠️ Scripts

```bash
npm run dev        # Servidor de desenvolvimento
npm run build      # Build para produção
npm run preview    # Preview do build
npm run lint       # Executar linter
```

## 🎨 Páginas

### Públicas
- `/` - Home/Landing page
- `/login` - Página de login
- `/cadastro` - Página de cadastro

### Privadas (requer autenticação)
- `/chamados` - Lista de chamados
- `/chamados/:id` - Detalhes do chamado
- `/usuarios` - Gerenciamento de usuários (admin)
- `/grupos` - Gerenciamento de grupos (admin)

## 🔐 Autenticação

O sistema utiliza JWT armazenado no `localStorage`:

```javascript
// Login
await authStore.login({ email, password })

// Logout
authStore.logout()

// Verificar se está autenticado
authStore.isAuthenticated
```

## 📊 Stores (Pinia)

### Auth Store
```javascript
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()

// Estado
authStore.user          // Usuário logado
authStore.token         // JWT token
authStore.isAuthenticated // Boolean

// Ações
authStore.login(credentials)
authStore.register(userData)
authStore.logout()
```

## 🎨 Componentes

### Layout
- `Navbar` - Barra de navegação
- `Sidebar` - Menu lateral
- `Footer` - Rodapé

### Formulários
- `FormInput` - Input personalizado
- `FormSelect` - Select personalizado
- `FormTextarea` - Textarea personalizado

### Chamados
- `ChamadoCard` - Card de chamado
- `ChamadoList` - Lista de chamados
- `ChamadoForm` - Formulário de chamado
- `ChamadoDetalhes` - Detalhes do chamado

## 🎨 Estilos

O projeto usa Bootstrap 5 com customizações em `assets/main.css`:

```css
/* Variáveis CSS */
--primary-color: #0d6efd;
--secondary-color: #6c757d;
--success-color: #198754;
--danger-color: #dc3545;
```

## 🌐 API

Configuração do Axios em desenvolvimento com proxy (vite.config.js):

```javascript
proxy: {
  '/api': {
    target: 'http://localhost:3000',
    changeOrigin: true
  }
}
```

## 📱 Responsividade

O layout é totalmente responsivo usando classes do Bootstrap:

- Mobile: < 768px
- Tablet: 768px - 992px
- Desktop: > 992px

## 🧪 Desenvolvimento

### Modo Hot Reload
```bash
npm run dev
```

O Vite fornece hot module replacement (HMR) para desenvolvimento rápido.

### Build de Produção
```bash
npm run build
npm run preview
```

### Estrutura de Componentes

Use Composition API:

```vue
<template>
  <div>{{ message }}</div>
</template>

<script setup>
import { ref } from 'vue'

const message = ref('Hello Vue!')
</script>

<style scoped>
/* Estilos do componente */
</style>
```

## 🔧 Configuração

### Environment Variables

Crie `.env.local` para configurações locais:

```env
VITE_API_URL=http://localhost:3000
```

Acesse com:
```javascript
import.meta.env.VITE_API_URL
```

## 📚 Recursos

- [Vue.js Docs](https://vuejs.org/)
- [Vue Router Docs](https://router.vuejs.org/)
- [Pinia Docs](https://pinia.vuejs.org/)
- [Bootstrap Docs](https://getbootstrap.com/)
- [Vite Docs](https://vitejs.dev/)

