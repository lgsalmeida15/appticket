# Documentação API - Sistema de Chamados

## Índice

1. [Introdução](#1-introdução)
2. [Autenticação](#2-autenticação)
3. [Estrutura Padrão de Resposta](#3-estrutura-padrão-de-resposta)
4. [Tipos de Usuário e Permissões](#4-tipos-de-usuário-e-permissões)
5. [Endpoints](#5-endpoints)
   - [5.1 Autenticação](#51-autenticação)
   - [5.2 Chamados](#52-chamados)
   - [5.3 Usuários](#53-usuários)
   - [5.4 Grupos](#54-grupos)
   - [5.5 Dashboard](#55-dashboard)
   - [5.6 Auditoria](#56-auditoria)
   - [5.7 Categorias de Solução](#57-categorias-de-solução)
   - [5.8 Webhooks](#58-webhooks)
6. [Exemplos Práticos Completos](#6-exemplos-práticos-completos)
7. [Códigos de Erro](#7-códigos-de-erro)
8. [Boas Práticas](#8-boas-práticas)
9. [Changelog](#9-changelog)

---

## 1. Introdução

A API do Sistema de Chamados (AppTicket) é uma API RESTful desenvolvida em Node.js com Express.js que fornece endpoints para gerenciamento completo de chamados, usuários, grupos, autenticação e integrações.

### URL Base

- **Desenvolvimento**: `http://localhost:3000/api`
- **Produção**: `https://api.seudominio.com/api` (configurável via variável de ambiente)

### Versão da API

Versão atual: **1.0.0**

### Formato de Dados

Todas as requisições e respostas utilizam o formato **JSON** (`Content-Type: application/json`), exceto quando há upload de arquivos que utiliza `multipart/form-data`.

### Health Check

Antes de usar a API, você pode verificar se o servidor está online:

```bash
curl http://localhost:3000/health
```

**Resposta:**
```json
{
  "status": "OK",
  "message": "Servidor AppTicket está rodando",
  "timestamp": "2025-01-10T12:00:00.000Z"
}
```

---

## 2. Autenticação

A API utiliza autenticação baseada em **JWT (JSON Web Tokens)**. A maioria dos endpoints requer um token válido no header `Authorization`.

### Como Obter um Token

1. **Registro de Novo Usuário** (`POST /api/auth/register`) - Cria conta e retorna token
2. **Login** (`POST /api/auth/login`) - Autentica usuário existente e retorna token

### Como Usar o Token

Inclua o token no header `Authorization` de todas as requisições autenticadas:

```
Authorization: Bearer SEU_TOKEN_AQUI
```

### Expiração do Token

Por padrão, os tokens expiram em **24 horas**. Este valor pode ser configurado via variável de ambiente `JWT_EXPIRES_IN`.

### Refresh de Token

Atualmente, a API não possui endpoint específico de refresh. O usuário deve fazer login novamente quando o token expirar. Você pode verificar se o token é válido usando o endpoint `GET /api/auth/me`.

### Fluxo Completo de Autenticação

1. **Registrar ou Fazer Login**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "usuario@exemplo.com",
    "password": "senha123"
  }'
```

2. **Guardar o Token**
A resposta inclui um token que deve ser armazenado:
```json
{
  "message": "Login realizado com sucesso",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": { ... }
}
```

3. **Usar o Token nas Requisições**
```bash
curl -X GET http://localhost:3000/api/chamados \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

## 3. Estrutura Padrão de Resposta

### Resposta de Sucesso

As respostas de sucesso geralmente seguem um dos seguintes formatos:

**Resposta simples:**
```json
{
  "message": "Operação realizada com sucesso",
  "data": { ... }
}
```

**Resposta com paginação:**
```json
{
  "chamados": [ ... ],
  "total": 100,
  "page": 1,
  "limit": 10,
  "totalPages": 10
}
```

**Resposta de criação (201):**
```json
{
  "message": "Recurso criado com sucesso",
  "chamado": { ... }
}
```

### Resposta de Erro

Todas as respostas de erro seguem o formato padronizado:

```json
{
  "error": {
    "message": "Descrição do erro",
    "status": 400,
    "code": "ERROR_CODE",
    "details": { ... }
  }
}
```

**Campos:**
- `message` (string): Mensagem descritiva do erro
- `status` (integer): Código HTTP do erro
- `code` (string): Código de erro customizado para programação
- `details` (object, opcional): Detalhes adicionais do erro (ex: campos de validação)

**Exemplo de erro de validação:**
```json
{
  "error": {
    "message": "Dados de entrada inválidos",
    "status": 400,
    "code": "VALIDATION_ERROR",
    "details": [
      {
        "path": "email",
        "message": "Email inválido"
      }
    ]
  }
}
```

---

## 4. Tipos de Usuário e Permissões

A API possui três tipos de usuários com diferentes níveis de permissão:

### Tipos de Usuário

1. **admin** - Administrador
   - Acesso completo a todas as funcionalidades
   - Pode gerenciar usuários, grupos, categorias
   - Pode reabrir chamados fechados
   - Acesso a logs de auditoria

2. **gerente** - Gerente
   - Pode visualizar e gerenciar chamados
   - Pode visualizar grupos e estatísticas
   - Não pode fechar chamados (exclusivo de administradores)
   - Não pode gerenciar usuários ou grupos

3. **agente** - Agente/Técnico
   - Pode criar e atualizar chamados atribuídos a ele
   - Pode adicionar comentários
   - Visualização limitada de chamados

### Matriz de Permissões

| Recurso | Admin | Gerente | Agente |
|---------|-------|---------|--------|
| Criar chamado | ✅ | ✅ | ✅ |
| Listar chamados | ✅ | ✅ | ✅ (limitado) |
| Atualizar chamado | ✅ | ✅ | ✅ (próprios) |
| Fechar chamado | ✅ | ❌ | ❌ |
| Reabrir chamado | ✅ | ❌ | ❌ |
| Cancelar chamado | ✅ | ✅ | ❌ |
| Gerenciar usuários | ✅ | ❌ | ❌ |
| Gerenciar grupos | ✅ | ❌ | ❌ |
| Visualizar auditoria | ✅ | ❌ | ❌ |
| Gerenciar categorias | ✅ | ❌ | ❌ |

**Nota:** Alguns endpoints têm permissões específicas documentadas individualmente.

---

## 5. Endpoints

### 5.1 Autenticação

#### POST /api/auth/register

**Descrição:** Cadastrar novo usuário no sistema.

**Autenticação:** `Público`

**Permissões:** `Todos`

#### Request Body

```json
{
  "nome": "João Silva",
  "email": "joao@exemplo.com",
  "password": "senha123"
}
```

**Campos:**
- `nome` (string, obrigatório): Nome completo do usuário (mínimo 2 caracteres, máximo 100)
- `email` (string, obrigatório): Email válido e único no sistema
- `password` (string, obrigatório): Senha (mínimo 6 caracteres)

#### Response - Sucesso (201)

```json
{
  "message": "Usuário cadastrado com sucesso",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "nome": "João Silva",
    "email": "joao@exemplo.com",
    "tipo": "agente",
    "ativo": true,
    "created_at": "2025-01-10T12:00:00.000Z"
  }
}
```

#### Status Codes

| Código | Descrição |
|--------|-----------|
| 201 | Usuário criado com sucesso |
| 400 | Dados inválidos (validação falhou) |
| 409 | Email já está em uso |
| 500 | Erro interno do servidor |

#### Exemplo cURL

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "João Silva",
    "email": "joao@exemplo.com",
    "password": "senha123"
  }'
```

#### Exemplo JavaScript

```javascript
const response = await fetch('http://localhost:3000/api/auth/register', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    nome: 'João Silva',
    email: 'joao@exemplo.com',
    password: 'senha123'
  })
});

const data = await response.json();
if (response.ok) {
  localStorage.setItem('token', data.token);
  console.log('Usuário criado:', data.user);
} else {
  console.error('Erro:', data.error);
}
```

#### Notas

- O primeiro usuário cadastrado sempre será do tipo `agente`
- O token retornado pode ser usado imediatamente para autenticação
- A senha é armazenada com hash (bcrypt) no banco de dados

---

#### POST /api/auth/login

**Descrição:** Autenticar usuário e obter token JWT.

**Autenticação:** `Público`

**Permissões:** `Todos`

#### Request Body

```json
{
  "email": "joao@exemplo.com",
  "password": "senha123"
}
```

**Campos:**
- `email` (string, obrigatório): Email do usuário
- `password` (string, obrigatório): Senha do usuário

#### Response - Sucesso (200)

```json
{
  "message": "Login realizado com sucesso",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "nome": "João Silva",
    "email": "joao@exemplo.com",
    "tipo": "agente",
    "ativo": true,
    "created_at": "2025-01-10T12:00:00.000Z"
  }
}
```

#### Status Codes

| Código | Descrição |
|--------|-----------|
| 200 | Login realizado com sucesso |
| 400 | Dados inválidos |
| 401 | Email ou senha incorretos |
| 401 | Usuário inativo |
| 429 | Muitas tentativas de login (rate limiting) |
| 500 | Erro interno do servidor |

#### Exemplo cURL

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "joao@exemplo.com",
    "password": "senha123"
  }'
```

#### Exemplo JavaScript

```javascript
const response = await fetch('http://localhost:3000/api/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    email: 'joao@exemplo.com',
    password: 'senha123'
  })
});

const data = await response.json();
if (response.ok) {
  localStorage.setItem('token', data.token);
  localStorage.setItem('user', JSON.stringify(data.user));
  console.log('Login realizado:', data.user);
} else {
  console.error('Erro:', data.error);
}
```

#### Notas

- Este endpoint possui rate limiting para prevenir ataques de força bruta
- Tentativas falhadas são registradas na auditoria
- O último acesso do usuário é atualizado automaticamente

---

#### GET /api/auth/me

**Descrição:** Obter dados do usuário autenticado.

**Autenticação:** `Requer Token`

**Permissões:** `Todos`

#### Response - Sucesso (200)

```json
{
  "user": {
    "id": 1,
    "nome": "João Silva",
    "email": "joao@exemplo.com",
    "tipo": "agente",
    "ativo": true,
    "grupos": [
      {
        "id": 1,
        "nome": "Suporte Técnico",
        "papel": "membro",
        "UsuarioGrupo": {
          "papel": "membro",
          "ativo": true
        }
      }
    ],
    "created_at": "2025-01-10T12:00:00.000Z",
    "updated_at": "2025-01-10T12:00:00.000Z"
  }
}
```

#### Status Codes

| Código | Descrição |
|--------|-----------|
| 200 | Dados do usuário retornados |
| 401 | Token inválido ou expirado |
| 401 | Usuário não encontrado ou inativo |
| 500 | Erro interno do servidor |

#### Exemplo cURL

```bash
curl -X GET http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

#### Exemplo JavaScript

```javascript
const token = localStorage.getItem('token');
const response = await fetch('http://localhost:3000/api/auth/me', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const data = await response.json();
if (response.ok) {
  console.log('Usuário:', data.user);
} else {
  console.error('Erro:', data.error);
}
```

---

#### POST /api/auth/logout

**Descrição:** Logout do usuário (invalidar token).

**Autenticação:** `Requer Token`

**Permissões:** `Todos`

#### Response - Sucesso (200)

```json
{
  "message": "Logout realizado com sucesso"
}
```

#### Status Codes

| Código | Descrição |
|--------|-----------|
| 200 | Logout realizado com sucesso |
| 401 | Token inválido ou expirado |
| 500 | Erro interno do servidor |

#### Exemplo cURL

```bash
curl -X POST http://localhost:3000/api/auth/logout \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

#### Exemplo JavaScript

```javascript
const token = localStorage.getItem('token');
const response = await fetch('http://localhost:3000/api/auth/logout', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const data = await response.json();
if (response.ok) {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  console.log('Logout realizado');
}
```

#### Notas

- O token não é invalidado no servidor (JWT stateless), mas a ação é registrada na auditoria
- O cliente deve remover o token do armazenamento local

---

#### POST /api/auth/change-password

**Descrição:** Alterar senha do usuário autenticado.

**Autenticação:** `Requer Token`

**Permissões:** `Todos`

#### Request Body

```json
{
  "currentPassword": "senhaAntiga123",
  "newPassword": "novaSenha456",
  "confirmPassword": "novaSenha456"
}
```

**Campos:**
- `currentPassword` (string, obrigatório): Senha atual do usuário
- `newPassword` (string, obrigatório): Nova senha (mínimo 6 caracteres, máximo 255)
- `confirmPassword` (string, obrigatório): Confirmação da nova senha (deve ser igual a newPassword)

#### Response - Sucesso (200)

```json
{
  "message": "Senha alterada com sucesso"
}
```

#### Status Codes

| Código | Descrição |
|--------|-----------|
| 200 | Senha alterada com sucesso |
| 400 | Dados inválidos |
| 401 | Senha atual incorreta |
| 401 | Token inválido ou expirado |
| 500 | Erro interno do servidor |

#### Exemplo cURL

```bash
curl -X POST http://localhost:3000/api/auth/change-password \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -H "Content-Type: application/json" \
  -d '{
    "currentPassword": "senhaAntiga123",
    "newPassword": "novaSenha456",
    "confirmPassword": "novaSenha456"
  }'
```

#### Exemplo JavaScript

```javascript
const token = localStorage.getItem('token');
const response = await fetch('http://localhost:3000/api/auth/change-password', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    currentPassword: 'senhaAntiga123',
    newPassword: 'novaSenha456',
    confirmPassword: 'novaSenha456'
  })
});

const data = await response.json();
if (response.ok) {
  console.log('Senha alterada com sucesso');
} else {
  console.error('Erro:', data.error);
}
```

#### Notas

- A nova senha deve ser diferente da senha atual
- A senha é validada e armazenada com hash (bcrypt)
- A alteração é registrada na auditoria

---

### 5.2 Chamados

#### GET /api/chamados

**Descrição:** Listar chamados com paginação e filtros.

**Autenticação:** `Requer Token`

**Permissões:** `Todos` (com filtros baseados no usuário)

#### Query Parameters

| Parâmetro | Tipo | Obrigatório | Descrição |
|-----------|------|-------------|-----------|
| page | integer | Não | Número da página (padrão: 1) |
| limit | integer | Não | Itens por página (padrão: 10, máximo: 100) |
| search | string | Não | Busca por título ou descrição |
| numero_chamado | integer | Não | Buscar por número específico do chamado |
| data_inicio | string | Não | Data de início (formato: YYYY-MM-DD) |
| data_fim | string | Não | Data de fim (formato: YYYY-MM-DD) |
| status | string/array | Não | Filtro por status (novo, aberto, em_andamento, aguardando, resolvido, fechado, cancelado) |
| prioridade | string/array | Não | Filtro por prioridade (baixa, media, alta, urgente) |
| tipo | string/array | Não | Filtro por tipo (incidente, requisicao, problema, mudanca) |
| grupo_id | integer/array | Não | Filtro por grupo |
| grupo_executor_id | integer/array | Não | Filtro por grupo executor |
| usuario_id | integer/array | Não | Filtro por usuário criador |
| atribuido_a | integer | Não | Filtro por usuário atribuído (null para não atribuídos) |

#### Response - Sucesso (200)

```json
{
  "chamados": [
    {
      "id": 1,
      "numero_chamado": 1001,
      "titulo": "Problema no sistema",
      "descricao": "Descrição detalhada do problema",
      "tipo": "incidente",
      "prioridade": "alta",
      "status": "em_andamento",
      "grupo_id": 1,
      "grupo_executor_id": 2,
      "usuario_id": 5,
      "atribuido_a": 3,
      "solicitante_id": 5,
      "prazo": "2025-01-15T10:00:00.000Z",
      "data_abertura": "2025-01-10T12:00:00.000Z",
      "data_fechamento": null,
      "tags": ["urgente", "sistema"],
      "campos_customizados": {
        "anexos": ["/uploads/arquivo.pdf"]
      }
    }
  ],
  "total": 50,
  "page": 1,
  "limit": 10,
  "totalPages": 5
}
```

#### Status Codes

| Código | Descrição |
|--------|-----------|
| 200 | Lista retornada com sucesso |
| 400 | Parâmetros inválidos |
| 401 | Token inválido ou expirado |
| 500 | Erro interno do servidor |

#### Exemplo cURL

```bash
curl -X GET "http://localhost:3000/api/chamados?page=1&limit=10&status=aberto&prioridade=alta" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

#### Exemplo JavaScript

```javascript
const token = localStorage.getItem('token');
const params = new URLSearchParams({
  page: 1,
  limit: 10,
  status: 'aberto',
  prioridade: 'alta'
});

const response = await fetch(`http://localhost:3000/api/chamados?${params}`, {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const data = await response.json();
console.log('Chamados:', data.chamados);
```

#### Notas

- Agentes veem apenas chamados atribuídos a eles ou criados por eles
- Gerentes e Admins veem todos os chamados
- Múltiplos valores podem ser passados usando arrays

---

#### GET /api/chamados/:id

**Descrição:** Buscar chamado por ID com detalhes completos.

**Autenticação:** `Requer Token`

**Permissões:** `Todos` (respeitando permissões do chamado)

#### Parâmetros de Rota

| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| id | integer | ID do chamado |

#### Query Parameters

| Parâmetro | Tipo | Obrigatório | Descrição |
|-----------|------|-------------|-----------|
| incluirHistorico | boolean | Não | Incluir histórico (padrão: false) |
| incluirComentarios | boolean | Não | Incluir comentários (padrão: false) |
| incluirRelacionamentos | boolean | Não | Incluir relacionamentos (padrão: true) |

#### Response - Sucesso (200)

```json
{
  "chamado": {
    "id": 1,
    "numero_chamado": 1001,
    "titulo": "Problema no sistema",
    "descricao": "Descrição detalhada",
    "tipo": "incidente",
    "prioridade": "alta",
    "status": "em_andamento",
    "grupo_id": 1,
    "usuario_id": 5,
    "atribuido_a": 3,
    "data_abertura": "2025-01-10T12:00:00.000Z",
    "filhos": [],
    "chamado_pai": null
  }
}
```

#### Status Codes

| Código | Descrição |
|--------|-----------|
| 200 | Chamado encontrado |
| 400 | ID inválido |
| 401 | Token inválido |
| 403 | Sem permissão |
| 404 | Chamado não encontrado |

#### Exemplo cURL

```bash
curl -X GET "http://localhost:3000/api/chamados/1?incluirComentarios=true" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

#### Exemplo JavaScript

```javascript
const token = localStorage.getItem('token');
const response = await fetch('http://localhost:3000/api/chamados/1?incluirComentarios=true', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const data = await response.json();
console.log('Chamado:', data.chamado);
```

---
#### POST /api/chamados

**Descrição:** Criar novo chamado.

**Autenticação:** `Requer Token`

**Permissões:** `Todos`

#### Request Body (multipart/form-data)

```json
{
  "titulo": "Novo problema reportado",
  "descricao": "Descrição detalhada",
  "tipo": "incidente",
  "prioridade": "media",
  "grupo_id": 1,
  "grupo_executor_id": 2,
  "atribuido_a": 3,
  "solicitante_id": 5,
  "prazo": "2025-01-15T10:00:00.000Z",
  "tags": ["tag1", "tag2"]
}
```

**Campos:**
- `titulo` (string, obrigatório): Título (mínimo 3, máximo 200 caracteres)
- `descricao` (string, obrigatório): Descrição do chamado
- `tipo` (string, opcional): Tipo (incidente, requisicao, problema, mudanca) - padrão: incidente
- `prioridade` (string, opcional): Prioridade (baixa, media, alta, urgente) - padrão: media
- `grupo_id` (integer, obrigatório): ID do grupo responsável
- `grupo_executor_id` (integer, opcional): ID do grupo executor
- `atribuido_a` (integer, opcional): ID do usuário atribuído
- `solicitante_id` (integer, opcional): ID do solicitante (padrão: usuário autenticado)
- `prazo` (string, opcional): Prazo em formato ISO 8601
- `tags` (array, opcional): Array de tags
- `arquivos` (array, opcional): Arquivos para upload (máximo 5, 10MB cada)

#### Response - Sucesso (201)

```json
{
  "message": "Chamado criado com sucesso",
  "chamado": {
    "id": 1,
    "numero_chamado": 1001,
    "titulo": "Novo problema reportado",
    "status": "novo",
    "data_abertura": "2025-01-10T12:00:00.000Z"
  }
}
```

#### Status Codes

| Código | Descrição |
|--------|-----------|
| 201 | Chamado criado com sucesso |
| 400 | Dados inválidos |
| 401 | Token inválido |
| 404 | Grupo não encontrado |

#### Exemplo cURL

```bash
curl -X POST http://localhost:3000/api/chamados \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -F "titulo=Novo problema" \
  -F "descricao=Descrição" \
  -F "grupo_id=1" \
  -F "arquivos=@/caminho/arquivo.pdf"
```

#### Exemplo JavaScript

```javascript
const formData = new FormData();
formData.append('titulo', 'Novo problema');
formData.append('descricao', 'Descrição');
formData.append('grupo_id', '1');
formData.append('arquivos', fileInput.files[0]);

const response = await fetch('http://localhost:3000/api/chamados', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: formData
});
```

#### Notas

- Status inicial é sempre "novo"
- Máximo 5 arquivos, 10MB cada
- Webhooks são disparados automaticamente

---

#### PUT /api/chamados/:id

**Descrição:** Atualizar chamado existente.

**Autenticação:** `Requer Token`

**Permissões:** `Todos` (agentes apenas os próprios)

#### Parâmetros de Rota

| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| id | integer | ID do chamado |

#### Request Body (multipart/form-data)

```json
{
  "titulo": "Título atualizado",
  "descricao": "Nova descrição",
  "tipo": "problema",
  "prioridade": "alta",
  "status": "em_andamento",
  "atribuido_a": 3,
  "prazo": "2025-01-20T10:00:00.000Z"
}
```

**Campos:** Todos os campos são opcionais, mas pelo menos um deve ser fornecido

#### Response - Sucesso (200)

```json
{
  "message": "Chamado atualizado com sucesso",
  "chamado": { ... }
}
```

#### Status Codes

| Código | Descrição |
|--------|-----------|
| 200 | Chamado atualizado |
| 400 | Dados inválidos |
| 401 | Token inválido |
| 403 | Sem permissão |
| 404 | Chamado não encontrado |

---

#### DELETE /api/chamados/:id

**Descrição:** Cancelar chamado (soft delete).

**Autenticação:** `Requer Token`

**Permissões:** `Gerente` ou `Admin`

#### Parâmetros de Rota

| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| id | integer | ID do chamado |

#### Response - Sucesso (200)

```json
{
  "message": "Chamado cancelado com sucesso"
}
```

#### Status Codes

| Código | Descrição |
|--------|-----------|
| 200 | Chamado cancelado |
| 401 | Token inválido |
| 403 | Apenas gerentes/admins |
| 404 | Chamado não encontrado |

---

#### GET /api/chamados/estatisticas

**Descrição:** Buscar estatísticas de chamados.

**Autenticação:** `Requer Token`

**Permissões:** `Todos`

#### Response - Sucesso (200)

```json
{
  "total": 100,
  "por_status": {
    "novo": 10,
    "em_andamento": 20,
    "resolvido": 50,
    "fechado": 20
  },
  "por_prioridade": {
    "baixa": 30,
    "media": 40,
    "alta": 25,
    "urgente": 5
  }
}
```

---

#### POST /api/chamados/:id/comentarios

**Descrição:** Adicionar comentário a um chamado.

**Autenticação:** `Requer Token`

**Permissões:** `Todos`

#### Parâmetros de Rota

| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| id | integer | ID do chamado |

#### Request Body (multipart/form-data)

```json
{
  "texto": "Comentário sobre o chamado",
  "interno": false,
  "arquivos": [File, ...]
}
```

**Campos:**
- `texto` (string, obrigatório): Texto do comentário
- `interno` (boolean, opcional): Se true, visível apenas para equipe (padrão: false)
- `arquivos` (array, opcional): Arquivos anexos (máximo 5, 10MB cada)

#### Response - Sucesso (201)

```json
{
  "message": "Comentário adicionado com sucesso",
  "comentario": {
    "id": 1,
    "chamado_id": 1,
    "usuario_id": 5,
    "texto": "Comentário sobre o chamado",
    "interno": false,
    "data_hora": "2025-01-10T14:00:00.000Z"
  }
}
```

---

#### GET /api/chamados/:id/comentarios

**Descrição:** Listar comentários de um chamado.

**Autenticação:** `Requer Token`

**Permissões:** `Todos`

#### Parâmetros de Rota

| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| id | integer | ID do chamado |

#### Response - Sucesso (200)

```json
{
  "comentarios": [
    {
      "id": 1,
      "texto": "Comentário",
      "interno": false,
      "usuario": {
        "id": 5,
        "nome": "João Silva"
      },
      "data_hora": "2025-01-10T14:00:00.000Z"
    }
  ]
}
```

---

#### POST /api/chamados/:id/close

**Descrição:** Fechar chamado.

**Autenticação:** `Requer Token`

**Permissões:** `Admin` (exclusivo)

#### Parâmetros de Rota

| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| id | integer | ID do chamado |

#### Request Body

```json
{
  "data_hora_resolucao": "2025-01-10T16:00:00.000Z",
  "categoria_solucao_id": 1,
  "descricao_fechamento": "Problema resolvido com sucesso"
}
```

**Campos:**
- `data_hora_resolucao` (string, obrigatório): Data/hora da resolução (ISO 8601)
- `categoria_solucao_id` (integer, obrigatório): ID da categoria de solução
- `descricao_fechamento` (string, obrigatório): Descrição do fechamento (mínimo 10 caracteres)

#### Response - Sucesso (201)

```json
{
  "message": "Chamado fechado com sucesso",
  "fechamento": { ... }
}
```

---

#### GET /api/chamados/:id/fechamento

**Descrição:** Buscar fechamento de um chamado.

**Autenticação:** `Requer Token`

**Permissões:** `Todos`

#### Parâmetros de Rota

| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| id | integer | ID do chamado |

---

#### GET /api/chamados/:id/pode-fechar

**Descrição:** Verificar se chamado pode ser fechado.

**Autenticação:** `Requer Token`

**Permissões:** `Todos`

---

#### POST /api/chamados/:id/reopen

**Descrição:** Reabrir chamado fechado.

**Autenticação:** `Requer Token`

**Permissões:** `Admin`

---

#### POST /api/chamados/:idPai/associar/:idFilho

**Descrição:** Associar chamado filho a um chamado pai.

**Autenticação:** `Requer Token`

**Permissões:** `Todos`

#### Parâmetros de Rota

| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| idPai | integer | ID do chamado pai |
| idFilho | integer | ID do chamado filho |

---

#### DELETE /api/chamados/:idFilho/desassociar

**Descrição:** Desassociar chamado filho do seu pai.

**Autenticação:** `Requer Token`

**Permissões:** `Todos`

---

#### GET /api/chamados/:idPai/filhos

**Descrição:** Listar filhos de um chamado pai.

**Autenticação:** `Requer Token`

**Permissões:** `Todos`

---

#### GET /api/chamados/:id/pode-encerrar

**Descrição:** Verificar se chamado pai pode ser encerrado (verifica filhos ativos).

**Autenticação:** `Requer Token`

**Permissões:** `Todos`

---

#### POST /api/chamados/:id/time/start

**Descrição:** Iniciar contagem de tempo para um chamado.

**Autenticação:** `Requer Token`

**Permissões:** `Todos`

---

#### POST /api/chamados/:id/time/stop

**Descrição:** Parar contagem de tempo.

**Autenticação:** `Requer Token`

**Permissões:** `Todos`

---

#### GET /api/chamados/:id/time/history

**Descrição:** Buscar histórico de time tracking de um chamado.

**Autenticação:** `Requer Token`

**Permissões:** `Todos`

---

### 5.3 Usuários

#### GET /api/usuarios

**Descrição:** Listar todos os usuários (com paginação e filtros).

**Autenticação:** `Requer Token`

**Permissões:** `Admin`

#### Query Parameters

| Parâmetro | Tipo | Obrigatório | Descrição |
|-----------|------|-------------|-----------|
| page | integer | Não | Número da página (padrão: 1) |
| limit | integer | Não | Itens por página (padrão: 10) |
| search | string | Não | Busca por nome ou email |
| tipo | string | Não | Filtro por tipo (admin, gerente, agente) |
| ativo | boolean | Não | Filtro por status ativo/inativo |

---

#### POST /api/usuarios

**Descrição:** Criar novo usuário.

**Autenticação:** `Requer Token`

**Permissões:** `Admin`

#### Request Body

```json
{
  "nome": "Maria Santos",
  "email": "maria@exemplo.com",
  "password": "senha123",
  "tipo": "agente",
  "ativo": true
}
```

---

### 5.4 Grupos

#### GET /api/grupos/meus

**Descrição:** Listar grupos do usuário logado.

**Autenticação:** `Requer Token`

**Permissões:** `Todos`

---

#### GET /api/grupos

**Descrição:** Listar todos os grupos (com paginação e filtros).

**Autenticação:** `Requer Token`

**Permissões:** `Gerente` ou `Admin` (ou Todos se executor=true)

---

#### POST /api/grupos

**Descrição:** Criar novo grupo.

**Autenticação:** `Requer Token`

**Permissões:** `Admin`

#### Request Body

```json
{
  "nome": "Suporte Técnico",
  "descricao": "Grupo de suporte",
  "ativo": true,
  "solicitante": true,
  "executor": true,
  "webhook_url": "https://exemplo.com/webhook",
  "webhook_eventos": ["chamado.criado", "chamado.atualizado"]
}
```

---

### 5.5 Dashboard

#### GET /api/dashboard/resumo

**Descrição:** Buscar resumo do dashboard.

**Autenticação:** `Requer Token`

**Permissões:** `Todos`

---

### 5.6 Auditoria

#### GET /api/auditoria

**Descrição:** Listar logs de auditoria.

**Autenticação:** `Requer Token`

**Permissões:** `Admin`

---

### 5.7 Categorias de Solução

#### GET /api/solution-categories/active

**Descrição:** Listar categorias de solução ativas.

**Autenticação:** `Requer Token`

**Permissões:** `Todos`

---

#### POST /api/solution-categories

**Descrição:** Criar nova categoria.

**Autenticação:** `Requer Token`

**Permissões:** `Admin`

#### Request Body

```json
{
  "categoria_nivel_1": "Nível 1",
  "categoria_nivel_2": "Nível 2",
  "categoria_nivel_3": "Nível 3"
}
```

---

### 5.8 Webhooks

#### GET /api/webhooks/estatisticas

**Descrição:** Estatísticas de webhooks.

**Autenticação:** `Requer Token`

**Permissões:** `Gerente` ou `Admin`

---

#### GET /api/webhooks/logs

**Descrição:** Listar logs de webhooks.

**Autenticação:** `Requer Token`

**Permissões:** `Gerente` ou `Admin`

---

## 6. Exemplos Práticos Completos

### Fluxo Completo: Login → Criar Chamado → Fechar

```javascript
// 1. Login
const loginResponse = await fetch('http://localhost:3000/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'usuario@exemplo.com',
    password: 'senha123'
  })
});
const { token } = await loginResponse.json();

// 2. Criar chamado
const formData = new FormData();
formData.append('titulo', 'Novo problema');
formData.append('descricao', 'Descrição');
formData.append('grupo_id', '1');

const chamadoResponse = await fetch('http://localhost:3000/api/chamados', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` },
  body: formData
});
const { chamado } = await chamadoResponse.json();

// 3. Fechar chamado
await fetch(`http://localhost:3000/api/chamados/${chamado.id}/close`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    data_hora_resolucao: new Date().toISOString(),
    categoria_solucao_id: 1,
    descricao_fechamento: 'Problema resolvido'
  })
});
```

---

## 7. Códigos de Erro

### Códigos HTTP Utilizados

| Código | Descrição |
|--------|-----------|
| 200 | OK - Requisição bem-sucedida |
| 201 | Created - Recurso criado |
| 400 | Bad Request - Dados inválidos |
| 401 | Unauthorized - Não autenticado |
| 403 | Forbidden - Sem permissão |
| 404 | Not Found - Recurso não encontrado |
| 409 | Conflict - Conflito |
| 422 | Unprocessable Entity - Erro de validação |
| 429 | Too Many Requests - Rate limit |
| 500 | Internal Server Error - Erro interno |

---

## 8. Boas Práticas

### Rate Limiting

A API possui rate limiting para prevenir abuso.

### Paginação

Sempre use paginação em listagens:
- Use `page` e `limit` nos query parameters
- Limite padrão: 10 itens
- Limite máximo: 100 itens por página

### Upload de Arquivos

- Máximo 5 arquivos por requisição
- Tamanho máximo: 10MB por arquivo
- Use `multipart/form-data` para uploads

---

## 9. Changelog

### Versão 1.0.0 (2025-01-10)

- Versão inicial da API
- Autenticação JWT
- CRUD completo de chamados
- Gerenciamento de usuários e grupos
- Sistema de comentários
- Fechamento de chamados
- Time tracking
- Associação de chamados (pai/filho)
- Dashboard e estatísticas
- Auditoria de ações
- Categorias de solução
- Sistema de webhooks
- Upload de arquivos

---

**Última atualização:** 2025-01-10


