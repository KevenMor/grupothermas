import { NextResponse, NextRequest } from 'next/server'

export const runtime = 'nodejs'

// POST - Marcar chat como lido ou não lido
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { phone, action } = body

    if (!phone || !action) {
      return NextResponse.json({ error: 'Phone e action são obrigatórios' }, { status: 400 })
    }

    if (!['read', 'unread'].includes(action)) {
      return NextResponse.json({ error: 'Action deve ser "read" ou "unread"' }, { status: 400 })
    }

    const zapiInstanceId = process.env.ZAPI_INSTANCE_ID
    const zapiToken = process.env.ZAPI_TOKEN

    if (!zapiInstanceId || !zapiToken) {
      return NextResponse.json({ error: 'Z-API não configurada' }, { status: 500 })
    }

    const headers: Record<string, string> = { 
      'Content-Type': 'application/json'
    }
    
    if (process.env.ZAPI_CLIENT_TOKEN) {
      headers['Client-Token'] = process.env.ZAPI_CLIENT_TOKEN
    }

    const zapiResponse = await fetch(
      `https://api.z-api.io/instances/${zapiInstanceId}/token/${zapiToken}/modify-chat`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify({
          phone: phone,
          action: action
        })
      }
    )

    if (!zapiResponse.ok) {
      const errorText = await zapiResponse.text()
      console.error('Erro Z-API:', errorText)
      return NextResponse.json({ error: 'Erro ao marcar chat na Z-API' }, { status: 500 })
    }

    const result = await zapiResponse.json()
    
    return NextResponse.json({
      success: true,
      phone,
      action,
      result: result.value
    })

  } catch (error) {
    console.error('Erro ao marcar chat como lido:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
} 