# GUIA COMPLETO DE DEPLOY - PASSO A PASSO

Este guia leva você desde a configuração do arquivo `.env` até o deploy completo da aplicação AppTicket no Portainer.

---

## 📋 PRÉ-REQUISITOS

Antes de começar, certifique-se de ter:

- ✅ VPS com Docker e Docker Swarm instalados
- ✅ Portainer instalado e acessível
- ✅ Traefik configurado (opcional, mas recomendado)
- ✅ Acesso SSH à VPS
- ✅ Domínios configurados no DNS:
  - `api-suporte.otmiz.tech` → IP da VPS
  - `suporte.otmiz.tech` → IP da VPS

---

## PASSO 1: PREPARAR O AMBIENTE NA VPS

### 1.1 Conectar via SSH

```bash
ssh usuario@ip-da-vps
```

### 1.2 Criar diretório do projeto

```bash
# Criar diretório (ou usar um existente)
mkdir -p /opt/appticket
cd /opt/appticket
```

### 1.3 Transferir arquivos do projeto

**Opção A: Via Git (recomendado)**
```bash
# Se o projeto está em um repositório Git
git clone https://seu-repositorio.git .
# ou
git pull  # se já está clonado
```

**Opção B: Via SCP (do seu computador local)**
```bash
# No seu computador local, execute:
scp -r backend frontend docker-compose.prod.yml deploy.sh usuario@ip-da-vps:/opt/appticket/
```

**Opção C: Via SFTP ou interface gráfica**
- Use FileZilla, WinSCP ou similar
- Transfira os diretórios: `backend/`, `frontend/`
- Transfira os arquivos: `docker-compose.prod.yml`, `deploy.sh`

### 1.4 Dar permissão de execução ao script

```bash
chmod +x deploy.sh
```

---

## PASSO 2: CONFIGURAR ARQUIVO .env

### 2.1 Criar arquivo .env na pasta backend

**IMPORTANTE**: O arquivo `.env` fica dentro da pasta `backend/`, não na raiz do projeto.

```bash
cd /opt/appticket/backend
nano .env
```

### 2.2 Conteúdo do arquivo .env

Cole o seguinte conteúdo (substitua os valores) no arquivo `.env` dentro de `backend/`:

```bash
# ============================================
# VARIÁVEIS DE AMBIENTE - APPTICKET PRODUÇÃO
# ============================================

# Banco de Dados PostgreSQL
DB_HOST=postgres
DB_PORT=5432
DB_NAME=appticket
DB_USER=postgres
DB_PASSWORD=SUA_SENHA_FORTE_AQUI
DB_SSL=false

# JWT (JSON Web Token)
JWT_SECRET=SEU_SECRET_GERADO_AQUI
JWT_EXPIRES_IN=24h

# Webhooks (opcional)
WEBHOOK_URL=
WEBHOOK_SECRET=
```

### 2.3 Gerar valores seguros

**Gerar JWT_SECRET:**
```bash
openssl rand -base64 32
```
Copie o resultado e cole no `.env` como valor de `JWT_SECRET`.

**Gerar DB_PASSWORD:**
```bash
openssl rand -base64 24
```
Ou crie uma senha forte manualmente (mínimo 16 caracteres, com letras, números e símbolos).

### 2.4 Exemplo de .env preenchido

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

### 2.5 Salvar o arquivo

- No `nano`: `Ctrl+O` (salvar), `Enter` (confirmar), `Ctrl+X` (sair)
- No `vi`: `:wq` (salvar e sair)

### 2.6 Salvar e proteger o arquivo .env

- No `nano`: `Ctrl+O` → `Enter` → `Ctrl+X`
- No `vi`: `:wq` → `Enter`

```bash
chmod 600 .env  # Apenas o proprietário pode ler/escrever
cd ..  # Voltar para a raiz do projeto
```

---

## PASSO 3: VERIFICAR PRÉ-REQUISITOS

### 3.1 Verificar Docker Swarm

```bash
docker info | grep Swarm
```

Deve mostrar: `Swarm: active`

Se não estiver ativo:
```bash
docker swarm init
```

### 3.2 Verificar/Criar network_public

```bash
# Verificar se existe
docker network ls | grep network_public

# Se não existir, criar
docker network create --driver overlay --attachable network_public
```

**Nota**: Se você usa Traefik, esta network provavelmente já existe.

---

## PASSO 4: EXECUTAR DEPLOY (OPÇÃO A - SCRIPT AUTOMATIZADO)

### 4.1 Executar script de deploy

```bash
cd /opt/appticket
sudo ./deploy.sh
```

O script irá:
1. ✅ Verificar pré-requisitos
2. ✅ Verificar arquivo .env
3. ✅ Verificar/criar network_public
4. ✅ Build das imagens (backend e frontend)
5. ✅ Deploy da stack
6. ✅ Aguardar serviços ficarem prontos
7. ✅ Mostrar status

### 4.2 Executar migrations (se necessário)

O script perguntará se você quer executar migrations. Se sim, ele tentará executar automaticamente.

**OU executar manualmente:**
```bash
# Aguardar postgres ficar disponível (após deploy)
sleep 30

cd /opt/appticket/backend
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

---

## PASSO 5: EXECUTAR DEPLOY (OPÇÃO B - MANUAL/PORTAINER)

### 5.1 Build das imagens manualmente

```bash
cd /opt/appticket

# Build Backend
docker build -f backend/Dockerfile.prod -t appticket-backend:latest ./backend

# Build Frontend
docker build \
  --build-arg VITE_API_URL=https://api-suporte.otmiz.tech/api \
  -f frontend/Dockerfile.prod \
  -t appticket-frontend:latest \
  ./frontend
```

### 5.2 Abrir Portainer

1. Acesse o Portainer no navegador:
   ```
   http://ip-da-vps:9000
   ```
   ou
   ```
   https://portainer.seudominio.com
   ```

2. Faça login

### 5.3 Criar Stack no Portainer

1. **Navegar para Stacks**
   - No menu lateral, clique em **Stacks**
   - Clique em **Add stack**

2. **Configurar Stack**
   - **Name**: `appticket`
   - **Build method**: Web editor
   - **Web editor**: Abrir arquivo `docker-compose.prod.yml` localmente e copiar todo o conteúdo

3. **Configurar Environment Variables**
   
   **IMPORTANTE**: Como o `.env` fica em `backend/`, você precisa exportar as variáveis ou configurar manualmente no Portainer.
   
   **Opção A: Exportar variáveis do backend/.env (antes de abrir o Portainer)**
   ```bash
   cd /opt/appticket/backend
   source .env
   export DB_NAME DB_USER DB_PASSWORD JWT_SECRET JWT_EXPIRES_IN WEBHOOK_URL WEBHOOK_SECRET
   cd ..
   ```
   Então o Portainer pode usar as variáveis exportadas.
   
   **Opção B: Manualmente no Portainer (recomendado)**
   - Clique em **Environment variables**
   - Adicione cada variável:
     - `DB_NAME` = `appticket`
     - `DB_USER` = `postgres`
     - `DB_PASSWORD` = `sua_senha_aqui`
     - `JWT_SECRET` = `seu_secret_aqui`
     - `JWT_EXPIRES_IN` = `24h`
     - `WEBHOOK_URL` = (deixe vazio se não usar)
     - `WEBHOOK_SECRET` = (deixe vazio se não usar)

4. **Deploy**
   - Clique em **Deploy the stack**
   - Aguarde o deploy completar

### 5.4 Verificar Deploy

No Portainer:
1. Vá em **Services**
2. Verifique se os serviços aparecem:
   - `appticket_backend`
   - `appticket_frontend`
   - `appticket_postgres`

3. Clique em cada serviço para ver logs e status

---

## PASSO 6: EXECUTAR MIGRATIONS (MANUAL)

### 6.1 Aguardar PostgreSQL estar pronto

```bash
# Verificar logs do postgres
docker service logs appticket_postgres

# Aguardar aparecer: "database system is ready to accept connections"
```

### 6.2 Executar migrations

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

**OU usando container temporário do backend:**

```bash
# Se o backend já estiver rodando, você pode executar:
docker exec -it $(docker ps -q -f name=appticket_backend) sh

# Dentro do container:
npm run db:migrate
exit
```

---

## PASSO 7: VERIFICAÇÃO E TESTES

### 7.1 Verificar status dos serviços

```bash
# Listar serviços
docker service ls | grep appticket

# Ver status detalhado
docker service ps appticket_backend
docker service ps appticket_frontend
docker service ps appticket_postgres
```

### 7.2 Ver logs

```bash
# Backend
docker service logs -f appticket_backend

# Frontend
docker service logs -f appticket_frontend

# PostgreSQL
docker service logs -f appticket_postgres
```

### 7.3 Testar endpoints

```bash
# Healthcheck do backend
curl https://api-suporte.otmiz.tech/health

# Deve retornar: {"status":"OK","message":"Servidor AppTicket está rodando","timestamp":"..."}

# Frontend
curl -I https://suporte.otmiz.tech

# Deve retornar: HTTP/2 200
```

### 7.4 Verificar no navegador

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

## PASSO 8: TROUBLESHOOTING

### 8.1 Serviços não iniciam

```bash
# Ver logs de erro
docker service logs appticket_backend --tail 100

# Ver eventos
docker service ps appticket_backend --no-trunc
```

### 8.2 Healthcheck falhando

```bash
# Verificar se o endpoint responde
docker exec -it $(docker ps -q -f name=appticket_backend) \
  node -e "require('http').get('http://localhost:3000/health', (r) => {console.log(r.statusCode)})"
```

### 8.3 Problemas de conectividade (Traefik)

```bash
# Verificar se serviços estão na network correta
docker service inspect appticket_backend | grep -A 10 Networks

# Verificar network_public
docker network inspect network_public
```

### 8.4 SSL não funciona

1. Verificar DNS está apontando corretamente
2. Verificar logs do Traefik:
   ```bash
   docker service logs traefik | grep -i certificate
   ```
3. Verificar se Let's Encrypt está configurado no Traefik

### 8.5 Rollback (se necessário)

```bash
# Rollback do backend
docker service rollback appticket_backend

# Rollback do frontend
docker service rollback appticket_frontend
```

---

## ✅ CHECKLIST FINAL

- [ ] Arquivo `.env` criado e configurado
- [ ] JWT_SECRET gerado e configurado
- [ ] DB_PASSWORD alterado (não é padrão)
- [ ] Docker Swarm inicializado
- [ ] Network `network_public` existe
- [ ] Imagens buildadas com sucesso
- [ ] Stack deployada no Portainer
- [ ] Migrations executadas
- [ ] Serviços rodando (verificado)
- [ ] Healthchecks passando
- [ ] Endpoints testados e funcionando
- [ ] DNS configurado e apontando
- [ ] SSL funcionando (HTTPS)

---

## 📚 COMANDOS ÚTEIS

```bash
# Ver todos os serviços
docker service ls

# Escalar serviço (aumentar replicas)
docker service scale appticket_backend=2

# Atualizar stack (após mudanças no docker-compose.yml)
docker stack deploy -c docker-compose.prod.yml appticket

# Remover stack (cuidado!)
docker stack rm appticket

# Ver logs em tempo real
docker service logs -f appticket_backend

# Executar comando em container
docker exec -it $(docker ps -q -f name=appticket_backend) sh

# Backup do banco
docker exec $(docker ps -q -f name=appticket_postgres) \
  pg_dump -U postgres -d appticket > backup_$(date +%Y%m%d).sql
```

---

## 🎉 CONCLUÍDO!

Se todos os passos foram concluídos com sucesso, sua aplicação AppTicket está em produção!

**Próximos passos:**
- Configurar backup automático do banco
- Configurar monitoramento
- Configurar alertas
- Documentar credenciais em local seguro

---

**Última atualização**: Guia completo de deploy passo a passo

