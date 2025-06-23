# Variáveis de Ambiente - Sistema Grupo Thermas

## Configuração para Railway

### Variáveis Públicas (NEXT_PUBLIC_*)

Estas variáveis são expostas no cliente e são necessárias para o Firebase funcionar no navegador:

```
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyCla8K8AhlmFkULTxTP6jUz_yqP9LBpZXo
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=grupo-thermas-a99fc.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=grupo-thermas-a99fc
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=grupo-thermas-a99fc.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=437851791805
NEXT_PUBLIC_FIREBASE_APP_ID=1:437851791805:web:b5fbf28d417ab1729532d4
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-FL8LVCVBC9
```

### Variáveis Privadas (Servidor)

Estas variáveis ficam apenas no servidor e não são expostas ao cliente:

```
FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account","project_id":"your-project-id",...}
ZAPI_TOKEN=your_token
OPENAI_API_KEY=sk-your-openai-api-key
```

## Como Configurar no Railway

1. Acesse o painel do Railway (https://railway.app)
2. Vá para o seu projeto
3. Clique na aba "Variables"
4. Adicione cada variável acima
5. Clique em "Deploy" para aplicar as mudanças

## Para Desenvolvimento Local

Crie um arquivo `.env.local` na raiz do projeto com as mesmas variáveis acima.

## Notas Importantes

- **NEXT_PUBLIC_**: Estas variáveis são expostas no cliente e podem ser vistas no código JavaScript
- **Variáveis sem NEXT_PUBLIC_**: Estas ficam apenas no servidor e são seguras
- **FIREBASE_SERVICE_ACCOUNT_JSON**: Deve ser o JSON completo da conta de serviço do Firebase Admin
- **ZAPI_TOKEN**: Token de autenticação da Z-API para WhatsApp
- **OPENAI_API_KEY**: Chave da API da OpenAI para IA

## Verificação

Após configurar as variáveis, o build no Railway deve funcionar sem erros de `auth/invalid-api-key` ou outras falhas relacionadas ao Firebase. 

## Variáveis de Ambiente Necessárias

## Firebase
```
FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account","project_id":"your-project-id",...}
```

## Z-API (WhatsApp)
```
ZAPI_INSTANCE_ID=your_instance_id
ZAPI_TOKEN=your_token
ZAPI_CLIENT_TOKEN=your_client_token
```

## OpenAI (IA Conversacional)
```
OPENAI_API_KEY=sk-your-openai-api-key
```

## Next.js
```
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret
```

## Como Configurar

### 1. OpenAI
1. Acesse https://platform.openai.com/api-keys
2. Crie uma nova API key
3. Adicione a variável `OPENAI_API_KEY` no Railway/Vercel

### 2. Z-API
1. Configure sua instância no painel Z-API
2. Configure o webhook para: `https://seu-dominio.com/api/zapi/webhook`
3. Adicione as variáveis no Railway/Vercel

### 3. Firebase
1. Baixe o arquivo de service account do Firebase
2. Converta para string JSON
3. Adicione como `FIREBASE_SERVICE_ACCOUNT_JSON`

## Fluxo de IA

Quando um cliente envia mensagem:
1. Z-API recebe → Webhook salva no Firestore
2. Sistema verifica se IA está ativa
3. OpenAI processa mensagem com contexto
4. Resposta é enviada via Z-API automaticamente
5. Conversa fica na aba "IA" até agente assumir 