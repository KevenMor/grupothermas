import { NextRequest, NextResponse } from 'next/server'
import { adminDB } from '@/lib/firebaseAdmin'

interface AdminConfig {
  zapiApiKey: string
  zapiInstanceId: string
  zapiClientToken?: string
}

export async function GET() {
  try {
    // Load admin configuration
    const configDoc = await adminDB.collection('admin_config').doc('ai_settings').get()
    if (!configDoc.exists) {
      return NextResponse.json({ error: 'Configuração não encontrada' }, { status: 500 })
    }

    const config = configDoc.data() as AdminConfig
    if (!config.zapiApiKey || !config.zapiInstanceId) {
      return NextResponse.json({ error: 'Configuração Z-API incompleta' }, { status: 400 })
    }

    const webhookUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'https://app.grupothermas.com.br'}/api/zapi/webhook`
    
    // Verificar webhook atual
    const checkUrl = `https://api.z-api.io/instances/${config.zapiInstanceId}/token/${config.zapiApiKey}/webhook`
    const headers: Record<string, string> = { 'Accept': 'application/json' }
    
    if (config.zapiClientToken && config.zapiClientToken.trim()) {
      headers['Client-Token'] = config.zapiClientToken.trim()
    }
    
    const response = await fetch(checkUrl, { method: 'GET', headers })
    const data = await response.json()

    return NextResponse.json({ 
      currentWebhook: data,
      expectedWebhook: webhookUrl,
      isConfigured: data.webhook === webhookUrl
    })

  } catch (error) {
    console.error('Erro ao verificar webhook:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    // Load admin configuration
    const configDoc = await adminDB.collection('admin_config').doc('ai_settings').get()
    if (!configDoc.exists) {
      return NextResponse.json({ error: 'Configuração não encontrada' }, { status: 500 })
    }

    const config = configDoc.data() as AdminConfig
    if (!config.zapiApiKey || !config.zapiInstanceId) {
      return NextResponse.json({ error: 'Configuração Z-API incompleta' }, { status: 400 })
    }

    const webhookUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'https://app.grupothermas.com.br'}/api/zapi/webhook`
    
    const url = `https://api.z-api.io/instances/${config.zapiInstanceId}/token/${config.zapiApiKey}/update-webhook-received`
    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    
    if (config.zapiClientToken && config.zapiClientToken.trim()) {
      headers['Client-Token'] = config.zapiClientToken.trim()
    }
    
    const body = JSON.stringify({
      webhook: webhookUrl,
      events: ['message', 'qrcode-updated', 'connection-update', 'message-status']
    })

    console.log('Configurando webhook:', webhookUrl)
    
    const response = await fetch(url, { method: 'PUT', headers, body })
    const data = await response.json()
    
    if (!response.ok || data.error) {
      console.error('Erro ao configurar webhook na Z-API:', data)
      return NextResponse.json({ 
        error: 'Erro ao configurar webhook',
        details: data 
      }, { status: response.status !== 200 ? response.status : 400 })
    }
    
    console.log('Webhook configurado com sucesso:', data)
    return NextResponse.json({ 
      success: true, 
      message: 'Webhook configurado com sucesso',
      webhook: webhookUrl,
      response: data 
    })

  } catch (error) {
    console.error('Erro ao configurar webhook:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
} 