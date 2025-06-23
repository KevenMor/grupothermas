# 🤖 **N8N AUTOMATIONS - GRUPO THERMAS**

## 📋 **VISÃO GERAL**

Sistema completo de automação WhatsApp para o Grupo Thermas usando N8N + Z-API, com:
- ✅ Atendimento automático 24/7
- ✅ Follow-up inteligente
- ✅ Relatórios automáticos
- ✅ Alertas em tempo real
- ✅ Analytics avançado

---

## 🚀 **INSTALAÇÃO RÁPIDA**

### **Opção 1: Script Automático (Recomendado)**
```bash
# 1. Baixar e executar script
chmod +x setup-n8n-thermas.sh
./setup-n8n-thermas.sh

# 2. Seguir instruções na tela
# 3. Aguardar instalação completa
# 4. Acessar http://localhost:5678
```

### **Opção 2: Manual**
```bash
# 1. Instalar Docker
curl -fsSL https://get.docker.com | sh

# 2. Clonar repositório
git clone https://github.com/seu-repo/thermas-n8n
cd thermas-n8n

# 3. Configurar variáveis
cp .env.example .env
nano .env

# 4. Iniciar serviços
docker-compose up -d
```

---

## 🔧 **CONFIGURAÇÃO**

### **1. Variáveis de Ambiente**
```bash
# Z-API
ZAPI_INSTANCE_ID=sua_instancia_id
ZAPI_TOKEN=seu_token_zapi

# Sistema Thermas
SYSTEM_URL=https://thermas.com
SYSTEM_TOKEN=seu_token_api

# Contatos
ADMIN_PHONE=5562999999999
ALERT_PHONE=5562888888888

# N8N
N8N_PASSWORD=sua_senha_segura
```

### **2. Webhook Z-API**
```bash
# Configure no painel Z-API:
URL: http://seu-dominio.com:5678/webhook/whatsapp-thermas
Método: POST
Eventos: message, ack, presence
```

---

## 📊 **WORKFLOWS DISPONÍVEIS**

### **1. Atendimento Principal**
```javascript
// Fluxo: Mensagem → Processamento → Resposta
Trigger: Webhook WhatsApp
Funcionalidades:
- Detecção de intenção por IA
- Respostas automáticas personalizadas
- Handoff para humanos
- Salvamento de leads
- Agendamento de follow-up
```

### **2. Follow-up Automático**
```javascript
// Fluxo: Timer → Buscar Leads → Enviar Follow-up
Trigger: Cron (a cada 2 horas)
Funcionalidades:
- Identificação de leads sem resposta
- Mensagens personalizadas por intenção
- Ofertas especiais automáticas
- Agendamento de próximo follow-up
```

### **3. Analytics e Relatórios**
```javascript
// Fluxo: Timer → Coletar Dados → Gerar Relatório
Trigger: Cron (diário às 9h)
Funcionalidades:
- Métricas de performance
- Relatórios automáticos
- Alertas críticos
- Atualização de dashboard
```

---

## 💬 **EXEMPLOS DE CONVERSAS**

### **Cliente pergunta sobre pacotes:**
```
Cliente: "Oi, quero saber sobre pacotes para Caldas Novas"

Bot: "🌊 Olá! Que bom que você tem interesse nos nossos pacotes!

🏨 PACOTES DISPONÍVEIS:
• 💑 Pacote Casal - A partir de R$ 890
• 👨‍👩‍👧‍👦 Pacote Família - R$ 1.200  
• 👥 Pacote Grupo - A partir de R$ 750

✅ INCLUSOS:
• Hospedagem resort 5 estrelas
• Café da manhã completo
• Piscinas termais
• Transfer aeroporto

Digite 'CASAL', 'FAMÍLIA' ou 'GRUPO' para mais detalhes!"
```

### **Follow-up automático (2h depois):**
```
Bot: "Boa tarde! 🌅

Vi que você teve interesse nos pacotes para Caldas Novas.

💡 OFERTA ESPECIAL AGORA:
🎯 20% desconto para reservas hoje
⏰ Últimas vagas fim de semana!

Pacote Casal: R$ 712 (era R$ 890)
Pacote Família: R$ 960 (era R$ 1.200)

Quer garantir sua vaga? 😊"
```

---

## 📈 **MÉTRICAS E KPIs**

### **Dashboard Principal**
```javascript
// Métricas em tempo real
{
  "mensagens_hoje": 247,
  "leads_gerados": 38,
  "conversoes": 9,
  "taxa_conversao": "23.7%",
  "tempo_resposta": "12s",
  "satisfacao": "4.8/5"
}
```

### **Relatório Diário**
```
📊 RELATÓRIO DIÁRIO - GRUPO THERMAS
📅 Data: 2024-01-15

🎯 MÉTRICAS PRINCIPAIS:
• 💬 Mensagens: 247 📈 +15%
• 🎯 Leads: 38 📈 +22%
• 💰 Conversões: 9 📈 +12%
• ⚡ Tempo médio: 12s

📈 PERFORMANCE:
• 🎯 Taxa conversão: 23.7%
• 📱 Taxa resposta: 96.4%

🔥 TOP INTENÇÕES:
1. Pacotes: 156 (63%)
2. Preços: 67 (27%)
3. Reservas: 24 (10%)
```

---

## 🎯 **PALAVRAS-CHAVE DETECTADAS**

### **Intenções Automáticas**
```javascript
const keywords = {
  pacotes: ['pacote', 'viagem', 'caldas novas', 'thermas'],
  precos: ['preço', 'valor', 'quanto custa', 'orçamento'],
  reserva: ['reservar', 'agendar', 'disponibilidade'],
  urgente: ['urgente', 'emergência', 'problema'],
  humano: ['atendente', 'humano', 'pessoa']
};
```

### **Respostas Personalizadas**
```javascript
// Exemplo para intenção "precos"
response = `💰 PREÇOS ESPECIAIS GRUPO THERMAS

🏷️ Valores promocionais:
• Final de semana: R$ 750/pessoa
• Semana: R$ 590/pessoa  
• Promoção Flash: R$ 490/pessoa

🎯 CONDIÇÕES ESPECIAIS:
• Até 12x sem juros
• 10% desconto à vista
• Crianças até 6 anos: GRÁTIS

Quer orçamento personalizado? 📅`;
```

---

## 🔧 **COMANDOS ÚTEIS**

### **Gerenciamento Docker**
```bash
# Iniciar serviços
docker-compose up -d

# Ver logs
docker-compose logs -f n8n

# Parar serviços
docker-compose down

# Reiniciar N8N
docker-compose restart n8n

# Backup completo
docker run --rm -v n8n_data:/data -v $(pwd):/backup alpine tar czf /backup/n8n-backup.tar.gz -C /data .
```

### **Monitoramento**
```bash
# Status dos serviços
./monitor.sh

# Backup manual
./backup.sh

# Ver métricas
curl http://localhost:5678/api/v1/metrics

# Testar webhook
curl -X POST http://localhost:5678/webhook/whatsapp-thermas \
  -H "Content-Type: application/json" \
  -d '{"from":"5562999999999","message":"teste"}'
```

---

## 🚨 **ALERTAS AUTOMÁTICOS**

### **Tipos de Alertas**
```javascript
// Alertas críticos (enviados imediatamente)
- Taxa de conversão < 10%
- Tempo de resposta > 60s
- Sistema fora do ar > 5min
- Erro rate > 5%

// Alertas de atenção (relatório diário)
- Queda de leads > 20%
- Mensagens não respondidas > 10
- Webhook failures > 3
```

### **Configuração de Alertas**
```javascript
// No workflow analytics
if (metrics.conversionRate < 10) {
  alerts.push({
    type: 'critical',
    message: `Taxa conversão baixa: ${metrics.conversionRate}%`,
    action: 'Revisar estratégia follow-up'
  });
}
```

---

## 🔐 **SEGURANÇA**

### **Autenticação**
```javascript
// N8N com autenticação básica
N8N_BASIC_AUTH_ACTIVE=true
N8N_BASIC_AUTH_USER=admin
N8N_BASIC_AUTH_PASSWORD=senha_forte

// Tokens de API
SYSTEM_TOKEN=jwt_token_seguro
ZAPI_TOKEN=token_zapi_valido
```

### **Webhook Security**
```javascript
// Validação de origem
if (req.headers['user-agent'] !== 'Z-API-Webhook') {
  return res.status(403).json({error: 'Forbidden'});
}

// Rate limiting
const rateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minuto
  max: 100 // máximo 100 requests
});
```

---

## 📚 **CUSTOMIZAÇÃO**

### **Adicionando Nova Intenção**
```javascript
// 1. Adicionar palavras-chave
const keywords = {
  ...existing,
  cancelamento: ['cancelar', 'desistir', 'remover']
};

// 2. Criar resposta
case 'cancelamento':
  response = `😔 Entendo que você quer cancelar.
  
  Posso ajudar com:
  • Reagendamento gratuito
  • Crédito para futuras viagens
  • Reembolso (conforme política)
  
  Qual opção prefere?`;
  break;
```

### **Modificando Horários**
```javascript
// Follow-up personalizado
const followUpTime = new Date();
followUpTime.setHours(followUpTime.getHours() + 4); // 4h em vez de 2h

// Relatórios em horário específico
"0 9 * * *" // 9h da manhã
"0 18 * * *" // 6h da tarde
```

---

## 🐛 **TROUBLESHOOTING**

### **Problemas Comuns**

#### **Webhook não funciona**
```bash
# Verificar se N8N está acessível
curl http://localhost:5678/webhook/whatsapp-thermas

# Verificar logs
docker-compose logs -f n8n

# Testar manualmente
curl -X POST http://localhost:5678/webhook/whatsapp-thermas \
  -H "Content-Type: application/json" \
  -d '{"test": true}'
```

#### **Z-API não responde**
```bash
# Testar conectividade
curl https://api.z-api.io/instances/SEU_ID/token/SEU_TOKEN/status

# Verificar webhook configurado
curl https://api.z-api.io/instances/SEU_ID/token/SEU_TOKEN/webhook

# Reconectar instância se necessário
```

#### **Workflows não executam**
```bash
# Verificar se estão ativos
# N8N Dashboard > Workflows > Status

# Verificar credenciais
# N8N Dashboard > Settings > Credentials

# Testar execução manual
# Workflow > Execute Workflow
```

---

## 📞 **SUPORTE**

### **Documentação**
- [N8N Documentation](https://docs.n8n.io)
- [Z-API Documentation](https://z-api.io/docs)
- [Webhook Testing](https://webhook.site)

### **Comunidade**
- [N8N Community](https://community.n8n.io)
- [Discord Grupo Thermas](https://discord.gg/thermas)

### **Contato**
- 📧 Email: dev@grupothermas.com
- 📱 WhatsApp: +55 62 99999-9999
- 🌐 Site: https://grupothermas.com

---

## 🎉 **PRÓXIMOS PASSOS**

1. **✅ Instalar sistema** com script automático
2. **✅ Configurar Z-API** webhook
3. **✅ Testar workflows** com mensagens reais
4. **✅ Customizar respostas** para seu negócio
5. **✅ Monitorar métricas** e otimizar
6. **✅ Escalar** para outros canais

**🚀 Sua automação está pronta para decolar!** 