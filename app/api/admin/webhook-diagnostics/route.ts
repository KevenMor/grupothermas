import { NextRequest, NextResponse } from 'next/server'
import { adminDB } from '@/lib/firebaseAdmin'

interface AdminConfig {
  zapiApiKey: string
  zapiInstanceId: string
  zapiClientToken?: string
}

export async function GET() {
  try {
    console.log('=== DIAGNÓSTICO COMPLETO DO WEBHOOK ===')
    
    // 1. Verificar configurações
    const configDoc = await adminDB.collection('admin_config').doc('ai_settings').get()
    if (!configDoc.exists) {
      return NextResponse.json({
        error: 'Configurações não encontradas',
        step: 'config_check',
        status: 'error'
      }, { status: 500 })
    }

    const config = configDoc.data() as AdminConfig
    
    if (!config.zapiApiKey || !config.zapiInstanceId) {
      return NextResponse.json({
        error: 'Z-API não configurada completamente',
        step: 'config_validation',
        status: 'error',
        details: {
          hasApiKey: !!config.zapiApiKey,
          hasInstanceId: !!config.zapiInstanceId
        }
      }, { status: 500 })
    }

    // 2. URLs esperadas
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000'
    const expectedWebhooks = {
      aiWebhook: `${baseUrl}/api/zapi/ai-webhook`,
      basicWebhook: `${baseUrl}/api/zapi/webhook`
    }

    // 3. Verificar webhook atual na Z-API
    const checkUrl = `https://api.z-api.io/instances/${config.zapiInstanceId}/token/${config.zapiApiKey}/webhook`
    const headers: Record<string, string> = { 'Accept': 'application/json' }
    
    if (config.zapiClientToken && config.zapiClientToken.trim()) {
      headers['Client-Token'] = config.zapiClientToken.trim()
    }

    let currentWebhook = null
    let zapiStatus = null
    
    try {
      console.log('Verificando webhook atual na Z-API...')
      const webhookResponse = await fetch(checkUrl, { method: 'GET', headers })
      currentWebhook = await webhookResponse.json()
      
      console.log('Verificando status da instância Z-API...')
      const statusUrl = `https://api.z-api.io/instances/${config.zapiInstanceId}/token/${config.zapiApiKey}/status`
      const statusResponse = await fetch(statusUrl, { method: 'GET', headers })
      zapiStatus = await statusResponse.json()
      
    } catch (error) {
      console.error('Erro ao consultar Z-API:', error)
      return NextResponse.json({
        error: 'Erro ao conectar com Z-API',
        step: 'zapi_connection',
        status: 'error',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, { status: 500 })
    }

    // 4. Análise dos resultados
    const diagnostics = {
      timestamp: new Date().toISOString(),
      
      // Configurações
      config: {
        status: 'ok',
        zapiInstanceId: config.zapiInstanceId,
        hasApiKey: !!config.zapiApiKey,
        hasClientToken: !!config.zapiClientToken
      },
      
      // URLs
      webhooks: {
        expected: expectedWebhooks,
        current: currentWebhook,
        isConfigured: currentWebhook?.webhook === expectedWebhooks.aiWebhook || currentWebhook?.webhook === expectedWebhooks.basicWebhook,
        recommendedUrl: expectedWebhooks.aiWebhook
      },
      
      // Status Z-API
      zapiStatus: zapiStatus,
      
      // Problemas identificados
      issues: [],
      
      // Recomendações
      recommendations: []
    }

    // Identificar problemas
    if (!currentWebhook?.webhook) {
      diagnostics.issues.push({
        type: 'no_webhook',
        message: 'Nenhum webhook configurado na Z-API',
        severity: 'high'
      })
      diagnostics.recommendations.push({
        action: 'configure_webhook',
        message: `Configure o webhook na Z-API para: ${expectedWebhooks.aiWebhook}`,
        priority: 'high'
      })
    } else if (currentWebhook.webhook !== expectedWebhooks.aiWebhook && currentWebhook.webhook !== expectedWebhooks.basicWebhook) {
      diagnostics.issues.push({
        type: 'wrong_webhook',
        message: `Webhook configurado para URL incorreta: ${currentWebhook.webhook}`,
        severity: 'high'
      })
      diagnostics.recommendations.push({
        action: 'update_webhook',
        message: `Atualize o webhook para: ${expectedWebhooks.aiWebhook}`,
        priority: 'high'
      })
    }

    if (zapiStatus?.connected === false) {
      diagnostics.issues.push({
        type: 'disconnected',
        message: 'WhatsApp não está conectado na Z-API',
        severity: 'high'
      })
      diagnostics.recommendations.push({
        action: 'connect_whatsapp',
        message: 'Conecte o WhatsApp escaneando o QR Code',
        priority: 'high'
      })
    }

    if (!baseUrl.startsWith('https://') && !baseUrl.includes('localhost')) {
      diagnostics.issues.push({
        type: 'insecure_url',
        message: 'URL base não é HTTPS (pode causar problemas com webhooks)',
        severity: 'medium'
      })
      diagnostics.recommendations.push({
        action: 'use_https',
        message: 'Use uma URL HTTPS para produção',
        priority: 'medium'
      })
    }

    // Status geral
    const hasHighSeverityIssues = diagnostics.issues.some(issue => issue.severity === 'high')
    const overallStatus = hasHighSeverityIssues ? 'error' : diagnostics.issues.length > 0 ? 'warning' : 'ok'

    return NextResponse.json({
      status: overallStatus,
      message: overallStatus === 'ok' ? 'Webhook configurado corretamente' : 'Problemas encontrados na configuração do webhook',
      diagnostics
    })

  } catch (error) {
    console.error('Erro no diagnóstico:', error)
    return NextResponse.json({
      error: 'Erro interno no diagnóstico',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action } = await request.json()
    
    if (action !== 'fix_webhook') {
      return NextResponse.json({ error: 'Ação não suportada' }, { status: 400 })
    }

    console.log('=== CORRIGINDO CONFIGURAÇÃO DO WEBHOOK ===')
    
    // Carregar configurações
    const configDoc = await adminDB.collection('admin_config').doc('ai_settings').get()
    if (!configDoc.exists) {
      return NextResponse.json({ error: 'Configurações não encontradas' }, { status: 500 })
    }

    const config = configDoc.data() as AdminConfig
    
    if (!config.zapiApiKey || !config.zapiInstanceId) {
      return NextResponse.json({ error: 'Z-API não configurada' }, { status: 500 })
    }

    // URL correta do webhook
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000'
    const webhookUrl = `${baseUrl}/api/zapi/ai-webhook`
    
    // Configurar webhook na Z-API
    const url = `https://api.z-api.io/instances/${config.zapiInstanceId}/token/${config.zapiApiKey}/webhook`
    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    
    if (config.zapiClientToken && config.zapiClientToken.trim()) {
      headers['Client-Token'] = config.zapiClientToken.trim()
    }
    
    const body = JSON.stringify({
      webhook: webhookUrl,
      events: ['message', 'qrcode-updated', 'connection-update', 'message-status']
    })

    console.log('Configurando webhook para:', webhookUrl)
    
    const response = await fetch(url, { method: 'POST', headers, body })
    const result = await response.json()
    
    if (!response.ok) {
      console.error('Erro ao configurar webhook:', result)
      return NextResponse.json({
        error: 'Erro ao configurar webhook na Z-API',
        details: result
      }, { status: response.status })
    }
    
    console.log('Webhook configurado com sucesso:', result)
    
    return NextResponse.json({
      success: true,
      message: 'Webhook configurado com sucesso',
      webhookUrl,
      zapiResponse: result
    })

  } catch (error) {
    console.error('Erro ao corrigir webhook:', error)
    return NextResponse.json({
      error: 'Erro interno ao corrigir webhook',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 