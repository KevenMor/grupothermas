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
    // Buscar versão ativa primeiro
    const activeRef = db.collection('flowcharts').doc('active');
    const activeDoc = await activeRef.get();

    let logs: any[] = [];

    if (activeDoc.exists) {
      const activeData = activeDoc.data();
      const currentVersionId = activeData?.currentVersion;

      if (currentVersionId) {
        // Buscar logs da versão ativa
        const logsRef = db.collection('flowcharts').doc(currentVersionId).collection('logs');
        const logsSnapshot = await logsRef.orderBy('timestamp', 'desc').limit(50).get();

        logsSnapshot.forEach((doc) => {
          logs.push({
            id: doc.id,
            ...doc.data()
          });
        });
      }
    }

    // Se não há logs da versão ativa, buscar logs gerais
    if (logs.length === 0) {
      // Buscar logs de todas as versões
      const versionsRef = db.collection('flowcharts');
      const versionsSnapshot = await versionsRef.get();

      for (const versionDoc of versionsSnapshot.docs) {
        if (versionDoc.id !== 'active') {
          const versionLogsRef = versionDoc.ref.collection('logs');
          const versionLogsSnapshot = await versionLogsRef.orderBy('timestamp', 'desc').limit(10).get();

          versionLogsSnapshot.forEach((logDoc) => {
            logs.push({
              id: logDoc.id,
              versionId: versionDoc.id,
              ...logDoc.data()
            });
          });
        }
      }

      // Ordenar todos os logs por timestamp
      logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      logs = logs.slice(0, 50); // Limitar a 50 logs mais recentes
    }

    return NextResponse.json({
      success: true,
      logs: logs,
      message: 'Logs carregados com sucesso'
    });

  } catch (error) {
    console.error('Erro ao carregar logs:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 