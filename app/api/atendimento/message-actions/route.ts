import { NextResponse, NextRequest } from 'next/server'
import { adminDB } from '@/lib/firebaseAdmin'
import { replyMessage } from '@/lib/zapi'

export const runtime = 'nodejs'

// POST - Executar ações nas mensagens
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, chatId, messageId, content, phone } = body

    if (!action || !chatId || !messageId) {
      return NextResponse.json({ error: 'Parâmetros obrigatórios: action, chatId, messageId' }, { status: 400 })
    }

    const messageRef = adminDB
      .collection('conversations')
      .doc(chatId)
      .collection('messages')
      .doc(messageId)

    switch (action) {
      case 'reply':
        // Implementar resposta à mensagem
        if (!content || !phone) {
          return NextResponse.json({ error: 'Content e phone são obrigatórios para reply' }, { status: 400 })
        }

        // Buscar mensagem original
        const originalMessage = await messageRef.get()
        if (!originalMessage.exists) {
          return NextResponse.json({ error: 'Mensagem não encontrada' }, { status: 404 })
        }

        // Criar mensagem de resposta
        const replyMessage = {
          content,
          timestamp: new Date().toISOString(),
          role: 'agent',
          status: 'sending',
          replyTo: messageId,
          replyToContent: originalMessage.data()?.content
        }

        const replyRef = await adminDB
          .collection('conversations')
          .doc(chatId)
          .collection('messages')
          .add(replyMessage)

        // Enviar via Z-API com contexto de resposta
        try {
          // Usar a nova função replyMessage
          const result = await replyMessage(
            phone, 
            messageId, 
            content, 
            body.userName || 'Atendente'
          )
          
          if (result.success) {
            await replyRef.update({ 
              status: 'sent',
              zapiMessageId: result.messageId || null
            })
          } else {
            throw new Error(result.error || 'Erro ao enviar resposta')
          }
        } catch (error) {
          console.error('Erro ao enviar resposta:', error)
          await replyRef.update({ status: 'failed' })
          return NextResponse.json({ 
            error: 'Falha ao enviar resposta',
            details: error instanceof Error ? error.message : 'Erro desconhecido'
          }, { status: 500 })
        }

        return NextResponse.json({ success: true, messageId: replyRef.id })

      case 'edit':
        // Implementar edição de mensagem
        if (!content) {
          return NextResponse.json({ error: 'Content é obrigatório para edit' }, { status: 400 })
        }

        const messageDoc = await messageRef.get()
        if (!messageDoc.exists) {
          return NextResponse.json({ error: 'Mensagem não encontrada' }, { status: 404 })
        }

        const messageData = messageDoc.data()
        if (messageData?.role !== 'agent' && messageData?.role !== 'ai') {
          return NextResponse.json({ error: 'Só é possível editar mensagens da empresa' }, { status: 403 })
        }

        await messageRef.update({
          content,
          editedAt: new Date().toISOString(),
          edited: true
        })

        return NextResponse.json({ success: true })

      case 'delete':
        // Implementar exclusão de mensagem
        const deleteDoc = await messageRef.get()
        if (!deleteDoc.exists) {
          return NextResponse.json({ error: 'Mensagem não encontrada' }, { status: 404 })
        }

        const deleteData = deleteDoc.data()
        if (deleteData?.role !== 'agent' && deleteData?.role !== 'ai') {
          return NextResponse.json({ error: 'Só é possível excluir mensagens da empresa' }, { status: 403 })
        }

        // Excluir via Z-API se tiver messageId da Z-API
        const zapiMessageId = deleteData?.zapiMessageId
        if (zapiMessageId) {
          try {
            // Buscar configurações da Z-API do Firebase
            const configDoc = await adminDB.collection('admin_config').doc('ai_settings').get()
            
            if (configDoc.exists) {
              const config = configDoc.data()!
              
              if (config.zapiApiKey && config.zapiInstanceId) {
                const headers: Record<string, string> = { 'Content-Type': 'application/json' }
                if (config.zapiClientToken && config.zapiClientToken.trim()) {
                  headers['Client-Token'] = config.zapiClientToken.trim()
                }

                // Deletar via Z-API
                const deleteUrl = `https://api.z-api.io/instances/${config.zapiInstanceId}/token/${config.zapiApiKey}/messages?messageId=${zapiMessageId}&phone=${phone}&owner=true`
                
                const zapiResponse = await fetch(deleteUrl, {
                  method: 'DELETE',
                  headers
                })

                if (zapiResponse.ok) {
                  console.log('Mensagem excluída do WhatsApp via Z-API')
                } else {
                  console.warn('Erro ao excluir mensagem do WhatsApp:', await zapiResponse.text())
                }
              }
            }
          } catch (error) {
            console.warn('Erro ao tentar excluir via Z-API:', error)
            // Continua com a exclusão local mesmo se falhar na Z-API
          }
        }

        // Marcar como excluída no sistema
        await messageRef.update({
          deleted: true,
          deletedAt: new Date().toISOString(),
          content: '[Mensagem excluída]'
        })

        return NextResponse.json({ success: true })

      case 'info':
        // Implementar informações da mensagem
        const infoDoc = await messageRef.get()
        if (!infoDoc.exists) {
          return NextResponse.json({ error: 'Mensagem não encontrada' }, { status: 404 })
        }

        const infoData = infoDoc.data()
        const messageInfo = {
          id: messageId,
          content: infoData?.content,
          timestamp: infoData?.timestamp,
          role: infoData?.role,
          status: infoData?.status,
          edited: infoData?.edited || false,
          editedAt: infoData?.editedAt,
          deleted: infoData?.deleted || false,
          deletedAt: infoData?.deletedAt,
          agentName: infoData?.agentName,
          userName: infoData?.userName
        }

        return NextResponse.json(messageInfo)

      default:
        return NextResponse.json({ error: 'Ação não reconhecida' }, { status: 400 })
    }

  } catch (error) {
    console.error('Erro ao executar ação da mensagem:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
} 