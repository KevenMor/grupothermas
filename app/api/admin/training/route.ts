import { NextRequest, NextResponse } from 'next/server'
import { adminDB } from '@/lib/firebaseAdmin'

interface TrainingData {
  faq: Array<{id: string, question: string, answer: string}>
  products: Array<{id: string, name: string, description: string, price: string}>
  policies: Array<{id: string, title: string, content: string}>
  personality: {
    tone: string
    style: string
    greeting: string
    signature: string
  }
  updatedAt: string
}

export async function POST(request: NextRequest) {
  try {
    const trainingData: TrainingData = await request.json()
    
    // Validar dados
    if (!trainingData.faq || !trainingData.products || !trainingData.policies || !trainingData.personality) {
      return NextResponse.json({ 
        error: 'Dados de treinamento incompletos' 
      }, { status: 400 })
    }

    console.log('=== SALVANDO DADOS DE TREINAMENTO ===')
    console.log('FAQ items:', trainingData.faq.length)
    console.log('Products:', trainingData.products.length)
    console.log('Policies:', trainingData.policies.length)
    console.log('Personality:', trainingData.personality)

    // Salvar no Firebase
    await adminDB.collection('admin_config').doc('ai_training').set({
      ...trainingData,
      updatedAt: new Date().toISOString()
    })

    console.log('Dados de treinamento salvos com sucesso!')

    return NextResponse.json({ 
      success: true,
      message: 'Dados de treinamento salvos com sucesso!',
      data: trainingData
    })

  } catch (error) {
    console.error('Erro ao salvar dados de treinamento:', error)
    return NextResponse.json({ 
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function GET() {
  try {
    console.log('=== BUSCANDO DADOS DE TREINAMENTO ===')
    
    const doc = await adminDB.collection('admin_config').doc('ai_training').get()
    
    if (!doc.exists) {
      console.log('Nenhum dado de treinamento encontrado, retornando dados padrão')
      return NextResponse.json({
        faq: [],
        products: [],
        policies: [],
        personality: {
          tone: 'professional',
          style: 'helpful',
          greeting: 'Olá! Como posso ajudá-lo hoje?',
          signature: 'Atenciosamente, Equipe Grupo Thermas'
        },
        updatedAt: new Date().toISOString()
      })
    }

    const data = doc.data() as TrainingData
    console.log('Dados de treinamento encontrados:', {
      faq: data.faq?.length || 0,
      products: data.products?.length || 0,
      policies: data.policies?.length || 0,
      personality: !!data.personality
    })

    return NextResponse.json(data)

  } catch (error) {
    console.error('Erro ao buscar dados de treinamento:', error)
    return NextResponse.json({ 
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 