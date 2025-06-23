import { NextResponse, NextRequest } from 'next/server'
import { adminDB } from '@/lib/firebaseAdmin'
import { ChatMessage } from '@/lib/models'

// Garantir que a rota use o runtime Node.js (acesso a process.env)
export const runtime = 'nodejs'

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
    const zapiInstanceId = process.env.ZAPI_INSTANCE_ID
    const zapiToken = process.env.ZAPI_TOKEN
    if (!zapiInstanceId || !zapiToken) {
      return NextResponse.json({ error: 'Z-API não configurada. Verifique as variáveis de ambiente.' }, { status: 500 })
    }

    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    if (process.env.ZAPI_CLIENT_TOKEN) {
      headers['Client-Token'] = process.env.ZAPI_CLIENT_TOKEN
    }

    const zapiResponse = await fetch(`https://api.z-api.io/instances/${zapiInstanceId}/token/${zapiToken}/send-text`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
            phone: phone,
            message: content,
        }),
    });

    if (!zapiResponse.ok) {
        const errorText = await zapiResponse.text();
        console.error('Erro Z-API:', errorText);
        return NextResponse.json({ error: 'Erro ao enviar mensagem via Z-API', details: errorText }, { status: 500 });
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