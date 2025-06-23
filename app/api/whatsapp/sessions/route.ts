import { NextRequest, NextResponse } from 'next/server'
import { adminDB } from '@/lib/firebaseAdmin'

export async function GET() {
  try {
    const sessionsRef = adminDB.collection('whatsapp_sessions')
    const snapshot = await sessionsRef.get()
    
    const sessions = snapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data(),
      lastActivity: doc.data().lastActivity?.toDate(),
      createdAt: doc.data().createdAt?.toDate()
    }))

    return NextResponse.json({ sessions })
  } catch (error) {
    console.error('Erro ao buscar sessões:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name } = await request.json()

    if (!name) {
      return NextResponse.json(
        { error: 'Nome da sessão é obrigatório' },
        { status: 400 }
      )
    }

    const sessionId = `session_${Date.now()}`
    const sessionData = {
      name,
      status: 'disconnected',
      messagesCount: 0,
      aiEnabled: false,
      createdAt: new Date(),
      lastActivity: new Date()
    }

    await adminDB.collection('whatsapp_sessions').doc(sessionId).set(sessionData)

    return NextResponse.json({
      id: sessionId,
      ...sessionData
    })
  } catch (error) {
    console.error('Erro ao criar sessão:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
} 