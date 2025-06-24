import { NextRequest, NextResponse } from 'next/server'
import { adminDB } from '@/lib/firebaseAdmin'

interface AdminConfig {
  zapiApiKey: string
  zapiInstanceId: string
  zapiBaseUrl: string
  zapiClientToken?: string
  lastConnection?: string
}

export async function GET() {
  try {
    // Load admin configuration
    const configDoc = await adminDB.collection('admin_config').doc('ai_settings').get()
    if (!configDoc.exists) {
      return NextResponse.json(
        { error: 'Configuração administrativa não encontrada' },
        { status: 500 }
      )
    }

    const config = configDoc.data() as AdminConfig

    if (!config.zapiApiKey || !config.zapiInstanceId) {
      return NextResponse.json(
        { 
          connected: false,
          error: 'Configuração Z-API incompleta' 
        },
        { status: 400 }
      )
    }

    // Test Z-API connection
    const zapiUrl = `https://api.z-api.io/instances/${config.zapiInstanceId}/token/${config.zapiApiKey}/status`
    
    console.log('Verificando status Z-API:', {
      instanceId: config.zapiInstanceId,
      apiKey: config.zapiApiKey.substring(0, 8) + '...',
      url: zapiUrl
    })

    // Prepare headers
    const headers: Record<string, string> = {
      'Accept': 'application/json'
    }

    if (config.zapiClientToken && config.zapiClientToken.trim()) {
      headers['Client-Token'] = config.zapiClientToken.trim()
    }

    const response = await fetch(zapiUrl, {
      method: 'GET',
      headers
    })

    const data = await response.json()
    console.log('Raw Z-API response:', data)

    if (!response.ok) {
      console.log('Erro Z-API status:', data)
      return NextResponse.json(
        { 
          connected: false,
          error: data.error || 'Erro ao verificar status',
          details: data
        },
        { status: 200 }
      )
    }

    // Verificar se está realmente conectado
    const isConnected = data.connected === true || data.status === 'connected'
    
    // Update status and last check
    await adminDB.collection('admin_config').doc('ai_settings').update({
      lastStatusCheck: new Date().toISOString(),
      connectionStatus: isConnected ? 'connected' : 'disconnected',
      lastConnection: isConnected ? new Date().toISOString() : config.lastConnection
    })

    return NextResponse.json({
      connected: isConnected,
      status: data,
      lastCheck: new Date().toISOString()
    })

  } catch (error) {
    console.error('Erro ao verificar status:', error)
    return NextResponse.json(
      { 
        connected: false,
        error: 'Erro interno do servidor' 
      },
      { status: 500 }
    )
  }
} 