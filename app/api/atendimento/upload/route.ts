import { NextResponse, NextRequest } from 'next/server'
import { adminStorage, generateSignedUrl } from '@/lib/firebaseAdmin'
import ffmpeg from 'fluent-ffmpeg'
import { tmpdir } from 'os'
import { writeFile, unlink } from 'fs/promises'
import path from 'path'
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg'

ffmpeg.setFfmpegPath(ffmpegInstaller.path)

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

    // Salvar arquivo no Firebase Storage
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    // Conversão automática de áudio para mp3 se necessário
    let finalBuffer = buffer
    let finalExtension = extension
    let finalFileName = fileName
    let finalContentType = file.type || 'application/pdf'
    if (type === 'audio' && extension === 'wav') {
      // Converter para mp3 usando ffmpeg
      const tmpWav = path.join(tmpdir(), `${timestamp}.wav`)
      const tmpMp3 = path.join(tmpdir(), `${timestamp}.mp3`)
      await writeFile(tmpWav, buffer)
      await new Promise((resolve, reject) => {
        ffmpeg(tmpWav)
          .toFormat('mp3')
          .on('end', resolve)
          .on('error', reject)
          .save(tmpMp3)
      })
      finalBuffer = await import('fs').then(fs => fs.readFileSync(tmpMp3))
      finalExtension = 'mp3'
      finalFileName = `${timestamp}.mp3`
      finalContentType = 'audio/mpeg'
      await unlink(tmpWav)
      await unlink(tmpMp3)
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