import { NextResponse } from 'next/server'
import { adminDB } from '@/lib/firebaseAdmin'
import { Chat } from '@/lib/models'

// GET /api/atendimento/chats
// Returns a list of all chats
export async function GET() {
  try {
    const conversationsSnapshot = await adminDB
      .collection('conversations')
      .orderBy('timestamp', 'desc')
      .get()

    if (conversationsSnapshot.empty) {
      return NextResponse.json([])
    }
    
    const chats: Chat[] = conversationsSnapshot.docs.map((doc: any) => {
      const data = doc.data()
      return {
        id: doc.id,
        customerName: data.customerName || 'Nome desconhecido',
        customerPhone: data.customerPhone || doc.id,
        customerAvatar: data.customerAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(data.customerName || 'C')}&background=random`,
        lastMessage: data.lastMessage || 'Nenhuma mensagem',
        timestamp: data.timestamp ? new Date(data.timestamp).toISOString() : new Date().toISOString(),
        unreadCount: data.unreadCount || 0,
        status: data.status || 'open',
        aiEnabled: data.aiEnabled !== undefined ? data.aiEnabled : true,
        aiPaused: data.aiPaused || false,
        conversationStatus: data.conversationStatus || 'waiting',
        assignedAgent: data.assignedAgent,
        pausedAt: data.pausedAt,
        pausedBy: data.pausedBy,
      }
    })

    return NextResponse.json(chats)

  } catch (error) {
    console.error('Erro ao buscar conversas:', error)
    if (error instanceof Error) {
      console.error('Stack trace:', error.stack)
    }
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error', stack: error instanceof Error ? error.stack : undefined },
      { status: 500 }
    )
  }
}

// POST /api/atendimento/chats
// Cria um novo contato/conversa manualmente
export async function POST(request: Request) {
  try {
    const { name, phone } = await request.json()
    if (!name || !phone) {
      return NextResponse.json({ error: 'Nome e telefone são obrigatórios.' }, { status: 400 })
    }
    const now = new Date().toISOString()
    await adminDB.collection('conversations').doc(phone).set({
      customerName: name,
      customerPhone: phone,
      customerAvatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`,
      lastMessage: 'Nenhuma mensagem',
      timestamp: now,
      unreadCount: 0,
      status: 'open',
      aiEnabled: true,
      aiPaused: false,
      conversationStatus: 'waiting',
    }, { merge: true })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao criar contato:', error)
    return NextResponse.json({ error: 'Erro ao criar contato.' }, { status: 500 })
  }
} 