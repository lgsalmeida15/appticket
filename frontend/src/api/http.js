import axios from 'axios';
import { useAuthStore } from '../stores/auth.js';

/**
 * Instância do Axios configurada com interceptors
 * Centraliza todas as requisições HTTP
 */
const http = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
});

/**
 * Interceptor de requisição
 * Adiciona token de autenticação automaticamente
 */
http.interceptors.request.use(
  (config) => {
    const authStore = useAuthStore();
    const token = authStore.token;

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Interceptor de resposta
 * Trata erros globais (401, 403, 500, etc)
 */
http.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    const authStore = useAuthStore();

    // Se erro 401 (não autorizado), deslogar usuário
    if (error.response?.status === 401) {
      authStore.logout();
      
      // Redirecionar para login apenas se não estiver já na rota de login
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }

    // Se erro 403 (proibido), mostrar mensagem
    if (error.response?.status === 403) {
      console.error('Acesso negado:', error.response.data);
    }

    // Retornar erro para ser tratado pelo chamador
    return Promise.reject(error);
  }
);

export default http;

