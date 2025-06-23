import { NextRequest, NextResponse } from 'next/server'
import { adminDB } from '@/lib/firebaseAdmin'

interface ZAPIWebhookEvent {
  event?: string
  instanceId?: string
  data?: any
  // Estrutura para mensagens
  messageId?: string
  phone?: string
  fromMe?: boolean
  momment?: number
  status?: string
  chatName?: string
  senderPhoto?: string
  senderName?: string
  participantPhone?: string
  photo?: string
  broadcast?: boolean
  type?: string
  text?: {
    message: string
  }
  image?: {
    caption?: string
    imageUrl: string
    thumbnailUrl: string
    mimeType: string
  }
  audio?: {
    audioUrl: string
    mimeType: string
  }
  video?: {
    caption?: string
    videoUrl: string
    mimeType: string
  }
  contact?: {
    displayName: string
    vcard: string
  }
  location?: {
    latitude: number
    longitude: number
    address?: string
    url?: string
  }
  document?: {
    documentUrl: string
    mimeType: string
    title: string
    pageCount?: number
  }
}

interface AdminConfig {
  zapiApiKey: string
  zapiInstanceId: string
  zapiBaseUrl: string
  openaiApiKey: string
  openaiModel: string
  openaiTemperature: number
  openaiMaxTokens: number
  systemPrompt: string
  welcomeMessage: string
  fallbackMessage: string
  handoffMessage: string
  webhookUrls: {
    leadCapture: string
    appointmentBooking: string
    paymentProcess: string
    supportTicket: string
    humanHandoff: string
  }
  zapiClientToken?: string
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Trava de segurança #1: Ignorar eventos gerados pelo próprio bot.
    if (body.fromMe === true) {
      console.log('Loop Prevention: Ignorando evento originado pelo bot (fromMe: true)')
      return NextResponse.json({ status: 'ignored', reason: 'fromMe is true' })
    }

    const event = body.event // ex: 'qrcode-updated'
    const type = body.type   // ex: 'ReceivedCallback', 'DeliveryCallback'

    console.log(`Webhook recebido. Event: ${event}, Type: ${type}`)

    if (event === 'qrcode-updated') {
      return handleQRCodeUpdate(body)
    }

    if (event === 'connection-update') {
      return handleConnectionUpdate(body)
    }
    
    // Apenas mensagens recebidas de usuários com texto devem ser processadas
    if (type === 'ReceivedCallback' && body.text?.message) {
      console.log('Processando mensagem REAL do usuário com ID:', body.messageId)
      return handleMessage(body)
    }

    // Ignorar todos os outros tipos de callbacks e eventos não tratados
    console.log(`Evento ignorado (não é uma mensagem de usuário). Event: ${event}, Type: ${type}`)
    return NextResponse.json({ 
      status: 'ignored', 
      reason: `Event type ${event || type} is not a processable user message` 
    })

  } catch (error) {
    console.error('Erro no webhook Z-API:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' }, 
      { status: 500 }
    )
  }
}

async function handleQRCodeUpdate(body: any) {
  console.log('QR Code atualizado:', body)
  
  try {
    // Salvar QR Code no Firebase
    await adminDB.collection('admin_config').doc('ai_settings').update({
      qrCodeUrl: body.qrcode || body.data?.qrcode || '',
      connectionStatus: 'qr_code',
      lastConnection: new Date().toISOString()
    })
    
    console.log('QR Code salvo no Firebase')
  } catch (error) {
    console.error('Erro ao salvar QR Code:', error)
  }

  return NextResponse.json({ status: 'qr_code_updated' })
}

async function handleConnectionUpdate(body: any) {
  console.log('Status de conexão atualizado:', body)
  
  try {
    const status = body.state || body.data?.state || 'unknown'
    
    await adminDB.collection('admin_config').doc('ai_settings').update({
      connectionStatus: status,
      lastConnection: new Date().toISOString()
    })
    
    console.log('Status de conexão salvo:', status)
  } catch (error) {
    console.error('Erro ao salvar status de conexão:', error)
  }

  return NextResponse.json({ status: 'connection_updated' })
}

async function handleMessageStatus(body: any) {
  console.log('Status da mensagem:', body)
  // Aqui você pode implementar lógica para rastrear status de entrega
  return NextResponse.json({ status: 'message_status_received' })
}

async function handleMessage(message: ZAPIWebhookEvent) {
  try {
    console.log('Processando mensagem via Z-API AI Webhook:', message.messageId)

    // Obter configurações da IA do Firebase
    const configDoc = await adminDB.collection('admin_config').doc('ai_settings').get()
    if (!configDoc.exists) {
      console.error('Configurações da IA não encontradas')
      return NextResponse.json({ error: 'AI settings not configured' }, { status: 500 })
    }

    const config = configDoc.data()!

    // Trava de segurança #2: verificar se mensagem é de usuário real
    const isReceivedCallback = message.type === 'ReceivedCallback'
    const isText = message.type === 'text'
    const hasMessageText = message.text?.message && message.text.message.trim() !== ''

    if (!hasMessageText || (!isText && !isReceivedCallback)) {
      console.log('Tipo de mensagem não suportado (Nova Lógica):', message.type)
      // Apenas responda, não salve nada se o tipo não for suportado
      await sendMessage(config, message.phone!, config.fallbackMessage)
      return NextResponse.json({ status: 'processed', response: 'fallback sent' })
    }

    const userMessage = message.text.message
    const userPhone = message.phone!
    const userName = message.senderName || message.chatName || 'Cliente'

    console.log(`Processando mensagem de ${userName} (${userPhone}): ${userMessage}`)

    // Check if this is the first message (welcome)
    const conversationRef = adminDB.collection('conversations').doc(userPhone)
    const conversationDoc = await conversationRef.get()
    
    let conversationHistory: any[] = []
    let isFirstMessage = false
    let conversationData = null

    if (!conversationDoc.exists) {
      isFirstMessage = true
      console.log('Criando nova conversa para:', userPhone)
      // Create new conversation
      const newConversationData = {
        phone: userPhone,
        name: userName,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: 'active',
        messages: [],
        source: 'zapi',
        // Campos de controle de IA
        aiEnabled: true,
        aiPaused: false,
        conversationStatus: 'ai_active',
      }
      console.log('--- DADOS PARA CRIAR NOVA CONVERSA (set) ---', JSON.stringify(newConversationData, null, 2))
      await conversationRef.set(newConversationData)
      conversationData = newConversationData
    } else {
      conversationData = conversationDoc.data()
      conversationHistory = conversationData?.messages || []
      
      // Se a conversa estava resolvida e o cliente enviou nova mensagem, reabrir para IA
      if (conversationData?.conversationStatus === 'resolved') {
        console.log('Reabrindo conversa resolvida para IA ativa')
        await conversationRef.update({
          aiEnabled: true,
          aiPaused: false,
          conversationStatus: 'ai_active',
          // Limpar campos de resolução
          resolvedAt: null,
          resolvedBy: null,
          // Atualizar timestamp
          updatedAt: new Date().toISOString(),
        })
        conversationData = { ...conversationData, conversationStatus: 'ai_active' }
      }
    }

    // Add user message to history
    const userMessageData = {
      id: message.messageId!,
      role: 'user',
      content: userMessage,
      timestamp: new Date(message.momment! * 1000).toISOString(),
      phone: userPhone,
      name: userName
    }

    conversationHistory.push(userMessageData)

    // Prepare messages for OpenAI
    const messages = [
      {
        role: 'system',
        content: config.systemPrompt
      },
      ...conversationHistory.slice(-10).map(msg => ({
        role: msg.role,
        content: msg.content
      }))
    ]

    // If first message, prepend welcome context
    if (isFirstMessage) {
      messages.push({
        role: 'assistant',
        content: config.welcomeMessage
      })
    }

    console.log('Enviando para OpenAI:', messages.length, 'mensagens')

    // Call OpenAI API
    let aiResponse: string
    try {
      const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.openaiApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: config.openaiModel,
          messages: messages,
          temperature: config.openaiTemperature,
          max_tokens: config.openaiMaxTokens
        })
      })

      if (!openaiResponse.ok) {
        const errorText = await openaiResponse.text()
        throw new Error(`OpenAI API error: ${openaiResponse.status} - ${errorText}`)
      }

      const openaiData = await openaiResponse.json()
      aiResponse = openaiData.choices[0]?.message?.content || config.fallbackMessage

      console.log('Resposta da OpenAI:', aiResponse)

    } catch (error) {
      console.error('Erro ao chamar OpenAI:', error)
      aiResponse = config.fallbackMessage
    }

    // Add AI response to history
    const aiMessageData = {
      id: `ai_${Date.now()}`,
      role: 'assistant',
      content: aiResponse,
      timestamp: new Date().toISOString(),
      phone: userPhone,
      name: 'Assistente IA'
    }

    conversationHistory.push(aiMessageData)

    const finalUpdateData = {
      messages: conversationHistory,
      updatedAt: new Date().toISOString(),
      lastMessage: aiResponse,
      lastMessageAt: new Date().toISOString(),
    }

    // Update conversation in Firebase
    console.log('--- DADOS PARA ATUALIZAR CONVERSA (update) ---', JSON.stringify(finalUpdateData, null, 2))
    await conversationRef.update(finalUpdateData)

    // Send AI response via Z-API
    await sendMessage(config, userPhone, aiResponse)

    // Analyze message and trigger webhooks if needed
    await analyzeAndTriggerWebhooks(config, userMessage, userPhone, userName, aiResponse)

    console.log('Mensagem processada com sucesso')
    return NextResponse.json({ 
      status: 'processed', 
      response: aiResponse,
      phone: userPhone
    })

  } catch (error) {
    console.error('Erro ao processar mensagem:', error)
    return NextResponse.json(
      { error: 'Erro ao processar mensagem', details: error instanceof Error ? error.message : 'Unknown error' }, 
      { status: 500 }
    )
  }
}

async function sendMessage(config: AdminConfig, phone: string, message: string) {
  try {
    console.log(`Enviando mensagem para ${phone}: ${message}`)
    
    const url = `https://api.z-api.io/instances/${config.zapiInstanceId}/token/${config.zapiApiKey}/send-text`
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    if (config.zapiClientToken && config.zapiClientToken.trim()) {
      headers['Client-Token'] = config.zapiClientToken.trim()
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify({
        phone: phone,
        message: message,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Z-API error: ${response.status} - ${errorText}`)
    }

    const result = await response.json()
    console.log('Mensagem enviada com sucesso:', result)
    return result

  } catch (error) {
    console.error('Erro ao enviar mensagem via Z-API:', error)
    throw error
  }
}

async function analyzeAndTriggerWebhooks(
  config: AdminConfig, 
  userMessage: string, 
  phone: string, 
  name: string, 
  aiResponse: string
) {
  const lowerMessage = userMessage.toLowerCase()

  // Lead Capture triggers
  if (lowerMessage.includes('interesse') || 
      lowerMessage.includes('quero') || 
      lowerMessage.includes('preço') ||
      lowerMessage.includes('valor') ||
      lowerMessage.includes('pacote')) {
    
    await triggerWebhook(config.webhookUrls.leadCapture, 'lead_capture', {
      name,
      phone,
      message: userMessage,
      interest: extractInterest(userMessage),
      source: 'WhatsApp Bot',
      timestamp: new Date().toISOString()
    })
  }

  // Appointment Booking triggers
  if (lowerMessage.includes('agendar') || 
      lowerMessage.includes('consulta') || 
      lowerMessage.includes('reunião') ||
      lowerMessage.includes('encontro')) {
    
    await triggerWebhook(config.webhookUrls.appointmentBooking, 'appointment_booking', {
      customerName: name,
      phone,
      message: userMessage,
      requestedService: 'Consulta Personalizada',
      timestamp: new Date().toISOString()
    })
  }

  // Human Handoff triggers
  if (lowerMessage.includes('falar com') || 
      lowerMessage.includes('atendente') || 
      lowerMessage.includes('humano') ||
      lowerMessage.includes('pessoa') ||
      lowerMessage.includes('urgente')) {
    
    await triggerWebhook(config.webhookUrls.humanHandoff, 'human_handoff', {
      customerName: name,
      phone,
      reason: 'Solicitação de atendimento humano',
      context: userMessage,
      urgency: lowerMessage.includes('urgente') ? 'high' : 'medium',
      timestamp: new Date().toISOString()
    })
  }

  // Support Ticket triggers
  if (lowerMessage.includes('problema') || 
      lowerMessage.includes('erro') || 
      lowerMessage.includes('cancelar') ||
      lowerMessage.includes('reclamação') ||
      lowerMessage.includes('ajuda')) {
    
    await triggerWebhook(config.webhookUrls.supportTicket, 'support_ticket', {
      customerName: name,
      phone,
      issue: userMessage,
      priority: lowerMessage.includes('urgente') ? 'high' : 'medium',
      category: 'geral',
      timestamp: new Date().toISOString()
    })
  }
}

async function triggerWebhook(url: string, type: string, data: any) {
  if (!url) return

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Thermas-AI-Bot/1.0'
      },
      body: JSON.stringify({
        type,
        data,
        timestamp: new Date().toISOString()
      }),
      signal: AbortSignal.timeout(5000) // 5 seconds timeout
    })

    console.log(`Webhook ${type} triggered:`, { url, success: response.ok })
  } catch (error) {
    console.error(`Erro ao disparar webhook ${type}:`, error)
  }
}

function extractInterest(message: string): string {
  const lowerMessage = message.toLowerCase()
  
  if (lowerMessage.includes('premium') || lowerMessage.includes('luxo')) {
    return 'Pacote Premium'
  }
  if (lowerMessage.includes('família') || lowerMessage.includes('criança')) {
    return 'Pacote Família'
  }
  if (lowerMessage.includes('casal') || lowerMessage.includes('romântico')) {
    return 'Pacote Casal'
  }
  if (lowerMessage.includes('spa') || lowerMessage.includes('massagem')) {
    return 'Spa & Bem-estar'
  }
  if (lowerMessage.includes('termal') || lowerMessage.includes('águas')) {
    return 'Águas Termais'
  }
  
  return 'Interesse Geral'
}

export async function GET() {
  console.log('=== TESTE DE WEBHOOK ===')
  console.log('Webhook está funcionando!')
  return NextResponse.json({ 
    status: 'ok', 
    message: 'Webhook Z-API está funcionando',
    timestamp: new Date().toISOString()
  })
} 