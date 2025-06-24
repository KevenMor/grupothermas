import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    // Reconstruir a URL original
    const originalUrl = decodeURIComponent(params.path.join('/'))
    
    // Validar se é uma URL válida
    if (!originalUrl.startsWith('http')) {
      return NextResponse.json({ error: 'URL inválida' }, { status: 400 })
    }

    console.log('Fazendo proxy de mídia:', originalUrl)

    // Fazer download do arquivo
    const response = await fetch(originalUrl)
    
    if (!response.ok) {
      return NextResponse.json({ 
        error: 'Erro ao baixar mídia',
        status: response.status 
      }, { status: response.status })
    }

    // Obter o tipo de conteúdo
    const contentType = response.headers.get('content-type') || 'application/octet-stream'
    
    // Obter o buffer do arquivo
    const buffer = await response.arrayBuffer()

    // Retornar o arquivo com os headers corretos
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000', // Cache por 1 ano
        'Access-Control-Allow-Origin': '*',
      },
    })

  } catch (error) {
    console.error('Erro no proxy de mídia:', error)
    return NextResponse.json({ 
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 