import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import router from './router';

// Importar Bootstrap CSS e JS
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import * as bootstrap from 'bootstrap';

// Tornar Bootstrap disponível globalmente
window.bootstrap = bootstrap;

// Importar Design System (ordem importa!)
import './assets/design-tokens.css';    // 1. Tokens primeiro
import './assets/typography.css';        // 2. Tipografia
import './assets/global.css';            // 3. Estilos globais
import './assets/main.css';              // 4. Estilos personalizados legados

// Configurar VeeValidate
import veevalidate from './plugins/veevalidate.js';

const app = createApp(App);

app.use(createPinia());
app.use(router);
app.use(veevalidate);

app.mount('#app');

