import { NextResponse, NextRequest } from 'next/server'
import { adminDB } from '@/lib/firebaseAdmin'

export const runtime = 'nodejs'

// GET - Buscar configurações de delay
export async function GET() {
  try {
    const configDoc = await adminDB
      .collection('ai-config')
      .doc('delay-settings')
      .get()

    if (!configDoc.exists) {
      // Configurações padrão
      const defaultConfig = {
        enabled: true,
        minDelay: 2000, // 2 segundos
        maxDelay: 5000, // 5 segundos
        perMessageDelay: 1000, // 1 segundo adicional por mensagem na fila
        updatedAt: new Date().toISOString()
      }
      
      await adminDB
        .collection('ai-config')
        .doc('delay-settings')
        .set(defaultConfig)
        
      return NextResponse.json(defaultConfig)
    }

    return NextResponse.json(configDoc.data())
  } catch (error) {
    console.error('Erro ao buscar configurações de delay:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

// POST - Atualizar configurações de delay
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { enabled, minDelay, maxDelay, perMessageDelay } = body

    // Validações
    if (typeof enabled !== 'boolean') {
      return NextResponse.json({ error: 'enabled deve ser um boolean' }, { status: 400 })
    }

    if (minDelay && (typeof minDelay !== 'number' || minDelay < 0)) {
      return NextResponse.json({ error: 'minDelay deve ser um número positivo' }, { status: 400 })
    }

    if (maxDelay && (typeof maxDelay !== 'number' || maxDelay < minDelay)) {
      return NextResponse.json({ error: 'maxDelay deve ser maior que minDelay' }, { status: 400 })
    }

    const config = {
      enabled,
      minDelay: minDelay || 2000,
      maxDelay: maxDelay || 5000,
      perMessageDelay: perMessageDelay || 1000,
      updatedAt: new Date().toISOString()
    }

    await adminDB
      .collection('ai-config')
      .doc('delay-settings')
      .set(config, { merge: true })

    return NextResponse.json(config)
  } catch (error) {
    console.error('Erro ao atualizar configurações de delay:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
} 