import { NextRequest, NextResponse } from 'next/server'
import { adminDB } from '@/lib/firebaseAdmin'

export async function GET(
  request: NextRequest,
  context: { params: any }
) {
  try {
    const { sessionId } = context.params
    const { searchParams } = new URL(request.url)
    const contact = searchParams.get('contact')
    const limit = parseInt(searchParams.get('limit') || '50')

    let query = adminDB
      .collection('whatsapp_messages')
      .where('sessionId', '==', sessionId)
      .orderBy('timestamp', 'desc')
      .limit(limit)

    if (contact) {
      query = query.where('from', '==', contact)
    }

    const snapshot = await query.get()
    
    const messages = snapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp?.toDate(),
    }))

    return NextResponse.json({ messages: messages.reverse() })
  } catch (error) {
    console.error('Erro ao buscar mensagens:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  context: { params: any }
) {
  try {
    const { sessionId } = context.params
    const { to, message, type = 'text' } = await request.json()

    if (!to || !message) {
      return NextResponse.json(
        { error: 'Destinatário e mensagem são obrigatórios' },
        { status: 400 }
      )
    }

    // Aqui você pode integrar com o WhatsAppManager para enviar a mensagem
    // Por enquanto, vamos apenas salvar no banco
    const messageData = {
      sessionId: sessionId,
      from: 'system', // Será substituído pelo número da sessão
      to,
      body: message,
      type,
      timestamp: new Date(),
      fromMe: true,
      status: 'sent'
    }

    const docRef = await adminDB.collection('whatsapp_messages').add(messageData)

    return NextResponse.json({
      id: docRef.id,
      ...messageData
    })
  } catch (error) {
    console.error('Erro ao enviar mensagem:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
} 