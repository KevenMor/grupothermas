# 🔥 Configuração do Firebase - Grupo Thermas

## 📋 Pré-requisitos
- Acesso ao [Firebase Console](https://console.firebase.google.com)
- Projeto `grupo-thermas-a99fc` já criado

## 🚀 Passo a Passo

### 1. **Configurar Web App no Firebase Console**

1. Acesse o [Firebase Console](https://console.firebase.google.com)
2. Selecione o projeto `grupo-thermas-a99fc`
3. Clique em **⚙️ Configurações do projeto**
4. Na aba **Geral**, role até **Seus aplicativos**
5. Se não tiver um app web, clique em **Adicionar app** → **Web** (`</>`)
6. Registre o app com nome: `Grupo Thermas SaaS`
7. **NÃO** marque "Firebase Hosting"
8. Clique em **Registrar app**

### 2. **Copiar Configurações**

Você verá algo assim:
```javascript
const firebaseConfig = {
  apiKey: "AIzaSyC...",
  authDomain: "grupo-thermas-a99fc.firebaseapp.com",
  projectId: "grupo-thermas-a99fc",
  storageBucket: "grupo-thermas-a99fc.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456",
  measurementId: "G-ABCDEFGHIJ"
};
```

### 3. **Atualizar .env.local**

Edite o arquivo `.env.local` e substitua pelos valores reais:

```env
# Firebase Configuration - Grupo Thermas
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyC...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=grupo-thermas-a99fc.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=grupo-thermas-a99fc
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=grupo-thermas-a99fc.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef123456
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-ABCDEFGHIJ
```

### 4. **Verificar Service Account**

O arquivo `config/firebase-service-account.json` já está configurado com suas credenciais Admin SDK.

### 5. **Configurar Firestore Rules**

No Firebase Console:
1. Vá para **Firestore Database**
2. Clique na aba **Regras**
3. As regras já estão configuradas no arquivo `firebase/firestore.rules`

### 6. **Habilitar Autenticação**

1. No Firebase Console, vá para **Authentication**
2. Clique na aba **Método de login**
3. Habilite **E-mail/senha**
4. (Opcional) Habilite outros provedores conforme necessário

## 🧪 Testar Configuração

1. Inicie o servidor: `npm run dev`
2. Acesse `http://localhost:3000`
3. Vá para `/login` e teste a criação de conta
4. Acesse `/dashboard` e clique em "Criar Dados Teste"

## 📁 Estrutura de Arquivos

```
├── config/
│   └── firebase-service-account.json (Admin SDK)
├── lib/
│   ├── firebase.ts (Cliente)
│   ├── firebaseAdmin.ts (Admin)
│   └── firebaseTest.ts (Testes)
├── firebase/
│   └── firestore.rules
└── .env.local (Configurações)
```

## 🔧 Solução de Problemas

### "Firebase: Error (auth/invalid-api-key)"
- Verifique se a `NEXT_PUBLIC_FIREBASE_API_KEY` está correta
- Confirme se o app web foi criado no Firebase Console

### "Permission denied"
- Verifique se as regras do Firestore estão corretas
- Confirme se o usuário está autenticado

### "Module not found: firebase-service-account.json"
- Verifique se o arquivo está em `config/firebase-service-account.json`
- Confirme se o arquivo tem as permissões corretas

## ✅ Próximos Passos

Após configurar:
1. Teste o login/cadastro
2. Crie dados de teste no Dashboard
3. Explore as funcionalidades de Leads e Contratos
4. Configure regras de segurança adicionais conforme necessário 