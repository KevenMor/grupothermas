import { NextResponse, NextRequest } from 'next/server'
import { adminDB } from '@/lib/firebaseAdmin'

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
          const zapiInstanceId = process.env.ZAPI_INSTANCE_ID
          const zapiToken = process.env.ZAPI_TOKEN
          
          if (zapiInstanceId && zapiToken) {
            const headers: Record<string, string> = { 'Content-Type': 'application/json' }
            if (process.env.ZAPI_CLIENT_TOKEN) {
              headers['Client-Token'] = process.env.ZAPI_CLIENT_TOKEN
            }

            const replyText = `📝 Respondendo: "${originalMessage.data()?.content?.substring(0, 50)}..."\n\n${content}`

            await fetch(`https://api.z-api.io/instances/${zapiInstanceId}/token/${zapiToken}/send-text`, {
              method: 'POST',
              headers,
              body: JSON.stringify({ phone, message: replyText })
            })

            await replyRef.update({ status: 'sent' })
          }
        } catch (error) {
          await replyRef.update({ status: 'failed' })
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