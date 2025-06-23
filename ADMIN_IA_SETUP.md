# 🤖 Painel Administrativo - IA Thermas

## 📋 Visão Geral

O **Painel Administrativo da IA** é uma interface completa para configurar e gerenciar o assistente virtual integrado com Z-API e OpenAI. Permite configurar prompts, webhooks, conexões WhatsApp e monitorar o desempenho da IA.

## 🎯 Funcionalidades Principais

### 1. **Configuração Z-API**
- ✅ API Key e Instance ID
- ✅ Geração de QR Code automática
- ✅ Status de conexão em tempo real
- ✅ URL de webhook configurável

### 2. **Configuração OpenAI**
- ✅ API Key segura
- ✅ Seleção de modelo (GPT-4, GPT-3.5, etc.)
- ✅ Controle de temperatura e tokens
- ✅ Parâmetros personalizáveis

### 3. **Gerenciamento de Prompts**
- ✅ Prompt do sistema personalizável
- ✅ Mensagens de boas-vindas
- ✅ Mensagens de fallback
- ✅ Mensagens de transferência

### 4. **Sistema de Webhooks**
- ✅ Lead Capture
- ✅ Agendamento de consultas
- ✅ Processamento de pagamentos
- ✅ Tickets de suporte
- ✅ Transferência para humanos

### 5. **Conexão WhatsApp**
- ✅ QR Code integrado
- ✅ Status de conexão
- ✅ Histórico de conexões
- ✅ Webhook automático

## 🚀 Como Configurar

### Passo 1: Acesse o Painel Admin
```
http://localhost:3000/admin
```

### Passo 2: Configure Z-API
1. **API Key**: Insira sua chave da Z-API
2. **Instance ID**: ID da sua instância Z-API
3. **Base URL**: `https://api.z-api.io` (padrão)

### Passo 3: Configure OpenAI
1. **API Key**: Sua chave da OpenAI (`sk-...`)
2. **Modelo**: Escolha entre GPT-4, GPT-4 Turbo, GPT-3.5
3. **Temperature**: Controle a criatividade (0.0 - 1.0)
4. **Max Tokens**: Limite de tokens por resposta

### Passo 4: Personalize os Prompts
1. **Prompt do Sistema**: Define personalidade da IA
2. **Mensagem de Boas-vindas**: Primeira mensagem
3. **Mensagem de Fallback**: Quando não entende
4. **Mensagem de Transferência**: Para atendimento humano

### Passo 5: Configure Webhooks
Configure URLs para diferentes ações:
- **Lead Capture**: `https://seu-crm.com/webhook/leads`
- **Appointment Booking**: `https://seu-sistema.com/webhook/agendamentos`
- **Payment Process**: `https://seu-gateway.com/webhook/pagamentos`
- **Support Ticket**: `https://seu-suporte.com/webhook/tickets`
- **Human Handoff**: `https://seu-chat.com/webhook/transferencia`

### Passo 6: Conecte o WhatsApp
1. Clique em **"Gerar QR Code"**
2. Escaneie com seu WhatsApp
3. Aguarde conexão ser estabelecida
4. Configure webhook no painel Z-API

## 🔧 Configuração no Z-API

### URL do Webhook
```
https://seu-dominio.com/api/zapi/ai-webhook
```

### Configuração no Painel Z-API
1. Acesse o painel Z-API
2. Vá em **"Webhooks"**
3. Cole a URL do webhook
4. Ative as notificações de mensagens

## 📊 Monitoramento

### Status da Conexão
- 🔴 **Desconectado**: WhatsApp não conectado
- 🟡 **Conectando**: Aguardando escaneamento do QR
- 🟢 **Conectado**: WhatsApp ativo e funcionando

### Teste de Webhooks
- Cada webhook pode ser testado individualmente
- Indicadores visuais de sucesso/erro
- Logs detalhados no console

## 🛡️ Segurança

### Proteção de API Keys
- Campos de senha para chaves sensíveis
- Botão de mostrar/ocultar
- Sanitização nos logs
- Armazenamento seguro no Firebase

### Validação de Dados
- Campos obrigatórios validados
- URLs de webhook testadas
- Configurações salvas de forma segura

## 🔄 Fluxo de Funcionamento

### 1. Recebimento de Mensagem
```
WhatsApp → Z-API → Webhook → Sistema Thermas
```

### 2. Processamento IA
```
Mensagem → OpenAI → Resposta Personalizada
```

### 3. Análise de Contexto
```
Mensagem → Análise → Trigger de Webhooks
```

### 4. Resposta Automática
```
IA → Z-API → WhatsApp → Cliente
```

## 📋 Exemplos de Configuração

### Prompt do Sistema - Exemplo
```
Você é um assistente virtual especializado do Grupo Thermas.

CONTEXTO:
- Empresa de turismo termal premium
- Foco em experiências de relaxamento
- Atendimento personalizado e exclusivo

PERSONALIDADE:
- Caloroso e acolhedor
- Profissional e elegante
- Conhecimento especializado
- Proativo em soluções

OBJETIVOS:
1. Qualificar leads interessados
2. Agendar consultorias
3. Fornecer informações precisas
4. Transferir quando necessário
```

### Webhooks - Exemplos
```json
{
  "leadCapture": "https://crm.thermas.com/api/leads",
  "appointmentBooking": "https://agenda.thermas.com/api/booking",
  "paymentProcess": "https://payments.thermas.com/api/process",
  "supportTicket": "https://support.thermas.com/api/tickets",
  "humanHandoff": "https://chat.thermas.com/api/handoff"
}
```

## 🚨 Troubleshooting

### Problemas Comuns

#### QR Code não aparece
- Verifique API Key Z-API
- Confirme Instance ID
- Teste conectividade com Z-API

#### IA não responde
- Verifique API Key OpenAI
- Confirme webhook configurado
- Teste conectividade OpenAI

#### Webhooks não funcionam
- Teste URLs individualmente
- Verifique logs do servidor
- Confirme formato dos dados

### Logs e Debug
```bash
# Ver logs do servidor
npm run dev

# Logs específicos da IA
tail -f logs/ai-webhook.log

# Debug do Firebase
firebase emulators:start --debug
```

## 📈 Métricas Esperadas

### Performance
- ⚡ **Tempo de Resposta**: < 3 segundos
- 🎯 **Taxa de Acerto**: > 95%
- 📱 **Disponibilidade**: 99.9%

### Conversões
- 📊 **Taxa de Resposta**: > 90%
- 💰 **Conversão em Leads**: > 25%
- 🤝 **Satisfação**: > 4.5/5

## 🔄 Atualizações

### Versão 1.0 - Atual
- ✅ Painel administrativo completo
- ✅ Integração Z-API + OpenAI
- ✅ Sistema de webhooks
- ✅ QR Code automático

### Próximas Versões
- 🔜 Dashboard de analytics
- 🔜 A/B testing de prompts
- 🔜 Múltiplas instâncias
- 🔜 Relatórios automáticos

## 📞 Suporte

Para dúvidas ou problemas:
1. Verifique este guia primeiro
2. Consulte os logs do sistema
3. Teste as configurações individualmente
4. Entre em contato com o suporte técnico

---

**🌿 Grupo Thermas - Sistema de IA Administrativa v1.0** 