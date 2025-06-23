# Variáveis de Ambiente para Railway

## Variáveis Públicas (NEXT_PUBLIC_*)

Adicione estas variáveis no painel do Railway:

```
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyCla8K8AhlmFkULTxTP6jUz_yqP9LBpZXo
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=grupo-thermas-a99fc.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=grupo-thermas-a99fc
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=grupo-thermas-a99fc.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=437851791805
NEXT_PUBLIC_FIREBASE_APP_ID=1:437851791805:web:b5fbf28d417ab1729532d4
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-FL8LVCVBC9
```

## Variáveis Privadas (Servidor)

Certifique-se de que estas variáveis também estão configuradas:

```
FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account","project_id":"grupo-thermas-a99fc",...}
ZAPI_TOKEN=seu_token_da_zapi
OPENAI_API_KEY=sua_chave_da_openai
```

## Como Configurar no Railway:

1. Acesse o painel do Railway
2. Vá para o seu projeto
3. Clique em "Variables"
4. Adicione cada variável acima
5. Clique em "Deploy" para aplicar as mudanças

## Nota Importante:

- As variáveis que começam com `NEXT_PUBLIC_` são públicas e serão expostas no cliente
- As outras variáveis são privadas e só ficam no servidor
- Após adicionar as variáveis, o build deve funcionar corretamente 