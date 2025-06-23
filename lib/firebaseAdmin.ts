import { cert, getApps, initializeApp, App } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

// --- Início do Bloco de Debug ---
console.log('--- Verificando Variável de Ambiente do Firebase ---')
console.log(
  'Variável FIREBASE_SERVICE_ACCOUNT_JSON existe?',
  !!process.env.FIREBASE_SERVICE_ACCOUNT_JSON
)
if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
  console.log('Primeiros 15 caracteres:', process.env.FIREBASE_SERVICE_ACCOUNT_JSON.substring(0, 15))
}
console.log('--- Fim do Bloco de Debug ---')
// --- Fim do Bloco de Debug ---

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
      console.warn('Arquivo de service account não encontrado, usando configuração mock para build');
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
    throw new Error(
      'ERRO CRÍTICO: FIREBASE_SERVICE_ACCOUNT_JSON não definida em ambiente de produção.'
    );
  }

  try {
    admin = initializeApp({
      credential: cert(serviceAccount as any),
    });
  } catch (error) {
    console.warn('Erro ao inicializar Firebase Admin (pode ser esperado durante build):', error);
    // Retorna um mock para permitir o build
    admin = {} as App;
  }
}

export const adminDB = admin ? getFirestore(admin) : ({} as any); 