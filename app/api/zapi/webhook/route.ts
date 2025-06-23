import { NextRequest, NextResponse } from 'next/server'
import { adminDB } from '@/lib/firebaseAdmin'
import { ChatMessage } from '@/lib/models'

// Recebe eventos enviados pela Z-API (https://developer.z-api.io/en/webhooks)
// Configure no painel da instância a URL: https://SEU_DOMINIO/api/zapi/webhook
export async function POST(request: NextRequest) {
  try {
    console.log('=== WEBHOOK Z-API RECEBIDO ===')
    console.log('Headers:', Object.fromEntries(request.headers.entries()))
    
    const body = await request.json()
    console.log('Body completo:', JSON.stringify(body, null, 2))

    // Z-API envia diferentes tipos de eventos; focamos em mensagens
    if (!body || !body.message || body.message.fromMe) {
      console.log('Mensagem ignorada:', { hasBody: !!body, hasMessage: !!body?.message, fromMe: body?.message?.fromMe })
      // Ignorar mensagens enviadas por nós mesmos ou payloads sem conteúdo
      return NextResponse.json({ ignored: true })
    }

    console.log('Processando mensagem de entrada...')
    const {
      messageId,
      chatId,
      type,
      timestamp,
      senderName,
      text,
    } = body.message

    const phone = chatId?.split('@')[0] || body.message.phone || 'unknown'
    const content = type === 'text' ? text?.message : `[${type} não suportado]`
    
    console.log('Dados extraídos:', { phone, content, type, messageId })

    // Referência da conversa (documento por telefone)
    const conversationRef = adminDB.collection('conversations').doc(phone)

    // Garantir documento da conversa
    const convSnapshot = await conversationRef.get()
    if (!convSnapshot.exists) {
      await conversationRef.set({
        customerName: senderName || phone,
        customerPhone: phone,
        customerAvatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(senderName || phone)}&background=random`,
        lastMessage: content,
        timestamp: new Date(timestamp * 1000).toISOString(),
        unreadCount: 0,
        status: 'open',
        source: 'zapi'
      })
    } else {
      await conversationRef.update({
        lastMessage: content,
        timestamp: new Date(timestamp * 1000).toISOString()
      })
    }

    // Salvar na subcoleção messages
    const msg: Partial<ChatMessage> = {
      content,
      role: 'user',
      timestamp: new Date(timestamp * 1000).toISOString(),
      status: 'sent'
    }
    await conversationRef.collection('messages').doc(messageId).set(msg)

    console.log('Mensagem salva com sucesso no Firestore')
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro webhook Z-API:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
} 