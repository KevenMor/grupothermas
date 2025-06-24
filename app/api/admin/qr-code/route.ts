import { NextResponse } from 'next/server'
import { adminDB } from '@/lib/firebaseAdmin'

interface AdminConfig {
  zapiApiKey: string
  zapiInstanceId: string
  zapiBaseUrl: string
  zapiClientToken?: string
}

export async function POST() {
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

    // Generate QR Code using Z-API correct URL format
    const zapiUrl = `https://api.z-api.io/instances/${config.zapiInstanceId}/token/${config.zapiApiKey}/qr-code`
    
    console.log('Gerando QR Code via Z-API:', {
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

    if (!response.ok) {
      console.log('Erro Z-API QR Code:', data)
      return NextResponse.json({ error: data.error || 'Erro ao gerar QR Code' }, { status: 400 })
    }

    console.log('QR Code gerado com sucesso:', data)
    
    // Extrair a URL do QR Code do response
    let qrCodeUrl = null
    if (data.qrcode) {
      qrCodeUrl = data.qrcode
    } else if (data.data && data.data.qrcode) {
      qrCodeUrl = data.data.qrcode
    } else if (typeof data === 'string') {
      qrCodeUrl = data
    }
    
    if (!qrCodeUrl) {
      console.log('QR Code não encontrado na resposta:', data)
      return NextResponse.json({ error: 'QR Code não encontrado na resposta da Z-API' }, { status: 400 })
    }
    
    return NextResponse.json({ qrCode: qrCodeUrl })

  } catch (error) {
    console.error('Erro ao gerar QR Code:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
} 