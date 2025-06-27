import { NextResponse } from 'next/server';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Inicializar Firebase Admin se não estiver inicializado
if (!getApps().length) {
  try {
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    
    if (serviceAccount) {
      initializeApp({
        credential: cert(JSON.parse(serviceAccount)),
        databaseURL: process.env.FIREBASE_DATABASE_URL
      });
    } else {
      console.warn('FIREBASE_SERVICE_ACCOUNT_JSON não encontrado, usando configuração padrão');
      initializeApp({
        projectId: process.env.FIREBASE_PROJECT_ID,
        databaseURL: process.env.FIREBASE_DATABASE_URL
      });
    }
  } catch (error) {
    console.error('Erro ao inicializar Firebase Admin:', error);
  }
}

const db = getFirestore();

export async function GET() {
  try {
    // Buscar todas as versões
    const versionsRef = db.collection('flowcharts');
    const versionsSnapshot = await versionsRef.get();

    const versions: any[] = [];
    versionsSnapshot.forEach((doc) => {
      if (doc.id !== 'active') { // Excluir documento de controle
        versions.push({
          id: doc.id,
          ...doc.data()
        });
      }
    });

    // Ordenar por data de criação (mais recente primeiro)
    versions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json({
      success: true,
      versions: versions,
      message: 'Versões carregadas com sucesso'
    });

  } catch (error) {
    console.error('Erro ao carregar versões:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 