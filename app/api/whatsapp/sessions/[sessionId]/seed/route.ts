import { NextRequest, NextResponse } from 'next/server'
import { adminDB } from '@/lib/firebaseAdmin'

export async function POST(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const sessionId = params.sessionId
    
    // Dados de exemplo para contatos
    const sampleContacts = [
      {
        phone: '+5511999999999',
        name: 'João Silva',
        messages: [
          { body: 'Olá, gostaria de informações sobre os pacotes', fromMe: false, timestamp: new Date(Date.now() - 3600000) },
          { body: 'Olá João! Claro, posso te ajudar com informações sobre nossos pacotes. Temos várias opções disponíveis.', fromMe: true, timestamp: new Date(Date.now() - 3500000) },
          { body: 'Qual seria o melhor para uma família de 4 pessoas?', fromMe: false, timestamp: new Date(Date.now() - 3000000) },
          { body: 'Para uma família de 4 pessoas, recomendo nosso Pacote Família Premium que inclui hospedagem, café da manhã e acesso completo às termas.', fromMe: true, timestamp: new Date(Date.now() - 2500000) }
        ]
      },
      {
        phone: '+5511888888888',
        name: 'Maria Santos',
        messages: [
          { body: 'Bom dia! Vocês têm promoções para este fim de semana?', fromMe: false, timestamp: new Date(Date.now() - 7200000) },
          { body: 'Bom dia Maria! Sim, temos uma promoção especial para este fim de semana. Desconto de 20% em todos os pacotes.', fromMe: true, timestamp: new Date(Date.now() - 7100000) },
          { body: 'Perfeito! Como faço para reservar?', fromMe: false, timestamp: new Date(Date.now() - 7000000) },
          { body: 'Você pode fazer a reserva pelo nosso site ou me passar seus dados que eu faço para você.', fromMe: true, timestamp: new Date(Date.now() - 6900000) }
        ]
      },
      {
        phone: '+5511777777777',
        name: 'Carlos Oliveira',
        messages: [
          { body: 'Oi, vocês têm estacionamento gratuito?', fromMe: false, timestamp: new Date(Date.now() - 1800000) },
          { body: 'Oi Carlos! Sim, temos estacionamento gratuito para todos os hóspedes.', fromMe: true, timestamp: new Date(Date.now() - 1700000) },
          { body: 'Ótimo! E vocês aceitam pets?', fromMe: false, timestamp: new Date(Date.now() - 1600000) },
          { body: 'Infelizmente não aceitamos pets no momento. Mas temos uma área especial para animais de serviço.', fromMe: true, timestamp: new Date(Date.now() - 1500000) }
        ]
      }
    ]

    // Adicionar mensagens de exemplo
    const batch = adminDB.batch()
    
    sampleContacts.forEach(contact => {
      contact.messages.forEach((message, index) => {
        const messageRef = adminDB.collection('whatsapp_messages').doc()
        batch.set(messageRef, {
          sessionId,
          from: message.fromMe ? 'system' : contact.phone,
          to: message.fromMe ? contact.phone : 'system',
          body: message.body,
          type: 'text',
          timestamp: message.timestamp,
          fromMe: message.fromMe,
          status: message.fromMe ? 'sent' : 'read'
        })
      })
    })

    await batch.commit()

    return NextResponse.json({ 
      success: true, 
      message: 'Dados de exemplo adicionados com sucesso',
      contactsAdded: sampleContacts.length
    })
  } catch (error) {
    console.error('Erro ao adicionar dados de exemplo:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
} 