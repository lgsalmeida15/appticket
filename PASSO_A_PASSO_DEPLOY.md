# PASSO A PASSO - DEPLOY NO PORTAINER

## 📋 RESUMO EXECUTIVO

Este guia leva você desde a configuração do `.env` até o deploy completo no Portainer, passo a passo.

---

## 🔧 ETAPA 1: CONFIGURAR .env NA VPS

### 1.1 Conectar na VPS

```bash
ssh usuario@ip-da-vps
```

### 1.2 Navegar para o diretório do projeto

```bash
cd /opt/appticket
# ou o diretório onde está o projeto
```

### 1.3 Criar arquivo .env na pasta backend

```bash
cd backend
nano .env
```

### 1.4 Colar o seguinte conteúdo (substituir valores) no arquivo .env dentro de backend/:

```bash
# Banco de Dados
DB_HOST=postgres
DB_PORT=5432
DB_NAME=appticket
DB_USER=postgres
DB_PASSWORD=SUA_SENHA_FORTE_AQUI

# JWT
JWT_SECRET=SEU_SECRET_GERADO
JWT_EXPIRES_IN=24h

# Webhooks (opcional)
WEBHOOK_URL=
WEBHOOK_SECRET=
```

### 1.5 Gerar valores seguros

**Gerar JWT_SECRET (executar na VPS):**
```bash
openssl rand -base64 32
```
Copie o resultado e cole no `.env` como valor de `JWT_SECRET`.

**Exemplo de .env preenchido:**
```bash
DB_HOST=postgres
DB_PORT=5432
DB_NAME=appticket
DB_USER=postgres
DB_PASSWORD=MinhaSenh@Forte123!
JWT_SECRET=wK8xP3mN9qR2sT5vY7zA1bC4dE6fG8hJ0kL2nM5pQ7rS9tU1vW3xY5zA7b
JWT_EXPIRES_IN=24h
WEBHOOK_URL=
WEBHOOK_SECRET=
```

### 1.6 Salvar arquivo

- No `nano`: `Ctrl+O` → `Enter` → `Ctrl+X`
- No `vi`: `:wq` → `Enter`

### 1.7 Salvar e proteger arquivo

- No `nano`: `Ctrl+O` → `Enter` → `Ctrl+X`
- No `vi`: `:wq` → `Enter`

```bash
chmod 600 .env
cd ..  # Voltar para a raiz do projeto
```

---

## 🐳 ETAPA 2: PREPARAR AMBIENTE DOCKER

### 2.1 Verificar Docker Swarm

```bash
docker info | grep Swarm
```

**Se não estiver ativo:**
```bash
docker swarm init
```

### 2.2 Verificar/Criar network_public

```bash
# Verificar se existe
docker network ls | grep network_public

# Se não existir, criar
docker network create --driver overlay --attachable network_public
```

---

## 🚀 ETAPA 3: BUILD DAS IMAGENS

### 3.1 Build Backend

```bash
cd /opt/appticket
docker build -f backend/Dockerfile.prod -t appticket-backend:latest ./backend
```

**Aguarde completar** (pode demorar alguns minutos)

### 3.2 Build Frontend

```bash
docker build \
  --build-arg VITE_API_URL=https://api-suporte.otmiz.tech/api \
  -f frontend/Dockerfile.prod \
  -t appticket-frontend:latest \
  ./frontend
```

**Aguarde completar**

### 3.3 Verificar imagens

```bash
docker images | grep appticket
```

Deve mostrar:
- `appticket-backend:latest`
- `appticket-frontend:latest`

---

## 📦 ETAPA 4: DEPLOY NO PORTAINER

### 4.1 Abrir Portainer

1. Acesse o Portainer no navegador:
   ```
   http://ip-da-vps:9000
   ```
   ou
   ```
   https://portainer.seudominio.com
   ```

2. Faça login com suas credenciais

### 4.2 Acessar Stacks

1. No menu lateral esquerdo, clique em **Stacks**
2. Clique no botão **Add stack** (canto superior direito)

### 4.3 Configurar Stack

1. **Name**: Digite `appticket`

2. **Build method**: Selecione **Web editor**

3. **Web editor**: 
   - Abra o arquivo `docker-compose.prod.yml` no seu computador
   - Selecione todo o conteúdo (`Ctrl+A`)
   - Copie (`Ctrl+C`)
   - Cole no editor do Portainer (`Ctrl+V`)

4. **Environment variables**:
   
   **IMPORTANTE**: Como o `.env` fica em `backend/`, você precisa configurar manualmente no Portainer.
   
   **OPÇÃO A - Exportar variáveis do backend/.env (antes de abrir o Portainer):**
   ```bash
   # Na VPS, executar antes de abrir o Portainer:
   cd /opt/appticket/backend
   source .env
   export DB_NAME DB_USER DB_PASSWORD JWT_SECRET JWT_EXPIRES_IN WEBHOOK_URL WEBHOOK_SECRET
   cd ..
   ```
   Então o Portainer pode usar as variáveis exportadas (se executado no mesmo terminal).
   
   **OPÇÃO B - Manual no Portainer (recomendado):**
   - Marque **Environment variables**
   - Clique em **Add variable**
   - Adicione cada variável (copie os valores do arquivo `backend/.env`):
     ```
     DB_NAME = appticket
     DB_USER = postgres
     DB_PASSWORD = sua_senha_aqui (do backend/.env)
     JWT_SECRET = seu_secret_gerado (do backend/.env)
     JWT_EXPIRES_IN = 24h
     WEBHOOK_URL = (deixe vazio se não usar)
     WEBHOOK_SECRET = (deixe vazio se não usar)
     ```

### 4.4 Deploy

1. Role a página até o final
2. Clique no botão **Deploy the stack**
3. Aguarde o deploy completar (pode levar alguns minutos)

### 4.5 Verificar Deploy

1. Volte para **Stacks** (menu lateral)
2. Você deve ver a stack `appticket` listada
3. Clique em `appticket` para ver detalhes

4. Vá em **Services** (menu lateral)
5. Verifique se aparecem:
   - `appticket_backend`
   - `appticket_frontend`
   - `appticket_postgres`

6. Clique em cada serviço para ver:
   - Status (deve estar "Running")
   - Logs
   - Configurações

---

## 🗄️ ETAPA 5: EXECUTAR MIGRATIONS

### 5.1 Aguardar PostgreSQL estar pronto

No Portainer:
1. Vá em **Services**
2. Clique em `appticket_postgres`
3. Vá na aba **Logs**
4. Aguarde aparecer: `database system is ready to accept connections`

**OU via terminal:**

```bash
docker service logs appticket_postgres | grep "ready to accept connections"
```

### 5.2 Executar migrations via terminal

```bash
cd /opt/appticket/backend

# Carregar variáveis do .env (dentro de backend/)
source .env

# Executar migrations
docker run --rm \
  --network appticket_network_internal \
  -e DB_HOST=postgres \
  -e DB_PORT=5432 \
  -e DB_NAME=$DB_NAME \
  -e DB_USER=$DB_USER \
  -e DB_PASSWORD=$DB_PASSWORD \
  -v $(pwd):/app \
  -w /app \
  node:18-alpine \
  sh -c "npm install && npm run db:migrate"
```

**Aguarde completar** - você deve ver mensagens de migration sendo executadas.

---

## ✅ ETAPA 6: VERIFICAÇÃO

### 6.1 Verificar status dos serviços (Portainer)

1. **Services** → Verifique que todos estão "Running"
2. Clique em cada serviço → **Logs** → Verifique se não há erros

### 6.2 Verificar status via terminal

```bash
docker service ls | grep appticket
```

Todos devem mostrar `1/1` na coluna de replicas.

### 6.3 Testar endpoints

```bash
# Healthcheck do backend
curl https://api-suporte.otmiz.tech/health

# Deve retornar: {"status":"OK","message":"Servidor AppTicket está rodando","timestamp":"..."}

# Frontend
curl -I https://suporte.otmiz.tech

# Deve retornar: HTTP/2 200
```

### 6.4 Testar no navegador

1. **Backend API:**
   - Acesse: `https://api-suporte.otmiz.tech/health`
   - Deve mostrar JSON com status OK

2. **Frontend:**
   - Acesse: `https://suporte.otmiz.tech`
   - Deve carregar a aplicação Vue.js

3. **Documentação Swagger:**
   - Acesse: `https://api-suporte.otmiz.tech/api-docs`
   - Deve mostrar a documentação Swagger

---

## 🔄 ETAPA 7: OPÇÕES AVANÇADAS

### 7.1 Ver logs no Portainer

1. **Services** → Clique no serviço desejado
2. Aba **Logs** → Veja logs em tempo real
3. Use filtros para buscar por erro, etc.

### 7.2 Ver logs via terminal

```bash
# Backend
docker service logs -f appticket_backend

# Frontend
docker service logs -f appticket_frontend

# PostgreSQL
docker service logs -f appticket_postgres
```

### 7.3 Atualizar stack (após mudanças)

1. No Portainer: **Stacks** → `appticket` → **Editor**
2. Faça alterações no docker-compose.yml
3. Clique em **Update the stack**

### 7.4 Rollback (se algo der errado)

**Via Portainer:**
1. **Services** → Clique no serviço
2. Aba **Tasks** → Clique nos 3 pontos
3. **Rollback**

**Via terminal:**
```bash
docker service rollback appticket_backend
docker service rollback appticket_frontend
```

---

## 🆘 TROUBLESHOOTING

### Problema: Serviço não inicia

**Solução:**
1. No Portainer: **Services** → Clique no serviço → **Logs**
2. Verifique erros
3. Verifique se todas as variáveis de ambiente estão configuradas

### Problema: Healthcheck falhando

**Solução:**
```bash
# Testar healthcheck manualmente
docker exec -it $(docker ps -q -f name=appticket_backend) \
  node -e "require('http').get('http://localhost:3000/health', (r) => {console.log(r.statusCode)})"
```

### Problema: SSL não funciona

**Solução:**
1. Verificar se DNS está apontando corretamente
2. Verificar logs do Traefik
3. Verificar se Let's Encrypt está configurado

### Problema: Migrations não executam

**Solução:**
1. Verificar se PostgreSQL está pronto
2. Verificar se variáveis de ambiente estão corretas
3. Verificar se network `appticket_network_internal` existe:
   ```bash
   docker network ls | grep network_internal
   ```

---

## ✅ CHECKLIST FINAL

- [ ] Arquivo `.env` criado e configurado
- [ ] JWT_SECRET gerado (32+ caracteres)
- [ ] DB_PASSWORD alterado (não é padrão)
- [ ] Docker Swarm inicializado
- [ ] Network `network_public` existe
- [ ] Imagens buildadas com sucesso
- [ ] Stack deployada no Portainer
- [ ] Todos os serviços estão "Running"
- [ ] Migrations executadas
- [ ] Healthchecks passando
- [ ] Endpoints testados e funcionando
- [ ] DNS configurado e apontando
- [ ] SSL funcionando (HTTPS)

---

## 🎉 CONCLUSÃO

Se todos os passos foram concluídos com sucesso, sua aplicação AppTicket está rodando em produção!

**Próximos passos sugeridos:**
- Configurar backup automático do banco
- Configurar monitoramento
- Configurar alertas
- Documentar credenciais em local seguro

---

**Última atualização**: Guia passo a passo simplificado para deploy no Portainer

