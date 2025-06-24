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
    
    // Ler arquivo local e converter para base64
    try {
      // Remover barra inicial se existir para join funcionar corretamente
      const cleanPath = localPath.startsWith('/') ? localPath.substring(1) : localPath
      const fullPath = join(process.cwd(), 'public', cleanPath)
      console.log('Lendo arquivo:', fullPath)
      console.log('Caminho limpo:', cleanPath)
      console.log('Caminho completo:', fullPath)
      
      // Verificar se o arquivo existe
      if (!existsSync(fullPath)) {
        console.error('Arquivo não encontrado:', fullPath)
        console.error('Diretório atual:', process.cwd())
        console.error('Lista do diretório public:', existsSync(join(process.cwd(), 'public')) ? 'existe' : 'não existe')
        
        return NextResponse.json({ 
          error: 'Arquivo não encontrado no servidor',
          details: { 
            requestedPath: localPath, 
            fullPath,
            currentDir: process.cwd(),
            publicExists: existsSync(join(process.cwd(), 'public'))
          }
        }, { status: 404 })
      }
      
      const fileBuffer = await readFile(fullPath)
      const fileSizeBytes = fileBuffer.length
      const fileSizeMB = fileSizeBytes / (1024 * 1024)
      
      console.log(`Arquivo lido. Tamanho: ${fileSizeBytes} bytes (${fileSizeMB.toFixed(2)} MB)`)
      
      // Verificar tamanho do arquivo (limite de 16MB para Z-API)
      if (fileSizeMB > 16) {
        console.error('Arquivo muito grande:', fileSizeMB, 'MB')
        return NextResponse.json({ 
          error: 'Arquivo muito grande. Limite máximo: 16MB',
          details: { fileSize: `${fileSizeMB.toFixed(2)} MB` }
        }, { status: 413 })
      }
      
      const base64Data = fileBuffer.toString('base64')
      console.log(`Arquivo convertido para base64. Tamanho: ${base64Data.length} chars`)

      // Salvar URL para o Firebase (caminho público)
      mediaUrl = localPath.startsWith('/') ? localPath : `/${localPath}`

      switch (type) {
        case 'image':
          // Determinar tipo MIME baseado na extensão
          const imageExt = localPath.toLowerCase().split('.').pop()
          let imageMimeType = 'image/jpeg'
          if (imageExt === 'png') imageMimeType = 'image/png'
          else if (imageExt === 'gif') imageMimeType = 'image/gif'
          else if (imageExt === 'webp') imageMimeType = 'image/webp'
          
          // Usar a nova função sendImage
          const imageResult = await sendImage(
            phone, 
            `data:${imageMimeType};base64,${base64Data}`, 
            caption,
            replyTo
          )
          
          if (!imageResult.success) {
            throw new Error(imageResult.error || 'Erro ao enviar imagem')
          }
          
          zapiResult = imageResult
          break

        case 'audio':
          // Determinar tipo MIME baseado na extensão
          const audioExt = localPath.toLowerCase().split('.').pop()
          let audioMimeType = 'audio/mpeg' // padrão MP3
          if (audioExt === 'wav') audioMimeType = 'audio/wav'
          else if (audioExt === 'ogg') audioMimeType = 'audio/ogg'
          else if (audioExt === 'm4a') audioMimeType = 'audio/mp4'
          
          // Usar a nova função sendAudio
          const audioResult = await sendAudio(
            phone, 
            `data:${audioMimeType};base64,${base64Data}`,
            replyTo
          )
          
          if (!audioResult.success) {
            throw new Error(audioResult.error || 'Erro ao enviar áudio')
          }
          
          zapiResult = audioResult
          break

        case 'document':
          // Determinar tipo MIME baseado na extensão
          const docExt = localPath.toLowerCase().split('.').pop()
          let docMimeType = 'application/pdf' // padrão PDF
          if (docExt === 'doc') docMimeType = 'application/msword'
          else if (docExt === 'docx') docMimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
          else if (docExt === 'txt') docMimeType = 'text/plain'
          
          const docFilename = filename || localPath.split('/').pop() || 'documento'
          
          // Usar a nova função sendDocument
          const docResult = await sendDocument(
            phone, 
            `data:${docMimeType};base64,${base64Data}`,
            docFilename,
            docMimeType,
            replyTo
          )
          
          if (!docResult.success) {
            throw new Error(docResult.error || 'Erro ao enviar documento')
          }
          
          zapiResult = docResult
          break

        case 'video':
          // TODO: Implementar envio de vídeo com nova função
          return NextResponse.json({ 
            error: `Tipo 'video' ainda não suportado na nova API`
          }, { status: 400 })

        default:
          return NextResponse.json({ 
            error: `Tipo '${type}' não suportado`
          }, { status: 400 })
      }
    } catch (error) {
      console.error('Erro ao processar arquivo local:', error)
      return NextResponse.json({ 
        error: 'Falha ao processar arquivo local',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, { status: 400 })
    }

    // Salvar mensagem no Firebase com informações completas
    try {
      console.log('Salvando mensagem no Firebase...')
      
      const conversationRef = adminDB.collection('conversations').doc(phone)
      const messageData: MessageData = {
        content: `[${type.toUpperCase()}]`,
        role: 'agent',
        timestamp: new Date().toISOString(),
        status: 'sent',
        zapiMessageId: zapiResult.messageId || null,
        agentName: 'Sistema' // TODO: Pegar nome do agente logado
      }

      // Adicionar informações de mídia
      messageData.mediaType = type
      messageData.mediaUrl = mediaUrl
      messageData.mediaInfo = {
        type: type,
        url: mediaUrl,
        filename: filename || localPath?.split('/').pop(),
        ...(caption && { caption })
      }

      console.log('Dados da mensagem para salvar:', messageData)
      
      await conversationRef.collection('messages').add(messageData)
      
      // Atualizar última mensagem da conversa
      await conversationRef.update({
        lastMessage: `[${type.toUpperCase()}] enviado`,
        timestamp: new Date().toISOString()
      })

      console.log('Mensagem salva com sucesso no Firebase')
    } catch (saveError) {
      console.error('Erro ao salvar mensagem no Firebase:', saveError)
      // Não falhar o envio por causa disso, mas logar o erro
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