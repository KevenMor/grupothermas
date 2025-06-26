import { NextRequest, NextResponse } from 'next/server'
import { adminDB } from '@/lib/firebaseAdmin'

interface MediaMessage {
  phone: string
  type: 'text' | 'image' | 'audio' | 'video' | 'document'
  content?: string // Para texto
  url?: string // Para mídia
  caption?: string // Legenda para mídia
  filename?: string // Para documentos
}

export async function POST(request: NextRequest) {
  try {
    const { phone, type, content, url, caption, filename }: MediaMessage = await request.json()
    
    if (!phone || !type) {
      return NextResponse.json({ 
        error: 'Phone e type são obrigatórios',
        supportedTypes: ['text', 'image', 'audio', 'video', 'document'],
        example: { 
          phone: '5515998765432', 
          type: 'text', 
          content: 'Olá!' 
        }
      }, { status: 400 })
    }

    // Validação por tipo
    if (type === 'text' && !content) {
      return NextResponse.json({ 
        error: 'Content é obrigatório para mensagens de texto' 
      }, { status: 400 })
    }

    if (['image', 'audio', 'video', 'document'].includes(type) && !url) {
      return NextResponse.json({ 
        error: 'URL é obrigatória para mídia' 
      }, { status: 400 })
    }

    console.log(`=== ENVIANDO ${type.toUpperCase()} VIA Z-API ===`)
    
    // Buscar configurações
    const configDoc = await adminDB.collection('admin_config').doc('ai_settings').get()
    
    if (!configDoc.exists) {
      return NextResponse.json({ 
        error: 'Configurações não encontradas' 
      }, { status: 500 })
    }

    const config = configDoc.data()!

    if (!config.zapiApiKey || !config.zapiInstanceId) {
      return NextResponse.json({ 
        error: 'Z-API não configurada' 
      }, { status: 500 })
    }

    // Converter mídia para base64 para envio real (não link)
    let mediaBase64 = ''
    let fileName = ''
    
    if (type !== 'text' && url) {
      try {
        console.log(`Baixando mídia: ${url}`)
        
        // Baixar o arquivo da URL
        const mediaResponse = await fetch(url)
        if (!mediaResponse.ok) {
          throw new Error(`Falha ao baixar mídia: ${mediaResponse.status}`)
        }
        
        const arrayBuffer = await mediaResponse.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)
        mediaBase64 = buffer.toString('base64')
        
        // Extrair nome do arquivo da URL
        fileName = url.split('/').pop()?.split('?')[0] || 'arquivo'
        
        console.log(`Mídia convertida para base64. Tamanho: ${mediaBase64.length} chars`)
      } catch (error) {
        console.error('Erro ao processar mídia:', error)
        return NextResponse.json({ 
          error: 'Falha ao processar arquivo de mídia',
          details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 400 })
      }
    }

    // Montar URL e payload baseado no tipo
    let zapiUrl = ''
    let payload: any = { phone }

    switch (type) {
      case 'text':
        zapiUrl = `https://api.z-api.io/instances/${config.zapiInstanceId}/token/${config.zapiApiKey}/send-text`
        payload.message = content
        break

      case 'image':
        zapiUrl = `https://api.z-api.io/instances/${config.zapiInstanceId}/token/${config.zapiApiKey}/send-image`
        if (url && url.startsWith('http')) {
          // Modo B: URL pública
          payload.url = url
          if (caption) payload.caption = caption
        } else if (mediaBase64) {
          // Modo A: base64 puro (sem prefixo)
          payload.image = mediaBase64
          if (caption) payload.caption = caption
        } else {
          return NextResponse.json({ error: 'URL ou base64 obrigatório para imagem' }, { status: 400 })
        }
        break

      case 'audio':
        zapiUrl = `https://api.z-api.io/instances/${config.zapiInstanceId}/token/${config.zapiApiKey}/send-audio`
        if (url && url.startsWith('http')) {
          payload.url = url
        } else if (mediaBase64) {
          payload.audio = mediaBase64
        } else {
          return NextResponse.json({ error: 'URL ou base64 obrigatório para áudio' }, { status: 400 })
        }
        break

      case 'video':
        zapiUrl = `https://api.z-api.io/instances/${config.zapiInstanceId}/token/${config.zapiApiKey}/send-video`
        if (url && url.startsWith('http')) {
          payload.url = url
          if (caption) payload.caption = caption
        } else if (mediaBase64) {
          payload.video = mediaBase64
          if (caption) payload.caption = caption
        } else {
          return NextResponse.json({ error: 'URL ou base64 obrigatório para vídeo' }, { status: 400 })
        }
        break

      case 'document':
        zapiUrl = `https://api.z-api.io/instances/${config.zapiInstanceId}/token/${config.zapiApiKey}/send-document`
        if (url && url.startsWith('http')) {
          payload.url = url
          payload.fileName = filename || fileName || 'documento.pdf'
        } else if (mediaBase64) {
          payload.document = mediaBase64
          payload.fileName = filename || fileName || 'documento.pdf'
        } else {
          return NextResponse.json({ error: 'URL ou base64 obrigatório para documento' }, { status: 400 })
        }
        break

      default:
        return NextResponse.json({ 
          error: `Tipo '${type}' não suportado`,
          supportedTypes: ['text', 'image', 'audio', 'video', 'document']
        }, { status: 400 })
    }

    // Headers da requisição
    const zapiHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    if (config.zapiClientToken && config.zapiClientToken.trim()) {
      zapiHeaders['Client-Token'] = config.zapiClientToken.trim()
    }

    console.log('Enviando para Z-API:', { url: zapiUrl, payload })

    // Enviar via Z-API
    const zapiResponse = await fetch(zapiUrl, {
      method: 'POST',
      headers: zapiHeaders,
      body: JSON.stringify(payload)
    })

    const zapiResult = await zapiResponse.json()

    if (!zapiResponse.ok || zapiResult.error) {
      console.error('Erro Z-API:', zapiResult)
      return NextResponse.json({ 
        error: 'Erro ao enviar via Z-API',
        details: zapiResult,
        zapiUrl,
        payload
      }, { status: 500 })
    }

    console.log('Sucesso Z-API:', zapiResult)

    // Salvar no histórico (opcional)
    try {
      const conversationRef = adminDB.collection('conversations').doc(phone)
      await conversationRef.collection('messages').add({
        content: type === 'text' ? content : `[${type.toUpperCase()}] ${url}`,
        caption: caption || null,
        filename: filename || null,
        mediaType: type,
        mediaUrl: url || null,
        role: 'admin_test',
        timestamp: new Date().toISOString(),
        status: 'sent',
        zapiMessageId: zapiResult.messageId || null
      })
    } catch (saveError) {
      console.warn('Erro ao salvar no histórico:', saveError)
      // Não falha o envio por causa disso
    }

    return NextResponse.json({ 
      success: true,
      message: `${type.charAt(0).toUpperCase() + type.slice(1)} enviado com sucesso!`,
      zapiResult,
      sentData: {
        type,
        phone,
        content,
        url,
        caption,
        filename
      }
    })

  } catch (error) {
    console.error('Erro geral:', error)
    return NextResponse.json({ 
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'API de envio de mídia Z-API',
    supportedTypes: [
      {
        type: 'text',
        required: ['phone', 'content'],
        optional: []
      },
      {
        type: 'image',
        required: ['phone', 'url'],
        optional: ['caption']
      },
      {
        type: 'audio',
        required: ['phone', 'url'],
        optional: []
      },
      {
        type: 'video',
        required: ['phone', 'url'],
        optional: ['caption']
      },
      {
        type: 'document',
        required: ['phone', 'url'],
        optional: ['filename']
      }
    ],
    examples: {
      text: { phone: '5515998765432', type: 'text', content: 'Olá!' },
      image: { phone: '5515998765432', type: 'image', url: 'https://example.com/image.jpg', caption: 'Foto' },
      audio: { phone: '5515998765432', type: 'audio', url: 'https://example.com/audio.mp3' },
      video: { phone: '5515998765432', type: 'video', url: 'https://example.com/video.mp4', caption: 'Vídeo' },
      document: { phone: '5515998765432', type: 'document', url: 'https://example.com/doc.pdf', filename: 'documento.pdf' }
    }
  })
} 