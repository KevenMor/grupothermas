# 📱 Módulo Atendimento WhatsApp - Grupo Thermas

Sistema de atendimento WhatsApp com Kanban em tempo real, integrado ao GPT Maker.

## 🚀 Deploy na Vercel

```bash
# 1. Clone e instale dependências
npm install

# 2. Configure variáveis de ambiente
cp .env.example .env.local

# 3. Deploy
vercel --prod
```

## 🔧 Variáveis de Ambiente

```env
# GPT Maker API
GPTMAKER_API_KEY=your_api_key_here
GPTMAKER_WORKSPACE_ID=your_workspace_id
GPTMAKER_BASE_URL=https://api.gptmaker.ai
GPTMAKER_WEBHOOK_SECRET=your_webhook_secret

# Firebase (já configurado)
NEXT_PUBLIC_FIREBASE_API_KEY=...
```

## 📋 Funcionalidades

- **Kanban 3 colunas**: IA → Espera → Comigo
- **Drag & Drop**: Assumir/devolver chats
- **Chat em tempo real**: Firestore + WebSocket
- **PWA**: Instalável como app nativo
- **Mobile-first**: Otimizado para celular

## 🔗 Webhook GPT Maker

Configure no GPT Maker:
```
URL: https://your-domain.vercel.app/api/gptmaker/webhook
Eventos: message.created, chat.updated, chat.assigned
```

## 📱 PWA

Acesse `/kanban` no celular e clique "Adicionar à tela inicial". 