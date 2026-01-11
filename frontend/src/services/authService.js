import http from '../api/http.js';

/**
 * Service de autenticação
 * Centraliza todas as chamadas de API relacionadas a autenticação
 */
class AuthService {
  /**
   * Registrar novo usuário
   */
  async register(dados) {
    const response = await http.post('/auth/register', dados);
    return response.data;
  }

  /**
   * Login de usuário
   */
  async login(email, password) {
    const response = await http.post('/auth/login', { email, password });
    return response.data;
  }

  /**
   * Obter dados do usuário autenticado
   */
  async me() {
    const response = await http.get('/auth/me');
    return response.data;
  }

  /**
   * Logout
   */
  async logout() {
    const response = await http.post('/auth/logout');
    return response.data;
  }

  /**
   * Alterar senha do usuário autenticado
   */
  async changePassword(currentPassword, newPassword, confirmPassword) {
    const response = await http.post('/auth/change-password', {
      currentPassword,
      newPassword,
      confirmPassword
    });
    return response.data;
  }
}

export default new AuthService();

