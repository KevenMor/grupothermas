import { NextRequest, NextResponse } from 'next/server'
import { adminDB } from '@/lib/firebaseAdmin'

const API_KEY = process.env.GPTMAKER_API_KEY
const BASE_URL = process.env.GPTMAKER_BASE_URL || 'https://api.gptmaker.ai'

export async function PUT(request: NextRequest) {
  try {
    // TODO: Implement proper Firebase Auth verification in production
    // For now, allowing access for demo purposes

    const { chatId, status, assignedTo } = await request.json()

    if (!chatId || !status) {
      return NextResponse.json(
        { error: 'Missing required fields' }, 
        { status: 400 }
      )
    }

    // Update GPT Maker via API
    if (API_KEY) {
      try {
        const endpoint = status === 'human' 
          ? `${BASE_URL}/chat/${chatId}/start-human`
          : `${BASE_URL}/chat/${chatId}/end-human`

        const response = await fetch(endpoint, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            agentId: status === 'human' ? 'current-user' : null
          })
        })

        if (!response.ok) {
          console.error(`GPT Maker API error: ${response.status}`)
        }
      } catch (error) {
        console.error('Error updating GPT Maker:', error)
      }
    }

    // Update Firestore
    const chatRef = adminDB.collection('chats').doc(chatId)
    await chatRef.update({
      status,
      assignedTo: status === 'human' ? assignedTo : null,
      updatedAt: new Date()
    })

    return NextResponse.json({ 
      success: true,
      chatId,
      status,
      assignedTo: status === 'human' ? assignedTo : null
    })

  } catch (error) {
    console.error('Error updating chat status:', error)
    return NextResponse.json(
      { error: 'Failed to update chat status' }, 
      { status: 500 }
    )
  }
} 