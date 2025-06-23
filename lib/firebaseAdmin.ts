import { cert, getApps, initializeApp } from "firebase-admin/app";
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

const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_JSON
  ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON)
  : require('../config/firebase-service-account.json');

const admin = getApps().length
  ? getApps()[0]
  : initializeApp({
      credential: cert(serviceAccount as any),
    });

export const adminDB = getFirestore(admin); 