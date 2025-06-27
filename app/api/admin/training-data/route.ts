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

export async function GET(request: NextRequest) {
  try {
    // TODO: Implementar autenticação real
    // const session = await getServerSession(authOptions);
    // if (!session?.user) {
    //   return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    // }

    if (!db) {
      // Retornar dados padrão se Firebase não estiver configurado
      return NextResponse.json({
        agent: {
          id: 'default',
          name: 'Assistente Thermas',
          company: 'Grupo Thermas',
          description: 'Assistente virtual especializado em atendimento ao cliente',
          personality: 'Empático, profissional e eficiente',
          expertise: ['Atendimento ao Cliente', 'Vendas', 'Suporte Técnico'],
          trainingText: '',
          examples: [],
          rules: [],
          forbiddenPhrases: [],
          exceptions: [],
          alerts: [],
          actions: [],
          integrations: {},
          context: '',
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          openaiModel: 'gpt-4',
          openaiTemperature: 0.7,
          openaiMaxTokens: 1000
        }
      });
    }

    const trainingDoc = await db.collection('ai_training').doc('default').get();
    
    if (!trainingDoc.exists) {
      // Retornar dados padrão se não existir
      return NextResponse.json({
        agent: {
          id: 'default',
          name: 'Assistente Thermas',
          company: 'Grupo Thermas',
          description: 'Assistente virtual especializado em atendimento ao cliente',
          personality: 'Empático, profissional e eficiente',
          expertise: ['Atendimento ao Cliente', 'Vendas', 'Suporte Técnico'],
          trainingText: '',
          examples: [],
          rules: [],
          forbiddenPhrases: [],
          exceptions: [],
          alerts: [],
          actions: [],
          integrations: {},
          context: '',
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          openaiModel: 'gpt-4',
          openaiTemperature: 0.7,
          openaiMaxTokens: 1000
        }
      });
    }

    const data = trainingDoc.data();
    return NextResponse.json({ agent: data });

  } catch (error) {
    console.error('Erro ao carregar dados de treinamento:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 