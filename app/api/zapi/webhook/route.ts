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
    if (!body || body.fromMe) {
      console.log('Mensagem ignorada:', { 
        hasBody: !!body, 
        fromMe: body?.fromMe, 
        type: body?.type 
      })
      return NextResponse.json({ ignored: true })
    }

    // Aceitar apenas mensagens recebidas de clientes
    if (body.type !== 'ReceivedCallback') {
      console.log('Não é uma mensagem recebida do cliente:', { 
        type: body?.type,
        fromMe: body?.fromMe
      })
      return NextResponse.json({ ignored: true })
    }

    // Verificar se já processamos esta mensagem (evitar duplicatas)
    if (body.messageId) {
      const conversationRef = adminDB.collection('conversations').doc(body.phone)
      const existingMessage = await conversationRef.collection('messages').doc(body.messageId).get()
      
      if (existingMessage.exists) {
        console.log('Mensagem já processada:', body.messageId)
        return NextResponse.json({ ignored: true, reason: 'already_processed' })
      }
    }

    console.log('Processando mensagem de entrada...')
    console.log('Estrutura completa do body:', JSON.stringify(body, null, 2))
    
    const {
      messageId,
      phone,
      momment,
      senderName,
      text,
      chatName
    } = body

    // Processar diferentes tipos de conteúdo
    let content = ''
    let mediaInfo = null

    console.log('Verificando tipos de conteúdo:', {
      hasText: !!text?.message,
      hasImage: !!body.image,
      hasAudio: !!body.audio,
      hasVideo: !!body.video,
      hasDocument: !!body.document,
      hasContact: !!body.contact,
      hasLocation: !!body.location
    })

    if (text?.message) {
      content = text.message
      console.log('Processando texto:', content)
    } else if (body.image) {
      console.log('Processando imagem:', body.image)
      content = `📷 Imagem enviada${body.image.caption ? `: ${body.image.caption}` : ''}`
      mediaInfo = {
        type: 'image',
        url: body.image.imageUrl,
        caption: body.image.caption,
        mimeType: body.image.mimeType
      }
      // Usar URL local para proxy de mídia
      if (body.image.imageUrl) {
        mediaInfo.url = `/api/media/${encodeURIComponent(body.image.imageUrl)}`
      }
    } else if (body.audio) {
      console.log('Processando áudio:', body.audio)
      content = '🎤 Áudio enviado'
      mediaInfo = {
        type: 'audio',
        url: body.audio.audioUrl,
        mimeType: body.audio.mimeType
      }
      // Usar URL local para proxy de mídia
      if (body.audio.audioUrl) {
        mediaInfo.url = `/api/media/${encodeURIComponent(body.audio.audioUrl)}`
      }
    } else if (body.video) {
      console.log('Processando vídeo:', body.video)
      content = `🎬 Vídeo enviado${body.video.caption ? `: ${body.video.caption}` : ''}`
      mediaInfo = {
        type: 'video',
        url: body.video.videoUrl,
        caption: body.video.caption,
        mimeType: body.video.mimeType
      }
      // Usar URL local para proxy de mídia
      if (body.video.videoUrl) {
        mediaInfo.url = `/api/media/${encodeURIComponent(body.video.videoUrl)}`
      }
    } else if (body.document) {
      console.log('Processando documento:', body.document)
      content = `📄 Documento enviado: ${body.document.title || 'arquivo'}`
      mediaInfo = {
        type: 'document',
        url: body.document.documentUrl,
        title: body.document.title,
        mimeType: body.document.mimeType
      }
      // Usar URL local para proxy de mídia
      if (body.document.documentUrl) {
        mediaInfo.url = `/api/media/${encodeURIComponent(body.document.documentUrl)}`
      }
    } else if (body.contact) {
      content = `👤 Contato compartilhado: ${body.contact.displayName}`
      mediaInfo = {
        type: 'contact',
        displayName: body.contact.displayName,
        vcard: body.contact.vcard
      }
    } else if (body.location) {
      content = `📍 Localização compartilhada${body.location.address ? `: ${body.location.address}` : ''}`
      mediaInfo = {
        type: 'location',
        latitude: body.location.latitude,
        longitude: body.location.longitude,
        address: body.location.address
      }
    } else {
      content = '[Mensagem sem texto]'
    }
    const timestamp = momment ? new Date(momment).toISOString() : new Date().toISOString()
    
    console.log('Dados extraídos:', { phone, content, messageId, senderName })

    // Referência da conversa (documento por telefone)
    const conversationRef = adminDB.collection('conversations').doc(phone)

    // Garantir documento da conversa
    const convSnapshot = await conversationRef.get()
    let conversationData = null
    
    if (!convSnapshot.exists) {
      console.log('Criando nova conversa para:', phone)
      await conversationRef.set({
        customerName: senderName || chatName || phone,
        customerPhone: phone,
        customerAvatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(senderName || chatName || phone)}&background=random`,
        lastMessage: content,
        timestamp,
        unreadCount: 0,
        status: 'open',
        source: 'zapi',
        // Campos padrão de controle de IA
        aiEnabled: true,
        aiPaused: false,
        conversationStatus: 'ai_active', // Nova conversa inicia com IA ativa
      })
      conversationData = { conversationStatus: 'ai_active' }
    } else {
      conversationData = convSnapshot.data()
      const currentStatus = conversationData?.conversationStatus
      
      // Se a conversa estava resolvida e o cliente enviou nova mensagem, reabrir para IA
      if (currentStatus === 'resolved') {
        console.log('Reabrindo conversa resolvida para IA ativa')
        await conversationRef.update({
          lastMessage: content,
          timestamp,
          aiEnabled: true,
          aiPaused: false,
          conversationStatus: 'ai_active',
          // Limpar campos de resolução
          resolvedAt: null,
          resolvedBy: null,
          // Incrementar unread count se necessário
          unreadCount: (conversationData.unreadCount || 0) + 1
        })
        conversationData = { ...conversationData, conversationStatus: 'ai_active' }
      } else {
        await conversationRef.update({
          lastMessage: content,
          timestamp
        })
      }
    }

    // Salvar na subcoleção messages
    const msg: Partial<ChatMessage> = {
      content,
      role: 'user',
      timestamp,
      status: 'sent',
      // Adicionar informações de mídia se houver
      ...(mediaInfo && { 
        mediaType: mediaInfo.type as 'image' | 'audio' | 'video' | 'document' | 'contact' | 'location',
        mediaUrl: mediaInfo.url,
        mediaInfo: mediaInfo 
      })
    }
    await conversationRef.collection('messages').doc(messageId).set(msg)

    console.log('Mensagem salva com sucesso no Firestore')

    // Chamar IA automaticamente se a conversa estiver ativa para IA
    const finalConversationData = conversationData || convSnapshot.data()
    
    if (finalConversationData && (finalConversationData.conversationStatus === 'waiting' || finalConversationData.conversationStatus === 'ai_active')) {
      console.log('Chamando IA para responder automaticamente...')
      
      try {
        // Chamar API da IA
        const aiResponse = await fetch(`${process.env.NEXTAUTH_URL || 'https://app.grupothermas.com.br'}/api/ai/chat`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            chatId: phone,
            customerMessage: content,
            customerName: senderName || chatName || phone
          })
        })

        if (aiResponse.ok) {
          const aiResult = await aiResponse.json()
          console.log('IA respondeu:', aiResult.aiMessage)
        } else {
          console.error('Erro ao chamar IA:', await aiResponse.text())
        }
      } catch (error) {
        console.error('Erro ao processar resposta da IA:', error)
      }
    } else {
      console.log('IA não está ativa para esta conversa, status:', finalConversationData?.conversationStatus)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro webhook Z-API:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
} 