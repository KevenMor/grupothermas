import { NextResponse, NextRequest } from 'next/server'
import { uploadToFirebaseStorage } from '@/lib/mediaUpload'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
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

    // Validar formato de áudio
    if (type === 'audio') {
      const fileExtension = file.name.split('.').pop()?.toLowerCase()
      const mimeType = file.type.toLowerCase()
      
      // Aceitar mp3, wav, ogg/opus, webm
      const supportedFormats = ['mp3', 'wav', 'ogg', 'opus', 'webm']
      const supportedMimeTypes = [
        'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 
        'audio/opus', 'audio/webm', 'audio/webm;codecs=opus'
      ]
      
      if (!supportedFormats.includes(fileExtension || '') && 
          !supportedMimeTypes.some(mime => mimeType.includes(mime))) {
        return NextResponse.json({ 
          error: 'Formato de áudio não suportado. Use MP3, WAV, OGG, Opus ou WebM.' 
        }, { status: 400 })
      }
    }

    // Converter arquivo para buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    
    // Fazer upload usando a nova utility
    const uploadResult = await uploadToFirebaseStorage(
      buffer,
      file.name,
      file.type,
      type as 'image' | 'audio' | 'video' | 'document'
    )

    if (!uploadResult.success) {
      return NextResponse.json({ 
        error: uploadResult.error || 'Erro no upload para Firebase Storage'
      }, { status: 500 })
    }

    console.log('=== UPLOAD CONCLUÍDO ===')
    console.log('FileName:', uploadResult.fileName)
    console.log('FileUrl:', uploadResult.fileUrl)
    console.log('FileSize:', uploadResult.fileSize)
    console.log('StoragePath:', uploadResult.storagePath)
    if (uploadResult.convertedFrom) {
      console.log('ConvertedFrom:', uploadResult.convertedFrom)
    }

    return NextResponse.json({
      success: true,
      fileName: uploadResult.fileName,
      fileUrl: uploadResult.fileUrl,
      fileSize: uploadResult.fileSize,
      fileType: uploadResult.fileType,
      storagePath: uploadResult.storagePath,
      convertedFrom: uploadResult.convertedFrom,
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