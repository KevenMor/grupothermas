import { NextResponse, NextRequest } from 'next/server'
import { adminDB } from '@/lib/firebaseAdmin'
import { ChatMessage } from '@/lib/models'
import { replyMessage, sendTextMessage } from '@/lib/zapi'

// Garantir que a rota use o runtime Node.js (acesso a process.env)
export const runtime = 'nodejs'

// Sanitizar o conteúdo para remover prefixo *Nome:*
function sanitizeContent(content: string) {
  if (!content) return '';
  return content.replace(/^\*[^*]+:\*\s*\n?/, '').trim();
}

// GET /api/atendimento/messages?chatId=[id]
// Returns all messages for a given chat
export async function GET(request: NextRequest) {
  let chatId: string | null = null;
  try {
    const { searchParams } = new URL(request.url)
    chatId = searchParams.get('chatId')
    const since = searchParams.get('since') // Novo parâmetro para otimização

    if (!chatId) {
      return NextResponse.json({ error: 'chatId is required' }, { status: 400 })
    }

    console.log(`Buscando mensagens para chat ${chatId}${since ? ` desde ${since}` : ''}`)

    const messagesRef = adminDB.collection('conversations').doc(chatId).collection('messages')
    
    let query = messagesRef.orderBy('timestamp', 'asc')
    
    // Se há timestamp 'since', filtrar apenas mensagens mais recentes
    if (since) {
      try {
        const sinceDate = new Date(since)
        if (!isNaN(sinceDate.getTime())) {
          query = query.where('timestamp', '>', sinceDate.toISOString())
          console.log(`Filtrando mensagens após: ${sinceDate.toISOString()}`)
        }
      } catch (error) {
        console.warn('Timestamp "since" inválido, ignorando filtro:', since)
      }
    }

    const messagesSnapshot = await query.get()
    const messages: any[] = []

    console.log(`Encontradas ${messagesSnapshot.docs.length} mensagens${since ? ' novas' : ''}`)

    for (const doc of messagesSnapshot.docs) {
      try {
        const data = doc.data()
        // Filtrar mensagens que não pertencem ao chatId
        if (data.chatId && data.chatId !== chatId) continue;
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
          userName: data.userName,
          agentId: data.agentId,
          agentName: data.agentName,
          mediaType: data.mediaType,
          mediaUrl: data.mediaUrl,
          mediaInfo: data.mediaInfo,
          replyTo: data.replyTo,
          origin: data.origin || 'unknown',
          fromMe: data.fromMe || false,
          chatId: data.chatId || chatId,
          customerPhone: data.customerPhone || chatId
        })
      } catch (err) {
        console.error('Erro ao mapear mensagem', doc.id, err)
      }
    }

    console.log(`Total de mensagens válidas carregadas: ${messages.length}`)
    return NextResponse.json(messages)
    
  } catch (error) {
    console.error(`Erro ao buscar mensagens para o chat ${chatId || 'desconhecido'}:`, error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/atendimento/messages
// Sends a new message and adds it to a chat
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('POST /api/atendimento/messages - Body recebido:', body)
    const { chatId, content, phone, userName, agentId, replyTo } = body

    if (!chatId || !content || !phone) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Verificar se a conversa existe
    const conversationDoc = await adminDB.collection('conversations').doc(chatId).get()
    if (!conversationDoc.exists) {
      return NextResponse.json({ error: 'Conversa não encontrada' }, { status: 404 })
    }

    // Preparar objeto de mensagem com status inicial "sending"
    const baseMessage: Partial<ChatMessage> = {
      content: sanitizeContent(content),
      timestamp: new Date().toISOString(),
      role: 'agent',
      status: 'sending',
      userName: userName || 'Atendente',
      agentId: agentId,
      agentName: userName || 'Atendente',
      chatId: chatId, // Garantir que o chatId está correto
      origin: 'panel', // Marcar origem como painel
      fromMe: true, // Marcar como enviada pelo painel
      ...(replyTo ? { replyTo } : {})
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
      let zapiResult;
      // Verificar se é uma resposta ou mensagem normal
      if (replyTo && replyTo.id) {
        console.log('Enviando resposta via Z-API para mensagem:', replyTo.id);
        // Enviar como resposta
        zapiResult = await replyMessage(
          phone, 
          replyTo.id, // quotedMsgId
          content, 
          userName || 'Atendente'
        );
      } else {
        console.log('Enviando mensagem normal via Z-API');
        // Enviar como mensagem normal
        zapiResult = await sendTextMessage(
          phone, 
          content, 
          userName || 'Atendente'
        );
      }
      if (!zapiResult.success) {
        throw new Error(zapiResult.error || 'Erro ao enviar mensagem via Z-API');
      }
      // Salvar messageId da Z-API para poder excluir depois
      await messageRef.update({ 
        status: 'sent',
        zapiMessageId: zapiResult.messageId || null
      });
    } catch (err) {
      console.error('Falha ao enviar via Z-API:', err)
      await updateStatus('failed')
      return NextResponse.json({ error: (err as Error).message || 'Erro ao enviar mensagem via Z-API' }, { status: 500 })
    }

    // Atualizar documento pai com último conteúdo mesmo em caso de falha
    await adminDB.collection('conversations').doc(chatId).set({
      lastMessage: sanitizeContent(content),
      timestamp: baseMessage.timestamp,
      customerPhone: phone,
      unreadCount: 0 // Reset unread count when agent sends message
    }, { merge: true })

    const savedData = (await messageRef.get()).data() as Omit<ChatMessage, 'id'>
    const savedMessage: ChatMessage = { id: messageRef.id, ...savedData }

    return NextResponse.json(savedMessage, { status: 201 })

  } catch (error) {
    console.error('Erro ao enviar mensagem:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 