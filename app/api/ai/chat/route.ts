import { NextRequest, NextResponse } from 'next/server'
import { adminDB } from '@/lib/firebaseAdmin'

export const runtime = 'nodejs'

// Configuração da OpenAI
const OPENAI_API_KEY = process.env.OPENAI_API_KEY
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions'

// Prompt do sistema para o Grupo Thermas
const SYSTEM_PROMPT = `
Você é um assistente virtual especializado do Grupo Thermas, uma empresa de águas termais e turismo.

INFORMAÇÕES DA EMPRESA:
- Grupo Thermas é especializado em águas termais terapêuticas
- Oferece pacotes de turismo, hospedagem e tratamentos termais
- Localizado em região de águas termais naturais
- Foco em bem-estar, relaxamento e saúde

SEUS OBJETIVOS:
1. Atender clientes interessados em pacotes termais
2. Informar sobre tratamentos e benefícios das águas termais
3. Auxiliar com reservas e informações de hospedagem
4. Identificar necessidades específicas dos clientes
5. Transferir para atendente humano quando necessário

COMO RESPONDER:
- Seja sempre cordial e profissional
- Use linguagem acessível e acolhedora
- Faça perguntas para entender melhor as necessidades
- Ofereça soluções personalizadas
- Se não souber algo, seja honesto e ofereça transferir para um especialista

IMPORTANTE:
- Sempre pergunte o nome do cliente no início da conversa
- Identifique se é primeira visita ou cliente retornando
- Colete informações sobre: datas desejadas, número de pessoas, tipo de experiência buscada
- Se a conversa ficar complexa ou o cliente solicitar, ofereça transferir para um atendente humano

Responda sempre em português brasileiro de forma natural e amigável.
`

export async function POST(request: NextRequest) {
  try {
    const { chatId, customerMessage, customerName, conversationHistory } = await request.json()

    if (!chatId || !customerMessage) {
      return NextResponse.json(
        { error: 'ChatId e mensagem são obrigatórios' },
        { status: 400 }
      )
    }

    // Verificar se a IA está ativa para esta conversa
    const chatRef = adminDB.collection('conversations').doc(chatId)
    const chatDoc = await chatRef.get()
    
    if (!chatDoc.exists) {
      return NextResponse.json(
        { error: 'Conversa não encontrada' },
        { status: 404 }
      )
    }

    const chatData = chatDoc.data()
    
    // Só responder se a IA estiver ativa
    if (chatData?.conversationStatus !== 'waiting' && chatData?.conversationStatus !== 'ai_active') {
      return NextResponse.json({ 
        message: 'IA não está ativa para esta conversa',
        shouldRespond: false 
      })
    }

    // Preparar histórico da conversa para contexto
    const messagesRef = chatRef.collection('messages')
    const recentMessages = await messagesRef
      .orderBy('timestamp', 'desc')
      .limit(10)
      .get()

    const context = recentMessages.docs
      .reverse()
      .map((doc: any) => {
        const data = doc.data()
        const role = data.role === 'user' ? 'Cliente' : 'Assistente'
        return `${role}: ${data.content}`
      })
      .join('\n')

    // Preparar mensagens para OpenAI
    const messages = [
      {
        role: 'system',
        content: SYSTEM_PROMPT
      },
      {
        role: 'user',
        content: `
Histórico da conversa:
${context}

Nova mensagem do cliente ${customerName || 'Cliente'}:
${customerMessage}

Responda de forma natural e útil, considerando o contexto da conversa.
        `
      }
    ]

    // Chamar OpenAI API
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY não configurada')
    }

    const openaiResponse = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini', // Modelo mais econômico
        messages,
        max_tokens: 500,
        temperature: 0.7,
        presence_penalty: 0.1,
        frequency_penalty: 0.1
      })
    })

    if (!openaiResponse.ok) {
      const errorData = await openaiResponse.json().catch(() => ({}))
      throw new Error(`OpenAI API Error: ${openaiResponse.status} - ${errorData.error?.message || 'Unknown error'}`)
    }

    const aiData = await openaiResponse.json()
    const aiMessage = aiData.choices?.[0]?.message?.content

    if (!aiMessage) {
      throw new Error('Resposta vazia da OpenAI')
    }

    // Salvar resposta da IA no Firestore
    const aiMessageDoc = {
      content: aiMessage.trim(),
      role: 'ai',
      timestamp: new Date().toISOString(),
      status: 'sent'
    }

    await messagesRef.add(aiMessageDoc)

    // Atualizar status da conversa para ai_active
    await chatRef.update({
      conversationStatus: 'ai_active',
      lastMessage: aiMessage.trim(),
      timestamp: new Date().toISOString()
    })

    // Enviar mensagem via Z-API
    const zapiResponse = await sendMessageViaZAPI(chatId, aiMessage.trim())

    return NextResponse.json({
      success: true,
      aiMessage: aiMessage.trim(),
      shouldRespond: true,
      zapiSent: zapiResponse.success
    })

  } catch (error) {
    console.error('Erro no chat com IA:', error)
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// Função para enviar mensagem via Z-API
async function sendMessageViaZAPI(phone: string, message: string) {
  try {
    // Buscar configurações da Z-API do Firebase
    const configDoc = await adminDB.collection('admin_config').doc('ai_settings').get()
    
    if (!configDoc.exists) {
      throw new Error('Configurações não encontradas no Firebase')
    }

    const config = configDoc.data()!

    if (!config.zapiApiKey || !config.zapiInstanceId) {
      throw new Error('Z-API não configurada no Admin IA')
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    }

    if (config.zapiClientToken && config.zapiClientToken.trim()) {
      headers['Client-Token'] = config.zapiClientToken.trim()
    }

    const response = await fetch(`https://api.z-api.io/instances/${config.zapiInstanceId}/token/${config.zapiApiKey}/send-text`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        phone,
        message
      })
    })

    const result = await response.json()
    
    return {
      success: response.ok,
      data: result
    }
  } catch (error) {
    console.error('Erro ao enviar via Z-API:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
} 