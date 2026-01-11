# Backend - AppTicket

API RESTful do sistema de gerenciamento de chamados.

## 🚀 Tecnologias

- Node.js 18+
- Express.js
- PostgreSQL
- Sequelize ORM
- JWT Authentication
- Bcrypt

## 📁 Estrutura

```
backend/
├── src/
│   ├── config/          # Configurações (DB, JWT, etc)
│   ├── controllers/     # Lógica de negócios
│   ├── middleware/      # Middlewares (auth, validation)
│   ├── models/          # Models do Sequelize
│   ├── routes/          # Definição de rotas
│   ├── migrations/      # Migrations do banco
│   ├── seeders/         # Seeds do banco
│   └── server.js        # Entry point
├── package.json
└── .env.example
```

## 🛠️ Scripts

```bash
npm run dev        # Modo desenvolvimento com nodemon
npm start          # Modo produção
npm run db:migrate # Executar migrations
npm run db:seed    # Executar seeds
```

## 🔐 Variáveis de Ambiente

Copie `.env.example` para `.env` e configure:

```env
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=appticket
DB_USER=postgres
DB_PASSWORD=sua_senha
JWT_SECRET=seu_segredo
```

### ⚠️ IMPORTANTE - Segurança em Produção

**CRÍTICO**: O arquivo `docker-compose.yml` contém credenciais padrão (hardcoded) apenas para desenvolvimento. 

**ANTES de usar em produção:**
1. ❌ **NUNCA** commite o `docker-compose.yml` com credenciais reais em repositórios públicos
2. ✅ Use variáveis de ambiente do sistema ou arquivo `.env` (não versionado)
3. ✅ Altere TODAS as senhas padrão (`postgres/postgres` não devem ser usadas em produção)
4. ✅ Use `docker-compose.override.yml` para desenvolvimento local (já está no `.gitignore`)
5. ✅ Configure variáveis de ambiente no ambiente de produção
6. ✅ Use secretos gerenciados (Docker Secrets, AWS Secrets Manager, etc.) em produção

**Exemplo de docker-compose.yml seguro para produção:**
```yaml
environment:
  DB_PASSWORD: ${DB_PASSWORD}  # Variável de ambiente
  JWT_SECRET: ${JWT_SECRET}    # Variável de ambiente
```

## 📡 Endpoints da API

### Autenticação
- `POST /api/auth/register` - Cadastro de usuário
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout

### Usuários (próximas etapas)
- `GET /api/users` - Listar usuários
- `GET /api/users/:id` - Detalhes do usuário
- `POST /api/users` - Criar usuário
- `PUT /api/users/:id` - Atualizar usuário
- `DELETE /api/users/:id` - Deletar usuário

### Chamados (próximas etapas)
- `GET /api/chamados` - Listar chamados
- `GET /api/chamados/:id` - Detalhes do chamado
- `POST /api/chamados` - Criar chamado
- `PUT /api/chamados/:id` - Atualizar chamado
- `DELETE /api/chamados/:id` - Deletar chamado

## 🔒 Autenticação

A API usa JWT (JSON Web Tokens) para autenticação. Inclua o token no header:

```
Authorization: Bearer seu_token_aqui
```

## 📝 Status HTTP

- `200` - OK
- `201` - Criado
- `400` - Bad Request
- `401` - Não autorizado
- `403` - Proibido
- `404` - Não encontrado
- `500` - Erro interno

## 🧪 Testando a API

### Com cURL
```bash
# Health check
curl http://localhost:3000/health

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"senha123"}'
```

### Com Postman/Insomnia
Importe a collection (será adicionada nas próximas etapas).

## 📦 Dependências Principais

- `express` - Framework web
- `sequelize` - ORM
- `pg` - Driver PostgreSQL
- `bcryptjs` - Hash de senhas
- `jsonwebtoken` - JWT
- `cors` - CORS middleware
- `helmet` - Security headers
- `morgan` - Logger HTTP
- `dotenv` - Variáveis de ambiente
- `express-validator` - Validação de dados

