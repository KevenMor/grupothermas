import { NextRequest, NextResponse } from 'next/server'
import { adminDB } from '@/lib/firebaseAdmin'
import { sendImage, sendAudio, sendDocument, sendVideo } from '@/lib/zapi'
import { isFirebaseStorageUrl } from '@/lib/mediaUpload'

interface MediaMessage {
  phone: string
  type: 'image' | 'audio' | 'video' | 'document'
  content?: string // Para texto
  localPath?: string // Para mídia local (deve ser URL do Firebase Storage)
  caption?: string // Legenda para mídia
  filename?: string // Para documentos
  replyTo?: { id: string, text: string, author: 'agent' | 'customer' }
  oggUrl?: string
  mp3Url?: string
}

interface MessageData {
  content: string
  role: 'agent' | 'user' | 'ai'
  timestamp: string
  status: 'sent' | 'received' | 'pending'
  zapiMessageId?: string | null
  agentName?: string
  mediaType?: 'image' | 'audio' | 'video' | 'document'
  mediaUrl?: string
  mediaInfo?: {
    type: string
    url: string
    filename?: string
    caption?: string
  }
  replyTo?: { id: string, text: string, author: 'agent' | 'customer' }
}

export async function POST(request: NextRequest) {
  try {
    const { phone, type, content, localPath, caption, filename, replyTo, oggUrl, mp3Url }: MediaMessage = await request.json()
    
    console.log(`=== RECEBIDO PEDIDO DE ENVIO ===`)
    console.log('Phone:', phone)
    console.log('Type:', type)
    console.log('Content:', content)
    console.log('LocalPath:', localPath)
    console.log('Caption:', caption)
    console.log('Filename:', filename)
    console.log('ReplyTo:', replyTo)
    console.log('OGG URL:', oggUrl)
    console.log('MP3 URL:', mp3Url)
    
    if (!phone || !type) {
      return NextResponse.json({ 
        error: 'Phone e type são obrigatórios'
      }, { status: 400 })
    }

    console.log(`=== ENVIANDO ${type.toUpperCase()} VIA Z-API (ATENDIMENTO) ===`)
    
    // FLUXO OBRIGATÓRIO: Validar que a URL é do Firebase Storage
    if (!localPath || !localPath.startsWith('http')) {
      return NextResponse.json({ 
        error: 'localPath precisa ser uma URL pública do Firebase Storage' 
      }, { status: 400 })
    }

    // Verificar se é uma URL do Firebase Storage
    if (!isFirebaseStorageUrl(localPath)) {
      return NextResponse.json({ 
        error: 'A URL deve ser do Firebase Storage para garantir persistência e histórico completo' 
      }, { status: 400 })
    }

    // Testar se a URL está realmente acessível (HEAD request)
    try {
      const testResponse = await fetch(localPath, { method: 'HEAD' });
      if (!testResponse.ok) {
        return NextResponse.json({ 
          error: `A URL do ${type} não está acessível publicamente para a Z-API. Status: ${testResponse.status}` 
        }, { status: 400 })
      }
    } catch (e) {
      return NextResponse.json({ 
        error: `Falha ao testar a URL do ${type}. Verifique se está realmente pública.` 
      }, { status: 400 })
    }

    let zapiResult: any = {}
    let mediaUrl = localPath
    let zapiError = null

    try {
      switch (type) {
        case 'image': {
          console.log('=== ENVIANDO IMAGEM ===')
          console.log('URL do Firebase Storage:', localPath)
          console.log('Caption:', caption)
          console.log('ReplyTo:', replyTo)
          
          const imageResult = await sendImage(phone, localPath, caption, replyTo)
          if (!imageResult.success) throw new Error(imageResult.error || 'Erro ao enviar imagem')
          zapiResult = imageResult
          break
        }
        case 'audio': {
          console.log('=== PROCESSANDO ÁUDIO ===')
          console.log('Phone:', phone)
          console.log('LocalPath (Firebase URL):', localPath)
          console.log('ReplyTo:', replyTo)
          console.log('OGG URL:', oggUrl)
          console.log('MP3 URL:', mp3Url)
          
          // Validar formato de áudio de forma mais robusta
          console.log('=== VALIDAÇÃO DE EXTENSÃO ===')
          console.log('URL completa:', localPath)
          const match = localPath.match(/\.([a-zA-Z0-9]+)(?=\?|$)/)
          console.log('Regex match:', match)
          const urlExtension = match ? match[1].toLowerCase() : ''
          console.log('Extensão detectada:', urlExtension)
          const supportedFormats = ['mp3', 'ogg', 'opus']
          console.log('Formatos suportados:', supportedFormats)
          console.log('Extensão é suportada?', supportedFormats.includes(urlExtension))
          
          if (!urlExtension || !supportedFormats.includes(urlExtension)) {
            console.error('=== ERRO DE VALIDAÇÃO ===')
            console.error('URL:', localPath)
            console.error('Extensão detectada:', urlExtension)
            console.error('Formatos suportados:', supportedFormats)
            return NextResponse.json({ 
              error: `Formato de áudio não suportado: ${urlExtension}. Use apenas MP3, OGG ou Opus do Firebase Storage.` 
            }, { status: 400 })
          }
          
          console.log('=== VALIDAÇÃO PASSOU - INICIANDO ENVIO ===')
          console.log('URL válida:', localPath)
          console.log('Extensão válida:', urlExtension)
          
          // Priorizar OGG/Opus se disponível, senão MP3
          let audioUrl = localPath
          let audioFormat = urlExtension
          
          console.log('=== DEFININDO URL FINAL ===')
          console.log('URL inicial:', audioUrl)
          console.log('Formato inicial:', audioFormat)
          
          if (oggUrl && isFirebaseStorageUrl(oggUrl) && (oggUrl.endsWith('.ogg') || oggUrl.endsWith('.opus'))) {
            audioUrl = oggUrl
            audioFormat = oggUrl.endsWith('.opus') ? 'opus' : 'ogg'
            console.log('Usando URL OGG/Opus do Storage:', audioUrl)
          } else if (mp3Url && isFirebaseStorageUrl(mp3Url) && mp3Url.endsWith('.mp3')) {
            audioUrl = mp3Url
            audioFormat = 'mp3'
            console.log('Usando URL MP3 do Storage:', audioUrl)
          } else if (localPath.endsWith('.ogg') || localPath.endsWith('.opus')) {
            audioUrl = localPath
            audioFormat = localPath.endsWith('.opus') ? 'opus' : 'ogg'
            console.log('Usando URL OGG/Opus (localPath):', audioUrl)
          } else if (localPath.endsWith('.mp3')) {
            audioUrl = localPath
            audioFormat = 'mp3'
            console.log('Usando URL MP3 (localPath):', audioUrl)
          } else {
            console.log('=== ERRO: NENHUMA URL VÁLIDA ENCONTRADA ===')
            return NextResponse.json({ 
              error: 'Formato de áudio não suportado. Use MP3 ou OGG/Opus do Firebase Storage.' 
            }, { status: 400 })
          }
          
          console.log('=== URL FINAL DEFINIDA ===')
          console.log('URL final:', audioUrl)
          console.log('Formato final:', audioFormat)
          
          // Verificar se a URL está realmente acessível e tem o content-type correto
          console.log('=== TESTANDO ACESSIBILIDADE DA URL ===')
          try {
            const testResponse = await fetch(audioUrl, { method: 'HEAD' });
            console.log('Status da resposta HEAD:', testResponse.status)
            console.log('Headers da resposta:', Object.fromEntries(testResponse.headers.entries()))
            
            if (!testResponse.ok) {
              console.log('=== ERRO: URL NÃO ACESSÍVEL ===')
              return NextResponse.json({ 
                error: `A URL do áudio não está acessível publicamente. Status: ${testResponse.status}` 
              }, { status: 400 })
            }
            
            const contentType = testResponse.headers.get('content-type')
            console.log('Content-Type do áudio:', contentType)
            // Validar content-type
            const validContentTypes = [
              'audio/mpeg', 'audio/mp3', 'audio/mpeg3', 'audio/x-mpeg-3',
              'audio/ogg', 'audio/opus', 'audio/ogg; codecs=opus'
            ]
            if (!contentType || !validContentTypes.some(valid => contentType.includes(valid))) {
              console.warn('Content-Type inválido:', contentType)
              // Não falhar aqui, apenas logar o warning
            }
            
            console.log('=== URL ACESSÍVEL - CHAMANDO SEND AUDIO ===')
            // Chamar sendAudio passando o Content-Type detectado e caption (se houver)
            console.log('Chamando sendAudio com Content-Type:', contentType)
            console.log('=== PAYLOAD PARA SEND AUDIO ===')
            console.log('Phone:', phone)
            console.log('Audio URL:', audioUrl)
            console.log('ReplyTo:', replyTo)
            console.log('ContentType:', contentType)
            console.log('Caption:', caption || "")
            console.log('================================')
            const audioResult = await sendAudio(phone, audioUrl, replyTo, contentType || undefined, caption || "")
            
            console.log('=== RESULTADO ENVIO ÁUDIO ===')
            console.log('Success:', audioResult.success)
            console.log('MessageId:', audioResult.messageId)
            console.log('Error:', audioResult.error)
            
            if (!audioResult.success) {
              // Log detalhado do erro para debugging
              console.error('Erro detalhado do envio de áudio:', {
                phone,
                audioUrl,
                audioFormat,
                error: audioResult.error,
                timestamp: new Date().toISOString()
              })
              
              throw new Error(audioResult.error || 'Erro ao enviar áudio')
            }
            
            zapiResult = audioResult
            break
          } catch (e) {
            console.warn('Erro ao testar URL do áudio:', e)
            // Não falhar aqui, apenas logar o warning
            // Chamar sendAudio sem Content-Type
            const audioResult = await sendAudio(phone, audioUrl, replyTo)
            
            console.log('=== RESULTADO ENVIO ÁUDIO ===')
            console.log('Success:', audioResult.success)
            console.log('MessageId:', audioResult.messageId)
            console.log('Error:', audioResult.error)
            
            if (!audioResult.success) {
              // Log detalhado do erro para debugging
              console.error('Erro detalhado do envio de áudio:', {
                phone,
                audioUrl,
                audioFormat,
                error: audioResult.error,
                timestamp: new Date().toISOString()
              })
              
              throw new Error(audioResult.error || 'Erro ao enviar áudio')
            }
            
            zapiResult = audioResult
            break
          }
        }
        case 'video': {
          console.log('=== ENVIANDO VÍDEO ===')
          console.log('URL do Firebase Storage:', localPath)
          console.log('Caption:', caption)
          console.log('ReplyTo:', replyTo)
          
          const videoResult = await sendVideo(phone, localPath, filename, caption, replyTo)
          if (!videoResult.success) throw new Error(videoResult.error || 'Erro ao enviar vídeo')
          zapiResult = videoResult
          break
        }
        case 'document': {
          console.log('=== ENVIANDO DOCUMENTO ===')
          console.log('URL do Firebase Storage:', localPath)
          console.log('Filename:', filename)
          console.log('ReplyTo:', replyTo)
          
          const safeFilename = filename || 'documento.pdf';
          const documentResult = await sendDocument(phone, localPath, safeFilename, undefined, replyTo)
          if (!documentResult.success) throw new Error(documentResult.error || 'Erro ao enviar documento')
          zapiResult = documentResult
          break
        }
        default:
          throw new Error(`Tipo de mídia não suportado: ${type}`)
      }
    } catch (error) {
      console.error('Erro ao enviar mídia via Z-API:', error)
      zapiError = error instanceof Error ? error.message : 'Erro desconhecido'
      throw error
    }

    // Só grava no Firestore se não houve erro
    try {
      const conversationRef = adminDB.collection('conversations').doc(phone)
      // Garantir que não salva undefined
      const safeMessageId = typeof zapiResult.messageId === 'string' && zapiResult.messageId ? zapiResult.messageId : (typeof zapiResult.id === 'string' && zapiResult.id ? zapiResult.id : null)
      if (!safeMessageId) {
        console.warn('Z-API não retornou messageId nem id:', JSON.stringify(zapiResult, null, 2))
      }
      const safeContent = type === 'audio' ? '[AUDIO]' : (typeof content === 'string' && content.trim() ? content : `[${type.toUpperCase()}]`)
      const messageData: MessageData = {
        content: safeContent,
        role: 'agent',
        timestamp: new Date().toISOString(),
        status: 'sent',
        ...(safeMessageId !== null ? { zapiMessageId: safeMessageId } : {}),
        agentName: 'Sistema',
        mediaType: type,
        mediaUrl: mediaUrl,
        mediaInfo: {
          type: type,
          url: mediaUrl,
          filename: filename || localPath?.split('/').pop(),
          ...(caption && { caption })
        },
        ...(replyTo && { replyTo })
      }
      
      let lastMessagePreview = '';
      switch (type) {
        case 'image':
          lastMessagePreview = caption || '📷 Imagem'
          break
        case 'audio':
          lastMessagePreview = '🎵 Áudio'
          break
        case 'video':
          lastMessagePreview = caption || '🎥 Vídeo'
          break
        case 'document':
          lastMessagePreview = `📄 ${filename || 'Documento'}`
          break
      }

      // Adicionar mensagem à conversa
      await conversationRef.collection('messages').add(messageData)
      
      // Atualizar preview da última mensagem
      await conversationRef.update({
        lastMessage: lastMessagePreview,
        lastMessageTime: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })

      console.log('=== MENSAGEM SALVA NO FIRESTORE ===')
      console.log('Phone:', phone)
      console.log('Type:', type)
      console.log('MessageId:', zapiResult.messageId)
      console.log('LastMessagePreview:', lastMessagePreview)

      return NextResponse.json({
        success: true,
        messageId: zapiResult.messageId,
        message: `${type} enviado com sucesso via Z-API`,
        mediaUrl: mediaUrl
      })

    } catch (firestoreError) {
      console.error('Erro ao salvar no Firestore:', firestoreError)
      // Mesmo com erro no Firestore, retorna sucesso se Z-API funcionou
      return NextResponse.json({
        success: true,
        messageId: zapiResult.messageId,
        message: `${type} enviado via Z-API, mas erro ao salvar no histórico`,
        mediaUrl: mediaUrl,
        warning: 'Mensagem enviada mas não salva no histórico'
      })
    }

  } catch (error) {
    console.error('Erro geral no envio de mídia:', error)
    return NextResponse.json({ 
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
} 