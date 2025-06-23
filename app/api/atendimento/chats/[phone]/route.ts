import { NextResponse } from 'next/server'
import { adminDB } from '@/lib/firebaseAdmin'

export async function GET(
  request: Request,
  { params }: { params: { phone: string } }
) {
  try {
    const phone = params.phone
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
    console.error(`Erro ao buscar mensagens para ${params.phone}:`, error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
} 