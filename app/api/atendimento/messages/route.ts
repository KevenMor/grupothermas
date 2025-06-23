import { NextResponse, NextRequest } from 'next/server'
import { adminDB } from '@/lib/firebaseAdmin'
import { ChatMessage } from '@/lib/models'

// GET /api/atendimento/messages?chatId=[id]
// Returns all messages for a given chat
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const chatId = searchParams.get('chatId')

  if (!chatId) {
    return NextResponse.json({ error: 'Chat ID is required' }, { status: 400 })
  }

  try {
    const messagesSnapshot = await adminDB
      .collection('conversations')
      .doc(chatId)
      .collection('messages')
      .orderBy('timestamp', 'asc')
      .get()

    if (messagesSnapshot.empty) {
      return NextResponse.json([])
    }

    const messages: ChatMessage[] = messagesSnapshot.docs.map(doc => {
      const data = doc.data()
      return {
        id: doc.id,
        content: data.content,
        timestamp: new Date(data.timestamp).toISOString(),
        role: data.role,
        status: data.status || 'sent', // Default to sent for older messages
      }
    })

    return NextResponse.json(messages)
  } catch (error) {
    console.error(`Erro ao buscar mensagens para o chat ${chatId}:`, error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/atendimento/messages
// Sends a new message and adds it to a chat
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { chatId, content, phone } = body

    if (!chatId || !content || !phone) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // 1. Send message via Z-API
    const zapiResponse = await fetch(`https://api.z-api.io/instances/YOUR_INSTANCE_ID/token/YOUR_TOKEN/send-text`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            phone: phone,
            message: content,
        }),
    });

    if (!zapiResponse.ok) {
        throw new Error('Failed to send message via Z-API');
    }
    const zapiResult = await zapiResponse.json();

    // 2. Create message object to save in Firestore
    const newMessage: Partial<ChatMessage> = {
      content,
      timestamp: new Date().toISOString(),
      role: 'agent',
      status: 'sent', // Or 'delivered' depending on Z-API response
    }

    // 3. Save message to Firestore subcollection
    const messageRef = await adminDB
      .collection('conversations')
      .doc(chatId)
      .collection('messages')
      .add(newMessage)
      
    // 4. Update the parent conversation document
    await adminDB.collection('conversations').doc(chatId).update({
        lastMessage: content,
        timestamp: newMessage.timestamp
    });

    const savedMessage: ChatMessage = {
      id: messageRef.id,
      ...newMessage,
    } as ChatMessage

    return NextResponse.json(savedMessage, { status: 201 })

  } catch (error) {
    console.error('Erro ao enviar mensagem:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 