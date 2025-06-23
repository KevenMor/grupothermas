import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { url, type } = await request.json()
    
    if (!url || !type) {
      return NextResponse.json(
        { error: 'URL e tipo são obrigatórios' },
        { status: 400 }
      )
    }
    
    // Create test payload based on webhook type
    const testPayloads: { [key: string]: any } = {
      leadCapture: {
        type: 'lead_capture',
        data: {
          name: 'João Silva',
          phone: '11999999999',
          email: 'joao@email.com',
          interest: 'Pacote Termal Premium',
          source: 'WhatsApp Bot',
          timestamp: new Date().toISOString()
        }
      },
      appointmentBooking: {
        type: 'appointment_booking',
        data: {
          customerName: 'Maria Santos',
          phone: '11888888888',
          preferredDate: '2024-02-15',
          preferredTime: '14:00',
          service: 'Consulta Personalizada',
          notes: 'Cliente interessado em pacote para casal',
          timestamp: new Date().toISOString()
        }
      },
      paymentProcess: {
        type: 'payment_process',
        data: {
          customerName: 'Carlos Oliveira',
          phone: '11777777777',
          packageId: 'thermas-premium-001',
          amount: 2500.00,
          currency: 'BRL',
          paymentMethod: 'credit_card',
          timestamp: new Date().toISOString()
        }
      },
      supportTicket: {
        type: 'support_ticket',
        data: {
          customerName: 'Ana Costa',
          phone: '11666666666',
          issue: 'Dúvida sobre cancelamento',
          priority: 'medium',
          category: 'reservas',
          description: 'Cliente precisa cancelar reserva devido a imprevisto',
          timestamp: new Date().toISOString()
        }
      },
      humanHandoff: {
        type: 'human_handoff',
        data: {
          customerName: 'Pedro Ferreira',
          phone: '11555555555',
          chatId: 'chat_12345',
          reason: 'Solicitação de atendimento especializado',
          context: 'Cliente interessado em pacote corporativo para 50 pessoas',
          urgency: 'high',
          timestamp: new Date().toISOString()
        }
      }
    }
    
    const testPayload = testPayloads[type] || {
      type: 'test',
      data: { message: 'Test webhook call', timestamp: new Date().toISOString() }
    }
    
    console.log(`Testando webhook ${type}:`, { url, payload: testPayload })
    
    // Send test request to webhook URL
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Thermas-AI-Bot/1.0'
      },
      body: JSON.stringify(testPayload),
      // Set timeout for webhook test
      signal: AbortSignal.timeout(10000) // 10 seconds
    })
    
    const responseText = await response.text()
    
    if (!response.ok) {
      console.error(`Webhook test failed for ${type}:`, {
        status: response.status,
        statusText: response.statusText,
        body: responseText
      })
      
      return NextResponse.json({
        success: false,
        error: `Webhook retornou status ${response.status}`,
        details: responseText
      }, { status: 400 })
    }
    
    console.log(`Webhook test successful for ${type}:`, {
      status: response.status,
      body: responseText
    })
    
    return NextResponse.json({
      success: true,
      status: response.status,
      response: responseText,
      message: 'Webhook testado com sucesso'
    })
    
  } catch (error) {
    console.error('Erro ao testar webhook:', error)
    
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        return NextResponse.json({
          success: false,
          error: 'Timeout: Webhook não respondeu em 10 segundos'
        }, { status: 408 })
      }
      
      if (error.message.includes('fetch')) {
        return NextResponse.json({
          success: false,
          error: 'Erro de conexão: Não foi possível conectar ao webhook'
        }, { status: 502 })
      }
    }
    
    return NextResponse.json({
      success: false,
      error: 'Erro interno do servidor'
    }, { status: 500 })
  }
} 