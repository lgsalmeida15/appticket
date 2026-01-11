# ANÁLISE COMPLETA - PREPARAÇÃO PARA PRODUÇÃO

## 1. MAPEAMENTO DE CONFIGURAÇÕES ATUAIS

### Backend

**Porta:**
- Configurada via `process.env.PORT` (padrão: 3000)
- Definida em: `backend/src/server.js:31`

**Comando de start:**
- Produção: `npm start` → `node src/server.js`
- Definido em: `backend/package.json:8`

**Variáveis de ambiente necessárias:**
1. `NODE_ENV` - Ambiente (development/production)
2. `PORT` - Porta do servidor (padrão: 3000)
3. `DB_HOST` - Host do PostgreSQL (padrão: localhost)
4. `DB_PORT` - Porta do PostgreSQL (padrão: 5432)
5. `DB_NAME` - Nome do banco de dados (padrão: appticket)
6. `DB_USER` - Usuário do PostgreSQL (padrão: postgres)
7. `DB_PASSWORD` - Senha do PostgreSQL (obrigatório)
8. `DB_SSL` - SSL do banco (opcional, para produção externa)
9. `JWT_SECRET` - Segredo para tokens JWT (obrigatório, não pode ser padrão)
10. `JWT_EXPIRES_IN` - Tempo de expiração do token (padrão: 24h)
11. `CORS_ORIGIN` - Origens permitidas CORS (separadas por vírgula)
12. `API_URL` - URL da API para Swagger (opcional)
13. `WEBHOOK_URL` - URL para webhooks (opcional)
14. `WEBHOOK_SECRET` - Secret para validação de webhooks (opcional)

**Healthcheck endpoint:**
- Rota: `GET /health`
- Retorna: `{ status: 'OK', message: 'Servidor AppTicket está rodando', timestamp: ISO }`
- Definida em: `backend/src/server.js:75-81`

**Migrations:**
- Comando: `npm run db:migrate` → `npx sequelize-cli db:migrate`
- Diretório: `backend/src/migrations/`
- Configuração: `backend/config/config.cjs`
- **IMPORTANTE**: Precisam ser executadas manualmente antes do deploy

**Uploads:**
- Diretório: `backend/uploads/`
- Rota: `/uploads` (express.static)
- Tamanho máximo: 10MB
- Tipos permitidos: imagens, PDFs, documentos Office, ZIP, RAR

### Frontend

**Build command:**
- `npm run build` → `vite build`
- Definido em: `frontend/package.json:8`

**Output directory:**
- `dist/` (padrão do Vite)

**Variáveis de ambiente (build time):**
1. `VITE_API_URL` - URL da API (padrão: http://localhost:3000/api)
- Usada em: `frontend/src/api/http.js:9`

**Servidor de produção:**
- Não há servidor de produção configurado atualmente
- **NECESSÁRIO**: Adicionar servidor HTTP (serve ou nginx)
- O Vite tem `npm run preview` mas não é adequado para produção

**SPA routing:**
- Usa Vue Router (SPA)
- **NECESSÁRIO**: Configurar fallback para `index.html` no servidor

**Porta do servidor:**
- Em desenvolvimento: 5173 (Vite dev server)
- Em produção: precisa definir (80 ou customizado)

### PostgreSQL

**Versão:**
- PostgreSQL 15-alpine (do docker-compose.yml atual)

**Database name:**
- `appticket` (padrão)

**Usuário:**
- `postgres` (padrão, mas deve ser alterado em produção)

**Opção recomendada:**
- **Container no stack** para simplicidade inicial
- Banco externo pode ser configurado posteriormente se necessário

---

## 2. DOCKERFILE BACKEND - PROPOSTA

```dockerfile
# Stage 1: Build
FROM node:18-alpine AS builder

WORKDIR /app

# Copiar arquivos de dependências
COPY package*.json ./

# Instalar dependências (apenas produção)
RUN npm ci --only=production && npm cache clean --force

# Stage 2: Production
FROM node:18-alpine

WORKDIR /app

# Instalar dumb-init para gerenciamento de processos
RUN apk add --no-cache dumb-init

# Criar usuário não-root
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copiar dependências do stage builder
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules

# Copiar código da aplicação
COPY --chown=nodejs:nodejs . .

# Criar diretórios necessários
RUN mkdir -p uploads logs && \
    chown -R nodejs:nodejs uploads logs

# Mudar para usuário não-root
USER nodejs

# Expor porta
EXPOSE 3000

# Healthcheck
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Usar dumb-init para gerenciar processo Node
ENTRYPOINT ["dumb-init", "--"]

# Comando de start
CMD ["node", "src/server.js"]
```

**Explicação:**
- **Multi-stage build**: Reduz tamanho final da imagem eliminando cache e devDependencies
- **dumb-init**: Gerencia processos corretamente (importante para containers)
- **Usuário não-root**: Segurança (nodejs user)
- **Healthcheck**: Verifica se aplicação está saudável via endpoint /health
- **npm ci**: Instalação mais rápida e determinística (usa package-lock.json)
- **Cache optimization**: Dependências copiadas antes do código para melhor cache

---

## 3. DOCKERFILE FRONTEND - PROPOSTA

```dockerfile
# Stage 1: Build
FROM node:18-alpine AS builder

WORKDIR /app

# Copiar arquivos de dependências
COPY package*.json ./

# Instalar dependências
RUN npm ci && npm cache clean --force

# Copiar código
COPY . .

# Build da aplicação (variáveis de ambiente devem estar disponíveis)
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

# Stage 2: Production (servir arquivos estáticos)
FROM nginx:alpine

# Copiar arquivos buildados
COPY --from=builder /app/dist /usr/share/nginx/html

# Copiar configuração customizada do nginx para SPA
RUN echo 'server { \
    listen 80; \
    server_name _; \
    root /usr/share/nginx/html; \
    index index.html; \
    \
    # Gzip compression \
    gzip on; \
    gzip_vary on; \
    gzip_min_length 1024; \
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json; \
    \
    # SPA fallback \
    location / { \
        try_files $uri $uri/ /index.html; \
    } \
    \
    # Cache para assets estáticos \
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ { \
        expires 1y; \
        add_header Cache-Control "public, immutable"; \
    } \
}' > /etc/nginx/conf.d/default.conf

# Healthcheck
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost/ || exit 1

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

**Explicação:**
- **Multi-stage build**: Separa build de produção do servidor final
- **nginx alpine**: Servidor leve e eficiente para arquivos estáticos
- **SPA routing**: Configuração nginx com fallback para index.html
- **Gzip**: Compressão para melhor performance
- **Cache headers**: Assets estáticos com cache longo
- **Build-time env**: VITE_API_URL definido no build (não runtime)

---

## 4. DOCKER-COMPOSE.YML - PROPOSTA

```yaml
version: '3.8'

services:
  # Backend API
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    image: appticket-backend:latest
    restart: unless-stopped
    environment:
      NODE_ENV: production
      PORT: 3000
      DB_HOST: postgres
      DB_PORT: 5432
      DB_NAME: ${DB_NAME}
      DB_USER: ${DB_USER}
      DB_PASSWORD: ${DB_PASSWORD}
      JWT_SECRET: ${JWT_SECRET}
      JWT_EXPIRES_IN: ${JWT_EXPIRES_IN:-24h}
      CORS_ORIGIN: https://suporte.otmiz.tech
      API_URL: https://api-suporte.otmiz.tech/api
      WEBHOOK_URL: ${WEBHOOK_URL:-}
      WEBHOOK_SECRET: ${WEBHOOK_SECRET:-}
    depends_on:
      postgres:
        condition: service_healthy
    volumes:
      - backend_uploads:/app/uploads
      - backend_logs:/app/logs
    networks:
      - network_public
      - network_internal
    deploy:
      replicas: 1
      update_config:
        parallelism: 1
        delay: 10s
        order: start-first
      rollback_config:
        parallelism: 1
      restart_policy:
        condition: on-failure
        delay: 5s
        max_attempts: 3
      resources:
        limits:
          cpus: '1'
          memory: 512M
        reservations:
          cpus: '0.5'
          memory: 256M
    labels:
      # Traefik labels
      - "traefik.enable=true"
      - "traefik.docker.network=network_public"
      # HTTP Router
      - "traefik.http.routers.backend.rule=Host(`api-suporte.otmiz.tech`)"
      - "traefik.http.routers.backend.entrypoints=websecure"
      - "traefik.http.routers.backend.tls.certresolver=letsencrypt"
      - "traefik.http.routers.backend.service=backend"
      # HTTP Service
      - "traefik.http.services.backend.loadbalancer.server.port=3000"
      # Middlewares
      - "traefik.http.routers.backend.middlewares=backend-headers"
      - "traefik.http.middlewares.backend-headers.headers.customrequestheaders.X-Forwarded-Proto=https"
    healthcheck:
      test: ["CMD", "node", "-e", "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"]
      interval: 30s
      timeout: 3s
      start_period: 40s
      retries: 3

  # Frontend
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
      args:
        VITE_API_URL: https://api-suporte.otmiz.tech/api
    image: appticket-frontend:latest
    restart: unless-stopped
    networks:
      - network_public
    deploy:
      replicas: 1
      update_config:
        parallelism: 1
        delay: 10s
        order: start-first
      rollback_config:
        parallelism: 1
      restart_policy:
        condition: on-failure
        delay: 5s
        max_attempts: 3
      resources:
        limits:
          cpus: '0.5'
          memory: 128M
        reservations:
          cpus: '0.25'
          memory: 64M
    labels:
      # Traefik labels
      - "traefik.enable=true"
      - "traefik.docker.network=network_public"
      # HTTP Router
      - "traefik.http.routers.frontend.rule=Host(`suporte.otmiz.tech`)"
      - "traefik.http.routers.frontend.entrypoints=websecure"
      - "traefik.http.routers.frontend.tls.certresolver=letsencrypt"
      - "traefik.http.routers.frontend.service=frontend"
      # HTTP Service
      - "traefik.http.services.frontend.loadbalancer.server.port=80"
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost/"]
      interval: 30s
      timeout: 3s
      start_period: 5s
      retries: 3

  # PostgreSQL Database
  postgres:
    image: postgres:15-alpine
    restart: unless-stopped
    environment:
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: ${DB_NAME}
      PGDATA: /var/lib/postgresql/data/pgdata
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - network_internal
    deploy:
      replicas: 1
      placement:
        constraints:
          - node.role == manager
      resources:
        limits:
          cpus: '1'
          memory: 512M
        reservations:
          cpus: '0.5'
          memory: 256M
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER}"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  postgres_data:
    driver: local
  backend_uploads:
    driver: local
  backend_logs:
    driver: local

networks:
  network_public:
    external: true
  network_internal:
    driver: overlay
    internal: false
```

**Explicação:**
- **network_public**: Rede externa do Traefik (deve existir previamente)
- **network_internal**: Rede privada para comunicação backend-postgres
- **Labels Traefik**: Configuração para roteamento HTTPS automático
- **Healthchecks**: Todos os serviços têm healthchecks configurados
- **Deploy config**: Configurações para Docker Swarm (replicas, rollback, etc)
- **Resources**: Limites de CPU/Memória para cada serviço
- **Volumes**: Persistência de dados PostgreSQL e uploads/logs do backend
- **Environment variables**: Usa variáveis do arquivo .env (não hardcoded)

---

## 5. VARIÁVEIS DE AMBIENTE

### .env.example (Root - para docker-compose)

```bash
# Banco de Dados PostgreSQL
DB_HOST=postgres
DB_PORT=5432
DB_NAME=appticket
DB_USER=postgres
DB_PASSWORD=ALTERAR_SENHA_FORTE_AQUI
DB_SSL=false

# JWT
JWT_SECRET=GERAR_SECRET_FORTE_AQUI_MINIMO_32_CHARS
JWT_EXPIRES_IN=24h

# CORS (já configurado no docker-compose, mas pode ser customizado)
# CORS_ORIGIN=https://suporte.otmiz.tech

# Webhooks (opcional)
WEBHOOK_URL=
WEBHOOK_SECRET=
```

**Nota**: Este arquivo deve ser copiado para `.env` (não versionado) e preenchido com valores reais.

---

## 6. QUESTÕES PARA DECISÃO

Antes de finalizar, preciso confirmar as seguintes decisões:

### 1. PostgreSQL: Container ou Banco Externo?

**Opção A: Container no stack** ✅ RECOMENDADO PARA INÍCIO
- Mais simples de configurar
- Funciona imediatamente
- Backup via volumes Docker
- Adequado para início de produção

**Opção B: Banco externo**
- Mais seguro e performático
- Requer configuração separada
- Backup gerenciado externamente
- Melhor para alta escala

**MINHA RECOMENDAÇÃO**: Opção A (Container) para começar, pode migrar depois.

### 2. Migrations: Automático ou Manual?

**Opção A: Automático** (via script de entrypoint)
- Executa migrations no startup
- Risco de conflitos em múltiplas replicas
- Pode causar problemas em atualizações

**Opção B: Manual** ✅ RECOMENDADO
- Mais seguro e controlado
- Executar antes do deploy
- Sem risco de conflitos

**MINHA RECOMENDAÇÃO**: Opção B (Manual) - executar `npm run db:migrate` antes do deploy.

### 3. Volumes para Persistência

Definidos no docker-compose.yml:
- ✅ `postgres_data` - Dados PostgreSQL
- ✅ `backend_uploads` - Arquivos uploadados
- ✅ `backend_logs` - Logs da aplicação

**Confirmar**: Localização dos volumes (path customizado ou padrão do Docker?)

### 4. Replicas: Quantas Instâncias?

**Backend:**
- **Recomendação**: 1 replica inicialmente
- Pode aumentar conforme carga
- Migrations manuais facilitam múltiplas replicas

**Frontend:**
- **Recomendação**: 1 replica (nginx serve estáticos, pode ter múltiplas facilmente)

**PostgreSQL:**
- **Recomendação**: 1 replica (replicação precisa configuração avançada)

### 5. Recursos: Limites Apropriados?

**Backend:**
- Limite: 1 CPU, 512MB RAM
- Reserva: 0.5 CPU, 256MB RAM

**Frontend:**
- Limite: 0.5 CPU, 128MB RAM
- Reserva: 0.25 CPU, 64MB RAM

**PostgreSQL:**
- Limite: 1 CPU, 512MB RAM
- Reserva: 0.5 CPU, 256MB RAM

**Confirmar**: Estes limites são adequados para seu ambiente?

---

## 7. INSTRUÇÕES DE BUILD E DEPLOY

### Passo 1: Preparação

1. **Configurar variáveis de ambiente:**
   ```bash
   cp .env.example .env
   # Editar .env com valores reais
   ```

2. **Verificar network_public:**
   ```bash
   docker network ls | grep network_public
   # Se não existir, criar: docker network create --driver overlay network_public
   ```

3. **Executar migrations (MANUAL):**
   ```bash
   # Conectar no container do banco ou executar localmente
   cd backend
   npm run db:migrate
   ```

### Passo 2: Build das Imagens

1. **Build das imagens (na VPS):**
   ```bash
   # Backend
   cd backend
   docker build -t appticket-backend:latest .

   # Frontend
   cd frontend
   docker build --build-arg VITE_API_URL=https://api-suporte.otmiz.tech/api -t appticket-frontend:latest .
   ```

### Passo 3: Deploy via Portainer

1. **Acessar Portainer**
2. **Stacks → Add Stack**
3. **Nome**: `appticket`
4. **Web Editor**: Colar conteúdo do `docker-compose.yml`
5. **Environment variables**: Configurar no Portainer ou usar arquivo .env
6. **Deploy the stack**

### Passo 4: Verificação

1. **Verificar serviços:**
   ```bash
   docker service ls | grep appticket
   ```

2. **Verificar logs:**
   ```bash
   docker service logs appticket_backend
   docker service logs appticket_frontend
   ```

3. **Testar endpoints:**
   - Backend: `https://api-suporte.otmiz.tech/health`
   - Frontend: `https://suporte.otmiz.tech`

### Passo 5: Rollback (se necessário)

```bash
docker service rollback appticket_backend
docker service rollback appticket_frontend
```

---

## 8. CHECKLIST PRÉ-DEPLOY

- [ ] Arquivo `.env` criado e configurado com valores reais
- [ ] JWT_SECRET gerado (mínimo 32 caracteres aleatórios)
- [ ] DB_PASSWORD alterado (não usar padrão)
- [ ] Migrations executadas manualmente
- [ ] Network `network_public` existe na VPS
- [ ] DNS apontando corretamente:
  - [ ] `api-suporte.otmiz.tech` → IP da VPS
  - [ ] `suporte.otmiz.tech` → IP da VPS
- [ ] Traefik funcionando e configurado
- [ ] Imagens buildadas com sucesso
- [ ] Backup do banco (se já existir dados)
- [ ] Testado localmente (se possível)
- [ ] Recursos da VPS suficientes para os limites definidos
- [ ] Portainer acessível e funcionando

---

## OBSERVAÇÕES IMPORTANTES

1. **Network_public**: Deve existir previamente (criada pelo Traefik)
2. **DNS**: Domínios devem estar apontando para a VPS antes do deploy
3. **SSL**: Traefik gerencia automaticamente via Let's Encrypt
4. **Migrations**: SEMPRE executar manualmente antes do deploy
5. **Secrets**: NUNCA commitar arquivo .env
6. **Backup**: Configurar backup automático do volume postgres_data

---

**Aguardando suas respostas às questões de decisão antes de gerar os arquivos finais.**

