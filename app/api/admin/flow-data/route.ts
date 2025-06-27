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
    // Buscar versão ativa
    const activeRef = db.collection('flowcharts').doc('active');
    const activeDoc = await activeRef.get();

    if (!activeDoc.exists) {
      return NextResponse.json({
        success: true,
        blocks: [],
        agent: {
          id: 'default',
          name: 'Assistente Thermas',
          company: 'Grupo Thermas',
          description: 'Assistente virtual especializado em atendimento ao cliente',
          personality: 'Empático, profissional e eficiente',
          expertise: ['Atendimento ao Cliente', 'Vendas', 'Suporte Técnico'],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          isActive: true
        },
        currentVersion: null,
        message: 'Nenhuma versão ativa encontrada'
      });
    }

    const activeData = activeDoc.data();
    const currentVersionId = activeData?.currentVersion;

    if (!currentVersionId) {
      return NextResponse.json({
        success: true,
        blocks: [],
        agent: activeData?.agent || {
          id: 'default',
          name: 'Assistente Thermas',
          company: 'Grupo Thermas',
          description: 'Assistente virtual especializado em atendimento ao cliente',
          personality: 'Empático, profissional e eficiente',
          expertise: ['Atendimento ao Cliente', 'Vendas', 'Suporte Técnico'],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          isActive: true
        },
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
        blocks: [],
        agent: activeData?.agent || {
          id: 'default',
          name: 'Assistente Thermas',
          company: 'Grupo Thermas',
          description: 'Assistente virtual especializado em atendimento ao cliente',
          personality: 'Empático, profissional e eficiente',
          expertise: ['Atendimento ao Cliente', 'Vendas', 'Suporte Técnico'],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          isActive: true
        },
        currentVersion: null,
        message: 'Versão ativa não encontrada'
      });
    }

    const versionData = versionDoc.data();

    return NextResponse.json({
      success: true,
      blocks: versionData?.blocks || [],
      agent: versionData?.agent || activeData?.agent,
      currentVersion: versionData,
      message: 'Dados carregados com sucesso'
    });

  } catch (error) {
    console.error('Erro ao carregar dados do fluxo:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 