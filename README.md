# Sistema de Vendas - Grupo Thermas

Sistema interno de gestão de vendas desenvolvido com Next.js 14, Firebase e Tailwind CSS.

## 🚀 Funcionalidades

- **Autenticação** com Firebase Auth
- **Dashboard** com métricas em tempo real
- **Registro de vendas** com formulário completo
- **Gestão de contratos** com filtros e visualização
- **Kanban de leads** com drag & drop
- **Integrações externas**: BrasilAPI (CEP), webhook Make
- **Segurança**: regras Firestore, validações, LGPD

## 🛠️ Tecnologias

- Next.js 14 (App Router)
- TypeScript
- Firebase (Auth + Firestore)
- Tailwind CSS + shadcn/ui
- Lucide React (ícones)

## 📦 Instalação

1. Clone o repositório
2. Instale as dependências:
```bash
pnpm install
```

3. Configure as variáveis de ambiente no arquivo `.env.local`:
```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef123456

# Webhook URLs  
MAKE_WEBHOOK_URL=https://hook.us2.make.com/ppj3n7wy1f76yg7091t6g7t72nq8c9w4
```

4. Execute o projeto:
```bash
pnpm dev
```

## 🔥 Configuração Firebase

1. Crie um projeto no [Firebase Console](https://console.firebase.google.com)
2. Ative Authentication (método Email/Password)
3. Ative Firestore Database
4. Configure as regras de segurança (`firebase/firestore.rules`)
5. Crie índices compostos no Firestore:
   - Coleção: `contracts`, Campos: `uid` (Asc), `status` (Asc)
   - Coleção: `leads`, Campos: `uid` (Asc), `createdAt` (Desc)

## 🚀 Deploy Vercel

1. Conecte seu repositório no [Vercel](https://vercel.com)
2. Configure as variáveis de ambiente no painel da Vercel
3. Deploy automático a cada push na branch main

### Variáveis de ambiente obrigatórias:
- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`
- `MAKE_WEBHOOK_URL`

## 📁 Estrutura do Projeto

```
├── app/                    # Pages (App Router)
│   ├── login/             # Página de login
│   ├── dashboard/         # Dashboard principal
│   ├── sales/new/         # Formulário de vendas
│   ├── contracts/         # Gestão de contratos
│   └── leads/             # Kanban de leads
├── components/            # Componentes React
│   ├── ui/               # Componentes shadcn/ui
│   ├── CardStat.tsx      # Card de métricas
│   └── Kanban.tsx        # Board de leads
├── lib/                  # Utilitários e configurações
│   ├── firebase.ts       # Config Firebase
│   ├── api.ts           # Integrações externas
│   ├── models.ts        # Interfaces TypeScript
│   └── utils.ts         # Helpers gerais
└── firebase/            # Regras Firestore
```

## 🔒 Segurança

- Dados sensíveis apenas no servidor/Firestore
- Regras de segurança Firestore por usuário
- Validações client-side e server-side
- Conformidade LGPD

## 📝 Exemplos de Documentos

### Contract (Firestore)
```json
{
  "uid": "user123",
  "customer": {
    "name": "João Silva",
    "cpf": "123.456.789-00",
    "email": "joao@email.com",
    // ... outros campos
  },
  "sale": {
    "paymentMethod": "PIX",
    "totalValue": 5000,
    "installments": 1
  },
  "status": "created",
  "createdAt": "2024-01-01T00:00:00Z"
}
```

## 🤝 Contribuição

Sistema interno do Grupo Thermas. Contato: suporte@grupothermas.com.br

---

**Sistema desenvolvido com ❤️ para o Grupo Thermas**

# Grupo Thermas SaaS 

## Erro ao iniciar Next.js em produção – Falta rodar o build

Ao rodar `next start`, aparece o erro:

```
[Error: Could not find a production build in the '.next' directory. Try building your app with 'next build' before starting the production server.]
```

### Solução:

1. Sempre rode o comando de build antes do start:

```bash
npm run build
# ou
yarn build
```

2. Só depois rode:

```bash
npm start
# ou
yarn start
```

Assim a pasta `.next` é criada e o servidor de produção funciona corretamente.

Se ocorrer erro no build, envie o log para análise. 