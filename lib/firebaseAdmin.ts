import { cert, getApps, initializeApp, App } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

// Debug apenas em runtime, não durante build
if (typeof window === 'undefined' && process.env.NODE_ENV !== 'production' && process.env.NEXT_PHASE !== 'phase-production-build') {
  console.log('--- Verificando Variável de Ambiente do Firebase ---')
  console.log(
    'Variável FIREBASE_SERVICE_ACCOUNT_JSON existe?',
    !!process.env.FIREBASE_SERVICE_ACCOUNT_JSON
  )
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    console.log('Primeiros 15 caracteres:', process.env.FIREBASE_SERVICE_ACCOUNT_JSON.substring(0, 15))
  }
  console.log('--- Fim do Bloco de Debug ---')
}

let admin: App;

if (getApps().length > 0) {
  admin = getApps()[0];
} else {
  let serviceAccount;

  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
  } else if (process.env.NODE_ENV !== 'production') {
    // Em desenvolvimento, tenta usar o arquivo local
    try {
      serviceAccount = require('../config/firebase-service-account.json');
    } catch (e) {
      // Se não conseguir carregar o arquivo, cria um admin mock para o build
      if (process.env.NEXT_PHASE !== 'phase-production-build') {
        console.warn('Arquivo de service account não encontrado, usando configuração mock para build');
      }
      serviceAccount = {
        type: "service_account",
        project_id: "mock-project",
        private_key_id: "mock-key-id",
        private_key: "-----BEGIN PRIVATE KEY-----\nMOCK_PRIVATE_KEY\n-----END PRIVATE KEY-----\n",
        client_email: "mock@mock-project.iam.gserviceaccount.com",
        client_id: "mock-client-id",
        auth_uri: "https://accounts.google.com/o/oauth2/auth",
        token_uri: "https://oauth2.googleapis.com/token"
      };
    }
  } else {
    // Durante build de produção, usar mock
    if (process.env.NEXT_PHASE === 'phase-production-build') {
      serviceAccount = {
        type: "service_account",
        project_id: "mock-project",
        private_key_id: "mock-key-id",
        private_key: "-----BEGIN PRIVATE KEY-----\nMOCK_PRIVATE_KEY\n-----END PRIVATE KEY-----\n",
        client_email: "mock@mock-project.iam.gserviceaccount.com",
        client_id: "mock-client-id",
        auth_uri: "https://accounts.google.com/o/oauth2/auth",
        token_uri: "https://oauth2.googleapis.com/token"
      };
    } else {
      throw new Error(
        'ERRO CRÍTICO: FIREBASE_SERVICE_ACCOUNT_JSON não definida em ambiente de produção.'
      );
    }
  }

  try {
    admin = initializeApp({
      credential: cert(serviceAccount as any),
    });
  } catch (error) {
    if (process.env.NEXT_PHASE !== 'phase-production-build') {
      console.warn('Erro ao inicializar Firebase Admin (pode ser esperado durante build):', error);
    }
    // Retorna um mock para permitir o build
    admin = {} as App;
  }
}

// Criar mock do Firestore para build
const mockFirestore = {
  collection: () => ({
    doc: () => ({
      get: () => Promise.resolve({ exists: false, data: () => ({}) }),
      set: () => Promise.resolve(),
      update: () => Promise.resolve(),
      delete: () => Promise.resolve(),
      collection: () => mockFirestore.collection()
    }),
    get: () => Promise.resolve({ docs: [], forEach: () => {} }),
    add: () => Promise.resolve({ id: 'mock-id' }),
    where: () => mockFirestore.collection(),
    orderBy: () => mockFirestore.collection(),
    limit: () => mockFirestore.collection()
  })
};

export const adminDB = (admin && typeof admin.name === 'string') ? getFirestore(admin) : mockFirestore as any; 