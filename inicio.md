# Implementação: Campo Data/Hora de Início Editável para Admins

## OBJETIVO
Adicionar campo `data_hora_inicio` editável por administradores, mantendo `created_at` como registro imutável da criação real do chamado.

## CONTEXTO ATUAL
- Database: PostgreSQL
- Campos existentes: `created_at`, `updated_at`
- Aproximadamente 25 registros em produção
- Sistema já possui controle de permissões admin (usado em funcionalidades como exclusão de chamados)

---

## ETAPA 1: MIGRATION DO BANCO DE DADOS

### Criar migration para adicionar novos campos
```sql
-- Migration: add_data_hora_inicio_and_audit
-- Descrição: Adiciona campo data_hora_inicio e campos de auditoria

BEGIN;

-- Adicionar novo campo data_hora_inicio
ALTER TABLE chamados 
ADD COLUMN data_hora_inicio TIMESTAMP WITH TIME ZONE;

-- Adicionar campos de auditoria para rastreamento de alterações
ALTER TABLE chamados
ADD COLUMN data_hora_inicio_alterado_por INTEGER REFERENCES users(id),
ADD COLUMN data_hora_inicio_alterado_em TIMESTAMP WITH TIME ZONE;

-- Criar índice para melhor performance em queries
CREATE INDEX idx_chamados_data_hora_inicio ON chamados(data_hora_inicio);

-- MIGRAÇÃO DE DADOS EXISTENTES
-- Copiar created_at para data_hora_inicio em todos os registros existentes
UPDATE chamados 
SET data_hora_inicio = created_at
WHERE data_hora_inicio IS NULL;

-- Tornar campo NOT NULL após popular dados
ALTER TABLE chamados 
ALTER COLUMN data_hora_inicio SET NOT NULL;

-- Adicionar constraint para garantir que data_hora_inicio não seja futura
ALTER TABLE chamados
ADD CONSTRAINT chk_data_hora_inicio_nao_futura 
CHECK (data_hora_inicio <= CURRENT_TIMESTAMP);

-- Adicionar constraint para garantir que data_hora_inicio não seja anterior a created_at
ALTER TABLE chamados
ADD CONSTRAINT chk_data_hora_inicio_valida 
CHECK (data_hora_inicio <= created_at);

COMMIT;
```

### Rollback da migration (caso necessário)
```sql
BEGIN;

ALTER TABLE chamados 
DROP CONSTRAINT IF EXISTS chk_data_hora_inicio_nao_futura,
DROP CONSTRAINT IF EXISTS chk_data_hora_inicio_valida;

DROP INDEX IF EXISTS idx_chamados_data_hora_inicio;

ALTER TABLE chamados 
DROP COLUMN IF EXISTS data_hora_inicio,
DROP COLUMN IF EXISTS data_hora_inicio_alterado_por,
DROP COLUMN IF EXISTS data_hora_inicio_alterado_em;

COMMIT;
```

---

## ETAPA 2: ATUALIZAR MODELO/SCHEMA

### Atualizar o modelo de Chamado
```typescript
// Localizar o arquivo de modelo/schema do Chamado e adicionar os novos campos

interface Chamado {
  // ... campos existentes ...
  created_at: Date;           // Mantém: registro imutável da criação
  updated_at: Date;           // Mantém: atualizado automaticamente
  
  // NOVOS CAMPOS
  data_hora_inicio: Date;     // Editável por admin, padrão = created_at
  data_hora_inicio_alterado_por?: number;  // ID do admin que alterou
  data_hora_inicio_alterado_em?: Date;     // Quando foi alterada
}
```

---

## ETAPA 3: VALIDAÇÕES NO BACKEND

### Criar função de validação
```typescript
// Adicionar em: utils/validations.ts ou similar

/**
 * Valida data_hora_inicio antes de salvar
 */
function validarDataHoraInicio(
  data_hora_inicio: Date,
  created_at: Date
): { valido: boolean; erro?: string } {
  const agora = new Date();
  
  // Não pode ser data futura
  if (data_hora_inicio > agora) {
    return {
      valido: false,
      erro: 'Data/hora de início não pode ser futura'
    };
  }
  
  // Não pode ser posterior ao created_at
  if (data_hora_inicio > created_at) {
    return {
      valido: false,
      erro: 'Data/hora de início não pode ser posterior à data de criação do chamado'
    };
  }
  
  return { valido: true };
}
```

---

## ETAPA 4: ATUALIZAR ENDPOINTS/CONTROLLERS

### Endpoint de CRIAÇÃO de chamado
```typescript
// POST /chamados ou similar

async function criarChamado(req, res) {
  const { /* outros campos */ } = req.body;
  const usuarioAtual = req.user; // Assumindo middleware de autenticação
  
  const agora = new Date();
  
  // Se usuário é ADMIN e forneceu data_hora_inicio customizada
  let dataHoraInicio = agora;
  if (usuarioAtual.isAdmin && req.body.data_hora_inicio) {
    const dataFornecida = new Date(req.body.data_hora_inicio);
    
    // Validar
    const validacao = validarDataHoraInicio(dataFornecida, agora);
    if (!validacao.valido) {
      return res.status(400).json({ erro: validacao.erro });
    }
    
    dataHoraInicio = dataFornecida;
  }
  
  const chamado = await db.chamados.create({
    // ... outros campos ...
    created_at: agora,              // Sempre automático
    data_hora_inicio: dataHoraInicio,
    data_hora_inicio_alterado_por: usuarioAtual.isAdmin && req.body.data_hora_inicio 
      ? usuarioAtual.id 
      : null,
    data_hora_inicio_alterado_em: usuarioAtual.isAdmin && req.body.data_hora_inicio 
      ? agora 
      : null
  });
  
  return res.json(chamado);
}
```

### Endpoint de EDIÇÃO de chamado
```typescript
// PUT /chamados/:id ou PATCH /chamados/:id

async function editarChamado(req, res) {
  const { id } = req.params;
  const usuarioAtual = req.user;
  
  const chamado = await db.chamados.findById(id);
  if (!chamado) {
    return res.status(404).json({ erro: 'Chamado não encontrado' });
  }
  
  const updates = { /* campos editáveis normais */ };
  
  // Apenas ADMIN pode editar data_hora_inicio
  if (req.body.data_hora_inicio) {
    if (!usuarioAtual.isAdmin) {
      return res.status(403).json({ 
        erro: 'Apenas administradores podem alterar a data/hora de início' 
      });
    }
    
    const novaData = new Date(req.body.data_hora_inicio);
    
    // Validar contra created_at do chamado existente
    const validacao = validarDataHoraInicio(novaData, chamado.created_at);
    if (!validacao.valido) {
      return res.status(400).json({ erro: validacao.erro });
    }
    
    updates.data_hora_inicio = novaData;
    updates.data_hora_inicio_alterado_por = usuarioAtual.id;
    updates.data_hora_inicio_alterado_em = new Date();
  }
  
  const chamadoAtualizado = await db.chamados.update(id, updates);
  
  return res.json(chamadoAtualizado);
}
```

---

## ETAPA 5: INTERFACE - FORMULÁRIO DE CRIAÇÃO

### Componente de formulário de criação
```tsx
// Componente: FormularioCriacaoChamado.tsx ou similar

function FormularioCriacaoChamado() {
  const usuarioAtual = useUsuarioAtual();
  const [dataHoraInicio, setDataHoraInicio] = useState(null);
  
  return (
    
      {/* ... outros campos ... */}
      
      {/* Campo de data/hora início - APENAS para ADMIN */}
      {usuarioAtual.isAdmin && (
        
          
            Data/Hora de Início
             (opcional)
          
          
          <input
            type="datetime-local"
            id="data_hora_inicio"
            value={dataHoraInicio ? formatarParaDateTimeLocal(dataHoraInicio) : ''}
            onChange={(e) => setDataHoraInicio(e.target.value ? new Date(e.target.value) : null)}
            max={formatarParaDateTimeLocal(new Date())} // Não permite futuro
          />
          
          
            Deixe vazio para usar a data/hora atual. 
            Não pode ser data futura.
          
        
      )}
      
      {/* ... resto do formulário ... */}
    
  );
}

// Função auxiliar
function formatarParaDateTimeLocal(date: Date): string {
  const ano = date.getFullYear();
  const mes = String(date.getMonth() + 1).padStart(2, '0');
  const dia = String(date.getDate()).padStart(2, '0');
  const hora = String(date.getHours()).padStart(2, '0');
  const minuto = String(date.getMinutes()).padStart(2, '0');
  
  return `${ano}-${mes}-${dia}T${hora}:${minuto}`;
}
```

---

## ETAPA 6: INTERFACE - VISUALIZAÇÃO/EDIÇÃO DO CHAMADO

### Componente de detalhes/edição do chamado
```tsx
// Componente: DetalhesChamado.tsx ou similar

function DetalhesChamado({ chamadoId }: { chamadoId: number }) {
  const usuarioAtual = useUsuarioAtual();
  const [chamado, setChamado] = useState(null);
  const [modoEdicao, setModoEdicao] = useState(false);
  const [dataHoraInicio, setDataHoraInicio] = useState(null);
  
  useEffect(() => {
    // Carregar chamado
    carregarChamado(chamadoId).then(setChamado);
  }, [chamadoId]);
  
  if (!chamado) return Carregando...;
  
  return (
    
      {/* Informações temporais */}
      
        Informações de Data/Hora
        
        {/* Data de criação (imutável) */}
        
          Criado em:
          {formatarDataHora(chamado.created_at)}
        
        
        {/* Data de início (editável por admin) */}
        
          Início:
          
          {modoEdicao && usuarioAtual.isAdmin ? (
            <input
              type="datetime-local"
              value={formatarParaDateTimeLocal(dataHoraInicio || chamado.data_hora_inicio)}
              onChange={(e) => setDataHoraInicio(new Date(e.target.value))}
              max={formatarParaDateTimeLocal(chamado.created_at)} // Não pode ser posterior a created_at
            />
          ) : (
            {formatarDataHora(chamado.data_hora_inicio)}
          )}
          
          {/* Mostrar se foi editado */}
          {chamado.data_hora_inicio_alterado_em && (
            
              Alterado por {chamado.usuario_alteracao?.nome} em{' '}
              {formatarDataHora(chamado.data_hora_inicio_alterado_em)}
            
          )}
        
        
        {/* Botão de edição - apenas para admin */}
        {usuarioAtual.isAdmin && (
          <button
            type="button"
            onClick={() => {
              if (modoEdicao) {
                salvarAlteracoes();
              }
              setModoEdicao(!modoEdicao);
            }}
          >
            {modoEdicao ? 'Salvar' : 'Editar Data de Início'}
          
        )}
      
      
      {/* ... resto dos detalhes do chamado ... */}
    
  );
}
```

---

## ETAPA 7: HISTÓRICO DE ALTERAÇÕES (AUDITORIA)

### Criar tabela de histórico (opcional mas recomendado)
```sql
-- Migration adicional para histórico completo

CREATE TABLE chamados_historico_data_inicio (
  id SERIAL PRIMARY KEY,
  chamado_id INTEGER NOT NULL REFERENCES chamados(id) ON DELETE CASCADE,
  data_hora_inicio_anterior TIMESTAMP WITH TIME ZONE NOT NULL,
  data_hora_inicio_nova TIMESTAMP WITH TIME ZONE NOT NULL,
  alterado_por INTEGER NOT NULL REFERENCES users(id),
  alterado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  observacao TEXT
);

CREATE INDEX idx_historico_chamado ON chamados_historico_data_inicio(chamado_id);
CREATE INDEX idx_historico_data ON chamados_historico_data_inicio(alterado_em);
```

### Função para registrar no histórico
```typescript
async function registrarAlteracaoDataInicio(
  chamadoId: number,
  dataAnterior: Date,
  dataNova: Date,
  usuarioId: number,
  observacao?: string
) {
  await db.chamados_historico_data_inicio.create({
    chamado_id: chamadoId,
    data_hora_inicio_anterior: dataAnterior,
    data_hora_inicio_nova: dataNova,
    alterado_por: usuarioId,
    alterado_em: new Date(),
    observacao
  });
}

// Chamar essa função no endpoint de edição, após validação bem-sucedida
```

---

## CHECKLIST DE IMPLEMENTAÇÃO

### ✅ Banco de Dados
- [ ] Criar e executar migration para adicionar campos
- [ ] Verificar que dados existentes foram migrados (25 registros com data_hora_inicio = created_at)
- [ ] Testar constraints (data não futura, não posterior a created_at)
- [ ] Criar migration de rollback (por segurança)

### ✅ Backend
- [ ] Atualizar modelo/schema do Chamado
- [ ] Implementar validações de data_hora_inicio
- [ ] Atualizar endpoint de criação (permitir admin customizar)
- [ ] Atualizar endpoint de edição (apenas admin pode alterar)
- [ ] Implementar registro de auditoria
- [ ] Criar testes unitários para validações

### ✅ Frontend
- [ ] Adicionar campo no formulário de criação (apenas para admin)
- [ ] Adicionar campo na tela de edição/detalhes (apenas para admin)
- [ ] Implementar validações no cliente (data não futura, não posterior a created_at)
- [ ] Mostrar informações de auditoria (quem/quando alterou)
- [ ] Testar comportamento para usuário não-admin (não deve ver campo editável)

### ✅ Testes
- [ ] Testar criação de chamado por usuário não-admin (deve usar created_at automaticamente)
- [ ] Testar criação de chamado por admin com data customizada
- [ ] Testar criação de chamado por admin sem data customizada
- [ ] Testar edição de data_hora_inicio por admin
- [ ] Testar tentativa de edição por não-admin (deve ser bloqueado)
- [ ] Testar validações (data futura, data posterior a created_at)
- [ ] Verificar que histórico está sendo registrado corretamente

---

## NOTAS IMPORTANTES

1. **BACKUP ANTES DE EXECUTAR**: Fazer backup do banco de dados antes de rodar a migration
2. **AMBIENTE DE TESTE**: Testar primeiro em ambiente de desenvolvimento/staging
3. **DADOS EXISTENTES**: Os 25 registros existentes terão `data_hora_inicio = created_at` automaticamente
4. **PERFORMANCE**: Índices criados para otimizar queries
5. **SEGURANÇA**: Validações tanto no frontend quanto backend
6. **AUDITORIA**: Todas as alterações são rastreadas (quem, quando)

---

## EXEMPLO DE FLUXO COMPLETO

### Cenário 1: Usuário normal cria chamado
1. Usuário não-admin acessa formulário
2. Campo `data_hora_inicio` NÃO aparece
3. Ao criar, sistema define automaticamente: `data_hora_inicio = created_at = NOW()`

### Cenário 2: Admin cria chamado com data customizada
1. Admin acessa formulário
2. Campo `data_hora_inicio` aparece (opcional)
3. Admin seleciona "15/01/2026 10:30"
4. Sistema valida (não é futura, OK)
5. Cria chamado com:
   - `created_at = NOW()` (ex: 18/01/2026 14:00)
   - `data_hora_inicio = 15/01/2026 10:30`
   - `data_hora_inicio_alterado_por = ID do admin`

### Cenário 3: Admin edita data_hora_inicio de chamado existente
1. Admin abre detalhes do chamado
2. Vê botão "Editar Data de Início"
3. Altera data e salva
4. Sistema:
   - Valida nova data
   - Atualiza `data_hora_inicio`
   - Registra em `data_hora_inicio_alterado_por` e `data_hora_inicio_alterado_em`
   - Salva no histórico

---

## QUESTÕES?

Se algo não estiver claro ou precisar de ajustes, me informe antes de executar.