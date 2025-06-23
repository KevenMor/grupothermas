import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import serviceAccount from "../config/firebase-service-account.json";

const admin = getApps().length
  ? getApps()[0]
  : initializeApp({
      credential: cert(serviceAccount as any),
    });

export const adminDB = getFirestore(admin); 