import { NextRequest, NextResponse } from 'next/server'
import { adminDB } from '@/lib/firebaseAdmin'

export async function GET(
  request: NextRequest,
  context: { params: any }
) {
  try {
    const { sessionId } = context.params
    // Buscar todas as mensagens da sessão para agrupar por contato
    const messagesSnapshot = await adminDB
      .collection('whatsapp_messages')
      .where('sessionId', '==', sessionId)
      .orderBy('timestamp', 'desc')
      .get()

    // Agrupar mensagens por contato
    const contactsMap = new Map()

    messagesSnapshot.docs.forEach((doc: any) => {
      const message = doc.data()
      const contactId = message.fromMe ? message.to : message.from
      
      if (!contactsMap.has(contactId)) {
        contactsMap.set(contactId, {
          id: contactId,
          phone: contactId,
          name: contactId.replace(/^\+55/, ''), // Remove código do país para exibição
          lastMessage: message.body,
          lastMessageTime: message.timestamp,
          unreadCount: 0,
          messageCount: 0
        })
      }

      const contact = contactsMap.get(contactId)
      contact.messageCount++
      
      // Contar mensagens não lidas (apenas mensagens recebidas)
      if (!message.fromMe && message.status !== 'read') {
        contact.unreadCount++
      }

      // Atualizar última mensagem se for mais recente
      if (message.timestamp > contact.lastMessageTime) {
        contact.lastMessage = message.body
        contact.lastMessageTime = message.timestamp
      }
    })

    const contacts = Array.from(contactsMap.values())
      .sort((a, b) => b.lastMessageTime - a.lastMessageTime)

    return NextResponse.json({ contacts })
  } catch (error) {
    console.error('Erro ao buscar contatos:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
} 