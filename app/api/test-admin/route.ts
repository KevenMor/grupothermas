import { NextRequest, NextResponse } from 'next/server'
import { adminDB } from '@/lib/firebaseAdmin'

export async function GET(request: NextRequest) {
  try {
    // Teste simples para verificar se o Firebase Admin está funcionando
    const testDoc = await adminDB.collection('test').doc('connection').get()
    
    return NextResponse.json({
      success: true,
      message: 'Firebase Admin configurado corretamente',
      timestamp: new Date().toISOString(),
      hasData: testDoc.exists
    })
  } catch (error: any) {
    console.error('Erro Firebase Admin:', error)
    
    return NextResponse.json({
      success: false,
      message: 'Erro na configuração do Firebase Admin',
      error: error.message
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json()
    
    // Adicionar um documento de teste
    const docRef = await adminDB.collection('test').add({
      message: message || 'Teste Firebase Admin',
      timestamp: new Date(),
      from: 'API Route'
    })
    
    return NextResponse.json({
      success: true,
      message: 'Documento criado com sucesso',
      docId: docRef.id
    })
  } catch (error: any) {
    console.error('Erro ao criar documento:', error)
    
    return NextResponse.json({
      success: false,
      message: 'Erro ao criar documento',
      error: error.message
    }, { status: 500 })
  }
} 