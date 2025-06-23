import { NextRequest, NextResponse } from 'next/server'
import { adminDB } from '@/lib/firebaseAdmin'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const { chatId, action, agentId } = await request.json()

    if (!chatId || !action) {
      return NextResponse.json(
        { error: 'ChatId e action são obrigatórios' },
        { status: 400 }
      )
    }

    const chatRef = adminDB.collection('conversations').doc(chatId)
    const timestamp = new Date().toISOString()

    let updateData: any = {}

    switch (action) {
      case 'pause_ai':
        updateData = {
          aiPaused: true,
          conversationStatus: 'agent_assigned',
          pausedAt: timestamp,
          pausedBy: agentId || 'unknown'
        }
        break

      case 'resume_ai':
      case 'return_to_ai':
        updateData = {
          aiPaused: false,
          aiEnabled: true,
          conversationStatus: 'ai_active',
          assignedAgent: null,
          pausedAt: null,
          pausedBy: null
        }
        break

      case 'assume_chat':
        updateData = {
          aiPaused: true,
          conversationStatus: 'agent_assigned',
          assignedAgent: agentId || 'unknown',
          pausedAt: timestamp,
          pausedBy: agentId || 'unknown',
          transferHistory: {
            from: 'ai',
            to: 'agent',
            agentId: agentId || 'unknown',
            timestamp,
            reason: 'Agent assumed chat'
          }
        }
        break

      case 'assign_agent':
        updateData = {
          aiPaused: true,
          conversationStatus: 'agent_assigned',
          assignedAgent: agentId || 'unknown',
          pausedAt: timestamp,
          pausedBy: agentId || 'unknown'
        }
        break

      case 'mark_resolved':
        updateData = {
          conversationStatus: 'resolved',
          aiPaused: true,
          resolvedAt: timestamp,
          resolvedBy: agentId || 'unknown'
        }
        break

      case 'reopen_chat':
        updateData = {
          conversationStatus: 'ai_active',
          aiEnabled: true,
          aiPaused: false,
          assignedAgent: null,
          resolvedAt: null,
          resolvedBy: null
        }
        break

      default:
        return NextResponse.json(
          { error: 'Ação inválida' },
          { status: 400 }
        )
    }

    await chatRef.update(updateData)

    return NextResponse.json({ 
      success: true, 
      message: 'Status atualizado com sucesso',
      data: updateData
    })

  } catch (error) {
    console.error('Erro ao atualizar controle de IA:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
} 