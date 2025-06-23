# 📱 Módulo WhatsApp Business - Grupo Thermas

## 🚀 Visão Geral

Este módulo permite conectar números WhatsApp ao sistema e automatizar o atendimento usando IA e integração com N8N.

## 🏗️ Arquitetura

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   WhatsApp Web  │────│  Nossa API      │────│   Firebase      │
│   (QR Code)     │    │  (Next.js)      │    │   (Database)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │
                              ├─── OpenAI (Agente IA)
                              │
                              └─── N8N (Automação)
```

## 🔧 Configuração

### 1. Variáveis de Ambiente

Adicione no seu `.env.local`:

```env
# OpenAI para Agente IA
OPENAI_API_KEY=sk-your-openai-key

# WhatsApp (opcional)
WHATSAPP_SESSION_SECRET=your-session-secret

# N8N (opcional)
N8N_WEBHOOK_BASE_URL=https://your-n8n-instance.com/webhook
```

### 2. Instalação de Dependências

```bash
npm install
```

### 3. Iniciar o Servidor

```bash
npm run dev
```

## 📋 Funcionalidades

### ✅ Implementadas

- **Conexão via QR Code**: Escaneie o QR Code com seu WhatsApp
- **Múltiplas Sessões**: Conecte vários números simultaneamente
- **Agente IA**: Respostas automáticas usando OpenAI
- **Integração N8N**: Envio de eventos para automação
- **Interface Web**: Gerenciamento completo via interface
- **Tempo Real**: Atualizações via Socket.IO
- **Banco de Dados**: Armazenamento no Firebase

### 🔄 Fluxo de Funcionamento

1. **Criar Sessão**: Usuário cria uma nova sessão WhatsApp
2. **Gerar QR Code**: Sistema gera QR Code para conexão
3. **Escanear**: Usuário escaneia QR Code com WhatsApp
4. **Conectar**: WhatsApp Web conecta e autentica
5. **Receber Mensagem**: Cliente envia mensagem
6. **Processar IA**: Sistema processa com OpenAI (se habilitado)
7. **Responder**: Resposta automática é enviada
8. **N8N Webhook**: Eventos são enviados para N8N (se configurado)

## 🤖 Configuração do Agente IA

### Prompt Padrão

```
Você é um assistente virtual do Grupo Thermas.
Seja prestativo, profissional e responda de forma concisa.
Se não souber algo, ofereça para transferir para um atendente humano.

Informações sobre o Grupo Thermas:
- Empresa especializada em aquecimento solar
- Atendemos residencial e comercial
- Oferecemos instalação e manutenção
- Localização: [Sua cidade]
- Telefone: [Seu telefone]
```

### Modelos Disponíveis

- **GPT-4**: Mais inteligente, mais caro
- **GPT-3.5 Turbo**: Rápido e econômico
- **Claude**: Alternativa da Anthropic

## 🔗 Integração N8N

### Eventos Enviados

```json
{
  "event": "message_received",
  "sessionId": "session_123",
  "message": {
    "id": "msg_456",
    "from": "5511999999999@c.us",
    "body": "Olá, gostaria de um orçamento",
    "timestamp": 1234567890
  }
}
```

```json
{
  "event": "ai_response_sent",
  "sessionId": "session_123",
  "originalMessage": "Olá, gostaria de um orçamento",
  "aiResponse": "Olá! Claro, posso ajudar com o orçamento...",
  "from": "5511999999999@c.us"
}
```

### Workflow N8N Exemplo

1. **Webhook Trigger**: Recebe evento do WhatsApp
2. **Conditional**: Verifica tipo de evento
3. **Database**: Salva lead no CRM
4. **Email**: Notifica equipe de vendas
5. **Slack**: Envia notificação no Slack

## 📊 Analytics

### Métricas Disponíveis

- **Mensagens por Dia**: Total de mensagens recebidas
- **Taxa de Resolução IA**: % de mensagens resolvidas automaticamente
- **Contatos Ativos**: Número de conversas únicas
- **Tempo de Resposta**: Média de tempo para resposta

## 🔒 Segurança

### Dados Protegidos

- **Sessões WhatsApp**: Criptografadas no Firebase
- **Mensagens**: Armazenadas com hash de identificação
- **Tokens**: Nunca expostos no frontend
- **Logs**: Sanitizados para não expor dados pessoais

## 🐛 Troubleshooting

### Problemas Comuns

**QR Code não aparece**
- Verifique se o servidor Socket.IO está rodando
- Confirme que não há firewall bloqueando

**IA não responde**
- Verifique se `OPENAI_API_KEY` está configurada
- Confirme se há créditos na conta OpenAI

**N8N não recebe eventos**
- Teste a URL do webhook manualmente
- Verifique logs do N8N

**WhatsApp desconecta frequentemente**
- Use uma conexão estável
- Evite usar o WhatsApp Web em outro local

## 🚀 Deploy em Produção

### Requerimentos

- **Servidor**: VPS com pelo menos 2GB RAM
- **Node.js**: Versão 18+
- **PM2**: Para gerenciar processo
- **Nginx**: Para proxy reverso
- **SSL**: Certificado HTTPS obrigatório

### Comandos de Deploy

```bash
# Instalar dependências
npm ci --production

# Build da aplicação
npm run build

# Iniciar com PM2
pm2 start ecosystem.config.js

# Configurar nginx
sudo nginx -t && sudo systemctl reload nginx
```

## 📞 Suporte

Para dúvidas ou problemas:

1. Verifique os logs: `pm2 logs whatsapp-thermas`
2. Consulte esta documentação
3. Entre em contato com a equipe técnica

---

**Desenvolvido para o Grupo Thermas** 🌡️ 