<template>
  <div class="login-view">
    <!-- Background Pattern -->
    <div class="bg-pattern"></div>
    
    <div class="login-container">
      <!-- Login Card -->
      <div class="login-card">
        <!-- Logo & Header -->
        <div class="login-header">
          <div class="logo-container">
            <img 
              :src="isDarkMode ? logoEscuro : logoClaro" 
              alt="OTMIZTech Logo" 
              class="logo" 
            />
          </div>
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
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { useForm, Field, ErrorMessage } from 'vee-validate';
import { loginSchema } from '@/validators/schemas/usuarioSchema.js';
import ErrorMessageComponent from '@/components/shared/ErrorMessage.vue';

// Importar logos
import logoClaro from '@/assets/techclaro.png';
import logoEscuro from '@/assets/techescuro.png';

const router = useRouter();
const authStore = useAuthStore();

const isDarkMode = ref(false);

onMounted(() => {
  // Detectar tema atual
  const savedTheme = localStorage.getItem('theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  isDarkMode.value = savedTheme === 'dark' || (!savedTheme && prefersDark);
  
  // Aplicar tema ao HTML para garantir que as variáveis CSS funcionem
  document.documentElement.setAttribute('data-theme', isDarkMode.value ? 'dark' : 'light');
});

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

.bg-pattern {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(4px);
  pointer-events: none;
}

[data-theme="dark"] .bg-pattern {
  background: rgba(0, 0, 0, 0.7);
}

.login-container {
  width: 100%;
  max-width: 440px;
  padding: 1.5rem;
  position: relative;
  z-index: 1;
}

.login-card {
  background: var(--color-bg-primary);
  backdrop-filter: blur(10px);
  border: 1px solid var(--color-border-medium);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-xl);
  padding: 3rem 2.5rem;
  animation: fadeInUp 0.5s ease-out;
}

[data-theme="dark"] .login-card {
  background: rgba(18, 18, 18, 0.9);
  border-color: rgba(255, 255, 255, 0.1);
}

@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

.login-header {
  text-align: center;
  margin-bottom: 2.5rem;
}

.logo-container {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 1.5rem;
}

.logo {
  max-width: 220px;
  height: auto;
  object-fit: contain;
}

.login-subtitle {
  font-size: var(--font-size-sm);
  color: var(--color-text-tertiary);
  margin: 0;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-label {
  font-size: var(--font-size-xs);
  font-weight: 700;
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.label-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.forgot-link {
  font-size: var(--font-size-xs);
  color: var(--color-primary);
  text-decoration: none;
  font-weight: 600;
}

.forgot-link:hover {
  text-decoration: underline;
}

.form-control {
  height: 48px;
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border-medium);
  color: var(--color-text-primary);
  border-radius: var(--radius-base);
  padding: 0 1rem;
  transition: all 0.2s ease;
}

.form-control:focus {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 4px var(--color-primary-light);
  background: var(--color-bg-primary);
}

.form-check-wrapper {
  margin: 0.5rem 0;
}

.form-check {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.form-check-input {
  width: 18px;
  height: 18px;
  cursor: pointer;
  accent-color: var(--color-primary);
}

.form-check-label {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  cursor: pointer;
}

.btn-login {
  width: 100%;
  height: 48px;
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: var(--radius-base);
  font-size: var(--font-size-base);
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  margin-top: 1rem;
}

.btn-login:hover:not(:disabled) {
  background: var(--color-primary-hover);
  transform: translateY(-2px);
  box-shadow: var(--shadow-primary);
}

.login-footer {
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 1px solid var(--color-border-light);
  text-align: center;
}

.login-footer p {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

.signup-link {
  color: var(--color-primary);
  text-decoration: none;
  font-weight: 700;
}

.signup-link:hover {
  text-decoration: underline;
}

@media (max-width: 576px) {
  .login-card {
    padding: 2rem 1.5rem;
  }
  .logo {
    max-width: 180px;
  }
}
</style>
