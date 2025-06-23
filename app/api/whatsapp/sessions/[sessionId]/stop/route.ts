import { NextRequest, NextResponse } from 'next/server'
import whatsappManager from '@/lib/whatsappManager'

export async function POST(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const { sessionId } = params

    if (!sessionId) {
      return NextResponse.json(
        { error: 'ID da sessão é obrigatório' },
        { status: 400 }
      )
    }

    await whatsappManager.stopSession(sessionId)

    return NextResponse.json({ 
      message: 'Sessão parada com sucesso',
      sessionId 
    })
  } catch (error) {
    console.error('Erro ao parar sessão:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro interno do servidor' },
      { status: 500 }
    )
  }
} 