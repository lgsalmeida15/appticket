# Guia: Como Subir o Projeto AppTicket para o GitHub

## Pré-requisitos
- Conta no GitHub (você já tem ✓)
- Git instalado no computador

---

## Passo 1: Criar Repositório no GitHub

1. Acesse [github.com](https://github.com) e faça login
2. Clique no botão **"+"** no canto superior direito
3. Selecione **"New repository"**
4. Preencha os dados:
   - **Repository name**: `AppTicket` (ou outro nome de sua escolha)
   - **Description** (opcional): "Sistema de gestão de chamados/tickets"
   - **Visibilidade**: Escolha entre Public ou Private
   - ⚠️ **NÃO marque** as opções:
     - ❌ Add a README file
     - ❌ Add .gitignore (já temos um)
     - ❌ Choose a license
5. Clique em **"Create repository"**

---

## Passo 2: Inicializar Git no Projeto (Local)

Abra o terminal/PowerShell na pasta do projeto e execute os seguintes comandos:

### 2.1. Inicializar o repositório Git
```bash
git init
```

### 2.2. Adicionar todos os arquivos ao staging
```bash
git add .
```

### 2.3. Fazer o primeiro commit
```bash
git commit -m "Initial commit: AppTicket project"
```

---

## Passo 3: Conectar ao Repositório GitHub

### 3.1. Adicionar o repositório remoto

Após criar o repositório no GitHub, você verá uma página com instruções. Copie a URL do seu repositório (será algo como: `https://github.com/SEU-USUARIO/AppTicket.git`)

Execute o comando (substitua SEU-USUARIO pelo seu nome de usuário do GitHub):
```bash
git remote add origin https://github.com/SEU-USUARIO/AppTicket.git
```

**Ou se preferir usar SSH** (requer configuração de chaves SSH):
```bash
git remote add origin git@github.com:SEU-USUARIO/AppTicket.git
```

### 3.2. Verificar se foi adicionado corretamente
```bash
git remote -v
```

Você deve ver algo como:
```
origin  https://github.com/SEU-USUARIO/AppTicket.git (fetch)
origin  https://github.com/SEU-USUARIO/AppTicket.git (push)
```

---

## Passo 4: Enviar para o GitHub

### 4.1. Renomear a branch principal (se necessário)
```bash
git branch -M main
```

### 4.2. Fazer o push inicial
```bash
git push -u origin main
```

Se você usar a branch `master` ao invés de `main`:
```bash
git branch -M master
git push -u origin master
```

**Nota**: Na primeira vez, o GitHub pode pedir autenticação:
- Se usar HTTPS: você precisará de um Personal Access Token (PAT)
- Se usar SSH: precisa ter chaves SSH configuradas

---

## Autenticação no GitHub (Se Necessário)

### Opção A: Personal Access Token (HTTPS)

1. No GitHub, vá em: **Settings** → **Developer settings** → **Personal access tokens** → **Tokens (classic)**
2. Clique em **"Generate new token"** → **"Generate new token (classic)"**
3. Dê um nome para o token (ex: "AppTicket")
4. Selecione os escopos: marque **"repo"** (acesso completo aos repositórios)
5. Clique em **"Generate token"**
6. **COPIE O TOKEN** (você só verá ele uma vez!)
7. Ao fazer `git push`, quando pedir senha, use o token no lugar da senha

### Opção B: SSH Keys (Recomendado para uso frequente)

1. Verifique se já tem chave SSH:
```bash
ls -al ~/.ssh
```

2. Se não tiver, gere uma nova:
```bash
ssh-keygen -t ed25519 -C "seu-email@exemplo.com"
```

3. Adicione a chave ao ssh-agent:
```bash
eval "$(ssh-agent -s)"
ssh-add ~/.ssh/id_ed25519
```

4. Copie a chave pública:
```bash
cat ~/.ssh/id_ed25519.pub
```

5. No GitHub: **Settings** → **SSH and GPG keys** → **New SSH key**
6. Cole a chave e salve

---

## Comandos Resumidos (Sequência Completa)

```bash
# 1. Inicializar Git
git init

# 2. Adicionar arquivos
git add .

# 3. Primeiro commit
git commit -m "Initial commit: AppTicket project"

# 4. Adicionar repositório remoto (SUBSTITUA SEU-USUARIO)
git remote add origin https://github.com/SEU-USUARIO/AppTicket.git

# 5. Renomear branch para main
git branch -M main

# 6. Enviar para GitHub
git push -u origin main
```

---

## Comandos Úteis para o Futuro

### Ver status das alterações
```bash
git status
```

### Adicionar arquivos modificados
```bash
git add .
# ou para arquivos específicos:
git add caminho/do/arquivo
```

### Fazer commit
```bash
git commit -m "Descrição das alterações"
```

### Enviar alterações para GitHub
```bash
git push
```

### Atualizar repositório local
```bash
git pull
```

### Ver histórico de commits
```bash
git log
```

---

## Verificações Importantes

✅ O arquivo `.gitignore` já está configurado e vai ignorar:
- `node_modules/`
- Arquivos `.env`
- `logs/`
- Arquivos de upload
- Arquivos sensíveis de configuração

⚠️ **IMPORTANTE**: Nunca commite arquivos com senhas, tokens ou informações sensíveis!

---

## Solução de Problemas Comuns

### Erro: "remote origin already exists"
```bash
git remote remove origin
git remote add origin https://github.com/SEU-USUARIO/AppTicket.git
```

### Erro: "Authentication failed"
- Verifique se está usando o Personal Access Token corretamente (não a senha)
- Ou configure SSH keys

### Erro: "Permission denied"
- Verifique se você tem permissão no repositório
- Confirme se o nome do usuário/repositório está correto

### Para atualizar depois de mudanças locais:
```bash
git add .
git commit -m "Descrição das mudanças"
git push
```

---

## Próximos Passos

Após o primeiro upload:
1. ✅ Verifique se todos os arquivos foram enviados corretamente no GitHub
2. ✅ Adicione uma descrição no repositório (se ainda não fez)
3. ✅ Considere adicionar um README.md mais completo
4. ✅ Configure branch protection (se necessário)

---

**Dúvidas?** Consulte a [documentação oficial do GitHub](https://docs.github.com/pt/get-started/quickstart/create-a-repo)

