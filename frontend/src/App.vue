<template>
  <div id="app">
    <router-view />
    <ToastContainer />
  </div>
</template>

<script setup>
import { onMounted } from 'vue';
import { useAuthStore } from '@/stores/auth';
import ToastContainer from '@/components/shared/ToastContainer.vue';

const authStore = useAuthStore();

onMounted(() => {
  // Verificar se há token salvo e validar
  authStore.checkAuth();
});
</script>

<style>
/* ========================================
   APP ROOT
   Design System importado via main.js
   ======================================== */
#app {
  min-height: 100vh;
  background-color: var(--color-bg-secondary);
  font-family: var(--font-primary);
  color: var(--color-text-primary);
}

/* ========================================
   BOOTSTRAP OVERRIDES - Apenas ajustes necessários
   ======================================== */

/* Cards */
.card {
  border: 1px solid var(--color-border-medium) !important;
  border-radius: var(--radius-lg) !important;
  box-shadow: var(--shadow-sm) !important;
  background: var(--color-bg-primary) !important;
}

.card:hover {
  box-shadow: var(--shadow-md) !important;
}

.card-header {
  background: transparent !important;
  border-bottom: 1px solid var(--color-border-medium) !important;
  padding: var(--space-5) var(--space-6) !important;
}

.card-body {
  padding: var(--space-6) !important;
}

.card-footer {
  background: var(--color-bg-secondary) !important;
  border-top: 1px solid var(--color-border-medium) !important;
  padding: var(--space-5) var(--space-6) !important;
}

/* Botões Bootstrap */
.btn {
  border-radius: var(--radius-base) !important;
  font-weight: var(--font-weight-medium) !important;
  padding: 0 var(--space-5) !important;
  height: var(--button-height-base) !important;
  display: inline-flex !important;
  align-items: center !important;
  gap: var(--space-2) !important;
  transition: all var(--transition-base) !important;
  border: none !important;
  line-height: 1 !important;
}

.btn-sm {
  height: var(--button-height-sm) !important;
  padding: 0 var(--space-3) !important;
  font-size: var(--font-size-xs) !important;
}

.btn-lg {
  height: var(--button-height-lg) !important;
  padding: 0 var(--space-8) !important;
  font-size: var(--font-size-base) !important;
}

.btn-primary {
  background-color: var(--color-primary) !important;
  color: white !important;
}

.btn-primary:hover {
  background-color: var(--color-primary-hover) !important;
  box-shadow: var(--shadow-primary) !important;
  transform: translateY(-1px);
}

.btn-secondary {
  background-color: var(--color-gray-200) !important;
  color: var(--color-text-primary) !important;
}

.btn-secondary:hover {
  background-color: var(--color-gray-300) !important;
}

.btn-success {
  background-color: var(--color-success-500) !important;
  color: white !important;
}

.btn-success:hover {
  background-color: var(--color-success-600) !important;
}

.btn-danger {
  background-color: var(--color-danger-500) !important;
  color: white !important;
}

.btn-danger:hover {
  background-color: var(--color-danger-600) !important;
}

.btn-warning {
  background-color: var(--color-warning-500) !important;
  color: white !important;
}

.btn-warning:hover {
  background-color: var(--color-warning-600) !important;
}

.btn-info {
  background-color: var(--color-info-500) !important;
  color: white !important;
}

.btn-info:hover {
  background-color: var(--color-info-600) !important;
}

/* Outline buttons */
.btn-outline-primary {
  background-color: transparent !important;
  color: var(--color-primary) !important;
  border: 1.5px solid var(--color-primary) !important;
}

.btn-outline-primary:hover {
  background-color: var(--color-primary) !important;
  color: white !important;
}

.btn-outline-secondary {
  background-color: transparent !important;
  color: var(--color-text-secondary) !important;
  border: 1.5px solid var(--color-border-strong) !important;
}

.btn-outline-secondary:hover {
  background-color: var(--color-gray-100) !important;
  color: var(--color-text-primary) !important;
}

/* Badges Bootstrap */
.badge {
  padding: var(--space-1) var(--space-3) !important;
  font-size: var(--font-size-xs) !important;
  font-weight: var(--font-weight-medium) !important;
  border-radius: var(--radius-full) !important;
}

.badge.bg-primary,
.bg-primary {
  background-color: var(--color-primary) !important;
}

.badge.bg-success,
.bg-success {
  background-color: var(--color-success-500) !important;
}

.badge.bg-danger,
.bg-danger {
  background-color: var(--color-danger-500) !important;
}

.badge.bg-warning,
.bg-warning {
  background-color: var(--color-warning-500) !important;
}

.badge.bg-info,
.bg-info {
  background-color: var(--color-info-500) !important;
}

.badge.bg-secondary,
.bg-secondary {
  background-color: var(--color-gray-500) !important;
}

/* Forms */
.form-control,
.form-select {
  height: var(--input-height-base) !important;
  padding: 0 var(--space-4) !important;
  font-size: var(--font-size-sm) !important;
  border: 1.5px solid var(--color-border-strong) !important;
  border-radius: var(--radius-base) !important;
  transition: all var(--transition-base) !important;
}

.form-control:focus,
.form-select:focus {
  border-color: var(--color-primary) !important;
  box-shadow: 0 0 0 3px var(--color-primary-light) !important;
}

.form-label {
  font-size: var(--font-size-sm) !important;
  font-weight: var(--font-weight-medium) !important;
  color: var(--color-text-secondary) !important;
  margin-bottom: var(--space-2) !important;
}

/* Modals */
.modal-content {
  border: none !important;
  border-radius: var(--radius-xl) !important;
  box-shadow: var(--shadow-xl) !important;
}

.modal-header {
  padding: var(--space-6) !important;
  border-bottom: 1px solid var(--color-border-medium) !important;
  background-color: var(--color-bg-secondary) !important;
}

.modal-title {
  font-size: var(--font-size-lg) !important;
  font-weight: var(--font-weight-semibold) !important;
}

.modal-body {
  padding: var(--space-6) !important;
}

.modal-footer {
  padding: var(--space-6) !important;
  border-top: 1px solid var(--color-border-medium) !important;
  background-color: var(--color-bg-secondary) !important;
}

/* Tables */
.table {
  border-collapse: separate;
  border-spacing: 0;
}

.table thead th {
  background-color: var(--color-bg-tertiary) !important;
  border-bottom: 1px solid var(--color-border-medium) !important;
  padding: var(--space-3) var(--space-4) !important;
  font-size: var(--font-size-xs) !important;
  font-weight: var(--font-weight-semibold) !important;
  text-transform: uppercase;
  letter-spacing: var(--letter-spacing-wider);
  color: var(--color-text-secondary) !important;
}

.table tbody td {
  padding: var(--space-4) !important;
  border-bottom: 1px solid var(--color-border-light) !important;
}

.table tbody tr:hover {
  background-color: var(--color-bg-tertiary) !important;
}

/* Alerts */
.alert {
  border-radius: var(--radius-base) !important;
  padding: var(--space-4) var(--space-5) !important;
  border-left: 4px solid !important;
  border-top: none !important;
  border-right: none !important;
  border-bottom: none !important;
}

.alert-success {
  background-color: var(--color-success-50) !important;
  color: var(--color-success-700) !important;
  border-left-color: var(--color-success-500) !important;
}

.alert-danger {
  background-color: var(--color-danger-50) !important;
  color: var(--color-danger-700) !important;
  border-left-color: var(--color-danger-500) !important;
}

.alert-warning {
  background-color: var(--color-warning-50) !important;
  color: var(--color-warning-700) !important;
  border-left-color: var(--color-warning-500) !important;
}

.alert-info {
  background-color: var(--color-info-50) !important;
  color: var(--color-info-700) !important;
  border-left-color: var(--color-info-500) !important;
}

/* Dropdown */
.dropdown-menu {
  border: 1px solid var(--color-border-medium) !important;
  border-radius: var(--radius-lg) !important;
  box-shadow: var(--shadow-lg) !important;
  padding: var(--space-2) !important;
}

.dropdown-item {
  padding: var(--space-2) var(--space-3) !important;
  border-radius: var(--radius-base) !important;
  font-size: var(--font-size-sm) !important;
  transition: all var(--transition-base) !important;
}

.dropdown-item:hover {
  background-color: var(--color-bg-tertiary) !important;
  color: var(--color-primary) !important;
}

/* Pagination */
.pagination {
  gap: var(--space-2);
}

.page-link {
  border-radius: var(--radius-base) !important;
  border: 1px solid var(--color-border-medium) !important;
  padding: var(--space-2) var(--space-4) !important;
  font-size: var(--font-size-sm) !important;
  font-weight: var(--font-weight-medium) !important;
  color: var(--color-text-secondary) !important;
  transition: all var(--transition-base) !important;
}

.page-link:hover {
  background-color: var(--color-bg-tertiary) !important;
  color: var(--color-text-primary) !important;
  border-color: var(--color-border-strong) !important;
}

.page-item.active .page-link {
  background-color: var(--color-primary) !important;
  border-color: var(--color-primary) !important;
  color: white !important;
}

/* Spinner */
.spinner-border {
  border-color: var(--color-primary) !important;
  border-right-color: transparent !important;
}

/* Text utilities */
.text-muted {
  color: var(--color-text-muted) !important;
}

.text-primary {
  color: var(--color-primary) !important;
}

.text-success {
  color: var(--color-success-600) !important;
}

.text-danger {
  color: var(--color-danger-600) !important;
}

.text-warning {
  color: var(--color-warning-600) !important;
}

.text-info {
  color: var(--color-info-600) !important;
}

/* Border utilities */
.border-primary {
  border-color: var(--color-primary) !important;
}

.border-success {
  border-color: var(--color-success-500) !important;
}

.border-danger {
  border-color: var(--color-danger-500) !important;
}

.border-warning {
  border-color: var(--color-warning-500) !important;
}

.border-info {
  border-color: var(--color-info-500) !important;
}
</style>
