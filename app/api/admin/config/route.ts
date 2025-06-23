import { NextRequest, NextResponse } from 'next/server'
import { adminDB } from '@/lib/firebaseAdmin'

const CONFIG_COLLECTION = 'admin_config'
const CONFIG_DOC_ID = 'ai_settings'

export async function GET() {
  try {
    const configDoc = await adminDB.collection(CONFIG_COLLECTION).doc(CONFIG_DOC_ID).get()
    
    if (!configDoc.exists) {
      // Return default configuration
      const defaultConfig = {
        zapiApiKey: '',
        zapiInstanceId: '',
        zapiBaseUrl: 'https://api.z-api.io',
        openaiApiKey: '',
        openaiModel: 'gpt-4',
        openaiTemperature: 0.7,
        openaiMaxTokens: 1000,
        systemPrompt: `Você é um assistente virtual especializado do Grupo Thermas, uma empresa de turismo e hospedagem de luxo.

CONTEXTO:
- Somos especialistas em pacotes para águas termais, spas e resorts
- Oferecemos experiências premium de relaxamento e bem-estar
- Nosso foco é atendimento personalizado e experiências únicas

PERSONALIDADE:
- Seja caloroso, acolhedor e profissional
- Use linguagem elegante mas acessível
- Demonstre conhecimento sobre turismo termal
- Seja proativo em oferecer soluções

OBJETIVOS:
1. Qualificar leads interessados em pacotes
2. Agendar consultorias personalizadas
3. Fornecer informações sobre destinos e preços
4. Direcionar para atendimento humano quando necessário

INSTRUÇÕES:
- Sempre pergunte o nome do cliente
- Identifique o interesse específico (destino, data, número de pessoas)
- Ofereça opções adequadas ao perfil
- Colete dados de contato para follow-up
- Use contexto das conversas anteriores`,
        welcomeMessage: '🌿 Olá! Sou o assistente virtual do Grupo Thermas. Como posso ajudá-lo a encontrar a experiência termal perfeita para você?',
        fallbackMessage: 'Desculpe, não entendi completamente. Poderia reformular sua pergunta? Estou aqui para ajudar com informações sobre nossos pacotes termais e resorts.',
        handoffMessage: 'Vou conectar você com um de nossos especialistas para um atendimento mais personalizado. Um momento, por favor...',
        webhookUrls: {
          leadCapture: '',
          appointmentBooking: '',
          paymentProcess: '',
          supportTicket: '',
          humanHandoff: ''
        },
        qrCodeUrl: '',
        connectionStatus: 'disconnected',
        lastConnection: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      
      return NextResponse.json(defaultConfig)
    }
    
    const config = configDoc.data()
    return NextResponse.json(config)
    
  } catch (error) {
    console.error('Erro ao carregar configuração:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

async function configureWebhook(config: any) {
  try {
    const webhookUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/zapi/ai-webhook`
    
    const url = `https://api.z-api.io/instances/${config.zapiInstanceId}/token/${config.zapiApiKey}/webhook`
    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    
    if (config.zapiClientToken && config.zapiClientToken.trim()) {
      headers['Client-Token'] = config.zapiClientToken.trim()
    }
    
    const body = JSON.stringify({
      webhook: webhookUrl,
      events: ['message', 'qrcode-updated', 'connection-update', 'message-status']
    })

    console.log('Configurando webhook:', webhookUrl)
    
    const response = await fetch(url, { method: 'POST', headers, body })
    const data = await response.json()
    
    if (response.ok) {
      console.log('Webhook configurado com sucesso:', data)
    } else {
      console.error('Erro ao configurar webhook:', data)
    }
  } catch (error) {
    console.error('Erro ao configurar webhook:', error)
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('Recebendo requisição POST para salvar configuração...')
    
    const body = await request.json()
    console.log('Body recebido (keys):', Object.keys(body))
    
    // Preparar dados para salvar
    const configData = {
      ...body,
      updatedAt: new Date().toISOString()
    }
    
    console.log('Salvando configuração:', configData)
    
    try {
      // Salvar no Firebase
      console.log('Tentando salvar no Firebase...')
      await adminDB.collection('admin_config').doc('ai_settings').set(configData, { merge: true })
      console.log('Salvo no Firebase com sucesso!')
      
      // Configurar webhook automaticamente
      await configureWebhook(configData)
      
    } catch (firebaseError) {
      console.error('Erro ao salvar no Firebase:', firebaseError)
      return NextResponse.json({ error: 'Erro ao salvar configuração' }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: 'Configuração salva com sucesso' })

  } catch (error) {
    console.error('Erro ao processar configuração:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { field, value } = body
    
    if (!field) {
      return NextResponse.json(
        { error: 'Campo obrigatório: field' },
        { status: 400 }
      )
    }
    
    // Update specific field
    const updateData = {
      [field]: value,
      updatedAt: new Date().toISOString()
    }
    
    await adminDB.collection(CONFIG_COLLECTION).doc(CONFIG_DOC_ID).update(updateData)
    
    return NextResponse.json({ 
      success: true, 
      message: `Campo ${field} atualizado com sucesso` 
    })
    
  } catch (error) {
    console.error('Erro ao atualizar configuração:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
} 