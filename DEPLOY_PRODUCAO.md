# GUIA DE DEPLOY PARA PRODUÇÃO

## 📋 PRÉ-REQUISITOS

- Docker Swarm inicializado
- Traefik configurado e funcionando
- Network `network_public` criada (externa)
- Portainer instalado e acessível
- DNS configurado:
  - `api-suporte.otmiz.tech` → IP da VPS
  - `suporte.otmiz.tech` → IP da VPS

---

## 📝 CHECKLIST PRÉ-DEPLOY

- [ ] **Variáveis de ambiente**: Arquivo `.env` criado e configurado
- [ ] **JWT_SECRET**: Gerado com comando `openssl rand -base64 32`
- [ ] **DB_PASSWORD**: Alterado para senha forte (não usar padrão)
- [ ] **Migrations**: Executadas manualmente (ver abaixo)
- [ ] **Network_public**: Verificada se existe (`docker network ls | grep network_public`)
- [ ] **DNS**: Ambos domínios apontando para VPS
- [ ] **Traefik**: Funcionando e acessível
- [ ] **Backup**: Backup do banco feito (se houver dados existentes)
- [ ] **Recursos**: VPS com recursos suficientes (mínimo 2GB RAM, 2 CPUs)

---

## 🚀 PASSO A PASSO DO DEPLOY

### 1. Preparar Variáveis de Ambiente

```bash
# Na raiz do projeto
cp .env.example .env

# Editar .env com valores reais
nano .env
```

**Valores obrigatórios a alterar:**
- `DB_PASSWORD`: Senha forte para PostgreSQL
- `JWT_SECRET`: Gerar com `openssl rand -base64 32`

### 2. Executar Migrations (IMPORTANTE)

**⚠️ ATENÇÃO**: Migrations devem ser executadas ANTES do primeiro deploy.

**Opção A: Executar localmente (conectando ao banco remoto)**
```bash
cd backend

# Configurar variáveis temporariamente
export DB_HOST=seu_host_postgres
export DB_PORT=5432
export DB_NAME=appticket
export DB_USER=postgres
export DB_PASSWORD=sua_senha

# Executar migrations
npm run db:migrate
```

**Opção B: Executar após primeiro deploy (via container temporário)**
```bash
# Depois que o container postgres estiver rodando
docker run --rm \
  --network appticket_network_internal \
  -e DB_HOST=postgres \
  -e DB_PORT=5432 \
  -e DB_NAME=appticket \
  -e DB_USER=postgres \
  -e DB_PASSWORD=sua_senha \
  -v $(pwd)/backend:/app \
  -w /app \
  node:18-alpine \
  sh -c "npm install && npm run db:migrate"
```

### 3. Build das Imagens (Na VPS)

```bash
# Backend
cd backend
docker build -f Dockerfile.prod -t appticket-backend:latest .

# Frontend
cd ../frontend
docker build --build-arg VITE_API_URL=https://api-suporte.otmiz.tech/api \
  -f Dockerfile.prod \
  -t appticket-frontend:latest .
```

**Nota**: As imagens podem ser buildadas localmente e enviadas para registry, ou buildadas diretamente na VPS.

### 4. Deploy via Portainer

1. **Acessar Portainer**
   - Login no Portainer
   - Ir para **Stacks**

2. **Criar Nova Stack**
   - Clicar em **Add Stack**
   - Nome: `appticket`

3. **Configurar Stack**
   - **Build method**: Web editor
   - **Web editor**: Colar conteúdo do arquivo `docker-compose.prod.yml`

4. **Configurar Environment Variables**
   - No Portainer, ir na seção **Environment variables**
   - Ou criar arquivo `.env` no servidor e referenciar
   - Alternativamente, usar secrets do Docker Swarm (recomendado para produção)

5. **Deploy**
   - Clicar em **Deploy the stack**
   - Aguardar serviços iniciarem

### 5. Verificação Pós-Deploy

```bash
# Listar serviços
docker service ls | grep appticket

# Ver logs do backend
docker service logs -f appticket_backend

# Ver logs do frontend
docker service logs -f appticket_frontend

# Ver logs do postgres
docker service logs -f appticket_postgres
```

**Testar endpoints:**
```bash
# Healthcheck do backend
curl https://api-suporte.otmiz.tech/health

# Frontend
curl -I https://suporte.otmiz.tech
```

### 6. Verificar Healthchecks

```bash
# Verificar status dos serviços
docker service ps appticket_backend
docker service ps appticket_frontend
docker service ps appticket_postgres
```

Todos devem estar em estado **Running** e healthchecks **healthy**.

---

## 🔄 ATUALIZAÇÃO (UPDATE)

### Atualizar Stack

1. **Build novas imagens:**
   ```bash
   # Backend
   docker build -f backend/Dockerfile.prod -t appticket-backend:latest ./backend

   # Frontend
   docker build --build-arg VITE_API_URL=https://api-suporte.otmiz.tech/api \
     -f frontend/Dockerfile.prod \
     -t appticket-frontend:latest ./frontend
   ```

2. **Atualizar stack no Portainer:**
   - Editar stack
   - Atualizar docker-compose.yml (se necessário)
   - Clicar em **Update the stack**

3. **Ou via CLI:**
   ```bash
   docker stack deploy -c docker-compose.prod.yml appticket
   ```

### Executar Novas Migrations

**⚠️ SEMPRE executar migrations antes de atualizar o código que depende delas:**

```bash
# Conectar ao container do backend
docker exec -it $(docker ps -q -f name=appticket_backend) sh

# Dentro do container
npm run db:migrate
```

---

## 🔙 ROLLBACK

Se algo der errado após atualização:

```bash
# Rollback do backend
docker service rollback appticket_backend

# Rollback do frontend
docker service rollback appticket_frontend

# Rollback do postgres (cuidado!)
docker service rollback appticket_postgres
```

---

## 🗄️ BACKUP E RESTORE

### Backup do PostgreSQL

```bash
# Criar backup
docker run --rm \
  --network appticket_network_internal \
  -v postgres_data:/var/lib/postgresql/data \
  -v $(pwd):/backup \
  postgres:15-alpine \
  pg_dump -h postgres -U postgres -d appticket -F c -f /backup/backup_$(date +%Y%m%d_%H%M%S).dump

# Ou via container do postgres
docker exec -it $(docker ps -q -f name=appticket_postgres) \
  pg_dump -U postgres -d appticket > backup_$(date +%Y%m%d_%H%M%S).sql
```

### Restore do PostgreSQL

```bash
# Restore do backup
docker exec -i $(docker ps -q -f name=appticket_postgres) \
  psql -U postgres -d appticket < backup_20240101_120000.sql
```

---

## 🔍 TROUBLESHOOTING

### Serviço não inicia

```bash
# Ver logs detalhados
docker service logs --tail 100 appticket_backend

# Verificar eventos
docker service ps --no-trunc appticket_backend
```

### Healthcheck falhando

```bash
# Testar healthcheck manualmente
docker exec -it $(docker ps -q -f name=appticket_backend) \
  node -e "require('http').get('http://localhost:3000/health', (r) => {console.log(r.statusCode)})"
```

### Problemas de conectividade

```bash
# Verificar networks
docker network inspect network_public
docker network inspect appticket_network_internal

# Verificar se serviços estão nas networks corretas
docker service inspect appticket_backend | grep -A 10 Networks
```

### Traefik não roteando

1. Verificar se serviços estão na network `network_public`
2. Verificar labels do Traefik nos serviços
3. Verificar logs do Traefik:
   ```bash
   docker service logs traefik
   ```

### SSL não funciona

1. Verificar se DNS está apontando corretamente
2. Verificar se Let's Encrypt está configurado no Traefik
3. Verificar logs do Traefik para erros de certificado

---

## 📊 MONITORAMENTO

### Recursos

```bash
# Ver uso de recursos dos serviços
docker stats $(docker ps -q --filter "name=appticket")
```

### Logs

```bash
# Seguir logs em tempo real
docker service logs -f appticket_backend

# Últimas 100 linhas
docker service logs --tail 100 appticket_backend
```

---

## 🔒 SEGURANÇA

### Secrets do Docker Swarm (Recomendado)

Em vez de usar `.env` no Portainer, usar Docker Secrets:

```bash
# Criar secrets
echo "senha_forte_aqui" | docker secret create db_password -
echo "jwt_secret_forte_aqui" | docker secret create jwt_secret -

# No docker-compose.yml, usar:
# secrets:
#   - db_password
#   - jwt_secret
# environment:
#   DB_PASSWORD_FILE: /run/secrets/db_password
```

### Atualizar Secrets

1. Criar novo secret
2. Atualizar stack para usar novo secret
3. Remover secret antigo após confirmação

---

## 📞 SUPORTE

Em caso de problemas:

1. Verificar logs dos serviços
2. Verificar healthchecks
3. Verificar recursos do sistema
4. Verificar conectividade de rede
5. Consultar documentação do Traefik

---

**Última atualização**: Baseado na análise completa do projeto AppTicket

