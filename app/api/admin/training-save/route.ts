import { NextRequest, NextResponse } from 'next/server';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Inicializar Firebase Admin se não estiver inicializado
let db: any = null;

try {
  if (!getApps().length) {
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    
    if (serviceAccount) {
      try {
        initializeApp({
          credential: cert(JSON.parse(serviceAccount)),
          databaseURL: process.env.FIREBASE_DATABASE_URL
        });
        db = getFirestore();
      } catch (error) {
        console.error('Erro ao inicializar Firebase Admin:', error);
      }
    } else {
      console.log('FIREBASE_SERVICE_ACCOUNT_JSON não encontrado, usando configuração padrão');
    }
  } else {
    db = getFirestore();
  }
} catch (error) {
  console.error('Erro ao configurar Firebase:', error);
}

export async function POST(request: NextRequest) {
  try {
    // TODO: Implementar autenticação real
    // const session = await getServerSession(authOptions);
    // if (!session?.user) {
    //   return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    // }

    const body = await request.json();
    const { agent } = body;

    if (!agent) {
      return NextResponse.json(
        { error: 'Dados do agente são obrigatórios' },
        { status: 400 }
      );
    }

    if (!db) {
      return NextResponse.json(
        { error: 'Firebase não configurado. Configure FIREBASE_SERVICE_ACCOUNT_JSON no Railway.' },
        { status: 500 }
      );
    }

    // Preparar dados para salvar
    const trainingData = {
      ...agent,
      updatedAt: new Date().toISOString(),
      version: Date.now(), // Versionamento automático
      lastModifiedBy: 'admin', // TODO: Usar ID do usuário real
    };

    // Salvar no Firebase
    await db.collection('ai_training').doc('default').set(trainingData, { merge: true });

    // Criar log de versão
    await db.collection('ai_training_versions').add({
      agentId: 'default',
      data: trainingData,
      createdAt: new Date().toISOString(),
      createdBy: 'admin', // TODO: Usar ID do usuário real
      version: trainingData.version,
      description: `Atualização automática - ${new Date().toLocaleString('pt-BR')}`
    });

    // Criar log de atividade
    await db.collection('ai_training_logs').add({
      agentId: 'default',
      action: 'update',
      timestamp: new Date().toISOString(),
      user: 'admin', // TODO: Usar ID do usuário real
      changes: {
        fields: Object.keys(agent),
        summary: 'Atualização completa do treinamento'
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Treinamento salvo com sucesso',
      version: trainingData.version
    });

  } catch (error) {
    console.error('Erro ao salvar treinamento:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 