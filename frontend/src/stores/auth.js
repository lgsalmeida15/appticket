import { defineStore } from 'pinia';
import authService from '../services/authService.js';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: JSON.parse(localStorage.getItem('user')) || null,
    token: localStorage.getItem('token') || null,
    loading: false,
    error: null
  }),

  getters: {
    isAuthenticated: (state) => !!state.token && !!state.user,
    currentUser: (state) => state.user,
    userType: (state) => state.user?.tipo || null,
    isAdmin: (state) => state.user?.tipo === 'admin',
    isGerente: (state) => state.user?.tipo === 'gerente' || state.user?.tipo === 'admin',
    isAgente: (state) => state.user?.tipo === 'agente'
  },

  actions: {
    /**
     * Verificar se há autenticação válida
     */
    async checkAuth() {
      if (this.token) {
        try {
          const response = await authService.me();
          this.user = response.user;
          localStorage.setItem('user', JSON.stringify(this.user));
        } catch (error) {
          console.error('Token inválido:', error);
          this.logout();
        }
      }
    },

    /**
     * Login de usuário
     */
    async login(credentials) {
      this.loading = true;
      this.error = null;
      
      try {
        const response = await authService.login(credentials.email, credentials.password);
        
        this.token = response.token;
        this.user = response.user;
        
        // Salvar no localStorage
        localStorage.setItem('token', this.token);
        localStorage.setItem('user', JSON.stringify(this.user));
        
        return true;
      } catch (error) {
        const errorMsg = error.response?.data?.error?.message || error.message || 'Erro ao fazer login';
        this.error = errorMsg;
        throw new Error(errorMsg);
      } finally {
        this.loading = false;
      }
    },

    /**
     * Cadastro de novo usuário
     */
    async register(userData) {
      this.loading = true;
      this.error = null;
      
      try {
        const response = await authService.register(userData);
        
        if (response.token) {
          this.token = response.token;
          this.user = response.user;
          
          // Salvar no localStorage
          localStorage.setItem('token', this.token);
          localStorage.setItem('user', JSON.stringify(this.user));
        }
        
        return true;
      } catch (error) {
        const errorMsg = error.response?.data?.error?.message || error.message || 'Erro ao cadastrar';
        this.error = errorMsg;
        throw new Error(errorMsg);
      } finally {
        this.loading = false;
      }
    },

    /**
     * Logout
     */
    async logout() {
      try {
        // Tentar fazer logout no backend (se autenticado)
        if (this.token) {
          await authService.logout();
        }
      } catch (error) {
        console.error('Erro ao fazer logout:', error);
      } finally {
        // Limpar estado e localStorage
        this.token = null;
        this.user = null;
        this.error = null;
        
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    },

    /**
     * Limpar erro
     */
    clearError() {
      this.error = null;
    }
  }
});
