import { NextRequest, NextResponse } from 'next/server'
import { adminDB } from '@/lib/firebaseAdmin'
import { Reaction } from '@/lib/models'
import { sendReaction } from '@/lib/zapi'

interface SendReactionRequest {
  phone: string
  messageId: string
  emoji: string
  agentName?: string
  agentId?: string
}

export async function POST(request: NextRequest) {
  try {
    const { phone, messageId, emoji, agentName, agentId }: SendReactionRequest = await request.json()
    
    console.log('=== ENVIANDO REAÇÃO ===')
    console.log('Phone:', phone)
    console.log('MessageId:', messageId)
    console.log('Emoji:', emoji)
    console.log('AgentName:', agentName)
    console.log('AgentId:', agentId)
    
    if (!phone || !messageId || !emoji) {
      return NextResponse.json({ 
        error: 'Phone, messageId e emoji são obrigatórios'
      }, { status: 400 })
    }

    // Validar emoji
    const validEmojis = ['👍', '❤️', '😂', '😮', '😢', '🙏']
    if (!validEmojis.includes(emoji)) {
      return NextResponse.json({ 
        error: 'Emoji não suportado. Use apenas: 👍, ❤️, 😂, 😮, 😢, 🙏'
      }, { status: 400 })
    }

    // Enviar reação via Z-API usando a nova função
    const zapiResult = await sendReaction(phone, messageId, emoji)
    
    if (!zapiResult.success) {
      console.error('Erro ao enviar reação via Z-API:', zapiResult.error)
      return NextResponse.json({ 
        error: 'Falha ao enviar reação via Z-API',
        details: zapiResult.error
      }, { status: 500 })
    }

    console.log('Reação enviada com sucesso via Z-API:', zapiResult)

    // Salvar reação no Firestore
    try {
      const conversationRef = adminDB.collection('conversations').doc(phone)
      const messageRef = conversationRef.collection('messages').doc(messageId)
      
      // Verificar se a mensagem existe
      const messageDoc = await messageRef.get()
      if (!messageDoc.exists) {
        console.warn('Mensagem não encontrada no Firestore:', messageId)
        // Não falhar aqui, apenas logar o warning
      } else {
        // Criar objeto de reação
        const reaction: Reaction = {
          emoji: emoji,
          by: agentName || 'Atendente',
          fromMe: true,
          timestamp: new Date().toISOString(),
          agentId: agentId
        }

        // Adicionar reação ao array de reações da mensagem
        await messageRef.update({
          reactions: adminDB.FieldValue.arrayUnion(reaction)
        })

        console.log('Reação salva no Firestore com sucesso')
      }

      return NextResponse.json({
        success: true,
        message: 'Reação enviada com sucesso',
        reaction: {
          emoji: emoji,
          by: agentName || 'Atendente',
          fromMe: true,
          timestamp: new Date().toISOString(),
          agentId: agentId
        },
        zapiResult: zapiResult
      })

    } catch (firestoreError) {
      console.error('Erro ao salvar reação no Firestore:', firestoreError)
      // Mesmo com erro no Firestore, retorna sucesso se Z-API funcionou
      return NextResponse.json({
        success: true,
        message: 'Reação enviada via Z-API, mas erro ao salvar no histórico',
        warning: 'Reação enviada mas não salva no histórico',
        firestoreError: firestoreError instanceof Error ? firestoreError.message : 'Unknown error'
      })
    }

  } catch (error) {
    console.error('Erro geral no envio de reação:', error)
    return NextResponse.json({ 
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
} 