import { NextRequest, NextResponse } from 'next/server'

// Simulação de banco de dados em memória
let instances: any[] = [
  {
    id: '1',
    name: 'Atendimento Principal',
    phone: '+55 11 99999-9999',
    status: 'connected',
    token: 'z-api-token-123',
    instanceId: 'instance-123',
    messagesCount: 245,
    n8nWebhook: 'https://n8n.exemplo.com/webhook/whatsapp',
    aiEnabled: true,
    lastActivity: new Date(),
    createdAt: new Date()
  }
]

export async function GET() {
  try {
    return NextResponse.json({ 
      success: true, 
      instances: instances.map(instance => ({
        ...instance,
        token: instance.token ? '***' : null // Ocultar token na resposta
      }))
    })
  } catch (error) {
    console.error('Erro ao buscar instâncias:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, token, instanceId, n8nWebhook } = body

    if (!name || !token || !instanceId) {
      return NextResponse.json(
        { success: false, error: 'Nome, token e instanceId são obrigatórios' },
        { status: 400 }
      )
    }

    // Verificar se já existe uma instância com o mesmo instanceId
    const existingInstance = instances.find(inst => inst.instanceId === instanceId)
    if (existingInstance) {
      return NextResponse.json(
        { success: false, error: 'Instance ID já existe' },
        { status: 409 }
      )
    }

    const newInstance = {
      id: Date.now().toString(),
      name,
      phone: '',
      status: 'disconnected',
      token,
      instanceId,
      messagesCount: 0,
      n8nWebhook: n8nWebhook || null,
      aiEnabled: false,
      lastActivity: null,
      createdAt: new Date()
    }

    instances.push(newInstance)

    // Simular chamada para Z-API para criar a instância
    console.log(`[Z-API] Criando instância: ${instanceId}`)
    
    // Simular webhook para N8N se fornecido
    if (n8nWebhook) {
      console.log(`[N8N] Configurando webhook: ${n8nWebhook}`)
    }

    return NextResponse.json({ 
      success: true, 
      instance: {
        ...newInstance,
        token: '***' // Ocultar token na resposta
      }
    })
  } catch (error) {
    console.error('Erro ao criar instância:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID da instância é obrigatório' },
        { status: 400 }
      )
    }

    const instanceIndex = instances.findIndex(inst => inst.id === id)
    if (instanceIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'Instância não encontrada' },
        { status: 404 }
      )
    }

    instances[instanceIndex] = {
      ...instances[instanceIndex],
      ...updates,
      updatedAt: new Date()
    }

    return NextResponse.json({ 
      success: true, 
      instance: {
        ...instances[instanceIndex],
        token: '***' // Ocultar token na resposta
      }
    })
  } catch (error) {
    console.error('Erro ao atualizar instância:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID da instância é obrigatório' },
        { status: 400 }
      )
    }

    const instanceIndex = instances.findIndex(inst => inst.id === id)
    if (instanceIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'Instância não encontrada' },
        { status: 404 }
      )
    }

    const deletedInstance = instances.splice(instanceIndex, 1)[0]

    // Simular chamada para Z-API para deletar a instância
    console.log(`[Z-API] Deletando instância: ${deletedInstance.instanceId}`)

    return NextResponse.json({ 
      success: true, 
      message: 'Instância deletada com sucesso' 
    })
  } catch (error) {
    console.error('Erro ao deletar instância:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
} 