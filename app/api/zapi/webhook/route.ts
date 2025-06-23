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

    // Z-API envia diferentes tipos de eventos; focamos em mensagens recebidas
    if (!body || body.fromMe || body.type !== 'ReceivedCallback') {
      console.log('Mensagem ignorada:', { 
        hasBody: !!body, 
        fromMe: body?.fromMe, 
        type: body?.type 
      })
      return NextResponse.json({ ignored: true })
    }

    console.log('Processando mensagem de entrada...')
    const {
      messageId,
      phone,
      momment,
      senderName,
      text,
      chatName
    } = body

    const content = text?.message || '[Mensagem sem texto]'
    const timestamp = momment ? new Date(momment).toISOString() : new Date().toISOString()
    
    console.log('Dados extraídos:', { phone, content, messageId, senderName })

    // Referência da conversa (documento por telefone)
    const conversationRef = adminDB.collection('conversations').doc(phone)

    // Garantir documento da conversa
    const convSnapshot = await conversationRef.get()
    if (!convSnapshot.exists) {
      await conversationRef.set({
        customerName: senderName || chatName || phone,
        customerPhone: phone,
        customerAvatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(senderName || chatName || phone)}&background=random`,
        lastMessage: content,
        timestamp,
        unreadCount: 0,
        status: 'open',
        source: 'zapi'
      })
    } else {
      await conversationRef.update({
        lastMessage: content,
        timestamp
      })
    }

    // Salvar na subcoleção messages
    const msg: Partial<ChatMessage> = {
      content,
      role: 'user',
      timestamp,
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