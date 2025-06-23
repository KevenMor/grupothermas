import { NextRequest, NextResponse } from 'next/server'
import { adminDB } from '@/lib/firebaseAdmin'

export async function POST(request: NextRequest) {
  try {
    // Simular uma mensagem recebida da Z-API
    const testMessage = {
      messageId: 'test-' + Date.now(),
      phone: '5515998023871', // Seu número de teste
      fromMe: false,
      momment: Math.floor(Date.now() / 1000),
      type: 'text',
      text: {
        message: 'Teste de mensagem recebida via webhook'
      },
      senderName: 'Teste Usuário',
      chatName: 'Teste Usuário'
    }

    console.log('=== TESTE DE MENSAGEM ===')
    console.log('Mensagem de teste:', testMessage)

    // Salvar no Firebase como se fosse uma mensagem real
    const conversationRef = adminDB.collection('conversations').doc(testMessage.phone)
    const conversationDoc = await conversationRef.get()
    
    let conversationHistory: any[] = []

    if (!conversationDoc.exists) {
      console.log('Criando nova conversa para teste')
      await conversationRef.set({
        phone: testMessage.phone,
        name: testMessage.senderName,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: 'active',
        messages: [],
        source: 'zapi'
      })
    } else {
      const conversationData = conversationDoc.data()
      conversationHistory = conversationData?.messages || []
    }

    // Adicionar mensagem de teste
    const userMessageData = {
      id: testMessage.messageId,
      role: 'user',
      content: testMessage.text.message,
      timestamp: new Date(testMessage.momment * 1000).toISOString(),
      phone: testMessage.phone,
      name: testMessage.senderName
    }

    conversationHistory.push(userMessageData)

    // Atualizar conversa no Firebase
    await conversationRef.update({
      messages: conversationHistory,
      updatedAt: new Date().toISOString(),
      lastMessage: testMessage.text.message
    })

    console.log('Mensagem de teste salva no Firebase')

    return NextResponse.json({ 
      success: true, 
      message: 'Mensagem de teste processada com sucesso',
      conversationId: testMessage.phone
    })

  } catch (error) {
    console.error('Erro ao processar mensagem de teste:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
} 