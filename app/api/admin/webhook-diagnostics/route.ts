import { NextRequest, NextResponse } from 'next/server'
import { adminDB } from '@/lib/firebaseAdmin'

interface AdminConfig {
  zapiApiKey: string
  zapiInstanceId: string
  zapiClientToken?: string
}

interface DiagnosticIssue {
  type: string
  message: string
  severity: 'high' | 'medium' | 'low'
}

interface DiagnosticRecommendation {
  action: string
  message: string
  priority: 'high' | 'medium' | 'low'
}

export async function GET() {
  try {
    console.log('=== DIAGNÓSTICO COMPLETO DO WEBHOOK ===')
    
    // 1. Verificar configurações
    let config: AdminConfig
    try {
      const configDoc = await adminDB.collection('admin_config').doc('ai_settings').get()
      if (!configDoc.exists) {
        return NextResponse.json({
          status: 'error',
          error: 'Configurações não encontradas no Firebase',
          step: 'config_check',
          diagnostics: {
            issues: [{
              type: 'no_config',
              message: 'Configurações da IA não foram encontradas no Firebase',
              severity: 'high'
            }],
            recommendations: [{
              action: 'configure_admin',
              message: 'Configure as credenciais Z-API e OpenAI no painel admin',
              priority: 'high'
            }]
          }
        })
      }

      config = configDoc.data() as AdminConfig
    } catch (firebaseError) {
      console.error('Erro ao acessar Firebase:', firebaseError)
      return NextResponse.json({
        status: 'error',
        error: 'Erro ao conectar com Firebase',
        step: 'firebase_connection',
        details: firebaseError instanceof Error ? firebaseError.message : 'Unknown Firebase error'
      })
    }
    
    if (!config.zapiApiKey || !config.zapiInstanceId) {
      return NextResponse.json({
        status: 'error',
        error: 'Z-API não configurada completamente',
        step: 'config_validation',
        diagnostics: {
          issues: [{
            type: 'incomplete_config',
            message: `Configurações incompletas: ${!config.zapiApiKey ? 'API Key' : ''} ${!config.zapiInstanceId ? 'Instance ID' : ''}`,
            severity: 'high'
          }],
          recommendations: [{
            action: 'complete_config',
            message: 'Complete as configurações Z-API no painel admin',
            priority: 'high'
          }]
        },
        details: {
          hasApiKey: !!config.zapiApiKey,
          hasInstanceId: !!config.zapiInstanceId
        }
      })
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
    let zapiErrors: string[] = []
    
    // Verificar webhook atual na Z-API
    try {
      console.log('Verificando webhook atual na Z-API...')
      const webhookResponse = await fetch(checkUrl, { 
        method: 'GET', 
        headers,
        signal: AbortSignal.timeout(10000) // 10 segundos timeout
      })
      
      if (webhookResponse.ok) {
        currentWebhook = await webhookResponse.json()
        console.log('Webhook atual:', currentWebhook)
      } else {
        const errorText = await webhookResponse.text()
        zapiErrors.push(`Webhook check failed: ${webhookResponse.status} - ${errorText}`)
        console.error('Erro ao verificar webhook:', webhookResponse.status, errorText)
      }
    } catch (webhookError) {
      zapiErrors.push(`Webhook connection error: ${webhookError instanceof Error ? webhookError.message : 'Unknown error'}`)
      console.error('Erro de conexão webhook:', webhookError)
    }
    
    // Verificar status da instância Z-API
    try {
      console.log('Verificando status da instância Z-API...')
      const statusUrl = `https://api.z-api.io/instances/${config.zapiInstanceId}/token/${config.zapiApiKey}/status`
      const statusResponse = await fetch(statusUrl, { 
        method: 'GET', 
        headers,
        signal: AbortSignal.timeout(10000) // 10 segundos timeout
      })
      
      if (statusResponse.ok) {
        zapiStatus = await statusResponse.json()
        console.log('Status Z-API:', zapiStatus)
      } else {
        const errorText = await statusResponse.text()
        zapiErrors.push(`Status check failed: ${statusResponse.status} - ${errorText}`)
        console.error('Erro ao verificar status:', statusResponse.status, errorText)
      }
    } catch (statusError) {
      zapiErrors.push(`Status connection error: ${statusError instanceof Error ? statusError.message : 'Unknown error'}`)
      console.error('Erro de conexão status:', statusError)
    }

    // 4. Análise dos resultados
    const diagnostics = {
      timestamp: new Date().toISOString(),
      
      // Configurações
      config: {
        status: 'ok',
        zapiInstanceId: config.zapiInstanceId,
        hasApiKey: !!config.zapiApiKey,
        hasClientToken: !!config.zapiClientToken,
        baseUrl: baseUrl
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
      
      // Erros de conexão Z-API
      zapiErrors: zapiErrors,
      
      // Problemas identificados
      issues: [] as DiagnosticIssue[],
      
      // Recomendações
      recommendations: [] as DiagnosticRecommendation[]
    }

    // Identificar problemas
    
    // Problemas de conexão Z-API
    if (zapiErrors.length > 0) {
      diagnostics.issues.push({
        type: 'zapi_connection_error',
        message: `Erro ao conectar com Z-API: ${zapiErrors.join(', ')}`,
        severity: 'high'
      })
      diagnostics.recommendations.push({
        action: 'check_credentials',
        message: 'Verifique as credenciais Z-API (Instance ID, Token, Client Token)',
        priority: 'high'
      })
    }
    
    // Problemas de webhook
    if (!currentWebhook?.webhook && zapiErrors.length === 0) {
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
    } else if (currentWebhook?.webhook && currentWebhook.webhook !== expectedWebhooks.aiWebhook && currentWebhook.webhook !== expectedWebhooks.basicWebhook) {
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
      return NextResponse.json({ 
        success: false,
        error: 'Ação não suportada',
        message: 'Apenas a ação "fix_webhook" é suportada'
      }, { status: 400 })
    }

    console.log('=== CORRIGINDO CONFIGURAÇÃO DO WEBHOOK ===')
    
    // Carregar configurações
    let config: AdminConfig
    try {
      const configDoc = await adminDB.collection('admin_config').doc('ai_settings').get()
      if (!configDoc.exists) {
        return NextResponse.json({ 
          success: false,
          error: 'Configurações não encontradas no Firebase',
          message: 'As configurações da IA não foram encontradas. Configure primeiro no painel admin.'
        })
      }
      config = configDoc.data() as AdminConfig
    } catch (firebaseError) {
      console.error('Erro ao acessar Firebase:', firebaseError)
      return NextResponse.json({ 
        success: false,
        error: 'Erro ao conectar com Firebase',
        details: firebaseError instanceof Error ? firebaseError.message : 'Unknown Firebase error'
      })
    }
    
    if (!config.zapiApiKey || !config.zapiInstanceId) {
      return NextResponse.json({ 
        success: false,
        error: 'Z-API não configurada completamente',
        message: `Faltam configurações: ${!config.zapiApiKey ? 'API Key' : ''} ${!config.zapiInstanceId ? 'Instance ID' : ''}`.trim(),
        details: {
          hasApiKey: !!config.zapiApiKey,
          hasInstanceId: !!config.zapiInstanceId
        }
      })
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
    console.log('Headers:', { ...headers, 'Client-Token': headers['Client-Token'] ? '***' : 'not set' })
    
    try {
      const response = await fetch(url, { 
        method: 'POST', 
        headers, 
        body,
        signal: AbortSignal.timeout(15000) // 15 segundos timeout
      })
      
      let result
      try {
        result = await response.json()
      } catch (parseError) {
        const textResponse = await response.text()
        console.error('Erro ao fazer parse da resposta:', textResponse)
        return NextResponse.json({
          success: false,
          error: 'Resposta inválida da Z-API',
          message: 'A Z-API retornou uma resposta que não pode ser processada',
          details: { status: response.status, response: textResponse }
        })
      }
      
      if (!response.ok) {
        console.error('Erro ao configurar webhook:', { status: response.status, result })
        return NextResponse.json({
          success: false,
          error: 'Erro ao configurar webhook na Z-API',
          message: result.message || result.error || `HTTP ${response.status}`,
          details: {
            status: response.status,
            zapiResponse: result,
            webhookUrl,
            instanceId: config.zapiInstanceId
          }
        })
      }
      
      console.log('Webhook configurado com sucesso:', result)
      
      return NextResponse.json({
        success: true,
        message: 'Webhook configurado com sucesso! 🎉',
        webhookUrl,
        zapiResponse: result,
        timestamp: new Date().toISOString()
      })
      
    } catch (fetchError) {
      console.error('Erro de conexão com Z-API:', fetchError)
      return NextResponse.json({
        success: false,
        error: 'Erro de conexão com Z-API',
        message: fetchError instanceof Error ? fetchError.message : 'Erro desconhecido de conexão',
        details: {
          webhookUrl,
          instanceId: config.zapiInstanceId,
          apiUrl: url
        }
      })
    }

  } catch (error) {
    console.error('Erro geral ao corrigir webhook:', error)
    return NextResponse.json({
      success: false,
      error: 'Erro interno ao corrigir webhook',
      message: 'Ocorreu um erro inesperado durante a correção',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
} 