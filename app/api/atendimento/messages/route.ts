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

    const messages: ChatMessage[] = []
    for (const doc of messagesSnapshot.docs) {
      try {
        const data = doc.data()
        let isoTimestamp: string
        const rawTs = data.timestamp
        if (!rawTs) {
          isoTimestamp = new Date().toISOString()
        } else if (typeof rawTs === 'string') {
          const parsed = new Date(rawTs)
          isoTimestamp = isNaN(parsed.valueOf()) ? new Date().toISOString() : parsed.toISOString()
        } else if (typeof rawTs === 'object' && typeof rawTs.toDate === 'function') {
          isoTimestamp = rawTs.toDate().toISOString()
        } else {
          const parsed = new Date(rawTs)
          isoTimestamp = isNaN(parsed.valueOf()) ? new Date().toISOString() : parsed.toISOString()
        }

        messages.push({
          id: doc.id,
          content: data.content || '',
          timestamp: isoTimestamp,
          role: data.role || data.sender || 'user',
          status: data.status || 'sent',
          // Incluir informações do agente se disponíveis
          userName: data.userName,
          agentId: data.agentId,
          agentName: data.agentName,
          // Incluir informações de mídia se disponíveis
          mediaType: data.mediaType,
          mediaUrl: data.mediaUrl,
          mediaInfo: data.mediaInfo
        })
      } catch (err) {
        console.error('Erro ao mapear mensagem', doc.id, err)
      }
    }

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
    const { chatId, content, phone, userName, agentId, replyTo, replyToContent } = body

    if (!chatId || !content || !phone) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Preparar objeto de mensagem com status inicial "sending"
    const baseMessage: Partial<ChatMessage> = {
      content,
      timestamp: new Date().toISOString(),
      role: 'agent',
      status: 'sending',
      userName: userName || 'Atendente',
      agentId: agentId,
      agentName: userName || 'Atendente',
      ...(replyTo ? { replyTo, replyToContent } : {})
    }

    // Salvar primeiro para garantir persistência mesmo se Z-API falhar
    const messageRef = await adminDB
      .collection('conversations')
      .doc(chatId)
      .collection('messages')
      .add(baseMessage)

    // Função auxiliar para atualizar status
    const updateStatus = async (status: ChatMessage['status']) => {
      await messageRef.update({ status })
    }

    try {
      // Buscar configurações da Z-API do Firebase
      const configDoc = await adminDB.collection('admin_config').doc('ai_settings').get()
      
      if (!configDoc.exists) {
        throw new Error('Configurações não encontradas no Firebase')
      }

      const config = configDoc.data()!

      if (!config.zapiApiKey || !config.zapiInstanceId) {
        throw new Error('Z-API não configurada no Admin IA')
      }

      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (config.zapiClientToken && config.zapiClientToken.trim()) {
        headers['Client-Token'] = config.zapiClientToken.trim()
      }

      // Incluir nome do atendente na mensagem para o cliente
      const agentName = userName || 'Atendente'
      const messageWithAgent = `*${agentName}:*\n${content}`

      const zapiResponse = await fetch(`https://api.z-api.io/instances/${config.zapiInstanceId}/token/${config.zapiApiKey}/send-text`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ phone, message: messageWithAgent })
      })

      if (!zapiResponse.ok) {
        const errorText = await zapiResponse.text()
        throw new Error(`Erro Z-API: ${errorText}`)
      }

      const zapiResult = await zapiResponse.json()
      
      // Salvar messageId da Z-API para poder excluir depois
      await messageRef.update({ 
        status: 'sent',
        zapiMessageId: zapiResult.messageId || null
      })
    } catch (err) {
      console.error('Falha ao enviar via Z-API:', err)
      await updateStatus('failed')
      return NextResponse.json({ error: (err as Error).message || 'Erro ao enviar mensagem via Z-API' }, { status: 500 })
    }

    // Atualizar documento pai com último conteúdo mesmo em caso de falha
    await adminDB.collection('conversations').doc(chatId).set({
      lastMessage: content,
      timestamp: baseMessage.timestamp,
      customerPhone: phone
    }, { merge: true })

    const savedData = (await messageRef.get()).data() as Omit<ChatMessage, 'id'>
    const savedMessage: ChatMessage = { id: messageRef.id, ...savedData }

    return NextResponse.json(savedMessage, { status: 201 })

  } catch (error) {
    console.error('Erro ao enviar mensagem:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 