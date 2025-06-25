import { NextResponse, NextRequest } from 'next/server'
import { adminStorage } from '@/lib/firebaseAdmin'

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
    if (type === 'audio' && (!extension || extension === 'unknown')) {
      extension = 'wav'
    }
    if (type === 'document' && extension === 'unknown') {
      extension = 'pdf'
    }
    const fileName = `${timestamp}.${extension}`
    const storagePath = `${type}/${fileName}`

    console.log('Salvando arquivo:', {
      fileName,
      storagePath,
      extension
    })

    // Salvar arquivo no Firebase Storage
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const bucket = adminStorage.bucket('grupo-thermas-a99fc.firebasestorage.app')
    const fileRef = bucket.file(storagePath)
    await fileRef.save(buffer, {
      contentType: file.type || 'application/pdf'
    })

    // Gerar URL pública
    const fileUrl = `https://firebasestorage.googleapis.com/v0/b/grupo-thermas-a99fc.appspot.com/o/${encodeURIComponent(storagePath)}?alt=media`

    console.log('Upload concluído:', {
      fileName,
      fileUrl,
      fileSize: file.size,
      storagePath
    })

    return NextResponse.json({
      success: true,
      fileName,
      fileUrl,
      fileSize: file.size,
      fileType: file.type,
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