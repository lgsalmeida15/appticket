<template>
  <div class="not-found-view">
    <div class="container">
      <div class="row justify-content-center align-items-center min-vh-100">
        <div class="col-md-6 text-center">
          <h1 class="display-1">404</h1>
          <h2 class="mb-4">Página não encontrada</h2>
          <p class="text-muted mb-4">
            A página que você está procurando não existe.
          </p>
          <router-link to="/" class="btn btn-primary">
            <i class="bi bi-house-door me-2"></i>
            Voltar para Home
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.not-found-view {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

h1 {
  font-size: 8rem;
  font-weight: bold;
}
</style>

