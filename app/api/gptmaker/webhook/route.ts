import { NextRequest, NextResponse } from 'next/server'
import { adminDB } from '@/lib/firebaseAdmin'
import crypto from 'crypto'

const WEBHOOK_SECRET = process.env.GPTMAKER_WEBHOOK_SECRET

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get('x-gptmaker-signature')

    // Verify webhook signature (if configured)
    if (WEBHOOK_SECRET && signature) {
      const expectedSignature = crypto
        .createHmac('sha256', WEBHOOK_SECRET)
        .update(body)
        .digest('hex')

      if (`sha256=${expectedSignature}` !== signature) {
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
      }
    }

    const event = JSON.parse(body)
    console.log('GPT Maker webhook event:', event.type)

    switch (event.type) {
      case 'message.created':
        await handleMessageCreated(event.data)
        break
      
      case 'chat.updated':
        await handleChatUpdated(event.data)
        break
      
      case 'chat.assigned':
        await handleChatAssigned(event.data)
        break
      
      case 'chat.escalated':
        await handleChatEscalated(event.data)
        break
      
      default:
        console.log('Unhandled webhook event type:', event.type)
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' }, 
      { status: 500 }
    )
  }
}

async function handleMessageCreated(data: any) {
  const { message, chat } = data

  try {
    // Add message to Firestore
    await adminDB.collection('messages').doc(chat.id).collection('messages').add({
      chatId: chat.id,
      content: message.content,
      type: message.type || 'text',
      sender: determineSender(message.sender),
      timestamp: new Date(message.timestamp || Date.now()),
      agentName: message.sender?.name || null,
      messageId: message.id
    })

    // Update chat last message
    const chatRef = adminDB.collection('chats').doc(chat.id)
    await chatRef.update({
      lastMessage: message.content,
      updatedAt: new Date(message.timestamp || Date.now()),
      unreadCount: message.sender?.type === 'customer' ? (chat.unreadCount || 0) + 1 : 0
    })

    console.log('Message synced to Firestore:', message.id)
  } catch (error) {
    console.error('Error handling message created:', error)
  }
}

async function handleChatUpdated(data: any) {
  const { chat } = data

  try {
    const chatRef = adminDB.collection('chats').doc(chat.id)
    await chatRef.set({
      id: chat.id,
      customerName: chat.customer?.name || 'Cliente',
      customerPhone: chat.customer?.phone || '',
      lastMessage: chat.lastMessage?.content || '',
      unreadCount: chat.unreadCount || 0,
      status: determineStatus(chat),
      assignedTo: chat.assignedAgent?.id || null,
      updatedAt: new Date(chat.updatedAt || Date.now()),
      avatar: chat.customer?.avatar || null,
      workspaceId: chat.workspaceId
    }, { merge: true })

    console.log('Chat updated in Firestore:', chat.id)
  } catch (error) {
    console.error('Error handling chat updated:', error)
  }
}

async function handleChatAssigned(data: any) {
  const { chat, agent } = data

  try {
    const chatRef = adminDB.collection('chats').doc(chat.id)
    await chatRef.update({
      status: 'human',
      assignedTo: agent.id,
      updatedAt: new Date()
    })

    console.log('Chat assigned in Firestore:', chat.id, 'to', agent.id)
  } catch (error) {
    console.error('Error handling chat assigned:', error)
  }
}

async function handleChatEscalated(data: any) {
  const { chat } = data

  try {
    const chatRef = adminDB.collection('chats').doc(chat.id)
    await chatRef.update({
      status: 'waiting',
      assignedTo: null,
      updatedAt: new Date()
    })

    console.log('Chat escalated in Firestore:', chat.id)
  } catch (error) {
    console.error('Error handling chat escalated:', error)
  }
}

function determineSender(sender: any): 'customer' | 'agent' | 'ai' {
  if (!sender) return 'customer'
  
  switch (sender.type) {
    case 'customer':
      return 'customer'
    case 'agent':
      return 'agent'
    case 'bot':
    case 'ai':
      return 'ai'
    default:
      return 'customer'
  }
}

function determineStatus(chat: any): 'ai' | 'waiting' | 'human' {
  if (chat.assignedAgent) {
    return 'human'
  }
  
  if (chat.awaitingHuman || chat.escalated) {
    return 'waiting'
  }
  
  return 'ai'
} 