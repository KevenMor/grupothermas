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
FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account","project_id":"grupo-thermas-a99fc","private_key_id":"...","private_key":"...","client_email":"...","client_id":"...","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_x509_cert_url":"..."}
ZAPI_TOKEN=seu_token_da_zapi_aqui
OPENAI_API_KEY=sua_chave_da_openai_aqui
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