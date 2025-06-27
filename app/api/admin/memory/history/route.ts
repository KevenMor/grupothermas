import { NextRequest, NextResponse } from 'next/server';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Inicializar Firebase Admin se não estiver inicializado
let db: any = null;
try {
  if (!getApps().length) {
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    if (serviceAccount) {
      initializeApp({
        credential: cert(JSON.parse(serviceAccount)),
        databaseURL: process.env.FIREBASE_DATABASE_URL
      });
      db = getFirestore();
    } else {
      console.log('FIREBASE_SERVICE_ACCOUNT_JSON não encontrado, usando configuração padrão');
    }
  } else {
    db = getFirestore();
  }
} catch (error) {
  console.error('Erro ao configurar Firebase:', error);
}

// GET: Buscar histórico por clientId
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('clientId');
    if (!clientId) {
      return NextResponse.json({ error: 'clientId é obrigatório' }, { status: 400 });
    }
    if (!db) {
      return NextResponse.json({ error: 'Firebase não configurado' }, { status: 500 });
    }
    const snapshot = await db.collection('ai_memory').doc(clientId).collection('history').orderBy('timestamp').get();
    const history = snapshot.docs.map((doc: FirebaseFirestore.QueryDocumentSnapshot) => doc.data());
    return NextResponse.json({ history });
  } catch (error) {
    console.error('Erro ao buscar histórico:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

// POST: Adicionar mensagem ao histórico
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { clientId, message } = body;
    if (!clientId || !message) {
      return NextResponse.json({ error: 'clientId e message são obrigatórios' }, { status: 400 });
    }
    if (!db) {
      return NextResponse.json({ error: 'Firebase não configurado' }, { status: 500 });
    }
    const ref = db.collection('ai_memory').doc(clientId).collection('history');
    await ref.add({ ...message, timestamp: new Date().toISOString() });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao adicionar mensagem ao histórico:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

// DELETE: Resetar histórico por clientId
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('clientId');
    if (!clientId) {
      return NextResponse.json({ error: 'clientId é obrigatório' }, { status: 400 });
    }
    if (!db) {
      return NextResponse.json({ error: 'Firebase não configurado' }, { status: 500 });
    }
    const ref = db.collection('ai_memory').doc(clientId).collection('history');
    const snapshot = await ref.get();
    const batch = db.batch();
    snapshot.docs.forEach((doc: FirebaseFirestore.QueryDocumentSnapshot) => batch.delete(doc.ref));
    await batch.commit();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao resetar histórico:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
} 