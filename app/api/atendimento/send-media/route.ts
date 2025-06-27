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
  replyTo?: { id: string, text: string, author: 'agent' | 'customer' }
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
  replyTo?: { id: string, text: string, author: 'agent' | 'customer' }
}

export async function POST(request: NextRequest) {
  try {
    const { phone, type, content, localPath, caption, filename, replyTo }: MediaMessage = await request.json()
    
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
    
    // Permitir apenas URL pública por enquanto (robustez)
    if (!localPath || !localPath.startsWith('http')) {
      return NextResponse.json({ error: 'localPath precisa ser uma URL pública do Firebase Storage' }, { status: 400 })
    }

    // Testar se a URL está realmente acessível (HEAD request)
    if (localPath) {
      try {
        const testResponse = await fetch(localPath, { method: 'HEAD' });
        if (!testResponse.ok) {
          return NextResponse.json({ error: `A URL do ${type} não está acessível publicamente para a Z-API.` }, { status: 400 })
        }
      } catch (e) {
        return NextResponse.json({ error: `Falha ao testar a URL do ${type}. Verifique se está realmente pública.` }, { status: 400 })
      }
    }

    let zapiResult: any = {}
    let mediaUrl = localPath
    let zapiError = null

    try {
      switch (type) {
        case 'image': {
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
          
          const audioResult = await sendAudio(phone, localPath, replyTo)
          
          console.log('=== RESULTADO ENVIO ÁUDIO ===')
          console.log('Success:', audioResult.success)
          console.log('MessageId:', audioResult.messageId)
          console.log('Error:', audioResult.error)
          
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
    } catch (err) {
      zapiError = err instanceof Error ? err.message : 'Erro desconhecido'
      console.error('Erro Z-API:', zapiError)
      return NextResponse.json({ error: 'Erro ao enviar via Z-API', details: zapiError }, { status: 500 })
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
        case 'audio':
          lastMessagePreview = '🎵 Áudio';
          break;
        case 'image':
          lastMessagePreview = '🖼️ Imagem';
          break;
        case 'document':
          lastMessagePreview = '📄 Documento';
          break;
        case 'video':
          lastMessagePreview = '🎬 Vídeo';
          break;
        default:
          lastMessagePreview = `[${type.toUpperCase()}]`;
      }
      await conversationRef.collection('messages').add(messageData)
      await conversationRef.update({
        lastMessage: lastMessagePreview,
        timestamp: new Date().toISOString()
      })
    } catch (e) {
      console.error('Erro ao salvar mensagem no Firestore:', e)
    }
    return NextResponse.json({ success: true, zapiResult })

  } catch (error) {
    console.error('Erro geral:', error)
    return NextResponse.json({ 
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
} 