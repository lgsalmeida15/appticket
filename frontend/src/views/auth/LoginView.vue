<template>
  <div class="login-view">
    <!-- Background Pattern (optional) -->
    <div class="bg-pattern"></div>
    
    <div class="login-container">
      <!-- Login Card -->
      <div class="login-card">
        <!-- Logo & Header -->
        <div class="login-header">
          <div class="logo-container">
            <img src="@/assets/minilogo.png" alt="AppTicket Logo" class="logo" />
          </div>
          <h1 class="login-title">AppTicket</h1>
          <p class="login-subtitle">Sistema de Gestão de Chamados</p>
        </div>

        <!-- Login Form -->
        <form @submit.prevent="onSubmit" class="login-form">
          <!-- Email -->
          <div class="form-group">
            <label for="email" class="form-label">Email</label>
            <Field
              id="email"
              name="email"
              type="email"
              v-model="values.email"
              class="form-control"
              :class="{ 'is-invalid': errors.email }"
              placeholder="seu@email.com"
            />
            <ErrorMessage v-if="errors.email" :message="errors.email" />
          </div>

          <!-- Password -->
          <div class="form-group">
            <div class="label-row">
              <label for="password" class="form-label">Senha</label>
              <a href="#" class="forgot-link">Esqueceu a senha?</a>
            </div>
            <Field
              id="password"
              name="password"
              type="password"
              v-model="values.password"
              class="form-control"
              :class="{ 'is-invalid': errors.password }"
              placeholder="Digite sua senha"
              autocomplete="current-password"
            />
            <ErrorMessage name="password" />
          </div>

          <!-- Remember Me -->
          <div class="form-check-wrapper">
            <div class="form-check">
              <input
                type="checkbox"
                class="form-check-input"
                id="remember"
                v-model="values.remember"
              >
              <label class="form-check-label" for="remember">
                Lembrar-me neste dispositivo
              </label>
            </div>
          </div>

          <!-- Error Message -->
          <ErrorMessageComponent 
            v-if="submitError" 
            :message="submitError" 
            dismissible 
            @dismiss="submitError = null" 
          />

          <!-- Submit Button -->
          <button
            type="submit"
            class="btn-login"
            :disabled="loading"
            @click="() => console.log('🔘 Botão clicado!', { email: values.email, password: values.password ? '***' : 'vazio' })"
          >
            <span v-if="loading" class="spinner-border spinner-border-sm me-2"></span>
            {{ loading ? 'Entrando...' : 'Entrar' }}
          </button>
          
          <!-- Debug Info (comentado em produção) -->
          <!-- 
          <div v-if="errors && Object.keys(errors).length > 0" class="mt-2">
            <small class="text-danger">
              Erros de validação: {{ JSON.stringify(errors) }}
            </small>
          </div>
          -->
        </form>

        <!-- Footer -->
        <div class="login-footer">
          <p>
            Não tem uma conta?
            <router-link to="/cadastro" class="signup-link">
              Cadastre-se gratuitamente
            </router-link>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { useForm, Field, ErrorMessage } from 'vee-validate';
import { loginSchema } from '@/validators/schemas/usuarioSchema.js';
import ErrorMessageComponent from '@/components/shared/ErrorMessage.vue';

const router = useRouter();
const authStore = useAuthStore();

const { handleSubmit, values, errors } = useForm({
  validationSchema: loginSchema,
  initialValues: {
    email: '',
    password: '',
    remember: false
  }
});

const loading = ref(false);
const submitError = ref(null);

const onSubmit = handleSubmit(
  async (formValues) => {
    console.log('🚀 Tentando fazer login com:', { email: formValues.email, temPassword: !!formValues.password });
    loading.value = true;
    submitError.value = null;

    try {
      console.log('📡 Chamando authStore.login...');
      const result = await authStore.login({
        email: formValues.email,
        password: formValues.password
      });
      
      console.log('✅ Resultado do login:', result);

      console.log('✅ Login bem-sucedido! Redirecionando...');
      
      // Redirecionar para a página de chamados após login
      const redirectPath = router.currentRoute.value.query.redirect || '/chamados';
      console.log('🔄 Redirecionando para:', redirectPath);
      await router.push(redirectPath);
      console.log('✅ Redirecionamento concluído');
    } catch (err) {
      console.error('❌ Erro no login:', err);
      const errorMessage = err.response?.data?.error?.message || 
                          err.response?.data?.message || 
                          err.message || 
                          'Erro ao fazer login. Verifique suas credenciais.';
      submitError.value = errorMessage;
      console.error('Erro completo:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
        statusText: err.response?.statusText,
        stack: err.stack
      });
    } finally {
      loading.value = false;
    }
  },
  (validationErrors) => {
    console.error('❌ Erros de validação:', validationErrors);
    console.error('Valores do formulário:', values);
    const errorsList = Object.values(validationErrors).filter(e => e);
    submitError.value = errorsList.length > 0 
      ? `Erros de validação: ${errorsList.join(', ')}`
      : 'Por favor, corrija os erros no formulário.';
  }
);
</script>

<style scoped>
.login-view {
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background-image: url('@/assets/fundologin.png');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  position: relative;
  overflow: hidden;
}

/* Overlay escuro para melhor contraste */
.bg-pattern {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(2px);
  pointer-events: none;
}

.login-container {
  width: 100%;
  max-width: 440px;
  max-height: 100vh;
  padding: 1.5rem;
  position: relative;
  z-index: 1;
  overflow-y: auto;
  box-shadow: none !important;
}

/* Login Card */
.login-card {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 16px;
  box-shadow: none;
  padding: 2rem 2.5rem;
  animation: fadeInUp 0.4s ease-out;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Header */
.login-header {
  text-align: center;
  margin-bottom: 2rem;
}

.logo-container {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 1rem;
}

.logo {
  max-width: 100px;
  height: auto;
  object-fit: contain;
  transition: transform 0.3s ease;
}

.logo:hover {
  transform: scale(1.02);
}

.login-title {
  font-size: 1.75rem;
  font-weight: 600;
  color: #1a1a1a;
  margin: 0 0 0.5rem 0;
  letter-spacing: -0.02em;
}

.login-subtitle {
  font-size: 0.9375rem;
  color: #666;
  margin: 0;
  font-weight: 400;
}

/* Form */
.login-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: #333;
  margin: 0;
}

.label-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.forgot-link {
  font-size: 0.8125rem;
  color: var(--primary-color);
  text-decoration: none;
  font-weight: 500;
  transition: color 0.2s ease;
}

.forgot-link:hover {
  color: var(--primary-hover);
  text-decoration: underline;
}

.form-control {
  height: 44px;
  padding: 0.625rem 0.875rem;
  font-size: 0.9375rem;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  background: #ffffff;
  color: #1a1a1a;
  transition: all 0.2s ease;
}

.form-control:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
  background: #ffffff;
}

.form-control::placeholder {
  color: #9ca3af;
}

.form-control.is-invalid {
  border-color: var(--danger-color);
}

.form-control.is-invalid:focus {
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
}

/* Checkbox */
.form-check-wrapper {
  margin: 0.25rem 0;
}

.form-check {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.form-check-input {
  width: 16px;
  height: 16px;
  margin: 0;
  cursor: pointer;
  border: 1.5px solid #d1d5db;
  border-radius: 4px;
  background-color: #ffffff;
}

.form-check-input:checked {
  background-color: var(--primary-color);
  border-color: var(--primary-color);
}

.form-check-input:focus {
  outline: none;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}

.form-check-label {
  font-size: 0.875rem;
  color: #666;
  margin: 0;
  cursor: pointer;
  user-select: none;
}

/* Submit Button */
.btn-login {
  width: 100%;
  height: 44px;
  background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 0.9375rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  margin-top: 0.25rem;
}

.btn-login:hover:not(:disabled) {
  background: linear-gradient(135deg, #6d28d9 0%, #9333ea 100%);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(124, 58, 237, 0.4);
}

.btn-login:active:not(:disabled) {
  transform: translateY(0);
}

.btn-login:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Footer */
.login-footer {
  margin-top: 1.5rem;
  padding-top: 1.25rem;
  border-top: 1px solid #e5e7eb;
  text-align: center;
}

.login-footer p {
  font-size: 0.875rem;
  color: #666;
  margin: 0;
}

.signup-link {
  color: var(--primary-color);
  text-decoration: none;
  font-weight: 600;
  transition: color 0.2s ease;
}

.signup-link:hover {
  color: var(--primary-hover);
  text-decoration: underline;
}

/* Responsive */
@media (max-width: 576px) {
  .login-container {
    padding: 1rem;
  }
  
  .login-card {
    padding: 1.5rem 1.25rem;
  }
  
  .login-title {
    font-size: 1.5rem;
  }
  
  .login-header {
    margin-bottom: 1.5rem;
  }
  
  .logo {
    max-width: 80px;
  }
  
  .login-form {
    gap: 0.875rem;
  }
  
  .login-footer {
    margin-top: 1.25rem;
    padding-top: 1rem;
  }
}
</style>
