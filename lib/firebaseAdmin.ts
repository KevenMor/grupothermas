import { cert, getApps, initializeApp, App } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import { getAuth } from "firebase-admin/auth";

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

// Debug e validação explícita da variável de ambiente
if (typeof window === 'undefined') {
  if (!process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    console.error('FIREBASE_SERVICE_ACCOUNT_JSON NÃO DEFINIDA!')
  } else {
    try {
      const parsed = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON)
      if (!parsed.private_key || !parsed.client_email) {
        throw new Error('private_key ou client_email ausente no JSON')
      }
      if (!parsed.private_key.includes('-----BEGIN PRIVATE KEY-----')) {
        throw new Error('private_key mal formatada (falta BEGIN PRIVATE KEY)')
      }
      if (!parsed.private_key.includes('\n')) {
        throw new Error('private_key deve conter quebras de linha (\\n)')
      }
      console.log('FIREBASE_SERVICE_ACCOUNT_JSON OK: project_id =', parsed.project_id)
    } catch (e) {
      console.error('FIREBASE_SERVICE_ACCOUNT_JSON MAL FORMADA:', e)
      throw e
    }
  }
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
export const adminStorage = (admin && typeof admin.name === 'string') ? getStorage(admin) : null;
export const adminAuth = (admin && typeof admin.name === 'string') ? getAuth(admin) : null;

export async function generateSignedUrl(storagePath: string, expiresInSeconds = 60 * 60) {
  if (!adminStorage) throw new Error('Firebase Storage não inicializado');
  const bucket = adminStorage.bucket('grupo-thermas-a99fc.firebasestorage.app');
  const file = bucket.file(storagePath);
  const [url] = await file.getSignedUrl({
    action: 'read',
    expires: Date.now() + expiresInSeconds * 1000, // 1 hora por padrão
  });
  return url;
} 