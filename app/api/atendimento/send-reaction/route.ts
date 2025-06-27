import { NextRequest, NextResponse } from 'next/server'
import { adminDB } from '@/lib/firebaseAdmin'
import { Reaction } from '@/lib/models'

interface SendReactionRequest {
  phone: string
  messageId: string
  emoji: string
  agentName?: string
  agentId?: string
}

export async function POST(request: NextRequest) {
  try {
    const { phone, messageId, emoji, agentName, agentId }: SendReactionRequest = await request.json()
    
    console.log('=== ENVIANDO REAÇÃO ===')
    console.log('Phone:', phone)
    console.log('MessageId:', messageId)
    console.log('Emoji:', emoji)
    console.log('AgentName:', agentName)
    console.log('AgentId:', agentId)
    
    if (!phone || !messageId || !emoji) {
      return NextResponse.json({ 
        error: 'Phone, messageId e emoji são obrigatórios'
      }, { status: 400 })
    }

    // Validar emoji
    const validEmojis = ['👍', '❤️', '😂', '😮', '😢', '🙏']
    if (!validEmojis.includes(emoji)) {
      return NextResponse.json({ 
        error: 'Emoji não suportado. Use apenas: 👍, ❤️, 😂, 😮, 😢, 🙏'
      }, { status: 400 })
    }

    // Buscar configuração Z-API do Firestore
    let zapiInstance: string
    let zapiToken: string
    let zapiClientToken: string | undefined
    
    try {
      const configDoc = await adminDB.collection('admin_config').doc('ai_settings').get()
      
      if (!configDoc.exists) {
        return NextResponse.json({ 
          error: 'Configuração Z-API não encontrada no Firestore'
        }, { status: 500 })
      }

      const config = configDoc.data()!
      zapiInstance = config.zapiInstanceId
      zapiToken = config.zapiApiKey
      zapiClientToken = config.zapiClientToken
      
      if (!zapiInstance || !zapiToken) {
        return NextResponse.json({ 
          error: 'Z-API não configurada corretamente (instanceId ou apiKey faltando)'
        }, { status: 500 })
      }
      
      console.log('Configuração Z-API carregada:', {
        instanceId: zapiInstance,
        hasToken: !!zapiToken,
        hasClientToken: !!zapiClientToken
      })
      
    } catch (configError) {
      console.error('Erro ao carregar configuração Z-API:', configError)
      return NextResponse.json({ 
        error: 'Erro ao carregar configuração Z-API'
      }, { status: 500 })
    }

    const zapiUrl = `https://api.z-api.io/instances/${zapiInstance}/token/${zapiToken}/send-message-reaction`
    
    const zapiPayload = {
      phone: phone,
      messageId: messageId,
      reaction: emoji
    }

    console.log('=== ENVIANDO REAÇÃO VIA Z-API ===')
    console.log('URL:', zapiUrl)
    console.log('Payload:', JSON.stringify(zapiPayload, null, 2))

    // Headers da requisição
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    }
    
    if (zapiClientToken && zapiClientToken.trim()) {
      headers['Client-Token'] = zapiClientToken.trim()
    }

    console.log('Headers:', headers)

    const zapiResponse = await fetch(zapiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(zapiPayload)
    })

    const zapiResultText = await zapiResponse.text()
    let zapiResult: any = {}
    
    try {
      zapiResult = JSON.parse(zapiResultText)
    } catch (parseError) {
      console.error('Erro ao fazer parse da resposta Z-API:', parseError)
      zapiResult = { raw: zapiResultText }
    }
    
    console.log('=== RESPOSTA Z-API REAÇÃO ===')
    console.log('Status:', zapiResponse.status)
    console.log('Status Text:', zapiResponse.statusText)
    console.log('Response:', zapiResult)

    if (!zapiResponse.ok) {
      console.error('Erro Z-API detalhado:', {
        status: zapiResponse.status,
        statusText: zapiResponse.statusText,
        response: zapiResult,
        url: zapiUrl,
        payload: zapiPayload,
        timestamp: new Date().toISOString()
      })
      
      return NextResponse.json({ 
        error: 'Erro ao enviar reação via Z-API',
        details: zapiResult,
        zapiStatus: zapiResponse.status,
        zapiStatusText: zapiResponse.statusText
      }, { status: zapiResponse.status })
    }

    // Salvar reação no Firestore
    try {
      const conversationRef = adminDB.collection('conversations').doc(phone)
      const messageRef = conversationRef.collection('messages').doc(messageId)
      
      // Verificar se a mensagem existe
      const messageDoc = await messageRef.get()
      if (!messageDoc.exists) {
        console.warn('Mensagem não encontrada no Firestore:', messageId)
        // Não falhar aqui, apenas logar o warning
      } else {
        // Criar objeto de reação
        const reaction: Reaction = {
          emoji: emoji,
          by: agentName || 'Atendente',
          fromMe: true,
          timestamp: new Date().toISOString(),
          agentId: agentId
        }

        // Adicionar reação ao array de reações da mensagem
        await messageRef.update({
          reactions: adminDB.FieldValue.arrayUnion(reaction)
        })

        console.log('Reação salva no Firestore com sucesso')
      }

      return NextResponse.json({
        success: true,
        message: 'Reação enviada com sucesso',
        reaction: {
          emoji: emoji,
          by: agentName || 'Atendente',
          fromMe: true,
          timestamp: new Date().toISOString(),
          agentId: agentId
        },
        zapiResult: zapiResult
      })

    } catch (firestoreError) {
      console.error('Erro ao salvar reação no Firestore:', firestoreError)
      // Mesmo com erro no Firestore, retorna sucesso se Z-API funcionou
      return NextResponse.json({
        success: true,
        message: 'Reação enviada via Z-API, mas erro ao salvar no histórico',
        warning: 'Reação enviada mas não salva no histórico',
        firestoreError: firestoreError instanceof Error ? firestoreError.message : 'Unknown error'
      })
    }

  } catch (error) {
    console.error('Erro geral no envio de reação:', error)
    return NextResponse.json({ 
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
} 