import { NextRequest, NextResponse } from 'next/server'
import { adminDB } from '@/lib/firebaseAdmin'

const CONFIG_COLLECTION = 'admin_config'
const CONFIG_DOC_ID = 'ai_settings'

interface ChatRequest {
  message: string
  customerId: string
  conversationHistory?: Array<{
    role: 'user' | 'assistant'
    content: string
  }>
}

interface WebhookTrigger {
  type: 'leadCapture' | 'appointmentBooking' | 'paymentProcess' | 'supportTicket' | 'humanHandoff'
  confidence: number
  extractedData?: Record<string, any>
}

export async function POST(request: NextRequest) {
  try {
    const { message, customerId, conversationHistory = [] }: ChatRequest = await request.json()

    // Carregar configurações da IA
    const configDoc = await adminDB.collection(CONFIG_COLLECTION).doc(CONFIG_DOC_ID).get()
    if (!configDoc.exists) {
      return NextResponse.json(
        { error: 'Configuração da IA não encontrada' },
        { status: 400 }
      )
    }

    const config = configDoc.data()
    if (!config?.openaiApiKey) {
      return NextResponse.json(
        { error: 'API Key OpenAI não configurada' },
        { status: 400 }
      )
    }

    // Detectar intenção e webhook necessário
    const webhookTrigger = detectWebhookIntent(message)

    // Construir prompt contextual
    const systemPrompt = `${config.systemPrompt}

IMPORTANTE: Você deve analisar cada mensagem e identificar quando acionar webhooks específicos:

1. LEAD CAPTURE (leadCapture): Quando o cliente demonstra interesse em produtos/serviços, pede orçamento, quer saber preços
2. APPOINTMENT BOOKING (appointmentBooking): Quando o cliente quer agendar reunião, conversar por telefone, marcar visita
3. PAYMENT PROCESS (paymentProcess): Quando o cliente fala sobre pagamento, formas de pagamento, quer fechar negócio
4. SUPPORT TICKET (supportTicket): Quando o cliente tem problemas, reclamações, precisa de suporte técnico
5. HUMAN HANDOFF (humanHandoff): Quando o cliente pede para falar com pessoa física, situação complexa

Responda de forma natural e indique no final se algum webhook deve ser acionado.`

    // Preparar mensagens para OpenAI
    const messages = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory,
      { role: 'user', content: message }
    ]

    // Chamar OpenAI
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.openaiApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: config.openaiModel || 'gpt-4',
        messages,
        temperature: config.openaiTemperature || 0.7,
        max_tokens: config.openaiMaxTokens || 1000
      })
    })

    if (!openaiResponse.ok) {
      const error = await openaiResponse.json()
      console.error('Erro OpenAI:', error)
      return NextResponse.json(
        { error: 'Erro ao processar com IA' },
        { status: 500 }
      )
    }

    const aiResult = await openaiResponse.json()
    const aiMessage = aiResult.choices[0]?.message?.content || config.fallbackMessage

    // Acionar webhook se detectado
    let webhookResult = null
    if (webhookTrigger && config.webhookUrls[webhookTrigger.type]) {
      webhookResult = await triggerWebhook(
        config.webhookUrls[webhookTrigger.type],
        webhookTrigger,
        {
          customerId,
          message,
          aiResponse: aiMessage,
          extractedData: webhookTrigger.extractedData
        }
      )
    }

    // Salvar conversa no Firebase
    await saveConversation(customerId, message, aiMessage, webhookTrigger?.type)

    return NextResponse.json({
      response: aiMessage,
      webhookTriggered: webhookTrigger?.type,
      webhookResult,
      confidence: webhookTrigger?.confidence
    })

  } catch (error) {
    console.error('Erro na API de chat:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

function detectWebhookIntent(message: string): WebhookTrigger | null {
  const lowerMessage = message.toLowerCase()
  
  // Palavras-chave para cada tipo de webhook
  const patterns = {
    leadCapture: {
      keywords: ['preço', 'valor', 'custo', 'orçamento', 'cotação', 'proposta', 'interesse', 'quero', 'gostaria'],
      confidence: 0.8
    },
    appointmentBooking: {
      keywords: ['agendar', 'reunião', 'conversar', 'ligar', 'telefone', 'visita', 'encontro', 'marcar'],
      confidence: 0.9
    },
    paymentProcess: {
      keywords: ['pagar', 'pagamento', 'cartão', 'boleto', 'pix', 'fechar', 'comprar', 'adquirir'],
      confidence: 0.95
    },
    supportTicket: {
      keywords: ['problema', 'erro', 'ajuda', 'suporte', 'não funciona', 'bug', 'reclamação'],
      confidence: 0.85
    },
    humanHandoff: {
      keywords: ['humano', 'pessoa', 'atendente', 'gerente', 'supervisor', 'falar com alguém'],
      confidence: 1.0
    }
  }

  for (const [type, config] of Object.entries(patterns)) {
    const matchCount = config.keywords.filter(keyword => 
      lowerMessage.includes(keyword)
    ).length

    if (matchCount > 0) {
      const confidence = Math.min(config.confidence * (matchCount / config.keywords.length), 1.0)
      
      return {
        type: type as WebhookTrigger['type'],
        confidence,
        extractedData: extractDataFromMessage(message, type)
      }
    }
  }

  return null
}

function extractDataFromMessage(message: string, type: string): Record<string, any> {
  const data: Record<string, any> = {}

  // Extrair nome
  const nameMatch = message.match(/meu nome é ([a-záêç\s]+)/i) || 
                   message.match(/me chamo ([a-záêç\s]+)/i) ||
                   message.match(/sou ([a-záêç\s]+)/i)
  if (nameMatch) {
    data.customerName = nameMatch[1].trim()
  }

  // Extrair telefone
  const phoneMatch = message.match(/(\(?[\d\s\-\(\)]{10,}\)?)/g)
  if (phoneMatch) {
    data.customerPhone = phoneMatch[0]
  }

  // Extrair email
  const emailMatch = message.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g)
  if (emailMatch) {
    data.customerEmail = emailMatch[0]
  }

  // Extrair valores monetários
  const valueMatch = message.match(/R?\$?\s?(\d{1,3}(?:\.\d{3})*(?:,\d{2})?)/g)
  if (valueMatch) {
    data.mentionedValue = valueMatch[0]
  }

  // Extrair datas
  const dateMatch = message.match(/(\d{1,2}\/\d{1,2}\/\d{4})|(\d{1,2} de \w+ de \d{4})/g)
  if (dateMatch) {
    data.mentionedDate = dateMatch[0]
  }

  return data
}

async function triggerWebhook(url: string, trigger: WebhookTrigger, context: any) {
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        type: trigger.type,
        confidence: trigger.confidence,
        timestamp: new Date().toISOString(),
        context,
        extractedData: trigger.extractedData
      })
    })

    return {
      success: response.ok,
      status: response.status,
      data: response.ok ? await response.json().catch(() => null) : null
    }
  } catch (error) {
    console.error('Erro ao acionar webhook:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

async function saveConversation(customerId: string, userMessage: string, aiResponse: string, webhookType?: string) {
  try {
    const conversationRef = adminDB.collection('conversations').doc(customerId)
    const timestamp = new Date().toISOString()

    await conversationRef.set({
      customerId,
      lastUpdate: timestamp,
      status: 'active'
    }, { merge: true })

    // Adicionar mensagens
    await conversationRef.collection('messages').add({
      content: userMessage,
      sender: 'user',
      timestamp,
      processed: true
    })

    await conversationRef.collection('messages').add({
      content: aiResponse,
      sender: 'ai',
      timestamp,
      webhookTriggered: webhookType || null
    })

  } catch (error) {
    console.error('Erro ao salvar conversa:', error)
  }
} 