# 🚀 GUIA RÁPIDO - DEPLOY APPTICKET NA VPS

## ✅ CONFIRMAÇÃO DOS PASSOS

**SIM, você está correto!** Os passos principais são:

1. ✅ Criar arquivo `.env` dentro da pasta `backend/`
2. ✅ Executar o script `deploy.sh` (que faz todo o processo)

---

## 📋 PASSO A PASSO COMPLETO

### **PASSO 1: Criar arquivo .env**

**Localização:** `backend/.env` (dentro da pasta backend, não na raiz!)

```bash
cd backend
nano .env
```

**Conteúdo mínimo necessário:**

```env
# Banco de Dados PostgreSQL
DB_HOST=postgres
DB_PORT=5432
DB_NAME=appticket
DB_USER=postgres
DB_PASSWORD=SUA_SENHA_FORTE_AQUI

# JWT (JSON Web Token)
JWT_SECRET=SEU_SECRET_GERADO_AQUI
JWT_EXPIRES_IN=24h

# Webhooks (opcional - pode deixar vazio)
WEBHOOK_URL=
WEBHOOK_SECRET=
```

**⚠️ IMPORTANTE: Gerar valores seguros**

```bash
# Gerar JWT_SECRET (32+ caracteres)
openssl rand -base64 32

# Gerar DB_PASSWORD (senha forte)
openssl rand -base64 24
# OU criar manualmente (mínimo 16 caracteres com letras, números e símbolos)
```

**Exemplo de .env preenchido:**

```env
DB_HOST=postgres
DB_PORT=5432
DB_NAME=appticket
DB_USER=postgres
DB_PASSWORD=MinhaSenh@Forte123!ABCD
JWT_SECRET=wK8xP3mN9qR2sT5vY7zA1bC4dE6fG8hJ0kL2nM5pQ7rS9tU1vW3xY5zA7bC9dE1fG
JWT_EXPIRES_IN=24h
WEBHOOK_URL=
WEBHOOK_SECRET=
```

**Salvar e proteger o arquivo:**

```bash
# Salvar (nano: Ctrl+O → Enter → Ctrl+X)
# Dar permissão restrita
chmod 600 .env

# Voltar para raiz do projeto
cd ..
```

---

### **PASSO 2: Verificar Pré-requisitos**

Antes de executar o deploy.sh, certifique-se de que:

```bash
# 1. Docker Swarm está inicializado
docker info | grep Swarm
# Deve mostrar: Swarm: active

# Se não estiver ativo:
docker swarm init

# 2. Network network_public existe (necessária para Traefik)
docker network ls | grep network_public

# Se não existir, criar:
docker network create --driver overlay --attachable network_public
```

---

### **PASSO 3: Executar deploy.sh**

```bash
# Na raiz do projeto (onde está o deploy.sh)
sudo ./deploy.sh
```

**O que o script faz automaticamente:**

1. ✅ Verifica se você tem permissões (root/sudo)
2. ✅ Verifica se Docker está instalado e rodando
3. ✅ Verifica se Docker Swarm está ativo (sugere iniciar se não estiver)
4. ✅ Verifica se o arquivo `backend/.env` existe
5. ✅ Valida variáveis obrigatórias (DB_PASSWORD e JWT_SECRET)
6. ✅ Verifica/cria network_public
7. ✅ Faz build das imagens Docker:
   - Backend (`appticket-backend:latest`)
   - Frontend (`appticket-frontend:latest`)
8. ✅ Faz deploy da stack no Docker Swarm
9. ✅ Aguarda serviços ficarem prontos
10. ✅ Mostra status dos serviços
11. ✅ Pergunta se quer executar migrations

**Tempo estimado:** 5-15 minutos (depende da velocidade da VPS e conexão)

---

### **PASSO 4: Executar Migrations (CRÍTICO)**

**⚠️ IMPORTANTE:** As migrations devem ser executadas após o primeiro deploy!

O script perguntará se você quer executar migrations. Se escolher sim, ele tentará automaticamente.

**OU executar manualmente:**

```bash
# Aguardar PostgreSQL ficar disponível (30-60 segundos após deploy)
sleep 30

cd backend

# Carregar variáveis do .env
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

**Aguardar completar** - você verá mensagens de migrations sendo executadas.

---

### **PASSO 5: Verificação**

```bash
# 1. Verificar status dos serviços
docker service ls | grep appticket

# Deve mostrar:
# appticket_backend    1/1
# appticket_frontend   1/1
# appticket_postgres   1/1

# 2. Ver logs do backend
docker service logs -f appticket_backend

# 3. Testar endpoints
curl https://api-suporte.otmiz.tech/health
# Deve retornar: {"status":"OK","message":"Servidor AppTicket está rodando",...}

curl -I https://suporte.otmiz.tech
# Deve retornar: HTTP/2 200
```

**Verificar no navegador:**

- Backend API: `https://api-suporte.otmiz.tech/health`
- Frontend: `https://suporte.otmiz.tech`
- Swagger: `https://api-suporte.otmiz.tech/api-docs`

---

## 🔍 TROUBLESHOOTING RÁPIDO

### Problema: Script diz que .env não existe

**Solução:**
```bash
# Verificar se está na pasta correta
ls -la backend/.env

# Se não existir, criar novamente
cd backend
nano .env
# (colar conteúdo)
chmod 600 .env
cd ..
```

### Problema: DB_PASSWORD ou JWT_SECRET não configurados

**Solução:**
```bash
# Abrir .env novamente
cd backend
nano .env

# Verificar que:
# - DB_PASSWORD não está vazio e não é "ALTERAR_SENHA_FORTE_AQUI"
# - JWT_SECRET não está vazio e não é "GERAR_SECRET_FORTE_AQUI_MINIMO_32_CHARS"

# Gerar novos valores se necessário:
openssl rand -base64 32  # Para JWT_SECRET
openssl rand -base64 24  # Para DB_PASSWORD
```

### Problema: Docker Swarm não inicializado

**Solução:**
```bash
docker swarm init
```

### Problema: Network network_public não existe

**Solução:**
```bash
docker network create --driver overlay --attachable network_public
```

### Problema: Serviços não iniciam

**Solução:**
```bash
# Ver logs detalhados
docker service logs appticket_backend --tail 100
docker service logs appticket_frontend --tail 100
docker service logs appticket_postgres --tail 100

# Ver status detalhado
docker service ps appticket_backend --no-trunc
```

### Problema: Migrations não executam

**Solução:**
1. Verificar se PostgreSQL está pronto:
   ```bash
   docker service logs appticket_postgres | grep "ready to accept connections"
   ```

2. Aguardar mais tempo e tentar novamente:
   ```bash
   sleep 60
   # Executar comando de migrations novamente
   ```

---

## ✅ CHECKLIST FINAL

Antes de considerar o deploy completo, verificar:

- [ ] Arquivo `.env` criado em `backend/.env`
- [ ] JWT_SECRET gerado (32+ caracteres)
- [ ] DB_PASSWORD alterado (senha forte)
- [ ] Docker Swarm inicializado
- [ ] Network `network_public` existe
- [ ] Script `deploy.sh` executado com sucesso
- [ ] Imagens buildadas (`docker images | grep appticket`)
- [ ] Stack deployada (`docker stack ls | grep appticket`)
- [ ] Serviços rodando (`docker service ls | grep appticket`)
- [ ] Migrations executadas
- [ ] Healthcheck passando (`curl https://api-suporte.otmiz.tech/health`)
- [ ] Frontend acessível (`curl -I https://suporte.otmiz.tech`)

---

## 📝 RESUMO EXECUTIVO

**Passos principais:**

1. **Criar `backend/.env`** com variáveis de ambiente
2. **Executar `sudo ./deploy.sh`** na raiz do projeto
3. **Executar migrations** (via script ou manualmente)
4. **Verificar** se tudo está funcionando

**Tempo total:** ~10-20 minutos (depende da VPS)

---

## 🆘 COMANDOS ÚTEIS

```bash
# Ver todos os serviços
docker service ls

# Ver logs em tempo real
docker service logs -f appticket_backend

# Ver status detalhado
docker service ps appticket_backend

# Atualizar stack (após mudanças)
docker stack deploy -c docker-compose.prod.yml appticket

# Remover stack (cuidado - apaga tudo!)
docker stack rm appticket

# Ver uso de recursos
docker stats $(docker ps -q --filter "name=appticket")
```

---

**Última atualização:** Guia rápido baseado na análise completa do projeto

