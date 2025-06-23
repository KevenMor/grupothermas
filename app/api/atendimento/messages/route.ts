import { NextResponse, NextRequest } from 'next/server'
import { adminDB } from '@/lib/firebaseAdmin'

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