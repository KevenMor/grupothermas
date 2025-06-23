import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_JSON
  ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON)
  : require('../config/firebase-service-account.json');

const admin = getApps().length
  ? getApps()[0]
  : initializeApp({
      credential: cert(serviceAccount as any),
    });

export const adminDB = getFirestore(admin); 