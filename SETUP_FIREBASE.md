# 🔥 Configuração Firebase - Grupo Thermas SaaS

## ⚡ Configuração Rápida

### 1. Criar arquivo `.env.local`

Crie um arquivo `.env.local` na raiz do projeto com as seguintes variáveis:

```bash
# 🔐 VISÍVEIS NO CLIENTE (prefixo NEXT_PUBLIC_)
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyCla8K8AhlmFkULTxTP6jUz_yqP9LBpZXo
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=grupo-thermas-a99fc.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=grupo-thermas-a99fc
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=grupo-thermas-a99fc.appspot.com
NEXT_PUBLIC_FIREBASE_APP_ID=1:437851791805:web:b5fbf28d417ab1729532d4
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-FL8LVCVBC9

# 🔒 SOMENTE NO SERVIDOR (NÃO use NEXT_PUBLIC)
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-fbsvc@grupo-thermas-a99fc.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvwIBADANBgkqhkiG9w0BAQEFAASCBKkwggSlAgEAAoIBAQDYUwT+9uBzDBZW\nHIfGWAmWKp4GxC8djEVzcJrNYmA2dppM9YB8C1lYXvoD9Hmvu+JOgdgnnGsCfGnO\nLP9kLm79bN1RnEhVza3YOoC/JJHwISabpcxfM9UZo4N7WelNkTE6oryl8hQIlEOo\nvVqDxHcpBJXb0I+lDxXMJtnllIYrMtrzVK3+v5gMf+SHJ0FYXyR4nkpXc8NxmOZ+\no7u2JPbWDIONDw3sqtBtmUnndAclo87zaNNNFBjLyh3tByV3Tc86aTUn3xSr+2oE\nEekAWVPvq1B7ByqagYvuMV0IVOrrlJyzl8uCKOx0BE/9177Zo5Y0KfWYT4D9cKg0\nJRxSVqknAgMBAAECggEAAbL43tyIKEzAhSGKHaeG0sez8aDAq+zVXvAOLn1Ivwa0\n2cyfm0ZsotWiM9FTbt95IYwu/ouQP5vPlqL0JX00XPDLBY/V/V8Gt7estNeEW97R\n8JmEVBCOfeiq+Hg+DHuWdz/FQBp9LQGHiz6xQm7oKNGAAgNp3uC44RPGYHyuQH71\nuJoEBfDnC9SMWA3Zo8R9tDfHzGuWx7yMj85PfuqXdntjdISbooFe7WJ6Ub3rnJB+\ncWN94D66inp6jGQbdoUdWIzLu/b7ZwwqkW67f+TUWCnz5EQnor5MH9idiZ5Wk9Y4\nMchRbaj+cv/UhsookAyxrF3m2Y6qKd54ciyerdB0wQKBgQD+XGAhHbrkSXPPrXHJ\nO1oFBoG/5jQdeUyo2YIUWA+g1ZbN7C5gSj3ET2mZ0TIoU56Dr96TAwepzhJcOz3Q\nIQOEfUu/zWpQfP3b5TAFBVQPhRc66hvtGL8livdE4MtEdpNemC0j44W0gx+0ZQ2k\nRE6X/o+uptEDzcJAI2nTH7vuhwKBgQDZt+TxcymOOAtJV6FtXMclJsZn1NoMwOqS\nftNsna6UHYOXJHSjZ9hA7OpvpHKJoLQH8VVrJQV8sUlK7ffDKMMDCPgQK2Waj0Nm\nxoqPvghy/KxhUkNvfE6a2fmdCLCwwOUD7z8pkSpnyu1vBuY+64MgIfOFf4Rx62I0\ncfpaW554YQKBgQC2zrMz+ccBHR1Dy/b0VlirNfL4dT1NVYlX7QMFFgkdYYSBuNXX\n1GOx/BT8PJJc00QghrxjUhEm4/jkGpuhQqjhhp9zWPGoqTxV1tD9OsggY1m/uNOb\nQmbWV5rBAQJ10Pa3TI1ctr+4bWjS4LG+Nm155bVkI3Yi0rViHVGIL82EbwKBgQCj\nvBfyucAr09wxGTUu8RJXz1RxK/Ocmc0PxU+tpNxxScz38xPA/Ez3bvVUZuE4veIH\nAylRPfNldlL/hf3KCLK4aptcVbbAyTNQbMoyFiF2kK33Nw2+H0diT8HYpntzQm45\nSkk/MowoqMVttUudUDM6DC5/XIo3vmUJuhoksDh6oQKBgQDjgimHh/X+vYNYE2Rd\nAmLCYm+2QzysRCK3n8x3VW6LDZCckQKxFmt5ZG0YXgsw5QMQwiVJKUC3Gs+GnW2R\nfmeIYEaLBZMmHYtv7aXZ56ZwxSLtGEOVfbA91d31gbaCVd4VW7BZJjJEW2wD5A+y\nm63Q9fAs4Co4zufOfpQVrv5nUw==\n-----END PRIVATE KEY-----\n"
```

### 2. Instalar dependências

```bash
npm install firebase firebase-admin
```

### 3. Testar configuração

1. Execute o projeto: `npm run dev`
2. Acesse: `    http://localhost:3000/api/test-admin`
3. Deve retornar: `{"success": true, "message": "Firebase Admin configurado corretamente"}`

## 🚀 Funcionalidades Implementadas

### ✅ Autenticação
- Login/Registro com Firebase Auth
- Provider de autenticação global (`AuthProvider`)
- Proteção de rotas automática
- Logout funcional

### ✅ Firestore Client
- Configuração para operações do cliente
- Integração com React components
- Listeners em tempo real

### ✅ Firebase Admin
- Configuração server-side segura
- API routes com acesso administrativo
- Validação de tokens no servidor

### ✅ UI/UX
- Página de login moderna com toggle criar conta/login
- Loading states com animações
- Toast notifications
- Informações do usuário na sidebar
- Tema escuro/claro integrado

## 🔧 Arquivos Criados/Modificados

### Novos arquivos:
- `lib/firebaseAdmin.ts` - Config Firebase Admin
- `components/auth/AuthProvider.tsx` - Provider de autenticação
- `app/api/test-admin/route.ts` - Teste da configuração
- `SETUP_FIREBASE.md` - Este arquivo

### Arquivos modificados:
- `lib/firebase.ts` - Config do cliente
- `app/login/page.tsx` - Login funcional
- `app/layout.tsx` - AuthProvider integrado
- `components/layout/app-layout.tsx` - useAuth integrado
- `package.json` - firebase-admin adicionado

## ⚠️ Segurança

- ✅ Chave privada NUNCA exposta ao cliente
- ✅ Regras Firestore por usuário (uid)
- ✅ Validação server-side com Admin SDK
- ✅ Variables de ambiente segregadas

## 🎯 Próximos passos

1. Configurar regras Firestore detalhadas
2. Implementar middleware de autenticação para API routes
3. Adicionar validação de permissões por usuário
4. Configurar Cloud Functions (opcional)
5. Setup de produção no Vercel 