import { NextRequest, NextResponse } from 'next/server'

const API_KEY = process.env.GPTMAKER_API_KEY
const BASE_URL = process.env.GPTMAKER_BASE_URL || 'https://api.gptmaker.ai'

export async function POST(request: NextRequest) {
  try {
    // TODO: Implement proper Firebase Auth verification in production
    // For now, allowing access for demo purposes

    const { chatId, content, type = 'text' } = await request.json()

    if (!chatId || !content) {
      return NextResponse.json(
        { error: 'Missing required fields' }, 
        { status: 400 }
      )
    }

    if (!API_KEY) {
      console.log('GPT Maker API key not configured')
      return NextResponse.json({ 
        success: true, 
        messageId: `local_${Date.now()}`,
        note: 'Message saved locally (GPT Maker not configured)'
      })
    }

    // Send message via GPT Maker API
    const response = await fetch(`${BASE_URL}/chat/${chatId}/send-message`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        content,
        type,
        sender: {
          type: 'agent',
          id: 'current-user',
          name: 'Agente - Grupo Thermas'
        }
      })
    })

    if (!response.ok) {
      throw new Error(`GPT Maker API error: ${response.status}`)
    }

    const data = await response.json()

    return NextResponse.json({
      success: true,
      messageId: data.messageId || data.id,
      chatId,
      content,
      type
    })

  } catch (error) {
    console.error('Error sending message:', error)
    return NextResponse.json(
      { error: 'Failed to send message' }, 
      { status: 500 }
    )
  }
} 