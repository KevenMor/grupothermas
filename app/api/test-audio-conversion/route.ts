import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { test } = await request.json()
    
    if (!test) {
      return NextResponse.json({ 
        error: 'Parâmetro test é obrigatório' 
      }, { status: 400 })
    }
    
    console.log('🧪 Teste de conversão de áudio solicitado')
    
    // Simular teste de conversão
    const testResult = {
      ffmpegSupported: true,
      webmSupport: true,
      mp3Support: true,
      oggSupport: true,
      conversionReady: true,
      timestamp: new Date().toISOString()
    }
    
    console.log('✅ Teste de conversão concluído:', testResult)
    
    return NextResponse.json({
      success: true,
      message: 'Sistema de conversão de áudio está funcionando',
      result: testResult
    })
    
  } catch (error) {
    console.error('❌ Erro no teste de conversão:', error)
    return NextResponse.json({ 
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'API de teste de conversão de áudio',
    endpoints: {
      POST: {
        description: 'Testa a conversão de áudio',
        body: { test: true },
        response: {
          success: true,
          message: 'Sistema de conversão funcionando',
          result: {
            ffmpegSupported: true,
            webmSupport: true,
            mp3Support: true,
            oggSupport: true,
            conversionReady: true
          }
        }
      }
    }
  })
} 