import { NextRequest, NextResponse } from 'next/server'
import { adminDB } from '@/lib/firebaseAdmin'
import { ChatMessage, Reaction } from '@/lib/models'
import { downloadAndSaveMedia, isFirebaseStorageUrl } from '@/lib/mediaUpload'

// Adicionar no topo do arquivo:
const recentReactionLogs = new Map<string, number>() // chave: messageId+reaction, valor: timestamp
const REACTION_LOG_THROTTLE_MS = 5000 // 5 segundos

// Recebe eventos enviados pela Z-API (https://developer.z-api.io/en/webhooks)
// Configure no painel da instância a URL: https://SEU_DOMINIO/api/zapi/webhook
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    console.log('=== WEBHOOK Z-API RECEBIDO ===')
    console.log('Body completo:', JSON.stringify(body, null, 2))

    // Validações básicas
    if (!body.phone || !body.messageId) {
      console.error('Dados obrigatórios ausentes:', { phone: body.phone, messageId: body.messageId })
      return NextResponse.json({ error: 'Phone e messageId são obrigatórios' }, { status: 400 })
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
      chatName,
      fromMe
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
      hasLocation: !!body.location,
      hasReaction: !!body.reaction
    })

    // Referência da conversa (documento por telefone)
    const conversationRef = adminDB.collection('conversations').doc(phone)
    const conversationDoc = await conversationRef.get()
    
    let conversationData = null
    let replyToFirestoreId = null
    let replyToContent = null
    let replyToSender = null

    if (text?.message) {
      content = text.message
      console.log('Processando texto:', content)
    } else if (body.reaction) {
      // Controle de logs repetidos
      const reactionData = body.reaction
      const targetMessageId = reactionData.messageId
      const reactionEmoji = reactionData.reaction
      const reactionLogKey = `${targetMessageId || ''}_${reactionEmoji || ''}`
      const now = Date.now()
      if (recentReactionLogs.has(reactionLogKey)) {
        const lastLog = recentReactionLogs.get(reactionLogKey) || 0
        if (now - lastLog < REACTION_LOG_THROTTLE_MS) {
          // Ignorar log repetido
        } else {
          recentReactionLogs.set(reactionLogKey, now)
          console.log('Processando reação:', body.reaction)
        }
      } else {
        recentReactionLogs.set(reactionLogKey, now)
        console.log('Processando reação:', body.reaction)
      }
      
      // Processar reação de mensagem
      const isReactionRemoved = reactionData.reaction === ''
      
      console.log('Dados da reação:', {
        targetMessageId,
        reactionEmoji,
        isReactionRemoved,
        fromMe: fromMe
      })
      
      // Buscar a mensagem alvo da reação
      if (targetMessageId) {
        try {
          const targetMessageQuery = await conversationRef.collection('messages')
            .where('zapiMessageId', '==', targetMessageId)
            .limit(1)
            .get()
          
          if (!targetMessageQuery.empty) {
            const targetMessageDoc = targetMessageQuery.docs[0]
            const targetMessageData = targetMessageDoc.data()
            
            console.log('Mensagem alvo encontrada:', targetMessageDoc.id)
            
            if (isReactionRemoved) {
              // Remover reação
              const currentReactions = targetMessageData.reactions || []
              const updatedReactions = currentReactions.filter((r: any) => 
                !(r.fromMe === fromMe && r.byPhone === phone)
              )
              
              await targetMessageDoc.ref.update({
                reactions: updatedReactions
              })
              
              console.log('Reação removida com sucesso')
              content = `Reação removida de uma mensagem`
            } else {
              // Adicionar reação
              const newReaction: Reaction = {
                emoji: reactionEmoji,
                by: senderName || 'Cliente',
                byPhone: phone,
                fromMe: !!fromMe,
                timestamp: new Date().toISOString()
              }
              
              // Verificar se já existe uma reação do mesmo usuário
              const currentReactions = targetMessageData.reactions || []
              const existingReactionIndex = currentReactions.findIndex((r: any) => 
                r.fromMe === fromMe && r.byPhone === phone
              )
              
              let updatedReactions
              if (existingReactionIndex >= 0) {
                // Atualizar reação existente
                updatedReactions = [...currentReactions]
                updatedReactions[existingReactionIndex] = newReaction
              } else {
                // Adicionar nova reação
                updatedReactions = [...currentReactions, newReaction]
              }
              
              await targetMessageDoc.ref.update({
                reactions: updatedReactions
              })
              
              console.log('Reação adicionada/atualizada com sucesso')
              content = `Reagiu com ${reactionEmoji} a uma mensagem`
            }
          } else {
            console.warn('Mensagem alvo da reação não encontrada:', targetMessageId)
            content = `Reagiu com ${reactionEmoji} a uma mensagem apagada`
          }
        } catch (error) {
          console.error('Erro ao processar reação:', error)
          content = `Erro ao processar reação`
        }
      } else {
        content = 'Reação sem mensagem alvo'
      }
      
      mediaInfo = {
        type: 'reaction',
        targetMessageId: reactionData.messageId,
        reaction: reactionEmoji,
        isRemoved: isReactionRemoved
      }
    } else if (body.image) {
      console.log('Processando imagem:', body.image)
      content = `📷 Imagem enviada${body.image.caption ? `: ${body.image.caption}` : ''}`
      
      // FLUXO OBRIGATÓRIO: Download e salvamento no Firebase Storage
      let storageUrl = body.image.imageUrl
      if (body.image.imageUrl && !isFirebaseStorageUrl(body.image.imageUrl)) {
        console.log('Download e salvamento de imagem no Firebase Storage...')
        const storageResult = await downloadAndSaveMedia(
          body.image.imageUrl,
          'image',
          `image_${Date.now()}.jpg`
        )
        
        if (storageResult.success) {
          storageUrl = storageResult.fileUrl!
          console.log('Imagem salva no Storage:', storageUrl)
        } else {
          console.error('Erro ao salvar imagem no Storage:', storageResult.error)
          // Usar URL original como fallback
          storageUrl = body.image.imageUrl
        }
      }
      
      mediaInfo = {
        type: 'image',
        url: storageUrl,
        caption: body.image.caption,
        mimeType: body.image.mimeType
      }
    } else if (body.audio) {
      console.log('Processando áudio:', body.audio)
      content = '🎵 Áudio'
      
      // FLUXO OBRIGATÓRIO: Download e salvamento no Firebase Storage
      let storageUrl = body.audio.audioUrl
      if (body.audio.audioUrl && !isFirebaseStorageUrl(body.audio.audioUrl)) {
        console.log('Download e salvamento de áudio no Firebase Storage...')
        const storageResult = await downloadAndSaveMedia(
          body.audio.audioUrl,
          'audio',
          `audio_${Date.now()}.mp3`
        )
        
        if (storageResult.success) {
          storageUrl = storageResult.fileUrl!
          console.log('Áudio salvo no Storage:', storageUrl)
        } else {
          console.error('Erro ao salvar áudio no Storage:', storageResult.error)
          // Usar URL original como fallback
          storageUrl = body.audio.audioUrl
        }
      }
      
      mediaInfo = {
        type: 'audio',
        url: storageUrl,
        mimeType: body.audio.mimeType
      }
    } else if (body.video) {
      console.log('Processando vídeo:', body.video)
      content = `🎬 Vídeo${body.video.caption ? `: ${body.video.caption}` : ''}`
      
      // FLUXO OBRIGATÓRIO: Download e salvamento no Firebase Storage
      let storageUrl = body.video.videoUrl
      if (body.video.videoUrl && !isFirebaseStorageUrl(body.video.videoUrl)) {
        console.log('Download e salvamento de vídeo no Firebase Storage...')
        const storageResult = await downloadAndSaveMedia(
          body.video.videoUrl,
          'video',
          `video_${Date.now()}.mp4`
        )
        
        if (storageResult.success) {
          storageUrl = storageResult.fileUrl!
          console.log('Vídeo salvo no Storage:', storageUrl)
        } else {
          console.error('Erro ao salvar vídeo no Storage:', storageResult.error)
          // Usar URL original como fallback
          storageUrl = body.video.videoUrl
        }
      }
      
      mediaInfo = {
        type: 'video',
        url: storageUrl,
        caption: body.video.caption,
        mimeType: body.video.mimeType
      }
    } else if (body.document) {
      console.log('Processando documento:', body.document)
      content = `📄 ${body.document.title || 'Documento'}`
      
      // FLUXO OBRIGATÓRIO: Download e salvamento no Firebase Storage
      let storageUrl = body.document.documentUrl
      if (body.document.documentUrl && !isFirebaseStorageUrl(body.document.documentUrl)) {
        console.log('Download e salvamento de documento no Firebase Storage...')
        const storageResult = await downloadAndSaveMedia(
          body.document.documentUrl,
          'document',
          body.document.title || `document_${Date.now()}.pdf`
        )
        
        if (storageResult.success) {
          storageUrl = storageResult.fileUrl!
          console.log('Documento salvo no Storage:', storageUrl)
        } else {
          console.error('Erro ao salvar documento no Storage:', storageResult.error)
          // Usar URL original como fallback
          storageUrl = body.document.documentUrl
        }
      }
      
      mediaInfo = {
        type: 'document',
        url: storageUrl,
        title: body.document.title,
        mimeType: body.document.mimeType
      }
    } else if (body.contact) {
      content = `👤 ${body.contact.displayName}`
      mediaInfo = {
        type: 'contact',
        displayName: body.contact.displayName,
        vcard: body.contact.vcard
      }
    } else if (body.location) {
      content = `📍 ${body.location.address || 'Localização'}`
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

    // Extrair referência de resposta (reply) se houver
    const replyTo = body.referenceMessageId || body.quotedMsgId || body.context?.id || null;

    // Processar reply se houver
    if (replyTo) {
      try {
        const replyQuery = await conversationRef.collection('messages')
          .where('zapiMessageId', '==', replyTo)
          .limit(1)
          .get()
        
        if (!replyQuery.empty) {
          const replyDoc = replyQuery.docs[0]
          replyToFirestoreId = replyDoc.id
          replyToContent = replyDoc.data().content
          replyToSender = replyDoc.data().agentName || 'Cliente'
        }
      } catch (error) {
        console.warn('Erro ao buscar mensagem de resposta:', error)
      }
    }

    // Criar ou atualizar conversa
    if (!conversationDoc.exists) {
      console.log('Criando nova conversa')
      conversationData = {
        phone: phone,
        name: senderName || chatName || phone,
        createdAt: timestamp,
        updatedAt: timestamp,
        lastMessage: content,
        timestamp: timestamp,
        status: 'active',
        unreadCount: 1,
        aiEnabled: true,
        aiPaused: false,
        conversationStatus: 'ai_active',
        source: 'zapi'
      }
      await conversationRef.set(conversationData)
    } else {
      conversationData = conversationDoc.data()
      
      // Atualizar última mensagem e incrementar contador de não lidas
      await conversationRef.update({
        lastMessage: content,
        timestamp: timestamp,
        unreadCount: (conversationData.unreadCount || 0) + 1,
        updatedAt: timestamp
      })
    }

    // Atualizar unreadCount
    if (!fromMe) {
      // Mensagem recebida do cliente: incrementar unreadCount
      await conversationRef.update({
        unreadCount: (conversationData?.unreadCount || 0) + 1,
        updatedAt: new Date().toISOString()
      })
    } else {
      // Mensagem enviada pelo painel: resetar unreadCount
      await conversationRef.update({
        unreadCount: 0,
        updatedAt: new Date().toISOString()
      })
    }

    // --- NOVA LÓGICA: Só salvar mensagem se houver conteúdo real ---
    const hasRealContent = (
      (content && content !== '[Mensagem sem texto]') ||
      (mediaInfo && mediaInfo.url) ||
      (mediaInfo && mediaInfo.type === 'reaction') ||
      (body.contact) ||
      (body.location)
    )

    if (!hasRealContent) {
      console.log('Ignorando mensagem sem conteúdo real. Não será salva no Firestore.')
      return NextResponse.json({ ignored: true, reason: 'empty_message' })
    }

    // Salvar mensagem no Firestore
    const msg: Partial<ChatMessage> = {
      content,
      role: fromMe ? 'agent' : 'user',
      timestamp,
      status: 'sent',
      origin: fromMe ? 'panel' : 'device',
      fromMe: !!fromMe,
      chatId: phone,
      customerPhone: phone,
      ...(mediaInfo && { 
        mediaType: mediaInfo.type as 'image' | 'audio' | 'video' | 'document' | 'contact' | 'location',
        mediaUrl: mediaInfo.url,
        mediaInfo: mediaInfo 
      }),
      ...(replyTo && {
        replyTo: replyToFirestoreId && replyToContent ? {
          id: replyToFirestoreId,
          text: replyToContent,
          author: replyToSender === 'Atendente' || replyToSender === 'IA Assistente' ? 'agent' : 'customer'
        } : {
          id: replyTo,
          text: 'Mensagem removida',
          author: 'customer'
        }
      })
    }
    await conversationRef.collection('messages').doc(messageId).set(msg)

    console.log('Mensagem salva com sucesso no Firestore')

    return NextResponse.json({ 
      success: true, 
      message: 'Mensagem processada com sucesso',
      messageId: messageId,
      phone: phone
    })

  } catch (error) {
    console.error('Erro no webhook:', error)
    return NextResponse.json({ 
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ 
    message: 'Webhook Z-API endpoint is working',
    timestamp: new Date().toISOString(),
    methods: ['POST'],
    usage: 'This endpoint receives webhooks from Z-API'
  })
} 