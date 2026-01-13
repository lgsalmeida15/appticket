# Como Remover o Bloqueio de Login (15 minutos)

## Problema
Após 5 tentativas de login com senha incorreta, a API bloqueia o IP por 15 minutos usando rate limiting.

## Solução: Reiniciar o Container do Backend

O bloqueio é armazenado em memória pelo `express-rate-limit`. Para remover o bloqueio imediatamente, você precisa reiniciar o container do backend.

### ⚡ Comando Rápido (Copiar e Colar)

```bash
docker service update --force appticket_backend
```

### Opção 1: Reiniciar o Serviço (Docker Swarm) - RECOMENDADO

```bash
# Conectar ao servidor de produção via SSH
ssh usuario@seu-servidor

# Navegar até o diretório do projeto (se necessário)
cd /caminho/para/AppTicket

# Reiniciar o serviço backend (nome do serviço: appticket_backend)
docker service update --force appticket_backend
```

### Opção 2: Reiniciar via Docker Compose (se não estiver usando Swarm)

```bash
# Conectar ao servidor
ssh usuario@seu-servidor

# Navegar até o diretório
cd /caminho/para/AppTicket

# Reiniciar o serviço backend
docker-compose -f docker-compose.prod.yml restart backend
```

### Opção 3: Verificar e Reiniciar Container Específico

```bash
# Listar containers em execução
docker ps | grep backend

# Reiniciar o container específico (substitua CONTAINER_ID)
docker restart <CONTAINER_ID>

# OU usando o nome do serviço
docker service ps appticket_backend
docker service update --force appticket_backend
```

### Opção 4: Aguardar 15 minutos

O bloqueio expira automaticamente após 15 minutos sem tentativas de login.

## Verificar Status do Serviço

```bash
# Ver status do serviço backend
docker service ps appticket_backend

# Ver logs do backend
docker service logs appticket_backend --tail 50

# Verificar se o serviço está rodando
docker service ls | grep backend
```

## Observações Importantes

⚠️ **Atenção:**
- Reiniciar o backend causa uma breve interrupção (alguns segundos)
- Todas as requisições em andamento serão interrompidas
- O bloqueio será removido para TODOS os IPs bloqueados
- Em produção, prefira fazer isso em horários de menor tráfego

## Prevenção Futura

Para evitar bloqueios acidentais:
1. Use a senha correta (obviamente 😊)
2. Considere aumentar o limite de tentativas no arquivo `backend/src/middleware/rateLimiter.js`
3. Para ambientes de desenvolvimento/teste, você pode configurar `SKIP_RATE_LIMIT=true` no `.env`

## Configuração Atual do Rate Limiter

O bloqueio está configurado em `backend/src/middleware/rateLimiter.js`:
- **Limite:** 5 tentativas
- **Janela de tempo:** 15 minutos
- **Armazenamento:** Memória (volátil - perdido ao reiniciar)

