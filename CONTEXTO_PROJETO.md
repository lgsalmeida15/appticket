# AppTicket — Contexto Técnico do Projeto

> Documento único de referência sobre o estado real do projeto, criado para orientar mudanças e adições de recursos (inclusive com apoio de IA). Todo o conteúdo abaixo foi verificado diretamente no código-fonte e no histórico git em 2026-10-11 — não apenas copiado de outros `.md`, que em vários pontos estão desatualizados (ver seção 9).
>
> Produção: `suporte.otmiz.tech` (frontend) / `api-suporte.otmiz.tech` (backend). Sistema já em uso real, com dados de clientes em `backend/uploads/`.

---

## 1. Visão geral

AppTicket é um sistema de **helpdesk/chamados** (service desk) interno, com:
- Backend em **Node.js (ESM) + Express + Sequelize + PostgreSQL**.
- Frontend em **Vue 3 (Composition API) + Pinia + Vue Router + Bootstrap 5**, servido via Vite.
- Deploy em **Docker Swarm**, atrás de Traefik, com banco PostgreSQL **externo** (não containerizado no stack atual).

Funcionalidades principais: autenticação JWT com RBAC (admin/gerente/agente), grupos solicitantes/executores, chamados com anexos, comentários, hierarquia pai/filho, kanban, time tracking, fechamento com categorização de solução, auditoria, webhooks (globais) e dashboard.

---

## 2. Backend (`backend/`)

### Stack
- Node.js, `"type": "module"` (ESM puro). Entry point: `src/server.js`.
- Express 4.18, Sequelize 6.35 (+ `pg`/`pg-hstore`) → **PostgreSQL** (único dialeto suportado).
- Auth: `jsonwebtoken` + `bcryptjs`.
- Segurança: `helmet`, `cors`, `express-rate-limit`, `express-validator`, `zod`.
- Upload: `multer` · Agendamento: `node-cron` · Logs: `winston` + `morgan` · HTTP client interno (webhooks): `axios`.
- Docs: `swagger-jsdoc` + `swagger-ui-express` em `/api-docs`.
- Dev/test: `nodemon`, `jest` 29, `supertest`, `sequelize-cli`.
- Dockerfile usa `node:18-alpine` (não há `engines` fixado no `package.json`).

### Estrutura (`backend/src/`)
```
config/        conexão Sequelize, JWT, Swagger, Multer
controllers/   camada HTTP fina (1 por recurso)
dtos/          DTOs parciais (Chamado, Grupo, Usuario, Comentario — não cobre tudo)
middleware/    auth (JWT+RBAC), globalErrorHandler, rateLimiter, requestLogger
migrations/    sequelize-cli, formato .cjs (20 migrations, nov/2025 → jan/2026)
models/        Sequelize models + index.js central de associações
repositories/  BaseRepository + repositories por entidade (separa Service de query)
routes/        endpoints por recurso + validators/middlewares
seeders/       admin inicial, grupos de exemplo, categorias de solução padrão
services/      regra de negócio
utils/         AppError, EventEmitter interno, eventHandlers (dispara webhook/auditoria), logger, validations
validators/    express-validator por recurso
```
⚠️ `backend/config/config.cjs` (lido pelo sequelize-cli) e `backend/src/config/database.js` (lido pela app) **duplicam** a lógica de conexão manualmente — risco de divergirem.
⚠️ `validators/sla/` existe mas está **vazia** (resíduo da feature SLA nunca implementada, ver seção 7).

### Autenticação e permissões
- JWT sem sessão/cookies. Payload `{ id, email, tipo }`, expiração configurável (`JWT_EXPIRES_IN`, default 24h).
- Servidor **não sobe** se `JWT_SECRET` não estiver definido ou for o valor-placeholder (falha intencional de segurança).
- Middleware `autenticar`: valida token, busca usuário no banco a cada request, bloqueia inativos.
- RBAC por `tipo`: `admin`, `gerente`, `agente` (+ `verificarGerenteOuGruposExecutores` para listagem de grupos executores).
- Rate limit: login 5 tentativas/15min por IP (nunca pulado em produção; `SKIP_RATE_LIMIT=true` só em dev); API geral 500 req/15min; upload 20/hora.
- Senha: bcrypt (salt 10) em hooks do model; `senha` nunca serializada (`toJSON`).

### Modelo de dados (entidades principais)
Todas com `created_at`/`updated_at`.

| Model | Campos-chave |
|---|---|
| **Usuario** | nome, email (único), senha (hash), tipo (admin/gerente/agente), ativo, ultimo_acesso |
| **Grupo** | nome, descricao, ativo, solicitante (bool), executor (bool), webhook_url/webhook_eventos ⚠️ aparentemente não usados mais (webhook atual é global via env, ver abaixo) |
| **UsuarioGrupo** (N:N) | usuario_id, grupo_id, papel (gerente/agente), ativo |
| **Chamado** | titulo, descricao, tipo (incidente/requisicao/problema/mudanca), prioridade, status, status_fechamento, grupo_id, grupo_executor_id, usuario_id (criador), atribuido_a, data_abertura/fechamento, prazo, tags (JSON), campos_customizados (JSON), chamado_pai_id (auto-relação), data_hora_inicio + auditoria de quem/quando alterou |
| **Comentario** | chamado_id, usuario_id, texto, interno (bool — equipe x cliente), anexos (JSON), editado |
| **Historico** | chamado_id, usuario_id, acao (12 tipos: criação, mudança de status/prioridade/tipo, comentário, edição, fechamento, reabertura, cancelamento, associação/desassociação de filho...) |
| **WebhookLog** | grupo_id (opcional), chamado_id, evento, url, metodo, payload (JSONB), status_code, resposta, erro, tentativas |
| **HistoricoAuditoria** | usuario_id (nullable p/ login falho), entidade, entidade_id, acao, dados_anteriores/novos (JSONB), ip, user_agent |
| **TicketTimeTracking** | chamado_id, usuario_id, inicio, fim (null = ativo), duracao_minutos, descricao |
| **SolutionCategory** | categoria_nivel_1/2/3 (hierarquia 3 níveis), ativo |
| **ChamadoFechamento** | chamado_id (1:1), data_hora_resolucao, categoria_solucao_id, descricao_fechamento (mín. 10 chars), usuario_fechamento_id |

### Rotas da API (prefixo `/api`, + `/health` e `/api-docs`)
- `/auth` — register, login (rate-limited), me, logout, change-password
- `/usuarios` (admin) — CRUD + associar/remover/papel em grupo
- `/grupos` — meus-grupos, CRUD (admin), usuários do grupo
- `/chamados` — estatísticas, CRUD (upload múltiplo, rate-limited), comentários, time-tracking (start/stop), fechar/reabrir (admin), hierarquia pai/filho
- `/webhooks` — estatísticas, logs, retry manual
- `/dashboard` — resumo
- `/auditoria` — logs
- `/solution-categories` — ativas, por nível, CRUD (admin)

Total ≈ 45 endpoints. **`backend/README.md` está desatualizado** — descreve uma API muito mais simples; não usar como referência.

### Webhooks
Webhook **global** (não por grupo, apesar de o model `Grupo` ter campos para isso). Config via env: `WEBHOOK_URL`, `WEBHOOK_SECRET`. Payload para `chamado_criado`/`chamado_atualizado`/`comentario_adicionado`, assinatura HMAC-SHA256 opcional, retry com backoff exponencial (`2^tentativa * 1000ms`), timeout 10s. `backend/WEBHOOK_CONFIGURACAO.md` está **consistente** com a implementação atual — pode ser usado como referência confiável.

### Uploads e logs
- Multer + `diskStorage` em `backend/uploads/` (sanitização de nome, limite 10MB, até 10 arquivos/request, filtro de MIME). Servido em `/uploads`.
- `backend/uploads/` contém **dados reais de clientes** hoje — está no `.gitignore` e confirmado fora do versionamento. Tratar com cuidado (LGPD).
- Winston com rotação (`error.log`/`combined.log`, 5MB x 5), sanitiza senhas antes de logar. `backend/logs/` no `.gitignore`.

### Testes — ⚠️ quebrados
- Só existe **1 arquivo de teste** (`tests/unit/services/chamadoService.test.js`).
- **A suíte não roda**: `jest.config.js` não está configurado para ESM, falha com `SyntaxError: Cannot use import statement outside a module` em `tests/setup/testSetup.js`.
- Esse teste também faz `jest.mock('.../slaService.js')`, arquivo que **não existe** (feature SLA nunca implementada — ver seção 7).
- **Cobertura efetiva hoje: 0%.** Antes de confiar em "os testes passam", corrigir a config ESM do Jest.

---

## 3. Frontend (`frontend/`)

**Importante**: é **Vue 3**, não React.

### Stack
- Vue 3.3 (Composition API) + Vue Router 4 + Pinia 2.
- UI: Bootstrap 5 + bootstrap-icons (sem kit componentizado tipo Vuetify/PrimeVue).
- chart.js (gráficos), date-fns, marked (renderiza a documentação da API dentro do app).
- Validação: vee-validate + yup/zod.
- HTTP: axios, cliente único em `src/api/http.js`.
- Build: Vite 7 + `@vitejs/plugin-vue`. Lint: ESLint 8 + eslint-plugin-vue.
- ⚠️ `yarn` está como `dependency` (não `devDependency`) — parece erro de instalação, não uso real.

### Estrutura (`frontend/src/`)
```
api/http.js          instância axios única (interceptors de token e 401/403)
assets/               design-tokens.css, typography.css, global.css, main.css
components/base/      BaseButton, BaseCard, BaseBadge — ⚠️ ver seção 7 (não usados em lugar nenhum)
components/chamado/   13 componentes (form, kanban, lista, filtros, comentários, fechamento...)
components/shared/     EmptyState, ErrorMessage, FormField, LoadingSpinner, ToastContainer
components/usuario/    modais de usuário/grupos
components/            ConfirmDeleteModal, FileUpload, LayoutPrincipal
composables/           useChamados, useFiltros, useLoading, useToast
router/index.js        rotas + guard de navegação
services/               1 client por recurso (espelha rotas do backend)
stores/ (Pinia)         auth, chamados, dashboard, grupos, usuarios
validators/schemas/     schemas de validação por recurso
views/                  16 views (ver abaixo)
```

Views: Auditoria, ChamadoClose/Edit/New/View (páginas dedicadas por ação), ChamadosView (lista), ConsultasChamados, Dashboard, DocumentacaoAPI, Grupos, NotFound, Perfil, SolutionCategories, Usuarios, auth/LoginView, auth/CadastroView.

### Comunicação com backend e autenticação
- Base URL: `VITE_API_URL` (build-time), default `http://localhost:3000/api`.
- Interceptor injeta `Authorization: Bearer <token>` da store `auth` (persistida em `localStorage`); em 401 faz logout + hard redirect para `/login`; timeout 30s.
- Store `auth` (Pinia): getters `isAuthenticated`/`isAdmin`/`isGerente`/`isAgente`; actions `login`/`register`/`logout`/`checkAuth`.
- `router/index.js`: guard global por `requiresAuth`/`requiresAdmin`, rotas lazy-loaded. Contém vários `console.log` de debug deixados em produção (não é bug, só ruído).

### `frontend/README.md`
Desatualizado — cita componentes e rotas que não existem mais (ou nunca existiram como descrito). Não usar como referência de estrutura.

---

## 4. Infraestrutura e deploy — fonte de verdade

A arquitetura real (confirmada nos arquivos abaixo) **difere** da descrita nos 5 guias de deploy da raiz (ver seção 9). Use **apenas** estes arquivos como fonte de verdade:

- **`docker-compose.prod.yml`** (formato Swarm): apenas **2 serviços** — `backend` e `frontend`. **Não há Postgres no stack** — banco é externo/gerenciado. Rede externa única `network_public` (Traefik). Backend exposto via `api-suporte.otmiz.tech`, frontend via `suporte.otmiz.tech`. Volumes nomeados `backend_uploads`/`backend_logs`.
- **`backend/Dockerfile.prod`**: multi-stage `node:18-alpine`, `npm ci --only=production`, usuário não-root, `dumb-init`, healthcheck em `/health`.
- **`frontend/Dockerfile.prod`**: multi-stage `node:20-alpine`, runtime via pacote **`serve`** (não nginx!), usuário não-root, healthcheck via wget.
- **`deploy.sh`**: script de deploy manual (checa pré-requisitos, valida `.env`, build das imagens, `docker stack deploy`, migrations opcionais via container temporário).

### Variáveis de ambiente esperadas (nomes apenas, nunca valores)
`NODE_ENV`, `PORT`, `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_SSL`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `CORS_ORIGIN`, `API_URL`, `LOG_LEVEL`, `WEBHOOK_URL`, `WEBHOOK_SECRET`, `SKIP_RATE_LIMIT`, `VITE_API_URL` (build-arg do frontend).

⚠️ Não existe `.env.example` versionado em nenhuma das duas pastas — dificulta onboarding.

---

## 5. Histórico git recente (direção do projeto)

Base funcional já completa e em produção. Trabalho recente é **incremental**: tema escuro, kanban, botão play/pause de time tracking na lista, ajuste de tela de login, aumento do limite de anexos para 10, correção de paginação de grupos, correção de "unexpected field" no upload. Não há menção a SLA em nenhum commit.

---

## 6. Pendências reais (não apenas documentadas — verificadas no código)

1. **Feature SLA abandonada no meio do caminho**: existem 2 migrations (`create-sla`, `create-sla-resultado`) e pasta `validators/sla/` vazia, mas **não há** model, service, controller, rota ou UI. É a lacuna estrutural mais óbvia hoje.
2. **Suíte de testes quebrada** (Jest sem suporte ESM configurado) — 0% de cobertura executável.
3. **Design System Vue nunca adotado**: `BaseButton`/`BaseCard`/`BaseBadge` existem como arquivos mas **zero ocorrências** de uso em qualquer view/componente real, apesar de `MIGRATION_GUIDE.md` afirmar que várias telas já foram migradas. Os *tokens* CSS (cores/espaçamento/tipografia), esses sim, são usados de fato em ~26 dos 42 arquivos `.vue`.
4. TODO real único no código: `backend/src/services/comentarioService.js:157` — falta permitir que **admins** (não só o autor) excluam comentários de terceiros.
5. `webhook_url`/`webhook_eventos` no model `Grupo` parecem código morto (webhook atual é global via env) — confirmar antes de remover.
6. Lixo não versionado, seguro para remover: `frontend/frontend/` (pasta vazia) e `frontend/$null` (arquivo de erro de terminal do Windows).
7. `yarn` como dependency real do frontend (provável erro de instalação).

---

## 7. Como tratar a documentação `.md` existente

| Arquivo | Confiabilidade | Observação |
|---|---|---|
| `backend/WEBHOOK_CONFIGURACAO.md` | ✅ Confiável | Bate com o código atual |
| `REMOVER_BLOQUEIO_LOGIN.md` | ✅ Confiável | Valores de rate limit batem com o código |
| `DOCUMENTACAO_API.md` (raiz) e `frontend/src/docs/api/DOCUMENTACAO_API.md` | ✅ Idênticos | Cópia manual um do outro — editar os dois juntos ou eliminar a duplicação |
| `backend/README.md`, `frontend/README.md` | ❌ Desatualizados | Não usar como referência de estrutura/endpoints |
| `frontend/DESIGN_SYSTEM.md` | ⚠️ Parcial | Tokens CSS em uso real; componentes Vue descritos **não** foram adotados |
| `frontend/MIGRATION_GUIDE.md` | ❌ Não confiável | Afirma migrações de componentes que não aconteceram; cita `SLAView.vue`, que não existe |
| `ANALISE_PRODUCAO.md`, `DEPLOY_PRODUCAO.md`, `GUIA_DEPLOY_COMPLETO.md`, `GUIA_RAPIDO_DEPLOY.md`, `PASSO_A_PASSO_DEPLOY.md` | ❌ Arquitetura superada | Todos assumem Postgres containerizado (`appticket_postgres`, rede `appticket_network_internal`) que **não existe** no stack atual. Tratar como planejamento histórico, não como guia operacional |
| `RESUMO_PRODUCAO.md` | ❌ Só índice | Aponta para os guias acima, sem conteúdo técnico próprio |
| `GUIA_GITHUB.md` | ➖ Genérico | Tutorial padrão de git, sem conteúdo específico do projeto |
| `backend/VARREDURA_ERROS.md` | ➖ Histórico | Changelog de correções já aplicadas (nov/2025) |
| `inicio.md` | ⚠️ Planejamento parcial | Especificação (em convenções genéricas, não batem com o projeto real) da feature "data_hora_inicio editável"; o núcleo foi implementado, mas a tabela de histórico dedicada citada no plano não foi criada |

**Recomendação**: os 5 guias de deploy redundantes podem ser consolidados em um único guia atualizado (refletindo banco externo + `serve` no frontend), e os READMEs merecem atualização para bater com o código real. Nenhuma exclusão foi feita neste momento — avisar antes de remover/consolidar.

---

## 8. Convenções a seguir em novas mudanças

- Nomes de colunas, enums e rotas em **português** (`chamado`, `grupo`, `usuario`, `status_fechamento` etc.) — manter consistência com o que já existe, não introduzir inglês a meio caminho.
- Backend em ESM puro (`import`/`export`), sem CommonJS novo (exceto migrations `.cjs`, que seguem o padrão do sequelize-cli).
- Separação Service (regra de negócio) → Repository (acesso a dados) já estabelecida — novas entidades devem seguir o mesmo padrão (`controller` → `service` → `repository`/`model`).
- Efeitos colaterais (webhook, auditoria) disparados via `utils/eventHandlers` + EventEmitter interno, não chamados diretamente nos services — manter esse desacoplamento.
- Frontend: Composition API + `<script setup>` quando aplicável, estado global só em Pinia stores, chamadas HTTP sempre via `services/` (nunca axios direto nas views).
- Antes de "continuar a migração do Design System", validar com o usuário se a decisão é retomar a adoção dos componentes Base ou formalizar que o padrão é Bootstrap + tokens CSS.

---

## 9. Dados sensíveis — lembrete de confidencialidade

Este projeto manipula dados financeiros/pessoais de clientes (anexos em `backend/uploads/`, registros de chamados). Ao gerar documentação, exemplos ou trechos de log para humanos ou IA:
- Nunca incluir valores reais de `.env`, tokens JWT, senhas ou conteúdo de uploads.
- Nunca misturar dados de um cliente/chamado em exemplos de outro contexto.
- Em caso de dúvida sobre o que pode ser exposto em um documento, ser conservador.
