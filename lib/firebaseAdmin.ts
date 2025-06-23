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
    serviceAccount = require('../config/firebase-service-account.json');
  } else {
    throw new Error(
      'ERRO CRÍTICO: FIREBASE_SERVICE_ACCOUNT_JSON não definida em ambiente de produção.'
    );
  }

  admin = initializeApp({
    credential: cert(serviceAccount as any),
  });
}

export const adminDB = getFirestore(admin); 