#!/bin/bash

# 🚀 Script de Configuração Automática N8N + Z-API + Grupo Thermas
# Versão: 1.0
# Data: $(date +%Y-%m-%d)

set -e  # Parar em caso de erro

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para imprimir com cor
print_color() {
    printf "${2}${1}${NC}\n"
}

# Função para verificar se comando existe
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Banner inicial
print_banner() {
    echo ""
    print_color "╔══════════════════════════════════════════════════════════════╗" "$BLUE"
    print_color "║                    GRUPO THERMAS AUTOMATION                  ║" "$BLUE"
    print_color "║                     N8N + Z-API Setup                       ║" "$BLUE"
    print_color "║                        Versão 1.0                           ║" "$BLUE"
    print_color "╚══════════════════════════════════════════════════════════════╝" "$BLUE"
    echo ""
}

# Verificar pré-requisitos
check_prerequisites() {
    print_color "🔍 Verificando pré-requisitos..." "$YELLOW"
    
    if ! command_exists docker; then
        print_color "❌ Docker não encontrado. Instalando..." "$RED"
        curl -fsSL https://get.docker.com -o get-docker.sh
        sh get-docker.sh
        rm get-docker.sh
    fi
    
    if ! command_exists docker-compose; then
        print_color "❌ Docker Compose não encontrado. Instalando..." "$RED"
        sudo curl -L "https://github.com/docker/compose/releases/download/1.29.2/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
        sudo chmod +x /usr/local/bin/docker-compose
    fi
    
    print_color "✅ Pré-requisitos verificados!" "$GREEN"
}

# Coletar configurações do usuário
collect_config() {
    print_color "📝 Coletando configurações..." "$YELLOW"
    
    echo -n "Digite seu Instance ID da Z-API: "
    read ZAPI_INSTANCE_ID
    
    echo -n "Digite seu Token da Z-API: "
    read ZAPI_TOKEN
    
    echo -n "Digite a URL do seu sistema (ex: https://thermas.com): "
    read SYSTEM_URL
    
    echo -n "Digite o token da API do sistema: "
    read SYSTEM_TOKEN
    
    echo -n "Digite seu número do WhatsApp para relatórios (ex: 5562999999999): "
    read ADMIN_PHONE
    
    echo -n "Digite seu número para alertas críticos (ex: 5562888888888): "
    read ALERT_PHONE
    
    echo -n "Digite uma senha para o N8N (mínimo 8 caracteres): "
    read -s N8N_PASSWORD
    echo ""
    
    # Validações básicas
    if [[ ${#ZAPI_INSTANCE_ID} -lt 10 ]]; then
        print_color "❌ Instance ID da Z-API muito curto!" "$RED"
        exit 1
    fi
    
    if [[ ${#ZAPI_TOKEN} -lt 20 ]]; then
        print_color "❌ Token da Z-API muito curto!" "$RED"
        exit 1
    fi
    
    if [[ ${#N8N_PASSWORD} -lt 8 ]]; then
        print_color "❌ Senha do N8N deve ter pelo menos 8 caracteres!" "$RED"
        exit 1
    fi
    
    print_color "✅ Configurações coletadas!" "$GREEN"
}

# Criar estrutura de diretórios
create_directories() {
    print_color "📁 Criando estrutura de diretórios..." "$YELLOW"
    
    mkdir -p n8n-thermas/{workflows,credentials,data,backups}
    cd n8n-thermas
    
    print_color "✅ Diretórios criados!" "$GREEN"
}

# Gerar docker-compose.yml
generate_docker_compose() {
    print_color "🐳 Gerando docker-compose.yml..." "$YELLOW"
    
    cat > docker-compose.yml << EOF
version: '3.8'

services:
  n8n:
    image: n8nio/n8n:latest
    restart: always
    ports:
      - "5678:5678"
    environment:
      - N8N_BASIC_AUTH_ACTIVE=true
      - N8N_BASIC_AUTH_USER=admin
      - N8N_BASIC_AUTH_PASSWORD=${N8N_PASSWORD}
      - N8N_HOST=0.0.0.0
      - N8N_PORT=5678
      - N8N_PROTOCOL=http
      - NODE_ENV=production
      - WEBHOOK_URL=http://localhost:5678
      - GENERIC_TIMEZONE=America/Sao_Paulo
      - N8N_LOG_LEVEL=info
      - N8N_LOG_OUTPUT=console
    volumes:
      - n8n_data:/home/node/.n8n
      - ./workflows:/home/node/.n8n/workflows
      - ./credentials:/home/node/.n8n/credentials
      - ./backups:/home/node/.n8n/backups
    networks:
      - n8n_network

  postgres:
    image: postgres:13
    restart: always
    environment:
      - POSTGRES_DB=n8n
      - POSTGRES_USER=n8n
      - POSTGRES_PASSWORD=n8n_password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - n8n_network

  redis:
    image: redis:6-alpine
    restart: always
    networks:
      - n8n_network

volumes:
  n8n_data:
  postgres_data:

networks:
  n8n_network:
    driver: bridge
EOF
    
    print_color "✅ Docker Compose configurado!" "$GREEN"
}

# Configurar workflows
setup_workflows() {
    print_color "⚙️ Configurando workflows..." "$YELLOW"
    
    # Workflow principal
    sed -e "s/SEU_TOKEN_AQUI/${ZAPI_TOKEN}/g" \
        -e "s/SEU_INSTANCE_ID/${ZAPI_INSTANCE_ID}/g" \
        -e "s|https://seudominio.com|${SYSTEM_URL}|g" \
        -e "s/SEU_TOKEN_SISTEMA/${SYSTEM_TOKEN}/g" \
        ../n8n-workflows/workflow-atendimento-thermas.json > workflows/workflow-atendimento-thermas.json
    
    # Workflow follow-up
    sed -e "s/SEU_TOKEN_ZAPI/${ZAPI_TOKEN}/g" \
        -e "s/SEU_INSTANCE_ID/${ZAPI_INSTANCE_ID}/g" \
        -e "s|https://seudominio.com|${SYSTEM_URL}|g" \
        -e "s/SEU_TOKEN_SISTEMA/${SYSTEM_TOKEN}/g" \
        ../n8n-workflows/workflow-followup-thermas.json > workflows/workflow-followup-thermas.json
    
    # Workflow analytics
    sed -e "s/SEU_TOKEN/${ZAPI_TOKEN}/g" \
        -e "s/SEU_INSTANCE_ID/${ZAPI_INSTANCE_ID}/g" \
        -e "s|https://seudominio.com|${SYSTEM_URL}|g" \
        -e "s/SEU_TOKEN_SISTEMA/${SYSTEM_TOKEN}/g" \
        -e "s/5562999999999/${ADMIN_PHONE}/g" \
        -e "s/5562888888888/${ALERT_PHONE}/g" \
        ../n8n-workflows/workflow-analytics-thermas.json > workflows/workflow-analytics-thermas.json
    
    print_color "✅ Workflows configurados!" "$GREEN"
}

# Iniciar serviços
start_services() {
    print_color "🚀 Iniciando serviços..." "$YELLOW"
    
    docker-compose up -d
    
    print_color "⏳ Aguardando N8N inicializar..." "$YELLOW"
    sleep 30
    
    # Verificar se N8N está rodando
    if curl -s http://localhost:5678 > /dev/null; then
        print_color "✅ N8N iniciado com sucesso!" "$GREEN"
    else
        print_color "❌ Erro ao iniciar N8N!" "$RED"
        print_color "Verifique os logs: docker-compose logs n8n" "$YELLOW"
        exit 1
    fi
}

# Importar workflows automaticamente
import_workflows() {
    print_color "📥 Importando workflows..." "$YELLOW"
    
    # Aguardar um pouco mais para garantir que N8N está pronto
    sleep 10
    
    # Copiar workflows para dentro do container
    docker cp workflows/. $(docker-compose ps -q n8n):/home/node/.n8n/workflows/
    
    # Reiniciar N8N para carregar workflows
    docker-compose restart n8n
    sleep 20
    
    print_color "✅ Workflows importados!" "$GREEN"
}

# Configurar backup automático
setup_backup() {
    print_color "💾 Configurando backup automático..." "$YELLOW"
    
    cat > backup.sh << 'EOF'
#!/bin/bash
# Backup automático N8N Thermas

BACKUP_DIR="./backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="n8n_backup_${DATE}.tar.gz"

echo "Iniciando backup..."

# Criar backup dos workflows e dados
docker run --rm -v n8n-thermas_n8n_data:/data -v $(pwd)/backups:/backup alpine tar czf /backup/${BACKUP_FILE} -C /data .

echo "Backup criado: ${BACKUP_FILE}"

# Manter apenas os últimos 7 backups
cd backups
ls -t n8n_backup_*.tar.gz | tail -n +8 | xargs -r rm

echo "Backup concluído!"
EOF
    
    chmod +x backup.sh
    
    # Adicionar ao crontab para backup diário às 2:00
    (crontab -l 2>/dev/null; echo "0 2 * * * cd $(pwd) && ./backup.sh") | crontab -
    
    print_color "✅ Backup automático configurado!" "$GREEN"
}

# Gerar script de monitoramento
create_monitoring() {
    print_color "📊 Criando script de monitoramento..." "$YELLOW"
    
    cat > monitor.sh << 'EOF'
#!/bin/bash
# Monitor N8N Thermas

check_service() {
    if docker-compose ps | grep -q "Up"; then
        echo "✅ Serviços rodando"
    else
        echo "❌ Serviços com problema"
        docker-compose ps
    fi
}

check_n8n() {
    if curl -s http://localhost:5678 > /dev/null; then
        echo "✅ N8N acessível"
    else
        echo "❌ N8N não acessível"
    fi
}

check_disk() {
    DISK_USAGE=$(df -h . | tail -1 | awk '{print $5}' | sed 's/%//')
    if [ $DISK_USAGE -gt 80 ]; then
        echo "⚠️  Disco com ${DISK_USAGE}% de uso"
    else
        echo "✅ Disco OK (${DISK_USAGE}%)"
    fi
}

echo "🔍 Monitoramento N8N Thermas - $(date)"
echo "=================================="
check_service
check_n8n
check_disk
echo ""
echo "📊 Logs recentes:"
docker-compose logs --tail=5 n8n
EOF
    
    chmod +x monitor.sh
    
    print_color "✅ Script de monitoramento criado!" "$GREEN"
}

# Gerar arquivo de configuração
create_config_file() {
    print_color "📄 Criando arquivo de configuração..." "$YELLOW"
    
    cat > config.env << EOF
# Configurações N8N Thermas
ZAPI_INSTANCE_ID=${ZAPI_INSTANCE_ID}
ZAPI_TOKEN=${ZAPI_TOKEN}
SYSTEM_URL=${SYSTEM_URL}
SYSTEM_TOKEN=${SYSTEM_TOKEN}
ADMIN_PHONE=${ADMIN_PHONE}
ALERT_PHONE=${ALERT_PHONE}
N8N_URL=http://localhost:5678
N8N_USER=admin
N8N_PASSWORD=${N8N_PASSWORD}

# URLs importantes
WEBHOOK_URL=http://localhost:5678/webhook/whatsapp-thermas
ZAPI_WEBHOOK_CONFIG=https://api.z-api.io/instances/${ZAPI_INSTANCE_ID}/token/${ZAPI_TOKEN}/webhook

# Data de instalação
INSTALL_DATE=$(date)
EOF
    
    print_color "✅ Arquivo de configuração criado!" "$GREEN"
}

# Teste de conectividade
test_connectivity() {
    print_color "🧪 Testando conectividade..." "$YELLOW"
    
    # Testar Z-API
    if curl -s "https://api.z-api.io/instances/${ZAPI_INSTANCE_ID}/token/${ZAPI_TOKEN}/status" > /dev/null; then
        print_color "✅ Z-API conectado!" "$GREEN"
    else
        print_color "⚠️  Z-API não respondeu (verifique credenciais)" "$YELLOW"
    fi
    
    # Testar sistema
    if curl -s -H "Authorization: Bearer ${SYSTEM_TOKEN}" "${SYSTEM_URL}/api/test" > /dev/null; then
        print_color "✅ Sistema Thermas conectado!" "$GREEN"
    else
        print_color "⚠️  Sistema Thermas não respondeu" "$YELLOW"
    fi
    
    # Testar N8N
    if curl -s http://localhost:5678 > /dev/null; then
        print_color "✅ N8N funcionando!" "$GREEN"
    else
        print_color "❌ N8N com problemas!" "$RED"
    fi
}

# Configurar webhook na Z-API
configure_zapi_webhook() {
    print_color "🔗 Configurando webhook na Z-API..." "$YELLOW"
    
    curl -X POST "https://api.z-api.io/instances/${ZAPI_INSTANCE_ID}/token/${ZAPI_TOKEN}/webhook" \
         -H "Content-Type: application/json" \
         -d "{\"url\": \"http://localhost:5678/webhook/whatsapp-thermas\"}" \
         > /dev/null 2>&1
    
    if [ $? -eq 0 ]; then
        print_color "✅ Webhook Z-API configurado!" "$GREEN"
    else
        print_color "⚠️  Erro ao configurar webhook (configure manualmente)" "$YELLOW"
    fi
}

# Mostrar informações finais
show_final_info() {
    print_color "🎉 INSTALAÇÃO CONCLUÍDA!" "$GREEN"
    echo ""
    print_color "📋 INFORMAÇÕES IMPORTANTES:" "$BLUE"
    echo ""
    print_color "🌐 N8N Dashboard: http://localhost:5678" "$YELLOW"
    print_color "👤 Usuário: admin" "$YELLOW"
    print_color "🔑 Senha: ${N8N_PASSWORD}" "$YELLOW"
    echo ""
    print_color "🔗 Webhook URL: http://localhost:5678/webhook/whatsapp-thermas" "$YELLOW"
    print_color "📱 Configure este webhook na Z-API!" "$YELLOW"
    echo ""
    print_color "🛠️  COMANDOS ÚTEIS:" "$BLUE"
    print_color "• Ver status: ./monitor.sh" "$YELLOW"
    print_color "• Fazer backup: ./backup.sh" "$YELLOW"
    print_color "• Ver logs: docker-compose logs -f n8n" "$YELLOW"
    print_color "• Parar serviços: docker-compose down" "$YELLOW"
    print_color "• Iniciar serviços: docker-compose up -d" "$YELLOW"
    echo ""
    print_color "📄 Configurações salvas em: config.env" "$YELLOW"
    echo ""
    print_color "🚀 PRÓXIMOS PASSOS:" "$BLUE"
    print_color "1. Acesse http://localhost:5678" "$YELLOW"
    print_color "2. Faça login com admin/${N8N_PASSWORD}" "$YELLOW"
    print_color "3. Ative os workflows importados" "$YELLOW"
    print_color "4. Configure o webhook na Z-API" "$YELLOW"
    print_color "5. Teste enviando uma mensagem!" "$YELLOW"
    echo ""
}

# Função principal
main() {
    print_banner
    
    print_color "🚀 Iniciando configuração automática..." "$BLUE"
    echo ""
    
    check_prerequisites
    collect_config
    create_directories
    generate_docker_compose
    setup_workflows
    start_services
    import_workflows
    setup_backup
    create_monitoring
    create_config_file
    configure_zapi_webhook
    test_connectivity
    
    echo ""
    show_final_info
}

# Executar função principal
main "$@" 