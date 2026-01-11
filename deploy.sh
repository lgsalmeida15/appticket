#!/bin/bash

# ============================================
# SCRIPT DE DEPLOY - APPTICKET PRODUÇÃO
# ============================================
# 
# Este script executa o deploy completo da aplicação AppTicket
# em produção usando Docker Swarm + Traefik
#
# USO: ./deploy.sh
#
# ============================================

set -e  # Sair em caso de erro

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para imprimir mensagens coloridas
print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Função para verificar se comando existe
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Verificar se está rodando como root ou com sudo
check_permissions() {
    if [ "$EUID" -ne 0 ] && ! sudo -n true 2>/dev/null; then
        print_error "Este script precisa de privilégios de root ou sudo"
        exit 1
    fi
}

# Verificar pré-requisitos
check_prerequisites() {
    print_info "Verificando pré-requisitos..."
    
    if ! command_exists docker; then
        print_error "Docker não está instalado"
        exit 1
    fi
    
    if ! docker info >/dev/null 2>&1; then
        print_error "Docker não está rodando ou sem permissões"
        exit 1
    fi
    
    # Verificar se Docker Swarm está inicializado
    if ! docker info | grep -q "Swarm: active"; then
        print_warning "Docker Swarm não está inicializado"
        read -p "Deseja inicializar o Docker Swarm? (y/n) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            docker swarm init
            print_success "Docker Swarm inicializado"
        else
            print_error "Docker Swarm é necessário para continuar"
            exit 1
        fi
    fi
    
    print_success "Pré-requisitos verificados"
}

# Verificar arquivo .env
check_env_file() {
    print_info "Verificando arquivo .env..."
    
    # O .env fica dentro da pasta backend/
    if [ ! -f backend/.env ]; then
        print_error "Arquivo backend/.env não encontrado!"
        print_info "Crie o arquivo .env dentro da pasta backend/"
        exit 1
    fi
    
    # Verificar variáveis obrigatórias
    source backend/.env
    
    # Exportar variáveis para uso no docker stack deploy
    export DB_NAME DB_USER DB_PASSWORD JWT_SECRET JWT_EXPIRES_IN WEBHOOK_URL WEBHOOK_SECRET
    
    if [ -z "$DB_PASSWORD" ] || [ "$DB_PASSWORD" = "ALTERAR_SENHA_FORTE_AQUI" ]; then
        print_error "DB_PASSWORD não foi configurado no .env"
        exit 1
    fi
    
    if [ -z "$JWT_SECRET" ] || [ "$JWT_SECRET" = "GERAR_SECRET_FORTE_AQUI_MINIMO_32_CHARS" ]; then
        print_error "JWT_SECRET não foi configurado no .env"
        print_info "Gere um secret com: openssl rand -base64 32"
        exit 1
    fi
    
    print_success "Arquivo .env verificado e variáveis exportadas"
}

# Verificar/Criar network_public
check_network_public() {
    print_info "Verificando network_public..."
    
    if ! docker network ls | grep -q "network_public"; then
        print_warning "Network network_public não existe"
        read -p "Deseja criar a network network_public? (y/n) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            docker network create --driver overlay --attachable network_public
            print_success "Network network_public criada"
        else
            print_error "Network network_public é necessária para o Traefik"
            exit 1
        fi
    else
        print_success "Network network_public existe"
    fi
}

# Build das imagens
build_images() {
    print_info "Construindo imagens Docker..."
    
    # Build Backend
    print_info "Construindo imagem do backend..."
    docker build -f backend/Dockerfile.prod -t appticket-backend:latest ./backend
    
    if [ $? -eq 0 ]; then
        print_success "Imagem do backend construída com sucesso"
    else
        print_error "Falha ao construir imagem do backend"
        exit 1
    fi
    
    # Build Frontend
    print_info "Construindo imagem do frontend..."
    docker build \
        --build-arg VITE_API_URL=https://api-suporte.otmiz.tech/api \
        -f frontend/Dockerfile.prod \
        -t appticket-frontend:latest \
        ./frontend
    
    if [ $? -eq 0 ]; then
        print_success "Imagem do frontend construída com sucesso"
    else
        print_error "Falha ao construir imagem do frontend"
        exit 1
    fi
}

# Verificar se stack já existe
check_existing_stack() {
    if docker stack ls | grep -q "appticket"; then
        print_warning "Stack 'appticket' já existe"
        read -p "Deseja atualizar a stack existente? (y/n) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            UPDATE_STACK=true
        else
            print_info "Cancelando deploy..."
            exit 0
        fi
    else
        UPDATE_STACK=false
    fi
}

# Deploy da stack
deploy_stack() {
    print_info "Fazendo deploy da stack..."
    
    if [ "$UPDATE_STACK" = true ]; then
        docker stack deploy -c docker-compose.prod.yml appticket
        print_success "Stack atualizada"
    else
        docker stack deploy -c docker-compose.prod.yml appticket
        print_success "Stack criada e deployada"
    fi
}

# Aguardar serviços ficarem prontos
wait_for_services() {
    print_info "Aguardando serviços ficarem prontos..."
    
    MAX_WAIT=300  # 5 minutos
    ELAPSED=0
    
    while [ $ELAPSED -lt $MAX_WAIT ]; do
        # Verificar status dos serviços
        BACKEND_STATUS=$(docker service ps appticket_backend --format "{{.CurrentState}}" --no-trunc 2>/dev/null | head -n1 || echo "")
        FRONTEND_STATUS=$(docker service ps appticket_frontend --format "{{.CurrentState}}" --no-trunc 2>/dev/null | head -n1 || echo "")
        POSTGRES_STATUS=$(docker service ps appticket_postgres --format "{{.CurrentState}}" --no-trunc 2>/dev/null | head -n1 || echo "")
        
        if [[ "$BACKEND_STATUS" == *"Running"* ]] && \
           [[ "$FRONTEND_STATUS" == *"Running"* ]] && \
           [[ "$POSTGRES_STATUS" == *"Running"* ]]; then
            print_success "Todos os serviços estão rodando"
            return 0
        fi
        
        sleep 5
        ELAPSED=$((ELAPSED + 5))
        echo -n "."
    done
    
    echo
    print_warning "Timeout aguardando serviços ficarem prontos"
    print_info "Verifique o status com: docker service ps appticket_backend"
}

# Mostrar status dos serviços
show_status() {
    print_info "Status dos serviços:"
    echo
    docker service ls | grep appticket
    echo
    print_info "Para ver logs detalhados:"
    echo "  docker service logs -f appticket_backend"
    echo "  docker service logs -f appticket_frontend"
    echo "  docker service logs -f appticket_postgres"
}

# Executar migrations (opcional)
run_migrations() {
    print_warning "IMPORTANTE: As migrations devem ser executadas ANTES do deploy!"
    print_info "Se ainda não executou, você pode executar agora:"
    echo
    echo "  cd backend"
    echo "  source .env"
    echo "  docker run --rm \\"
    echo "    --network appticket_network_internal \\"
    echo "    -e DB_HOST=postgres \\"
    echo "    -e DB_PORT=5432 \\"
    echo "    -e DB_NAME=\$DB_NAME \\"
    echo "    -e DB_USER=\$DB_USER \\"
    echo "    -e DB_PASSWORD=\$DB_PASSWORD \\"
    echo "    -v \$(pwd):/app \\"
    echo "    -w /app \\"
    echo "    node:18-alpine \\"
    echo "    sh -c \"npm install && npm run db:migrate\""
    echo
    read -p "Deseja executar as migrations agora? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_info "Executando migrations..."
        
        # Aguardar postgres ficar disponível
        print_info "Aguardando PostgreSQL ficar disponível..."
        sleep 10
        
        # Carregar variáveis do .env
        source backend/.env
        
        docker run --rm \
            --network appticket_network_internal \
            -e DB_HOST=postgres \
            -e DB_PORT=5432 \
            -e DB_NAME=${DB_NAME:-appticket} \
            -e DB_USER=${DB_USER:-postgres} \
            -e DB_PASSWORD=${DB_PASSWORD} \
            -v $(pwd)/backend:/app \
            -w /app \
            node:18-alpine \
            sh -c "npm install && npm run db:migrate"
        
        if [ $? -eq 0 ]; then
            print_success "Migrations executadas com sucesso"
        else
            print_error "Falha ao executar migrations"
            print_info "Você pode executar manualmente depois"
        fi
    fi
}

# Main
main() {
    echo "==========================================="
    echo "  DEPLOY APPTICKET - PRODUÇÃO"
    echo "==========================================="
    echo
    
    check_permissions
    check_prerequisites
    check_env_file
    check_network_public
    check_existing_stack
    build_images
    deploy_stack
    wait_for_services
    show_status
    run_migrations
    
    echo
    print_success "Deploy concluído!"
    echo
    print_info "Próximos passos:"
    echo "  1. Verificar healthchecks: docker service ps appticket_backend"
    echo "  2. Ver logs: docker service logs -f appticket_backend"
    echo "  3. Testar endpoints:"
    echo "     - Backend: curl https://api-suporte.otmiz.tech/health"
    echo "     - Frontend: curl -I https://suporte.otmiz.tech"
    echo
}

# Executar main
main

