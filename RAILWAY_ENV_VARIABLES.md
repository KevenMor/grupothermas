# 🚀 Variáveis de Ambiente para Railway

Este guia lista **todas as variáveis de ambiente** que você precisa configurar no painel do Railway para que o sistema funcione corretamente.

## 🔥 Firebase (Obrigatórias)

### Configuração Principal
```env
# Firebase Config (NEXT_PUBLIC_* são visíveis no frontend)
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef123456
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX
```

### Service Account (Backend)
```env
# Firebase Admin SDK (para operações server-side)
FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account","project_id":"your_project","private_key_id":"...","private_key":"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n","client_email":"firebase-adminsdk-xxxxx@your_project.iam.gserviceaccount.com","client_id":"...","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_x509_cert_url":"https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-xxxxx%40your_project.iam.gserviceaccount.com"}
FIREBASE_DATABASE_URL=https://your_project-default-rtdb.firebaseio.com
```

## 🤖 OpenAI (Obrigatória)

```env
# OpenAI API Key
OPENAI_API_KEY=sk-your_openai_api_key
```

## 📱 Z-API (Obrigatórias)

```env
# Z-API Configuration
ZAPI_TOKEN=your_zapi_token_here
ZAPI_INSTANCE_ID=your_instance_id_here
ZAPI_CLIENT_TOKEN=your_client_token_here
```

## 🔗 GPTMaker (Opcional - para integração alternativa)

```env
# GPTMaker Configuration
GPTMAKER_API_KEY=your_gptmaker_api_key
GPTMAKER_WORKSPACE_ID=your_workspace_id
GPTMAKER_BASE_URL=https://api.gptmaker.ai
GPTMAKER_WEBHOOK_SECRET=your_webhook_secret
```

## 🌐 URLs e Configurações (Obrigatórias)

```env
# Base URL da aplicação
NEXT_PUBLIC_BASE_URL=https://your-app-name.railway.app
NEXTAUTH_URL=https://your-app-name.railway.app

# Webhook Make (para integrações externas)
MAKE_WEBHOOK_URL=https://hook.us2.make.com/your_webhook_id
```

## 🎵 Microserviço de Áudio (Opcional)

```env
# URL do microserviço de conversão de áudio
AUDIO_CONVERTER_SERVICE_URL=http://your-audio-service.railway.app/convert-audio
```

## ⚙️ Configurações do Sistema

```env
# Ambiente
NODE_ENV=production

# Porta (Railway define automaticamente)
PORT=3000
```

## 📋 Como Configurar no Railway

### 1. Acesse o Painel do Railway
- Vá para [railway.app](https://railway.app)
- Selecione seu projeto

### 2. Configure as Variáveis
- Clique em **"Variables"** no menu lateral
- Adicione cada variável uma por uma
- Clique em **"Add Variable"** para cada uma

### 3. Ordem de Prioridade
Configure nesta ordem:
1. **Firebase** (obrigatório)
2. **OpenAI** (obrigatório)
3. **Z-API** (obrigatório)
4. **URLs** (obrigatório)
5. **GPTMaker** (opcional)
6. **Microserviço de Áudio** (opcional)

## 🔍 Verificação

### Teste de Configuração
Após configurar, acesse:
```
https://your-app-name.railway.app/admin
```

### Logs de Verificação
Verifique os logs no Railway para confirmar:
- ✅ Firebase conectado
- ✅ OpenAI funcionando
- ✅ Z-API conectado
- ✅ Webhook configurado

## ⚠️ Importante

### FIREBASE_SERVICE_ACCOUNT_JSON
- **Formato**: JSON completo em uma linha
- **Exemplo**: `{"type":"service_account","project_id":"...","private_key":"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",...}`
- **Dica**: Copie o JSON completo do arquivo de service account do Firebase

### URLs
- Use **HTTPS** para produção
- Sem barra no final
- Exemplo: `https://your-app-name.railway.app`

### Segurança
- Nunca commite estas variáveis no git
- Use sempre HTTPS em produção
- Rotacione as chaves periodicamente

## 🆘 Troubleshooting

### Erro: "Firebase não configurado"
- Verifique se todas as variáveis `NEXT_PUBLIC_FIREBASE_*` estão configuradas
- Confirme se o `FIREBASE_SERVICE_ACCOUNT_JSON` está correto

### Erro: "OpenAI API Key inválida"
- Verifique se a chave começa com `sk-`
- Confirme se a chave tem créditos disponíveis

### Erro: "Z-API não conectado"
- Verifique `ZAPI_TOKEN`, `ZAPI_INSTANCE_ID` e `ZAPI_CLIENT_TOKEN`
- Confirme se a instância está ativa no painel Z-API

### Erro: "Webhook não configurado"
- Verifique se `NEXT_PUBLIC_BASE_URL` está correto
- Confirme se o domínio está acessível publicamente 