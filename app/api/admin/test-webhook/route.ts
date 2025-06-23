import { NextRequest, NextResponse } from 'next/server'
import { adminDB } from '@/lib/firebaseAdmin'

export async function POST(request: NextRequest) {
  try {
    const { phone, message } = await request.json()
    
    if (!phone || !message) {
      return NextResponse.json({ 
        error: 'Phone e message são obrigatórios',
        example: { phone: '5515998765432', message: 'Olá, quero saber sobre pacotes' }
      }, { status: 400 })
    }

    console.log('=== TESTE COMPLETO DE FLUXO IA ===')
    
    // 1. Verificar configurações da IA
    console.log('1. Verificando configurações...')
    const configDoc = await adminDB.collection('admin_config').doc('ai_settings').get()
    
    if (!configDoc.exists) {
      return NextResponse.json({ 
        error: 'Configurações da IA não encontradas',
        step: 'config_check',
        action: 'Configure a IA no painel admin primeiro'
      }, { status: 500 })
    }

    const config = configDoc.data()!
    console.log('Config encontrada:', {
      hasOpenAIKey: !!config.openaiApiKey,
      hasZAPIKey: !!config.zapiApiKey,
      hasInstanceId: !!config.zapiInstanceId,
      model: config.openaiModel
    })

    if (!config.openaiApiKey) {
      return NextResponse.json({ 
        error: 'OpenAI API Key não configurada',
        step: 'openai_config',
        action: 'Configure a OpenAI API Key no painel admin'
      }, { status: 500 })
    }

    if (!config.zapiApiKey || !config.zapiInstanceId) {
      return NextResponse.json({ 
        error: 'Z-API não configurada',
        step: 'zapi_config',
        action: 'Configure Z-API no painel admin'
      }, { status: 500 })
    }

    // 2. Criar/verificar conversa
    console.log('2. Criando conversa de teste...')
    const conversationRef = adminDB.collection('conversations').doc(phone)
    await conversationRef.set({
      customerName: 'Usuário Teste',
      customerPhone: phone,
      customerAvatar: `https://ui-avatars.com/api/?name=Teste&background=random`,
      lastMessage: message,
      timestamp: new Date().toISOString(),
      unreadCount: 0,
      status: 'open',
      source: 'test',
      aiEnabled: true,
      aiPaused: false,
      conversationStatus: 'ai_active',
    }, { merge: true })

    // 3. Salvar mensagem do usuário
    console.log('3. Salvando mensagem do usuário...')
    const userMessageDoc = {
      content: message,
      role: 'user',
      timestamp: new Date().toISOString(),
      status: 'sent'
    }
    await conversationRef.collection('messages').add(userMessageDoc)

    // 4. Chamar OpenAI API
    console.log('4. Testando OpenAI API...')
    try {
      const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.openaiApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: config.openaiModel || 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: config.systemPrompt || 'Você é um assistente do Grupo Thermas.'
            },
            {
              role: 'user',
              content: message
            }
          ],
          temperature: config.openaiTemperature || 0.7,
          max_tokens: config.openaiMaxTokens || 500
        })
      })

      if (!openaiResponse.ok) {
        const errorText = await openaiResponse.text()
        console.error('Erro OpenAI:', errorText)
        return NextResponse.json({ 
          error: 'Erro na OpenAI API',
          details: errorText,
          step: 'openai_call',
          action: 'Verifique sua API Key da OpenAI'
        }, { status: 500 })
      }

      const openaiData = await openaiResponse.json()
      const aiMessage = openaiData.choices?.[0]?.message?.content

      if (!aiMessage) {
        return NextResponse.json({ 
          error: 'Resposta vazia da OpenAI',
          step: 'openai_response',
          openaiData
        }, { status: 500 })
      }

      console.log('OpenAI respondeu:', aiMessage.substring(0, 100) + '...')

      // 5. Salvar resposta da IA
      console.log('5. Salvando resposta da IA...')
      const aiMessageDoc = {
        content: aiMessage,
        role: 'ai',
        timestamp: new Date().toISOString(),
        status: 'sent'
      }
      await conversationRef.collection('messages').add(aiMessageDoc)

      // 6. Testar Z-API (sem enviar de verdade)
      console.log('6. Testando Z-API...')
      const zapiUrl = `https://api.z-api.io/instances/${config.zapiInstanceId}/token/${config.zapiApiKey}/send-text`
      
      const zapiHeaders: Record<string, string> = {
        'Content-Type': 'application/json',
      }

      if (config.zapiClientToken && config.zapiClientToken.trim()) {
        zapiHeaders['Client-Token'] = config.zapiClientToken.trim()
      }

      // Teste de conectividade Z-API (sem enviar mensagem)
      const zapiTestUrl = `https://api.z-api.io/instances/${config.zapiInstanceId}/token/${config.zapiApiKey}/status`
      try {
        const zapiTest = await fetch(zapiTestUrl, {
          method: 'GET',
          headers: { 'Accept': 'application/json', ...zapiHeaders }
        })
        
        const zapiStatus = await zapiTest.json()
        console.log('Status Z-API:', zapiStatus)

        if (!zapiTest.ok) {
          return NextResponse.json({ 
            error: 'Z-API não está funcionando',
            details: zapiStatus,
            step: 'zapi_test',
            action: 'Verifique suas credenciais Z-API'
          }, { status: 500 })
        }

      } catch (zapiError) {
        console.error('Erro Z-API:', zapiError)
        return NextResponse.json({ 
          error: 'Erro ao conectar com Z-API',
          details: zapiError instanceof Error ? zapiError.message : 'Unknown error',
          step: 'zapi_connection',
          action: 'Verifique se as credenciais Z-API estão corretas'
        }, { status: 500 })
      }

      // 7. Atualizar conversa
      await conversationRef.update({
        lastMessage: aiMessage,
        timestamp: new Date().toISOString()
      })

      return NextResponse.json({ 
        success: true,
        message: 'Teste completo realizado com sucesso!',
        results: {
          userMessage: message,
          aiMessage: aiMessage,
          conversationId: phone,
          steps: [
            '✅ Configurações verificadas',
            '✅ Conversa criada',
            '✅ Mensagem do usuário salva',
            '✅ OpenAI respondeu',
            '✅ Resposta da IA salva',
            '✅ Z-API testada',
            '✅ Conversa atualizada'
          ]
        }
      })

    } catch (openaiError) {
      console.error('Erro OpenAI:', openaiError)
      return NextResponse.json({ 
        error: 'Erro ao chamar OpenAI',
        details: openaiError instanceof Error ? openaiError.message : 'Unknown error',
        step: 'openai_call'
      }, { status: 500 })
    }

  } catch (error) {
    console.error('Erro no teste:', error)
    return NextResponse.json({ 
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'API de teste de webhook funcionando',
    usage: {
      method: 'POST',
      body: {
        phone: '5515998765432',
        message: 'Olá, quero saber sobre pacotes'
      }
    }
  })
} 