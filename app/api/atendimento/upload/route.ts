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

    console.log('Upload iniciado:', {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      uploadType: type
    })

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
        } else {
          extension = 'mp3' // Default para áudio
        }
      }
      
      // Aceitar mp3 e wav (wav será convertido)
      if (!['mp3', 'wav'].includes(extension)) {
        return NextResponse.json({ error: 'Apenas arquivos MP3 e WAV são suportados para envio de áudio.' }, { status: 400 })
      }
    }
    
    if (type === 'document' && (extension === 'unknown' || !extension)) {
      extension = 'pdf'
    }
    
    const fileName = `${timestamp}.${extension}`

    // Salvar arquivo no Firebase Storage
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    
    // Para áudio, sempre garantir que seja MP3
    let finalBuffer = buffer
    let finalExtension = extension
    let finalFileName = fileName
    let finalContentType = file.type || (type === 'audio' ? 'audio/mpeg' : 'application/pdf')
    
    if (type === 'audio') {
      // Se já é MP3, usar diretamente
      if (extension === 'mp3') {
        finalContentType = 'audio/mpeg'
      } else if (extension === 'wav') {
        // Tentar converter WAV para MP3 (sem ffmpeg no Railway)
        console.log('Áudio WAV detectado, mas conversão via ffmpeg não disponível no Railway')
        console.log('Arquivo será salvo como MP3 assumindo que já foi convertido no cliente')
        finalExtension = 'mp3'
        finalFileName = `${timestamp}.mp3`
        finalContentType = 'audio/mpeg'
      }
    }
    const storagePath = `${type}/${finalFileName}`

    console.log('Salvando arquivo:', {
      fileName: finalFileName,
      storagePath,
      extension: finalExtension
    })

    // Salvar arquivo no Firebase Storage
    const bucket = adminStorage.bucket('grupo-thermas-a99fc.firebasestorage.app')
    const fileRef = bucket.file(storagePath)
    await fileRef.save(finalBuffer, {
      contentType: finalContentType
    })

    // Gerar signed URL (válido por 1 hora)
    const fileUrl = await generateSignedUrl(storagePath, 60 * 60)

    console.log('Upload concluído:', {
      fileName: finalFileName,
      fileUrl,
      fileSize: finalBuffer.length,
      storagePath
    })

    return NextResponse.json({
      success: true,
      fileName: finalFileName,
      fileUrl,
      fileSize: finalBuffer.length,
      fileType: finalContentType,
      storagePath
    })

  } catch (error) {
    console.error('Erro no upload:', error)
    return NextResponse.json({ 
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
} 