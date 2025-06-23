import { NextResponse, NextRequest } from 'next/server'
import { adminDB } from '@/lib/firebaseAdmin'
import { ChatCustomer } from '@/lib/models'

export async function GET() {
  try {
    const conversationsSnapshot = await adminDB
      .collection('conversations')
      .orderBy('updatedAt', 'desc')
      .get()

    if (conversationsSnapshot.empty) {
      return NextResponse.json([])
    }

    const customers: ChatCustomer[] = conversationsSnapshot.docs.map(doc => {
      const data = doc.data()
      const lastMessage = data.messages && data.messages.length > 0
        ? data.messages[data.messages.length - 1]
        : { content: 'Nenhuma mensagem ainda', timestamp: data.updatedAt };

      return {
        id: doc.id, // phone number
        name: data.name || 'Nome desconhecido',
        phone: data.phone,
        email: data.email || '',
        lastMessage: lastMessage.content,
        timestamp: new Date(lastMessage.timestamp).toISOString(),
        status: data.status || 'waiting',
        unreadCount: data.unreadCount || 0,
        priority: data.priority || 'low',
        tags: data.tags || []
      }
    })

    return NextResponse.json(customers)

  } catch (error) {
    console.error('Erro ao buscar conversas:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { phone } = body

    if (!phone) {
      return NextResponse.json({ error: 'Phone number is required' }, { status: 400 })
    }

    const conversationDoc = await adminDB.collection('conversations').doc(phone).get()

    if (!conversationDoc.exists) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
    }

    const conversationData = conversationDoc.data()
    const messages = conversationData?.messages || []

    return NextResponse.json(messages)

  } catch (error) {
    console.error(`Erro ao buscar mensagens:`, error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
} 