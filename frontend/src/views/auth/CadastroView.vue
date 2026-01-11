<template>
  <div class="cadastro-view">
    <div class="cadastro-container">
      <!-- Background Pattern -->
      <div class="bg-pattern"></div>
      
      <!-- Cadastro Card -->
      <div class="cadastro-card">
        <!-- Logo & Header -->
        <div class="cadastro-header">
          <div class="icon-container">
            <i class="bi bi-person-plus-fill"></i>
          </div>
          <h1 class="cadastro-title">Criar Conta</h1>
          <p class="cadastro-subtitle">Comece a gerenciar seus chamados agora</p>
        </div>

        <!-- Cadastro Form -->
        <form @submit="onSubmit" class="cadastro-form">
          <!-- Nome -->
          <div class="form-group">
            <label for="nome" class="form-label">
              Nome Completo <span class="required">*</span>
            </label>
            <Field
              id="nome"
              name="nome"
              type="text"
              v-model="values.nome"
              class="form-control"
              :class="{ 'is-invalid': errors.nome }"
              placeholder="Digite seu nome completo"
            />
            <ErrorMessage v-if="errors.nome" :message="errors.nome" />
          </div>

          <!-- Email -->
          <div class="form-group">
            <label for="email" class="form-label">
              Email <span class="required">*</span>
            </label>
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
            <label for="password" class="form-label">
              Senha <span class="required">*</span>
            </label>
            <Field
              id="password"
              name="password"
              type="password"
              v-model="values.password"
              class="form-control"
              :class="{ 'is-invalid': errors.password }"
              placeholder="Mínimo 6 caracteres"
            />
            <ErrorMessage v-if="errors.password" :message="errors.password" />
          </div>

          <!-- Confirm Password -->
          <div class="form-group">
            <label for="confirmPassword" class="form-label">
              Confirmar Senha <span class="required">*</span>
            </label>
            <Field
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              v-model="values.confirmPassword"
              class="form-control"
              :class="{ 'is-invalid': errors.confirmPassword }"
              placeholder="Digite a senha novamente"
            />
            <ErrorMessage v-if="errors.confirmPassword" :message="errors.confirmPassword" />
          </div>

          <!-- Error Message -->
          <ErrorMessageComponent 
            v-if="submitError" 
            :message="submitError" 
            dismissible 
            @dismiss="submitError = null" 
          />
          
          <!-- Success Message -->
          <div v-if="success" class="alert-success" role="alert">
            <i class="bi bi-check-circle-fill me-2"></i>
            {{ success }}
          </div>

          <!-- Submit Button -->
          <button
            type="submit"
            class="btn-cadastro"
            :disabled="loading"
          >
            <span v-if="loading" class="spinner-border spinner-border-sm me-2"></span>
            {{ loading ? 'Criando conta...' : 'Criar Conta' }}
          </button>

          <!-- Terms -->
          <p class="terms-text">
            Ao criar uma conta, você concorda com nossos 
            <a href="#" class="terms-link">Termos de Uso</a> e 
            <a href="#" class="terms-link">Política de Privacidade</a>.
          </p>
        </form>

        <!-- Footer -->
        <div class="cadastro-footer">
          <p>
            Já tem uma conta?
            <router-link to="/login" class="login-link">
              Fazer login
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
import { cadastroSchema } from '@/validators/schemas/usuarioSchema.js';
import ErrorMessageComponent from '@/components/shared/ErrorMessage.vue';

const router = useRouter();
const authStore = useAuthStore();

const { handleSubmit, values, errors } = useForm({
  validationSchema: cadastroSchema,
  initialValues: {
    nome: '',
    email: '',
    password: '',
    confirmPassword: ''
  }
});

const loading = ref(false);
const submitError = ref(null);
const success = ref(null);

const onSubmit = handleSubmit(async (formValues) => {
  loading.value = true;
  submitError.value = null;
  success.value = null;

  try {
    await authStore.register({
      nome: formValues.nome,
      email: formValues.email,
      password: formValues.password
    });

    success.value = 'Cadastro realizado com sucesso! Redirecionando...';
    
    // Redirecionar após 1.5 segundos
    setTimeout(() => {
      router.push({ name: 'chamados' });
    }, 1500);
  } catch (err) {
    submitError.value = err.message || 'Erro ao cadastrar. Tente novamente.';
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped>
.cadastro-view {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-secondary);
  position: relative;
  overflow: hidden;
  padding: 2rem 0;
}

/* Subtle background pattern */
.bg-pattern {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image: 
    radial-gradient(circle at 20% 50%, rgba(99, 102, 241, 0.03) 0%, transparent 50%),
    radial-gradient(circle at 80% 80%, rgba(99, 102, 241, 0.03) 0%, transparent 50%);
  pointer-events: none;
}

.cadastro-container {
  width: 100%;
  max-width: 480px;
  padding: 2rem 1.5rem;
  position: relative;
  z-index: 1;
}

/* Cadastro Card */
.cadastro-card {
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  box-shadow: var(--shadow-lg);
  padding: 3rem 2.5rem;
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
.cadastro-header {
  text-align: center;
  margin-bottom: 2.5rem;
}

.icon-container {
  width: 64px;
  height: 64px;
  margin: 0 auto 1.5rem;
  background: linear-gradient(135deg, var(--primary-color), var(--primary-hover));
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.2);
}

.icon-container i {
  font-size: 2rem;
  color: white;
}

.cadastro-title {
  font-size: 1.75rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 0.5rem 0;
  letter-spacing: -0.02em;
}

.cadastro-subtitle {
  font-size: 0.9375rem;
  color: var(--text-secondary);
  margin: 0;
  font-weight: 400;
}

/* Form */
.cadastro-form {
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
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-primary);
  margin: 0;
}

.required {
  color: var(--danger-color);
}

.form-control {
  height: 44px;
  padding: 0.625rem 0.875rem;
  font-size: 0.9375rem;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  background: var(--bg-primary);
  color: var(--text-primary);
  transition: all 0.2s ease;
}

.form-control:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
  background: var(--bg-primary);
}

.form-control::placeholder {
  color: var(--text-tertiary);
}

.form-control.is-invalid {
  border-color: var(--danger-color);
}

.form-control.is-invalid:focus {
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
}

/* Success Alert */
.alert-success {
  padding: 0.875rem 1rem;
  background: rgba(34, 197, 94, 0.1);
  border: 1px solid rgba(34, 197, 94, 0.2);
  border-radius: 8px;
  color: var(--success-color);
  font-size: 0.875rem;
  display: flex;
  align-items: center;
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

/* Submit Button */
.btn-cadastro {
  width: 100%;
  height: 44px;
  background: var(--primary-color);
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
  margin-top: 0.5rem;
}

.btn-cadastro:hover:not(:disabled) {
  background: var(--primary-hover);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
}

.btn-cadastro:active:not(:disabled) {
  transform: translateY(0);
}

.btn-cadastro:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Terms Text */
.terms-text {
  font-size: 0.8125rem;
  color: var(--text-tertiary);
  text-align: center;
  margin: 0.5rem 0 0 0;
  line-height: 1.5;
}

.terms-link {
  color: var(--primary-color);
  text-decoration: none;
  font-weight: 500;
}

.terms-link:hover {
  text-decoration: underline;
}

/* Footer */
.cadastro-footer {
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 1px solid var(--border-color);
  text-align: center;
}

.cadastro-footer p {
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin: 0;
}

.login-link {
  color: var(--primary-color);
  text-decoration: none;
  font-weight: 600;
  transition: color 0.2s ease;
}

.login-link:hover {
  color: var(--primary-hover);
  text-decoration: underline;
}

/* Responsive */
@media (max-width: 576px) {
  .cadastro-view {
    padding: 1rem 0;
  }
  
  .cadastro-container {
    padding: 1rem;
  }
  
  .cadastro-card {
    padding: 2rem 1.5rem;
  }
  
  .cadastro-title {
    font-size: 1.5rem;
  }
  
  .icon-container {
    width: 56px;
    height: 56px;
  }
  
  .icon-container i {
    font-size: 1.75rem;
  }
}
</style>
