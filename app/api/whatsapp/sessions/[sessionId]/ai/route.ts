import { NextRequest, NextResponse } from 'next/server'
import whatsappManager from '@/lib/whatsappManager'

export async function PUT(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const { sessionId } = params
    const { aiEnabled, n8nWebhook, aiConfig } = await request.json()

    if (!sessionId) {
      return NextResponse.json(
        { error: 'ID da sessão é obrigatório' },
        { status: 400 }
      )
    }

    await whatsappManager.updateAISettings(sessionId, aiEnabled, n8nWebhook, aiConfig)

    return NextResponse.json({ 
      message: 'Configurações de IA atualizadas com sucesso',
      sessionId,
      aiEnabled,
      n8nWebhook
    })
  } catch (error) {
    console.error('Erro ao atualizar configurações de IA:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro interno do servidor' },
      { status: 500 }
    )
  }
} 