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
    
    const chats: Chat[] = conversationsSnapshot.docs.map(doc => {
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
      }
    })

    return NextResponse.json(chats)

  } catch (error) {
    console.error('Erro ao buscar conversas:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
} 