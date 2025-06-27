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
          
          // Validar formato de áudio
          const urlExtension = localPath.split('.').pop()?.toLowerCase()
          if (!urlExtension || !['mp3', 'ogg', 'opus'].includes(urlExtension)) {
            return NextResponse.json({ 
              error: 'Formato de áudio não suportado. Use apenas MP3, OGG ou Opus do Firebase Storage.' 
            }, { status: 400 })
          }
          
          // Priorizar OGG/Opus se disponível, senão MP3
          let audioUrl = localPath
          
          if (oggUrl && isFirebaseStorageUrl(oggUrl) && (oggUrl.endsWith('.ogg') || oggUrl.endsWith('.opus'))) {
            audioUrl = oggUrl
            console.log('Usando URL OGG/Opus do Storage:', audioUrl)
          } else if (mp3Url && isFirebaseStorageUrl(mp3Url) && mp3Url.endsWith('.mp3')) {
            audioUrl = mp3Url
            console.log('Usando URL MP3 do Storage:', audioUrl)
          } else if (localPath.endsWith('.ogg') || localPath.endsWith('.opus')) {
            audioUrl = localPath
            console.log('Usando URL OGG/Opus (localPath):', audioUrl)
          } else if (localPath.endsWith('.mp3')) {
            audioUrl = localPath
            console.log('Usando URL MP3 (localPath):', audioUrl)
          } else {
            return NextResponse.json({ 
              error: 'Formato de áudio não suportado. Use MP3 ou OGG/Opus do Firebase Storage.' 
            }, { status: 400 })
          }
          
          const audioResult = await sendAudio(phone, audioUrl, replyTo)
          
          console.log('=== RESULTADO ENVIO ÁUDIO ===')
          console.log('Success:', audioResult.success)
          console.log('MessageId:', audioResult.messageId)
          console.log('Error:', audioResult.error)
          
          if (!audioResult.success) throw new Error(audioResult.error || 'Erro ao enviar áudio')
          zapiResult = audioResult
          break
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
      const messageData: MessageData = {
        content: `[${type.toUpperCase()}]`,
        role: 'agent',
        timestamp: new Date().toISOString(),
        status: 'sent',
        zapiMessageId: zapiResult.messageId || null,
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