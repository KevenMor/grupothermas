import { NextRequest, NextResponse } from 'next/server'
import { adminDB } from '@/lib/firebaseAdmin'
import { Reaction } from '@/lib/models'
import { sendReaction } from '@/lib/zapi'

interface ReactionRequest {
  action: 'add' | 'remove'
  phone: string
  messageId: string
  emoji: string
  agentName?: string
  agentId?: string
}

export async function POST(request: NextRequest) {
  try {
    const { action, phone, messageId, emoji, agentName, agentId }: ReactionRequest = await request.json()
    
    console.log('=== GERENCIANDO REAÇÃO ===')
    console.log('Action:', action)
    console.log('Phone:', phone)
    console.log('MessageId:', messageId)
    console.log('Emoji:', emoji)
    console.log('AgentName:', agentName)
    console.log('AgentId:', agentId)
    
    if (!action || !phone || !messageId || !emoji) {
      return NextResponse.json({ 
        error: 'Action, phone, messageId e emoji são obrigatórios'
      }, { status: 400 })
    }

    // Validar emoji
    const validEmojis = ['👍', '❤️', '😂', '😮', '😢', '🙏']
    if (!validEmojis.includes(emoji)) {
      return NextResponse.json({ 
        error: 'Emoji não suportado. Use apenas: 👍, ❤️, 😂, 😮, 😢, 🙏'
      }, { status: 400 })
    }

    const conversationRef = adminDB.collection('conversations').doc(phone)
    const messageRef = conversationRef.collection('messages').doc(messageId)
    
    // Verificar se a mensagem existe
    const messageDoc = await messageRef.get()
    if (!messageDoc.exists) {
      return NextResponse.json({ 
        error: 'Mensagem não encontrada'
      }, { status: 404 })
    }

    const messageData = messageDoc.data()
    const currentReactions: Reaction[] = messageData?.reactions || []

    if (action === 'add') {
      // Verificar se já existe uma reação do mesmo agente para o mesmo emoji
      const existingReactionIndex = currentReactions.findIndex(
        r => r.agentId === agentId && r.emoji === emoji
      )

      if (existingReactionIndex !== -1) {
        return NextResponse.json({ 
          error: 'Você já reagiu com este emoji'
        }, { status: 400 })
      }

      // Enviar reação via Z-API
      const zapiResult = await sendReaction(phone, messageId, emoji)
      
      if (!zapiResult.success) {
        console.error('Erro ao enviar reação via Z-API:', zapiResult.error)
        return NextResponse.json({ 
          error: 'Falha ao enviar reação via Z-API',
          details: zapiResult.error
        }, { status: 500 })
      }

      // Criar nova reação
      const newReaction: Reaction = {
        emoji: emoji,
        by: agentName || 'Atendente',
        fromMe: true,
        timestamp: new Date().toISOString(),
        agentId: agentId
      }

      // Adicionar reação ao array
      await messageRef.update({
        reactions: adminDB.FieldValue.arrayUnion(newReaction)
      })

      console.log('Reação adicionada com sucesso')

      return NextResponse.json({
        success: true,
        message: 'Reação adicionada com sucesso',
        reaction: newReaction,
        zapiResult: zapiResult
      })

    } else if (action === 'remove') {
      // Encontrar reação para remover
      const reactionToRemove = currentReactions.find(
        r => r.agentId === agentId && r.emoji === emoji
      )

      if (!reactionToRemove) {
        return NextResponse.json({ 
          error: 'Reação não encontrada'
        }, { status: 404 })
      }

      // Remover reação do array
      await messageRef.update({
        reactions: adminDB.FieldValue.arrayRemove(reactionToRemove)
      })

      console.log('Reação removida com sucesso')

      return NextResponse.json({
        success: true,
        message: 'Reação removida com sucesso',
        removedReaction: reactionToRemove
      })

    } else {
      return NextResponse.json({ 
        error: 'Ação inválida. Use "add" ou "remove"'
      }, { status: 400 })
    }

  } catch (error) {
    console.error('Erro ao gerenciar reação:', error)
    return NextResponse.json({ 
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
} 