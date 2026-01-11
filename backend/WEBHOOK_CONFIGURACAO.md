# 🔔 Configuração do Webhook Global

## 📋 Visão Geral

O sistema agora utiliza um **webhook único e global** que dispara automaticamente para **toda criação e atualização de chamados**. 

O webhook envia um POST com informações completas do chamado, incluindo dados do usuário que criou e do responsável (se atribuído).

---

## ⚙️ Configuração

### 1. **Criar arquivo `.env`**

No diretório `backend/`, crie um arquivo `.env` (se ainda não existir) com as seguintes variáveis:

```env
# Configuração do Servidor
PORT=3000
NODE_ENV=development

# Banco de Dados PostgreSQL
DB_HOST=localhost
DB_PORT=5432
DB_NAME=appticket
DB_USER=postgres
DB_PASSWORD=sua_senha_aqui

# JWT
JWT_SECRET=sua_chave_secreta_jwt_aqui
JWT_EXPIRES_IN=24h

# CORS
CORS_ORIGIN=http://localhost:5173

# ✨ Webhook Global para Notificações
WEBHOOK_URL=https://seu-sistema-email.com/webhook
WEBHOOK_SECRET=sua_chave_secreta_opcional
```

### 2. **Variáveis de Webhook**

| Variável | Descrição | Obrigatório |
|----------|-----------|-------------|
| `WEBHOOK_URL` | URL completa para onde o POST será enviado | ✅ Sim |
| `WEBHOOK_SECRET` | Chave secreta para assinatura HMAC (segurança) | ❌ Não (mas recomendado) |

**Exemplo:**
```env
WEBHOOK_URL=https://api.seuemail.com/tickets/webhook
WEBHOOK_SECRET=minha_chave_super_secreta_123
```

> ⚠️ **Importante:** Se `WEBHOOK_URL` estiver vazio ou não configurado, os webhooks **NÃO serão disparados**.

---

## 📦 Payload do Webhook

### **POST Request**

**Headers:**
```
Content-Type: application/json
User-Agent: AppTicket-Webhook/1.0
X-Webhook-Event: chamado_criado | chamado_atualizado
X-Webhook-Timestamp: 2026-01-05T10:30:00Z
X-Webhook-Signature: [HMAC SHA256 se WEBHOOK_SECRET configurado]
```

**Body (JSON):**

#### **Criação de Chamado (`chamado_criado`):**
```json
{
  "evento": "chamado_criado",
  "timestamp": "2026-01-05T10:30:00.000Z",
  "chamado": {
    "id": 123,
    "titulo": "Problema no sistema",
    "descricao": "Descrição detalhada...",
    "tipo": "incidente",
    "status": "novo",
    "prioridade": "alta",
    "data_abertura": "2026-01-05T09:00:00.000Z",
    "data_fechamento": null,
    "status_fechamento": "aberto",
    "grupo_id": 1,
    "grupo_nome": "TI - Suporte"
  },
  "usuario_criador": {
    "id": 10,
    "nome": "João Silva",
    "email": "joao.silva@empresa.com",
    "login": "joao.silva@empresa.com"
  },
  "responsavel": null
}
```

#### **Atualização de Chamado (`chamado_atualizado`):**
```json
{
  "evento": "chamado_atualizado",
  "timestamp": "2026-01-05T11:00:00.000Z",
  "chamado": {
    "id": 123,
    "titulo": "Problema no sistema",
    "descricao": "Descrição detalhada...",
    "tipo": "incidente",
    "status": "em_andamento",
    "prioridade": "alta",
    "data_abertura": "2026-01-05T09:00:00.000Z",
    "data_fechamento": null,
    "status_fechamento": "aberto",
    "grupo_id": 1,
    "grupo_nome": "TI - Suporte"
  },
  "usuario_criador": {
    "id": 10,
    "nome": "João Silva",
    "email": "joao.silva@empresa.com",
    "login": "joao.silva@empresa.com"
  },
  "responsavel": {
    "id": 5,
    "nome": "Maria Santos",
    "email": "maria.santos@empresa.com",
    "login": "maria.santos@empresa.com"
  },
  "campos_alterados": ["status", "atribuido_a"],
  "valores_anteriores": {
    "status": "novo",
    "atribuido_a": null
  }
}
```

---

## 🔒 Validação de Assinatura (Segurança)

Se você configurou `WEBHOOK_SECRET`, o sistema enviará o header `X-Webhook-Signature` com uma assinatura HMAC SHA256 do payload.

### **Validar a assinatura no seu servidor:**

**Node.js:**
```javascript
const crypto = require('crypto');

function validarAssinatura(payload, signature, secret) {
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(JSON.stringify(payload));
  const calculado = hmac.digest('hex');
  
  return calculado === signature;
}

// No seu endpoint:
app.post('/webhook', (req, res) => {
  const signature = req.headers['x-webhook-signature'];
  const secret = process.env.WEBHOOK_SECRET;
  
  if (!validarAssinatura(req.body, signature, secret)) {
    return res.status(401).json({ error: 'Assinatura inválida' });
  }
  
  // Processar webhook...
  const { evento, usuario_criador, chamado } = req.body;
  
  // Enviar email para usuario_criador.email
  enviarEmail(usuario_criador.email, {
    assunto: `Chamado #${chamado.id} - ${evento === 'chamado_criado' ? 'Criado' : 'Atualizado'}`,
    corpo: `Seu chamado "${chamado.titulo}" foi ${evento === 'chamado_criado' ? 'criado' : 'atualizado'}.`
  });
  
  res.status(200).json({ recebido: true });
});
```

---

## 🔄 Retry Automático

O sistema tenta enviar o webhook **até 3 vezes** com backoff exponencial:
- 1ª tentativa: imediata
- 2ª tentativa: 2 segundos depois
- 3ª tentativa: 4 segundos depois

**Timeout:** 10 segundos por tentativa

---

## 📊 Logs de Webhook

Todos os disparos de webhook (sucesso e falha) são registrados na tabela `webhook_log`:

```sql
SELECT 
  id,
  evento,
  chamado_id,
  url,
  status_code,
  sucesso,
  tentativas,
  tempo_resposta_ms,
  erro,
  data_hora
FROM webhook_log
ORDER BY data_hora DESC;
```

---

## 🧪 Testar o Webhook

### **1. Usar webhook.site (teste rápido):**

1. Acesse https://webhook.site
2. Copie a URL única gerada
3. Configure no `.env`:
   ```env
   WEBHOOK_URL=https://webhook.site/sua-url-unica
   ```
4. Reinicie o backend
5. Crie ou atualize um chamado
6. Veja o payload recebido no webhook.site

### **2. Endpoint local de teste:**

Crie um servidor de teste simples:

```javascript
// test-webhook.js
const express = require('express');
const app = express();
app.use(express.json());

app.post('/webhook', (req, res) => {
  console.log('📨 Webhook recebido:');
  console.log(JSON.stringify(req.body, null, 2));
  console.log('Headers:', req.headers);
  res.status(200).json({ ok: true });
});

app.listen(4000, () => {
  console.log('🎯 Servidor de teste rodando em http://localhost:4000');
});
```

Execute e configure:
```env
WEBHOOK_URL=http://localhost:4000/webhook
```

---

## 🚀 Como Usar no Sistema de Email

O campo mais importante para envio de emails é o **`usuario_criador.email`**:

```javascript
// Exemplo de processamento no seu sistema de email
app.post('/webhook', async (req, res) => {
  const { evento, chamado, usuario_criador, responsavel } = req.body;
  
  // Email para o criador do chamado
  await enviarEmail({
    para: usuario_criador.email,
    assunto: `[Chamado #${chamado.id}] ${chamado.titulo}`,
    corpo: montarCorpoEmail(evento, chamado, responsavel)
  });
  
  res.status(200).json({ processado: true });
});
```

---

## ✅ Checklist de Configuração

- [ ] Criar arquivo `.env` no diretório `backend/`
- [ ] Adicionar `WEBHOOK_URL` com a URL do seu endpoint
- [ ] (Opcional) Adicionar `WEBHOOK_SECRET` para segurança
- [ ] Executar migration: `cd backend && npx sequelize-cli db:migrate`
- [ ] Reiniciar o backend
- [ ] Testar criando/atualizando um chamado
- [ ] Verificar logs na tabela `webhook_log`

---

## 🐛 Troubleshooting

**Webhook não está sendo disparado:**
- ✅ Verificar se `WEBHOOK_URL` está configurado no `.env`
- ✅ Reiniciar o backend após alterar `.env`
- ✅ Verificar logs do backend: `[info]: ✅ Webhook disparado com sucesso`

**Webhook falha (timeout):**
- ✅ Verificar se a URL está acessível
- ✅ Verificar firewall/proxy
- ✅ URL deve responder em menos de 10 segundos

**Assinatura inválida:**
- ✅ Verificar se `WEBHOOK_SECRET` está igual nos dois lados
- ✅ Validar usando o mesmo algoritmo (HMAC SHA256)
- ✅ Usar `JSON.stringify` do payload para gerar a assinatura

---

## 📞 Suporte

Para dúvidas ou problemas, verifique os logs em:
- Terminal do backend
- Tabela `webhook_log` no banco de dados
- Arquivo `backend/logs/combined.log`

