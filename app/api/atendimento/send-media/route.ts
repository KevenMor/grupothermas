import { NextRequest, NextResponse } from 'next/server'
import { adminDB } from '@/lib/firebaseAdmin'
import { readFile } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'
import { sendImage, sendAudio, sendDocument } from '@/lib/zapi'

interface MediaMessage {
  phone: string
  type: 'image' | 'audio' | 'video' | 'document'
  content?: string // Para texto
  localPath?: string // Para mídia local
  caption?: string // Legenda para mídia
  filename?: string // Para documentos
  replyTo?: string
}

interface MessageData {
  content: string
  role: string
  timestamp: string
  status: string
  zapiMessageId: any
  agentName: string
  mediaType?: 'image' | 'audio' | 'video' | 'document'
  mediaUrl?: string
  mediaInfo?: {
    type: string
    url: string
    filename?: string
    caption?: string
  }
}

export async function POST(request: NextRequest) {
  try {
    const { phone, type, content, localPath, caption, filename, replyTo }: MediaMessage & { replyTo?: string } = await request.json()
    
    console.log(`=== RECEBIDO PEDIDO DE ENVIO ===`)
    console.log('Phone:', phone)
    console.log('Type:', type)
    console.log('Content:', content)
    console.log('LocalPath:', localPath)
    console.log('Caption:', caption)
    console.log('Filename:', filename)
    console.log('ReplyTo:', replyTo)
    
    if (!phone || !type) {
      return NextResponse.json({ 
        error: 'Phone e type são obrigatórios'
      }, { status: 400 })
    }

    console.log(`=== ENVIANDO ${type.toUpperCase()} VIA Z-API (ATENDIMENTO) ===`)
    
    // Variáveis para resultado da API e URL da mídia
    let zapiResult: any = {}
    let mediaUrl = '' // Para salvar no Firebase

    if (!localPath) {
      return NextResponse.json({ 
        error: 'LocalPath é obrigatório para envio de mídia'
      }, { status: 400 })
    }
    // Só aceita URLs públicas do Firebase Storage
    if (!localPath.startsWith('http')) {
      return NextResponse.json({ error: 'localPath precisa ser uma URL pública do Firebase Storage' }, { status: 400 })
    }
    
    // Se localPath for uma URL pública (Firebase Storage), use-a. Caso contrário, retorne erro.
    if (localPath.startsWith('http')) {
      mediaUrl = localPath
      switch (type) {
        case 'image': {
          const imageResult = await sendImage(phone, localPath, caption, replyTo)
          if (!imageResult.success) throw new Error(imageResult.error || 'Erro ao enviar imagem')
          zapiResult = imageResult
          break
        }
        case 'audio': {
          const audioResult = await sendAudio(phone, localPath, replyTo)
          if (!audioResult.success) throw new Error(audioResult.error || 'Erro ao enviar áudio')
          zapiResult = audioResult
          break
        }
        case 'document': {
          const docFilename = filename || localPath.split('/').pop() || 'documento'
          const docMimeType = 'application/pdf'
          const docResult = await sendDocument(phone, localPath, docFilename, docMimeType, replyTo)
          if (!docResult.success) throw new Error(docResult.error || 'Erro ao enviar documento')
          zapiResult = docResult
          break
        }
        default:
          return NextResponse.json({ error: 'Tipo de mídia não suportado para URL pública' }, { status: 400 })
      }
      // Salvar mensagem no Firebase com mediaUrl correto
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
          }
        }
        await conversationRef.collection('messages').add(messageData)
        await conversationRef.update({
          lastMessage: `[${type.toUpperCase()}] enviado`,
          timestamp: new Date().toISOString()
        })
      } catch (e) {
        console.error('Erro ao salvar mensagem no Firestore:', e)
      }
      return NextResponse.json({ success: true, zapiResult })
    } else {
      // Se não for URL pública, retorne erro
      return NextResponse.json({ error: 'localPath precisa ser uma URL pública do Firebase Storage' }, { status: 400 })
    }

    return NextResponse.json({ 
      success: true,
      message: `${type.charAt(0).toUpperCase() + type.slice(1)} enviado com sucesso!`,
      zapiResult,
      sentData: {
        type,
        phone,
        content,
        localPath,
        caption,
        filename,
        mediaUrl
      }
    })

  } catch (error) {
    console.error('Erro geral:', error)
    return NextResponse.json({ 
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
} 