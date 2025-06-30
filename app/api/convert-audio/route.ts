import { NextRequest, NextResponse } from 'next/server'
import { Readable } from 'stream'
import { spawn } from 'child_process'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    // Verifica se é multipart/form-data
    const contentType = request.headers.get('content-type') || ''
    if (!contentType.includes('multipart/form-data')) {
      return NextResponse.json({ error: 'Content-Type deve ser multipart/form-data' }, { status: 400 })
    }

    // Extrai o arquivo do form-data
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    if (!file) {
      return NextResponse.json({ error: 'Arquivo não enviado' }, { status: 400 })
    }

    // Cria stream do arquivo recebido
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const fileStream = Readable.from(fileBuffer);

    // Prepara o comando ffmpeg para converter para mp3
    const ffmpeg = spawn('ffmpeg', [
      '-i', 'pipe:0', // entrada do stdin
      '-f', 'mp3',
      '-ab', '128k',
      '-ar', '44100',
      '-ac', '2',
      'pipe:1' // saída no stdout
    ])

    // Pipe do arquivo para o ffmpeg
    fileStream.pipe(ffmpeg.stdin)

    // Captura a saída do ffmpeg
    const chunks: Buffer[] = []
    let ffmpegError = ''
    ffmpeg.stdout.on('data', (chunk) => chunks.push(chunk))

    // Captura erros do ffmpeg
    ffmpeg.stderr.on('data', (data) => {
      ffmpegError += data.toString()
    })

    // Quando terminar, retorna o arquivo mp3
    const code: number = await new Promise((resolve) => {
      ffmpeg.on('close', resolve)
    })
    if (code === 0) {
      const mp3Buffer = Buffer.concat(chunks)
      // Salvar arquivo convertido em public/uploads/audio/
      const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'audio')
      await mkdir(uploadDir, { recursive: true })
      const fileName = `audio_${Date.now()}.mp3`
      const filePath = path.join(uploadDir, fileName)
      await writeFile(filePath, mp3Buffer)
      // Retornar URL relativa para o frontend
      const url = `/uploads/audio/${fileName}`
      return NextResponse.json({ url }, { status: 200 })
    } else {
      return NextResponse.json({ error: 'Erro na conversão', details: ffmpegError }, { status: 500 })
    }
  } catch (error: any) {
    return NextResponse.json({ error: 'Erro interno', details: error.message }, { status: 500 })
  }
}

export async function OPTIONS() {
  // Permitir CORS pré-flight
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    }
  })
} 