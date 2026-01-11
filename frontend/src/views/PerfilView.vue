<template>
  <layout-principal>
    <div class="perfil-container">
      <LoadingSpinner v-if="loading" text="Carregando perfil..." />
      
      <ErrorMessage v-else-if="error" :message="error" />
      
      <div v-else class="perfil-content">
        <!-- Informações do Usuário -->
        <div class="perfil-card">
          <div class="card-header">
            <h2 class="card-title">
              <i class="bi bi-person-circle"></i>
              Informações do Usuário
            </h2>
          </div>
          
          <div class="card-body">
            <div class="perfil-avatar">
              <div class="avatar-circle">
                <i class="bi bi-person-fill"></i>
              </div>
            </div>
            
            <div class="perfil-info">
              <div class="info-row">
                <div class="info-label">Nome</div>
                <div class="info-value">{{ usuario?.nome || 'N/A' }}</div>
              </div>
              
              <div class="info-row">
                <div class="info-label">Email</div>
                <div class="info-value">{{ usuario?.email || 'N/A' }}</div>
              </div>
              
              <div class="info-row">
                <div class="info-label">Tipo de Usuário</div>
                <div class="info-value">
                  <span :class="['tipo-badge', `badge-${usuario?.tipo}`]">
                    {{ tipoLabel(usuario?.tipo) }}
                  </span>
                </div>
              </div>
              
              <div class="info-row" v-if="usuario?.grupos && usuario.grupos.length > 0">
                <div class="info-label">Grupos</div>
                <div class="info-value">
                  <div class="grupos-list">
                    <span
                      v-for="grupo in usuario.grupos"
                      :key="grupo.id"
                      class="grupo-badge"
                      :title="`Papel: ${grupo.usuario_grupo?.papel || 'agente'}`"
                    >
                      {{ grupo.nome }}
                      <small v-if="grupo.usuario_grupo?.papel && grupo.usuario_grupo.papel !== 'agente'">
                        ({{ grupo.usuario_grupo.papel }})
                      </small>
                    </span>
                  </div>
                </div>
              </div>
              
              <div class="info-row" v-else>
                <div class="info-label">Grupos</div>
                <div class="info-value text-muted">Nenhum grupo associado</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Alteração de Senha -->
        <div class="perfil-card">
          <div class="card-header">
            <h2 class="card-title">
              <i class="bi bi-lock-fill"></i>
              Alterar Senha
            </h2>
          </div>
          
          <div class="card-body">
            <form @submit.prevent="alterarSenha" class="password-form">
              <div class="form-group">
                <label for="currentPassword" class="form-label">
                  Senha Atual
                </label>
                <div class="input-wrapper">
                  <input
                    id="currentPassword"
                    v-model="senhaForm.currentPassword"
                    type="password"
                    class="form-control"
                    :class="{ 'is-invalid': errors.currentPassword }"
                    placeholder="Digite sua senha atual"
                    required
                  />
                  <i class="bi bi-eye input-icon" @click="togglePasswordVisibility('currentPassword')" v-if="!showPasswords.currentPassword"></i>
                  <i class="bi bi-eye-slash input-icon" @click="togglePasswordVisibility('currentPassword')" v-else></i>
                </div>
                <div v-if="errors.currentPassword" class="invalid-feedback">
                  {{ errors.currentPassword }}
                </div>
              </div>
              
              <div class="form-group">
                <label for="newPassword" class="form-label">
                  Nova Senha
                </label>
                <div class="input-wrapper">
                  <input
                    id="newPassword"
                    v-model="senhaForm.newPassword"
                    type="password"
                    class="form-control"
                    :class="{ 'is-invalid': errors.newPassword }"
                    placeholder="Digite sua nova senha (mín. 6 caracteres)"
                    required
                    minlength="6"
                  />
                  <i class="bi bi-eye input-icon" @click="togglePasswordVisibility('newPassword')" v-if="!showPasswords.newPassword"></i>
                  <i class="bi bi-eye-slash input-icon" @click="togglePasswordVisibility('newPassword')" v-else></i>
                </div>
                <div v-if="errors.newPassword" class="invalid-feedback">
                  {{ errors.newPassword }}
                </div>
              </div>
              
              <div class="form-group">
                <label for="confirmPassword" class="form-label">
                  Confirmar Nova Senha
                </label>
                <div class="input-wrapper">
                  <input
                    id="confirmPassword"
                    v-model="senhaForm.confirmPassword"
                    type="password"
                    class="form-control"
                    :class="{ 'is-invalid': errors.confirmPassword }"
                    placeholder="Confirme sua nova senha"
                    required
                  />
                  <i class="bi bi-eye input-icon" @click="togglePasswordVisibility('confirmPassword')" v-if="!showPasswords.confirmPassword"></i>
                  <i class="bi bi-eye-slash input-icon" @click="togglePasswordVisibility('confirmPassword')" v-else></i>
                </div>
                <div v-if="errors.confirmPassword" class="invalid-feedback">
                  {{ errors.confirmPassword }}
                </div>
              </div>
              
              <transition name="alert-fade">
                <div v-if="senhaError" class="alert alert-danger alert-dismissible" role="alert">
                  <i class="bi bi-exclamation-triangle-fill me-2"></i>
                  <strong>Erro:</strong> {{ senhaError }}
                  <button
                    type="button"
                    class="alert-close-btn"
                    @click="senhaError = null"
                    aria-label="Fechar mensagem de erro"
                    title="Fechar"
                  >
                    <i class="bi bi-x-lg"></i>
                  </button>
                </div>
              </transition>
              
              <transition name="alert-fade">
                <div v-if="senhaSuccess" class="alert alert-success alert-dismissible" role="alert">
                  <i class="bi bi-check-circle-fill me-2"></i>
                  <strong>Sucesso!</strong> {{ senhaSuccess }}
                  <button
                    type="button"
                    class="alert-close-btn"
                    @click="senhaSuccess = null"
                    aria-label="Fechar mensagem de sucesso"
                    title="Fechar"
                  >
                    <i class="bi bi-x-lg"></i>
                  </button>
                </div>
              </transition>
              
              <div class="form-actions">
                <button
                  type="submit"
                  class="btn btn-primary"
                  :disabled="loadingSenha || !isFormValid"
                >
                  <span v-if="loadingSenha" class="spinner-border spinner-border-sm me-2"></span>
                  <i v-else class="bi bi-check-circle me-2"></i>
                  Alterar Senha
                </button>
                
                <button
                  type="button"
                  class="btn btn-outline-secondary"
                  @click="limparFormSenha"
                  :disabled="loadingSenha"
                >
                  <i class="bi bi-x-circle me-2"></i>
                  Limpar
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  </layout-principal>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useAuthStore } from '@/stores/auth';
import authService from '@/services/authService.js';
import LayoutPrincipal from '@/components/LayoutPrincipal.vue';
import LoadingSpinner from '@/components/shared/LoadingSpinner.vue';
import ErrorMessage from '@/components/shared/ErrorMessage.vue';

const authStore = useAuthStore();

const loading = ref(false);
const error = ref(null);
const usuario = ref(null);

const loadingSenha = ref(false);
const senhaError = ref(null);
const senhaSuccess = ref(null);

const senhaForm = ref({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
});

const showPasswords = ref({
  currentPassword: false,
  newPassword: false,
  confirmPassword: false
});

const errors = ref({
  currentPassword: null,
  newPassword: null,
  confirmPassword: null
});

const tipoLabel = (tipo) => {
  const tipos = {
    admin: 'Administrador',
    gerente: 'Gerente',
    agente: 'Agente'
  };
  return tipos[tipo] || tipo;
};

const isFormValid = computed(() => {
  return senhaForm.value.currentPassword &&
         senhaForm.value.newPassword &&
         senhaForm.value.confirmPassword &&
         senhaForm.value.newPassword === senhaForm.value.confirmPassword &&
         senhaForm.value.newPassword.length >= 6 &&
         senhaForm.value.currentPassword !== senhaForm.value.newPassword;
});

const togglePasswordVisibility = (field) => {
  showPasswords.value[field] = !showPasswords.value[field];
  const input = document.getElementById(field);
  if (input) {
    input.type = showPasswords.value[field] ? 'text' : 'password';
  }
};

const validarForm = () => {
  errors.value = {
    currentPassword: null,
    newPassword: null,
    confirmPassword: null
  };
  
  let hasErrors = false;
  
  if (!senhaForm.value.currentPassword) {
    errors.value.currentPassword = 'Senha atual é obrigatória';
    hasErrors = true;
  }
  
  if (!senhaForm.value.newPassword) {
    errors.value.newPassword = 'Nova senha é obrigatória';
    hasErrors = true;
  } else if (senhaForm.value.newPassword.length < 6) {
    errors.value.newPassword = 'Nova senha deve ter no mínimo 6 caracteres';
    hasErrors = true;
  }
  
  if (!senhaForm.value.confirmPassword) {
    errors.value.confirmPassword = 'Confirmação de senha é obrigatória';
    hasErrors = true;
  } else if (senhaForm.value.newPassword !== senhaForm.value.confirmPassword) {
    errors.value.confirmPassword = 'As senhas não coincidem';
    hasErrors = true;
  }
  
  if (senhaForm.value.currentPassword === senhaForm.value.newPassword) {
    errors.value.newPassword = 'A nova senha deve ser diferente da senha atual';
    hasErrors = true;
  }
  
  return !hasErrors;
};

const alterarSenha = async () => {
  senhaError.value = null;
  senhaSuccess.value = null;
  
  // Limpar erros de campos anteriores
  errors.value = {
    currentPassword: null,
    newPassword: null,
    confirmPassword: null
  };
  
  if (!validarForm()) {
    return;
  }
  
  loadingSenha.value = true;
  
  try {
    const response = await authService.changePassword(
      senhaForm.value.currentPassword,
      senhaForm.value.newPassword,
      senhaForm.value.confirmPassword
    );
    
    // Mostrar mensagem de sucesso
    senhaSuccess.value = response.message || 'Senha alterada com sucesso!';
    
    // Limpar apenas os campos do formulário, mas manter a mensagem de sucesso
    senhaForm.value = {
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    };
    
    // Resetar tipos de input para password
    ['currentPassword', 'newPassword', 'confirmPassword'].forEach(field => {
      const input = document.getElementById(field);
      if (input) {
        input.type = 'password';
        showPasswords.value[field] = false;
      }
    });
    
    // Limpar mensagem de sucesso após 8 segundos
    setTimeout(() => {
      senhaSuccess.value = null;
    }, 8000);
  } catch (err) {
    const errorMessage = err.response?.data?.error?.message || 
                        err.response?.data?.error?.details?.[0]?.message ||
                        err.response?.data?.message || 
                        err.message || 
                        'Erro ao alterar senha. Verifique os dados e tente novamente.';
    
    // Tratar erros específicos de validação
    if (err.response?.data?.error?.details) {
      const details = err.response.data.error.details;
      details.forEach(detail => {
        if (detail.path.includes('currentPassword')) {
          errors.value.currentPassword = detail.message;
        } else if (detail.path.includes('newPassword')) {
          errors.value.newPassword = detail.message;
        } else if (detail.path.includes('confirmPassword')) {
          errors.value.confirmPassword = detail.message;
        }
      });
    }
    
    // Tratar erros por mensagem
    if (errorMessage.toLowerCase().includes('senha atual') || 
        errorMessage.toLowerCase().includes('atual incorreta') ||
        errorMessage.toLowerCase().includes('current password')) {
      errors.value.currentPassword = errorMessage;
      senhaError.value = 'Não foi possível alterar a senha. Verifique a senha atual.';
    } else if (errorMessage.toLowerCase().includes('não coincidem') || 
               errorMessage.toLowerCase().includes('não coincidem') ||
               errorMessage.toLowerCase().includes('not match')) {
      errors.value.confirmPassword = errorMessage;
      senhaError.value = 'As senhas não coincidem. Verifique os campos.';
    } else if (errorMessage.toLowerCase().includes('diferente') ||
               errorMessage.toLowerCase().includes('diferente da senha atual')) {
      errors.value.newPassword = errorMessage;
      senhaError.value = 'A nova senha deve ser diferente da senha atual.';
    } else {
      senhaError.value = errorMessage;
    }
    
    // Manter mensagem de erro por 10 segundos
    setTimeout(() => {
      senhaError.value = null;
    }, 10000);
  } finally {
    loadingSenha.value = false;
  }
};

const limparFormSenha = () => {
  senhaForm.value = {
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  };
  errors.value = {
    currentPassword: null,
    newPassword: null,
    confirmPassword: null
  };
  showPasswords.value = {
    currentPassword: false,
    newPassword: false,
    confirmPassword: false
  };
  senhaError.value = null;
  senhaSuccess.value = null;
  
  // Resetar tipos de input
  ['currentPassword', 'newPassword', 'confirmPassword'].forEach(field => {
    const input = document.getElementById(field);
    if (input) {
      input.type = 'password';
    }
  });
  
  // Remover classes de validação do Bootstrap
  ['currentPassword', 'newPassword', 'confirmPassword'].forEach(field => {
    const input = document.getElementById(field);
    if (input) {
      input.classList.remove('is-invalid', 'is-valid');
    }
  });
};

const carregarPerfil = async () => {
  loading.value = true;
  error.value = null;
  
  try {
    const response = await authService.me();
    usuario.value = response.user || response;
    
    // Atualizar store com grupos se disponível
    if (usuario.value.grupos) {
      authStore.user = { ...authStore.user, grupos: usuario.value.grupos };
    }
  } catch (err) {
    error.value = err.response?.data?.error?.message || 
                  err.response?.data?.message || 
                  err.message || 
                  'Erro ao carregar perfil';
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  // Carregar dados do usuário do store primeiro
  usuario.value = authStore.currentUser;
  
  // Atualizar com dados completos da API (incluindo grupos)
  carregarPerfil();
});
</script>

<style scoped>
.perfil-container {
  max-width: 900px;
  margin: 0 auto;
}

.perfil-content {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}

.perfil-card {
  background: var(--color-bg-primary);
  border: 1px solid var(--color-border-medium);
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.card-header {
  padding: var(--space-5);
  border-bottom: 1px solid var(--color-border-medium);
  background: var(--color-bg-secondary);
}

.card-title {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  margin: 0;
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.card-title i {
  font-size: 1.5rem;
  color: var(--color-primary);
}

.card-body {
  padding: var(--space-6);
}

.perfil-avatar {
  display: flex;
  justify-content: center;
  margin-bottom: var(--space-6);
}

.avatar-circle {
  width: 120px;
  height: 120px;
  border-radius: var(--radius-full);
  background: linear-gradient(135deg, var(--color-brand-600), var(--color-brand-500));
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 4rem;
  box-shadow: var(--shadow-md);
}

.perfil-info {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.info-row {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  padding-bottom: var(--space-4);
  border-bottom: 1px solid var(--color-border-light);
}

.info-row:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.info-label {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  text-transform: uppercase;
  letter-spacing: var(--letter-spacing-wide);
  color: var(--color-text-tertiary);
}

.info-value {
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-primary);
}

.tipo-badge {
  display: inline-block;
  padding: var(--space-1) var(--space-3);
  border-radius: var(--radius-full);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  text-transform: uppercase;
  letter-spacing: var(--letter-spacing-wide);
}

.badge-admin {
  background: var(--color-danger-100);
  color: var(--color-danger-700);
}

.badge-gerente {
  background: var(--color-warning-100);
  color: var(--color-warning-700);
}

.badge-agente {
  background: var(--color-info-100);
  color: var(--color-info-700);
}

.grupos-list {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}

.grupo-badge {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  padding: var(--space-1) var(--space-3);
  background: var(--color-primary-light);
  color: var(--color-primary);
  border-radius: var(--radius-full);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
}

.grupo-badge small {
  font-size: var(--font-size-xs);
  opacity: 0.8;
}

.password-form {
  max-width: 500px;
}

.form-group {
  margin-bottom: var(--space-4);
}

.form-label {
  display: block;
  margin-bottom: var(--space-2);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-primary);
}

.input-wrapper {
  position: relative;
}

.input-wrapper .form-control {
  padding-right: 40px;
}

.input-icon {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  cursor: pointer;
  color: var(--color-text-tertiary);
  font-size: 1.1rem;
  transition: color var(--transition-base);
}

.input-icon:hover {
  color: var(--color-text-primary);
}

.form-actions {
  display: flex;
  gap: var(--space-3);
  margin-top: var(--space-5);
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-base);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  border: 1px solid transparent;
  cursor: pointer;
  transition: all var(--transition-base);
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-primary {
  background: var(--color-primary);
  color: white;
  border-color: var(--color-primary);
}

.btn-primary:hover:not(:disabled) {
  background: var(--color-primary-dark);
  border-color: var(--color-primary-dark);
}

.btn-outline-secondary {
  background: transparent;
  color: var(--color-text-secondary);
  border-color: var(--color-border-medium);
}

.btn-outline-secondary:hover:not(:disabled) {
  background: var(--color-bg-tertiary);
  color: var(--color-text-primary);
  border-color: var(--color-border-strong);
}

.text-muted {
  color: var(--color-text-tertiary);
  font-style: italic;
}

.alert {
  padding: var(--space-3) var(--space-4);
  border-radius: var(--radius-base);
  margin-bottom: var(--space-4);
  font-size: var(--font-size-sm);
  display: flex;
  align-items: center;
  position: relative;
  animation: slideDown 0.3s ease-out;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.alert-danger {
  background: var(--color-danger-50);
  color: var(--color-danger-700);
  border: 1px solid var(--color-danger-200);
}

.alert-danger i {
  color: var(--color-danger-600);
  font-size: 1.2rem;
}

.alert-success {
  background: var(--color-success-50);
  color: var(--color-success-700);
  border: 1px solid var(--color-success-200);
}

.alert-success i {
  color: var(--color-success-600);
  font-size: 1.2rem;
}

.alert-dismissible {
  padding-right: 3rem;
  position: relative;
}

.alert-close-btn {
  position: absolute;
  top: 50%;
  right: 0.75rem;
  transform: translateY(-50%);
  padding: 0.25rem 0.5rem;
  background: transparent;
  border: none;
  color: inherit;
  opacity: 0.7;
  cursor: pointer;
  font-size: 1rem;
  line-height: 1;
  transition: all var(--transition-base);
  border-radius: var(--radius-base);
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
}

.alert-close-btn:hover {
  opacity: 1;
  background: rgba(0, 0, 0, 0.1);
}

.alert-danger .alert-close-btn:hover {
  background: rgba(220, 53, 69, 0.2);
}

.alert-success .alert-close-btn:hover {
  background: rgba(25, 135, 84, 0.2);
}

.alert-close-btn i {
  font-size: 0.875rem;
}

.alert-fade-enter-active,
.alert-fade-leave-active {
  transition: all 0.3s ease;
}

.alert-fade-enter-from {
  opacity: 0;
  transform: translateY(-10px);
}

.alert-fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

.alert strong {
  font-weight: var(--font-weight-semibold);
  margin-right: var(--space-1);
}

.spinner-border {
  display: inline-block;
  width: 1rem;
  height: 1rem;
  border: 2px solid currentColor;
  border-right-color: transparent;
  border-radius: 50%;
  animation: spinner-border 0.75s linear infinite;
}

@keyframes spinner-border {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 768px) {
  .perfil-container {
    padding: 0 var(--space-2);
  }
  
  .card-body {
    padding: var(--space-4);
  }
  
  .avatar-circle {
    width: 100px;
    height: 100px;
    font-size: 3rem;
  }
  
  .form-actions {
    flex-direction: column;
  }
  
  .btn {
    width: 100%;
  }
}
</style>

