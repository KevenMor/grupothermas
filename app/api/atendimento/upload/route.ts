import { NextResponse, NextRequest } from 'next/server'
import { adminStorage, generateSignedUrl } from '@/lib/firebaseAdmin'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    if (!adminStorage) {
      return NextResponse.json({ error: 'Firebase Storage não inicializado no backend.' }, { status: 500 })
    }
    const formData = await request.formData()
    const file = formData.get('file') as File
    const type = formData.get('type') as string

    if (!file) {
      return NextResponse.json({ error: 'Nenhum arquivo enviado' }, { status: 400 })
    }

    // Validar tipo de arquivo
    const allowedTypes = ['image', 'audio', 'video', 'document']
    if (!allowedTypes.includes(type)) {
      return NextResponse.json({ error: 'Tipo de arquivo não permitido' }, { status: 400 })
    }

    console.log('=== UPLOAD INICIADO ===')
    console.log('FileName:', file.name)
    console.log('FileSize:', file.size)
    console.log('FileType:', file.type)
    console.log('UploadType:', type)

    // Gerar nome único para o arquivo
    const timestamp = Date.now()
    let extension = file.name.split('.').pop()?.toLowerCase() || 'unknown'
    
    // Para áudio, detectar extensão baseada no tipo MIME se necessário
    if (type === 'audio') {
      if (!extension || extension === 'unknown') {
        // Detectar extensão baseada no tipo MIME
        if (file.type.includes('mp3') || file.type.includes('mpeg')) {
          extension = 'mp3'
        } else if (file.type.includes('wav')) {
          extension = 'wav'
        } else if (file.type.includes('ogg') || file.type.includes('opus')) {
          extension = 'ogg'
        } else {
          extension = 'mp3' // Default para áudio
        }
      }
      
      // Aceitar mp3, wav, ogg/opus
      if (!['mp3', 'wav', 'ogg', 'opus'].includes(extension)) {
        return NextResponse.json({ error: 'Apenas arquivos MP3, WAV, OGG ou Opus são suportados para envio de áudio.' }, { status: 400 })
      }
    }
    
    if (type === 'document' && (extension === 'unknown' || !extension)) {
      extension = 'pdf'
    }
    
    const fileName = `${timestamp}.${extension}`

    // Para áudio, converter para mp3 se necessário (exemplo simplificado)
    if (type === 'audio' && extension !== 'mp3' && extension !== 'ogg') {
      // Aqui você pode adicionar lógica de conversão real se necessário
      // Exemplo: usar ffmpeg ou biblioteca de conversão
      // Por enquanto, apenas loga
      console.warn('Áudio não está em mp3/ogg. Recomenda-se converter antes do upload.')
    }
    
    // Salvar arquivo no Firebase Storage
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    
    // Para áudio, manter formato original
    let finalBuffer = buffer
    let finalExtension = extension
    let finalFileName = fileName
    let finalContentType = file.type || (type === 'audio' ? 'audio/mpeg' : 'application/pdf')
    
    if (type === 'audio') {
      // Manter formato original, não converter
      if (extension === 'mp3') {
        finalContentType = 'audio/mpeg'
      } else if (extension === 'wav') {
        finalContentType = 'audio/wav'
      } else if (extension === 'ogg') {
        finalContentType = 'audio/ogg'
      } else if (extension === 'opus') {
        finalContentType = 'audio/opus'
      }
    }
    const storagePath = `${type}/${finalFileName}`

    console.log('Salvando arquivo no Firebase Storage:', {
      fileName: finalFileName,
      storagePath,
      extension: finalExtension,
      contentType: finalContentType,
      fileSize: finalBuffer.length
    })

    // Salvar arquivo no Firebase Storage
    const bucket = adminStorage.bucket('grupo-thermas-a99fc.firebasestorage.app')
    const fileRef = bucket.file(storagePath)
    await fileRef.save(finalBuffer, {
      contentType: finalContentType,
      metadata: {
        originalFileName: file.name,
        uploadType: type,
        uploadedAt: new Date().toISOString(),
        fileSize: finalBuffer.length
      }
    })

    // FLUXO OBRIGATÓRIO: Gerar URL pública (signed URL válida por 1 ano)
    const fileUrl = await generateSignedUrl(storagePath, 365 * 24 * 60 * 60) // 1 ano
    console.log('URL pública gerada:', fileUrl)

    console.log('=== UPLOAD CONCLUÍDO ===')
    console.log('FileName:', finalFileName)
    console.log('FileUrl:', fileUrl)
    console.log('FileSize:', finalBuffer.length)
    console.log('StoragePath:', storagePath)

    return NextResponse.json({
      success: true,
      fileName: finalFileName,
      fileUrl, // URL pública do Firebase Storage
      fileSize: finalBuffer.length,
      fileType: finalContentType,
      storagePath,
      message: 'Arquivo salvo no Firebase Storage com sucesso!'
    })

  } catch (error) {
    console.error('Erro no upload:', error)
    return NextResponse.json({ 
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
} 