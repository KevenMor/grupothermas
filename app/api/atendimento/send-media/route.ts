import { NextRequest, NextResponse } from 'next/server'
import { adminDB } from '@/lib/firebaseAdmin'
import { readFile } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

interface MediaMessage {
  phone: string
  type: 'text' | 'image' | 'audio' | 'video' | 'document'
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
    
    // Buscar configurações da Z-API do Firebase
    const configDoc = await adminDB.collection('admin_config').doc('ai_settings').get()
    
    if (!configDoc.exists) {
      console.error('Configurações não encontradas no Firebase')
      return NextResponse.json({ 
        error: 'Configurações não encontradas' 
      }, { status: 500 })
    }

    const config = configDoc.data()!

    if (!config.zapiApiKey || !config.zapiInstanceId) {
      console.error('Z-API não configurada:', { 
        hasApiKey: !!config.zapiApiKey, 
        hasInstanceId: !!config.zapiInstanceId 
      })
      return NextResponse.json({ 
        error: 'Z-API não configurada' 
      }, { status: 500 })
    }

    // Montar URL e payload baseado no tipo
    let zapiUrl = ''
    let payload: any = { phone }
    let mediaUrl = '' // Para salvar no Firebase

    if (type === 'text') {
      zapiUrl = `https://api.z-api.io/instances/${config.zapiInstanceId}/token/${config.zapiApiKey}/send-text`
      payload.message = content
      if (replyTo) payload.messageId = replyTo
    } else if (localPath) {
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
            zapiUrl = `https://api.z-api.io/instances/${config.zapiInstanceId}/token/${config.zapiApiKey}/send-image`
            // Determinar tipo MIME baseado na extensão
            const imageExt = localPath.toLowerCase().split('.').pop()
            let imageMimeType = 'image/jpeg'
            if (imageExt === 'png') imageMimeType = 'image/png'
            else if (imageExt === 'gif') imageMimeType = 'image/gif'
            else if (imageExt === 'webp') imageMimeType = 'image/webp'
            
            payload.image = `data:${imageMimeType};base64,${base64Data}`
            if (caption) payload.caption = caption
            if (replyTo) payload.messageId = replyTo
            break

          case 'audio':
            zapiUrl = `https://api.z-api.io/instances/${config.zapiInstanceId}/token/${config.zapiApiKey}/send-audio`
            // Determinar tipo MIME baseado na extensão
            const audioExt = localPath.toLowerCase().split('.').pop()
            let audioMimeType = 'audio/mpeg' // padrão MP3
            if (audioExt === 'wav') audioMimeType = 'audio/wav'
            else if (audioExt === 'ogg') audioMimeType = 'audio/ogg'
            else if (audioExt === 'm4a') audioMimeType = 'audio/mp4'
            
            payload.audio = `data:${audioMimeType};base64,${base64Data}`
            if (replyTo) payload.messageId = replyTo
            break

          case 'video':
            zapiUrl = `https://api.z-api.io/instances/${config.zapiInstanceId}/token/${config.zapiApiKey}/send-video`
            // Determinar tipo MIME baseado na extensão
            const videoExt = localPath.toLowerCase().split('.').pop()
            let videoMimeType = 'video/mp4' // padrão MP4
            if (videoExt === 'avi') videoMimeType = 'video/x-msvideo'
            else if (videoExt === 'mov') videoMimeType = 'video/quicktime'
            else if (videoExt === 'webm') videoMimeType = 'video/webm'
            
            payload.video = `data:${videoMimeType};base64,${base64Data}`
            if (caption) payload.caption = caption
            if (replyTo) payload.messageId = replyTo
            break

          case 'document':
            zapiUrl = `https://api.z-api.io/instances/${config.zapiInstanceId}/token/${config.zapiApiKey}/send-document`
            // Determinar tipo MIME baseado na extensão
            const docExt = localPath.toLowerCase().split('.').pop()
            let docMimeType = 'application/pdf' // padrão PDF
            if (docExt === 'doc') docMimeType = 'application/msword'
            else if (docExt === 'docx') docMimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
            else if (docExt === 'txt') docMimeType = 'text/plain'
            
            payload.document = `data:${docMimeType};base64,${base64Data}`
            payload.fileName = filename || localPath.split('/').pop() || 'documento'
            if (replyTo) payload.messageId = replyTo
            break

          default:
            return NextResponse.json({ 
              error: `Tipo '${type}' não suportado`
            }, { status: 400 })
        }
      } catch (error) {
        console.error('Erro ao ler arquivo local:', error)
        return NextResponse.json({ 
          error: 'Falha ao processar arquivo local',
          details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 400 })
      }
    } else {
      return NextResponse.json({ 
        error: 'Content (para texto) ou localPath (para mídia) é obrigatório'
      }, { status: 400 })
    }

    // Headers da requisição
    const zapiHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    if (config.zapiClientToken && config.zapiClientToken.trim()) {
      zapiHeaders['Client-Token'] = config.zapiClientToken.trim()
    }

    // Log detalhado do payload (truncar base64)
    const logPayload = { ...payload }
    if (logPayload.document && typeof logPayload.document === 'string' && logPayload.document.length > 100) {
      logPayload.document = logPayload.document.substring(0, 100) + '... (truncado)'
    }
    if (logPayload.image && typeof logPayload.image === 'string' && logPayload.image.length > 100) {
      logPayload.image = logPayload.image.substring(0, 100) + '... (truncado)'
    }
    if (logPayload.audio && typeof logPayload.audio === 'string' && logPayload.audio.length > 100) {
      logPayload.audio = logPayload.audio.substring(0, 100) + '... (truncado)'
    }
    if (logPayload.video && typeof logPayload.video === 'string' && logPayload.video.length > 100) {
      logPayload.video = logPayload.video.substring(0, 100) + '... (truncado)'
    }

    console.log('Enviando para Z-API:', {
      url: zapiUrl,
      headers: zapiHeaders,
      payload: logPayload,
      payloadKeys: Object.keys(payload),
      hasBase64: Object.values(payload).some(v => typeof v === 'string' && v.includes('base64')),
      payloadSize: JSON.stringify(payload).length,
      phone: payload.phone,
      type: type
    })

    // Enviar via Z-API
    let zapiResponse, zapiResult, zapiText
    try {
      zapiResponse = await fetch(zapiUrl, {
        method: 'POST',
        headers: zapiHeaders,
        body: JSON.stringify(payload)
      })
      zapiText = await zapiResponse.text()
      try {
        zapiResult = JSON.parse(zapiText)
      } catch (err) {
        zapiResult = { raw: zapiText }
      }
      console.log('Resposta da Z-API:', {
        status: zapiResponse.status,
        statusText: zapiResponse.statusText,
        body: zapiResult
      })
    } catch (err) {
      console.error('Erro ao enviar para Z-API:', err)
      return NextResponse.json({
        error: 'Erro ao enviar para Z-API',
        details: err instanceof Error ? err.message : 'Unknown error'
      }, { status: 500 })
    }

    if (!zapiResponse.ok) {
      console.error('Erro Z-API:', zapiResult)
      return NextResponse.json({ 
        error: 'Erro ao enviar via Z-API',
        details: zapiResult,
        zapiUrl
      }, { status: 500 })
    }

    console.log('Sucesso Z-API:', zapiResult)

    // Salvar mensagem no Firebase com informações completas
    try {
      console.log('Salvando mensagem no Firebase...')
      
      const conversationRef = adminDB.collection('conversations').doc(phone)
      const messageData: MessageData = {
        content: type === 'text' ? content || '' : `[${type.toUpperCase()}]`,
        role: 'agent',
        timestamp: new Date().toISOString(),
        status: 'sent',
        zapiMessageId: zapiResult.messageId || null,
        agentName: 'Sistema' // TODO: Pegar nome do agente logado
      }

      // Adicionar informações de mídia se não for texto
      if (type !== 'text') {
        messageData.mediaType = type as 'image' | 'audio' | 'video' | 'document'
        messageData.mediaUrl = mediaUrl
        messageData.mediaInfo = {
          type: type,
          url: mediaUrl,
          filename: filename || localPath?.split('/').pop(),
          ...(caption && { caption })
        }
      }

      console.log('Dados da mensagem para salvar:', messageData)
      
      await conversationRef.collection('messages').add(messageData)
      
      // Atualizar última mensagem da conversa
      await conversationRef.update({
        lastMessage: type === 'text' ? content : `[${type.toUpperCase()}] enviado`,
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
    console.error('Erro geral no endpoint send-media:', error)
    return NextResponse.json({ 
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 