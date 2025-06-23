import { NextRequest, NextResponse } from 'next/server'
import { adminDB } from '@/lib/firebaseAdmin'

// TODO: Add your GPT Maker workspace ID
const WORKSPACE_ID = process.env.GPTMAKER_WORKSPACE_ID
const API_KEY = process.env.GPTMAKER_API_KEY
const BASE_URL = process.env.GPTMAKER_BASE_URL || 'https://api.gptmaker.ai'

export async function GET(request: NextRequest) {
  try {
    // TODO: Implement proper Firebase Auth verification in production
    // For now, allowing access for demo purposes

    if (!API_KEY || !WORKSPACE_ID) {
      console.log('GPT Maker credentials not configured')
      return NextResponse.json({ chats: [] })
    }

    // Fetch chats from GPT Maker API
    const response = await fetch(`${BASE_URL}/v2/workspace/${WORKSPACE_ID}/chats`, {
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`GPT Maker API error: ${response.status}`)
    }

    const data = await response.json()
    const chats = data.chats || []

    // Sync chats to Firestore for real-time updates
    const batch = adminDB.batch()
    
    for (const chat of chats) {
      const chatRef = adminDB.collection('chats').doc(chat.id)
      
      const chatData = {
        id: chat.id,
        customerName: chat.customer?.name || 'Cliente',
        customerPhone: chat.customer?.phone || '',
        lastMessage: chat.lastMessage?.content || '',
        unreadCount: chat.unreadCount || 0,
        status: determineStatus(chat),
        assignedTo: chat.assignedAgent?.id || null,
        updatedAt: new Date(chat.updatedAt || Date.now()),
        avatar: chat.customer?.avatar || null,
        workspaceId: WORKSPACE_ID,
        rawData: chat // Store original data for reference
      }

      batch.set(chatRef, chatData, { merge: true })
    }

    await batch.commit()

    return NextResponse.json({ 
      chats: chats.map((chat: any) => ({
        id: chat.id,
        customerName: chat.customer?.name || 'Cliente',
        customerPhone: chat.customer?.phone || '',
        lastMessage: chat.lastMessage?.content || '',
        unreadCount: chat.unreadCount || 0,
        status: determineStatus(chat),
        assignedTo: chat.assignedAgent?.id || null,
        updatedAt: chat.updatedAt,
        avatar: chat.customer?.avatar || null
      }))
    })

  } catch (error) {
    console.error('Error fetching chats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch chats' }, 
      { status: 500 }
    )
  }
}

// Determine chat status based on GPT Maker data
function determineStatus(chat: any): 'ai' | 'waiting' | 'human' {
  if (chat.assignedAgent) {
    return 'human'
  }
  
  if (chat.awaitingHuman || chat.escalated) {
    return 'waiting'
  }
  
  return 'ai'
} 