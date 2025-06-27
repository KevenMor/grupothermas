import { NextRequest, NextResponse } from 'next/server';
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { blocks, agent, version, isPublish } = body;

    // Validar dados obrigatórios
    if (!blocks || !agent) {
      return NextResponse.json(
        { error: 'Dados obrigatórios não fornecidos' },
        { status: 400 }
      );
    }

    // Gerar ID da versão se não existir
    const versionId = version?.id || `version-${Date.now()}`;
    const versionNumber = version?.version || '1.0.0';

    // Criar objeto da versão
    const flowVersion = {
      id: versionId,
      version: versionNumber,
      name: version?.name || `Versão ${versionNumber}`,
      description: version?.description || 'Versão automática',
      blocks: blocks,
      agent: agent,
      createdAt: version?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: 'admin', // TODO: Pegar do contexto de autenticação
      isPublished: isPublish || false
    };

    // Salvar no Firestore
    const flowRef = db.collection('flowcharts').doc(versionId);
    await flowRef.set(flowVersion);

    // Se for publicação, marcar como versão ativa
    if (isPublish) {
      const activeRef = db.collection('flowcharts').doc('active');
      await activeRef.set({
        currentVersion: versionId,
        lastPublished: new Date().toISOString(),
        agent: agent
      });
    }

    // Criar log da ação
    const logRef = db.collection('flowcharts').doc(versionId).collection('logs').doc();
    await logRef.set({
      id: logRef.id,
      action: isPublish ? 'publish' : 'update',
      version: versionNumber,
      timestamp: new Date().toISOString(),
      user: 'admin', // TODO: Pegar do contexto de autenticação
      details: isPublish ? 'Fluxo publicado' : 'Fluxo atualizado'
    });

    return NextResponse.json({
      success: true,
      version: flowVersion,
      message: isPublish ? 'Fluxo publicado com sucesso!' : 'Fluxo salvo com sucesso!'
    });

  } catch (error) {
    console.error('Erro ao salvar fluxo:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    // Buscar versão ativa
    const activeRef = db.collection('flowcharts').doc('active');
    const activeDoc = await activeRef.get();

    if (!activeDoc.exists) {
      return NextResponse.json({
        success: true,
        currentVersion: null,
        message: 'Nenhuma versão ativa encontrada'
      });
    }

    const activeData = activeDoc.data();
    const currentVersionId = activeData?.currentVersion;

    if (!currentVersionId) {
      return NextResponse.json({
        success: true,
        currentVersion: null,
        message: 'Nenhuma versão ativa encontrada'
      });
    }

    // Buscar dados da versão ativa
    const versionRef = db.collection('flowcharts').doc(currentVersionId);
    const versionDoc = await versionRef.get();

    if (!versionDoc.exists) {
      return NextResponse.json({
        success: true,
        currentVersion: null,
        message: 'Versão ativa não encontrada'
      });
    }

    return NextResponse.json({
      success: true,
      currentVersion: versionDoc.data(),
      message: 'Versão ativa carregada com sucesso'
    });

  } catch (error) {
    console.error('Erro ao carregar fluxo:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 