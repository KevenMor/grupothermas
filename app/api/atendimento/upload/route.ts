import { NextResponse, NextRequest } from 'next/server'
import { uploadToFirebaseStorage } from '@/lib/mediaUpload'
import ffmpeg from 'fluent-ffmpeg'
import ffmpegPath from 'ffmpeg-static'
import os from 'os'
import path from 'path'
import fs from 'fs/promises'

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

    // --- NOVO: Fallback para conversão backend se áudio for webm/opus ---
    let uploadBuffer: Buffer = Buffer.from(await file.arrayBuffer())
    let uploadName: string = file.name
    let uploadMime: string = file.type
    let convertedFrom: string | undefined = undefined

    if (type === 'audio') {
      const fileExtension = file.name.split('.').pop()?.toLowerCase()
      const mimeType = file.type.toLowerCase()
      const isWebmOrOpus = (fileExtension === 'webm' || fileExtension === 'opus' || mimeType.includes('webm') || mimeType.includes('opus'))
      if (isWebmOrOpus) {
        // Salvar arquivo temporário
        const tmpDir = os.tmpdir()
        const inputPath = path.join(tmpDir, `input_${Date.now()}.webm`)
        const outputPath = path.join(tmpDir, `output_${Date.now()}.mp3`)
        await fs.writeFile(inputPath, uploadBuffer)
        try {
          await new Promise((resolve, reject) => {
            ffmpeg()
              .setFfmpegPath(ffmpegPath as string)
              .input(inputPath)
              .audioCodec('libmp3lame')
              .audioBitrate('128k')
              .audioChannels(1)
              .audioFrequency(22050)
              .outputOptions('-y')
              .on('end', resolve)
              .on('error', reject)
              .save(outputPath)
          })
          const mp3Buffer = await fs.readFile(outputPath)
          uploadBuffer = mp3Buffer
          uploadName = file.name.replace(/\.(webm|opus)$/i, '.mp3')
          uploadMime = 'audio/mpeg'
          convertedFrom = file.name
        } catch (err) {
          await fs.unlink(inputPath).catch(() => {})
          await fs.unlink(outputPath).catch(() => {})
          return NextResponse.json({ error: 'Falha ao converter áudio para MP3 no backend', details: err instanceof Error ? err.message : err }, { status: 500 })
        }
        await fs.unlink(inputPath).catch(() => {})
        await fs.unlink(outputPath).catch(() => {})
      }
    }

    // Fazer upload usando a nova utility
    const uploadResult = await uploadToFirebaseStorage(
      uploadBuffer,
      uploadName,
      uploadMime,
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
    if (convertedFrom) {
      console.log('ConvertedFrom:', convertedFrom)
    }

    return NextResponse.json({
      success: true,
      fileName: uploadResult.fileName,
      fileUrl: uploadResult.fileUrl,
      fileSize: uploadResult.fileSize,
      fileType: uploadResult.fileType,
      storagePath: uploadResult.storagePath,
      convertedFrom,
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