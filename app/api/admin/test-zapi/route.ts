import { NextRequest, NextResponse } from 'next/server'
import { adminDB } from '@/lib/firebaseAdmin'

interface AdminConfig {
  zapiApiKey: string
  zapiInstanceId: string
  zapiClientToken?: string
}

async function checkConnection(config: AdminConfig) {
  const url = `https://api.z-api.io/instances/${config.zapiInstanceId}/token/${config.zapiApiKey}/status`
  const headers: Record<string, string> = { 'Accept': 'application/json' }
  
  if (config.zapiClientToken && config.zapiClientToken.trim()) {
    headers['Client-Token'] = config.zapiClientToken.trim()
  }
  
  return await fetch(url, { method: 'GET', headers })
}

async function sendTestMessage(config: AdminConfig, phone: string, message: string) {
  const url = `https://api.z-api.io/instances/${config.zapiInstanceId}/token/${config.zapiApiKey}/send-text`
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  
  if (config.zapiClientToken && config.zapiClientToken.trim()) {
    headers['Client-Token'] = config.zapiClientToken.trim()
  }
  
  const body = JSON.stringify({
    phone: phone,
    message: message
  })

  return await fetch(url, { method: 'POST', headers, body })
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

    console.log('Testando conexão Z-API:', {
      instanceId: config.zapiInstanceId,
      apiKey: config.zapiApiKey.substring(0, 8) + '...',
      url: `https://api.z-api.io/instances/${config.zapiInstanceId}/token/${config.zapiApiKey}/status`
    })

    // Test connection
    const connectionResponse = await checkConnection(config)
    const connectionData = await connectionResponse.json()

    console.log('Raw test response:', connectionData)

    if (!connectionResponse.ok) {
      console.log('Erro teste Z-API:', connectionData)
      return NextResponse.json({ 
        error: connectionData.error || 'Erro ao testar conexão',
        details: connectionData 
      }, { status: 400 })
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Conexão Z-API testada com sucesso',
      status: connectionData 
    })

  } catch (error) {
    console.error('Erro ao testar Z-API:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { phone, message } = await request.json()
    
    if (!phone || !message) {
      return NextResponse.json({ error: 'Número de telefone e mensagem são obrigatórios' }, { status: 400 })
    }

    // Load admin configuration
    const configDoc = await adminDB.collection('admin_config').doc('ai_settings').get()
    if (!configDoc.exists) {
      return NextResponse.json({ error: 'Configuração não encontrada' }, { status: 500 })
    }

    const config = configDoc.data() as AdminConfig
    if (!config.zapiApiKey || !config.zapiInstanceId) {
      return NextResponse.json({ error: 'Configuração Z-API incompleta' }, { status: 400 })
    }

    console.log(`Enviando mensagem via Z-API para: ${phone}`)

    // Send test message
    const sendResponse = await sendTestMessage(config, phone, message)
    const sendData = await sendResponse.json()

    if (!sendResponse.ok) {
      console.log('Erro ao enviar mensagem:', sendData)
      return NextResponse.json({ 
        error: sendData.error || 'Erro ao enviar mensagem',
        details: sendData 
      }, { status: 400 })
    }

    console.log('Mensagem enviada com sucesso:', sendData)
    return NextResponse.json({ 
      success: true, 
      message: 'Mensagem enviada com sucesso',
      response: sendData 
    })

  } catch (error) {
    console.error('Erro ao enviar mensagem:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
} 