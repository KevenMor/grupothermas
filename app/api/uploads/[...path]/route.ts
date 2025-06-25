import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    // Aguardar params (Promise no Next.js 15+)
    const resolvedParams = await params
    
    // Reconstruir o caminho do arquivo
    const filePath = resolvedParams.path.join('/')
    
    // Validar se o caminho é seguro (não permite acesso a outros diretórios)
    if (filePath.includes('..') || filePath.startsWith('/')) {
      return NextResponse.json({ error: 'Caminho inválido' }, { status: 400 })
    }

    // Caminho completo para o arquivo na pasta uploads
    const fullPath = join(process.cwd(), 'public', 'uploads', filePath)
    
    console.log('Servindo arquivo:', {
      requestedPath: filePath,
      fullPath,
      exists: existsSync(fullPath)
    })

    // Verificar se o arquivo existe
    if (!existsSync(fullPath)) {
      return NextResponse.json({ 
        error: 'Arquivo não encontrado',
        path: filePath
      }, { status: 404 })
    }

    // Ler o arquivo
    const fileBuffer = await readFile(fullPath)
    
    // Determinar o tipo de conteúdo baseado na extensão
    const extension = filePath.split('.').pop()?.toLowerCase()
    let contentType = 'application/octet-stream'
    
    switch (extension) {
      case 'pdf':
        contentType = 'application/pdf'
        break
      case 'jpg':
      case 'jpeg':
        contentType = 'image/jpeg'
        break
      case 'png':
        contentType = 'image/png'
        break
      case 'gif':
        contentType = 'image/gif'
        break
      case 'webp':
        contentType = 'image/webp'
        break
      case 'mp3':
        contentType = 'audio/mpeg'
        break
      case 'wav':
        contentType = 'audio/wav'
        break
      case 'ogg':
        contentType = 'audio/ogg'
        break
      case 'mp4':
        contentType = 'video/mp4'
        break
      case 'doc':
        contentType = 'application/msword'
        break
      case 'docx':
        contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        break
      case 'txt':
        contentType = 'text/plain'
        break
    }

    // Retornar o arquivo com os headers corretos
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000', // Cache por 1 ano
        'Access-Control-Allow-Origin': '*',
        'Content-Disposition': `inline; filename="${filePath.split('/').pop()}"`,
      },
    })

  } catch (error) {
    console.error('Erro ao servir arquivo:', error)
    return NextResponse.json({ 
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 