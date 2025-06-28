import { NextRequest, NextResponse } from 'next/server'
import { adminDB, adminAuth } from '@/lib/firebaseAdmin'

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ success: false, error: 'Token não fornecido' }, { status: 401 })
    }
    const token = authHeader.replace('Bearer ', '')
    if (!adminAuth) {
      return NextResponse.json({ success: false, error: 'adminAuth não inicializado' }, { status: 500 })
    }
    const decodedToken = await adminAuth.verifyIdToken(token)
    const userId = decodedToken.uid
    const userDoc = await adminDB.collection('users').doc(userId).get()
    if (!userDoc.exists) {
      return NextResponse.json({ success: false, error: 'Usuário não encontrado' }, { status: 404 })
    }
    const userData = { id: userDoc.id, ...userDoc.data() }
    return NextResponse.json({ success: true, data: userData })
  } catch (error) {
    console.error('Erro ao buscar perfil do usuário:', error)
    return NextResponse.json({ success: false, error: 'Erro interno do servidor' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ success: false, error: 'Token não fornecido' }, { status: 401 })
    }
    const token = authHeader.replace('Bearer ', '')
    if (!adminAuth) {
      return NextResponse.json({ success: false, error: 'adminAuth não inicializado' }, { status: 500 })
    }
    const decodedToken = await adminAuth.verifyIdToken(token)
    const userId = decodedToken.uid
    const body = await request.json()
    const { name, phone, photoURL, currentPassword, newPassword } = body
    const userDoc = await adminDB.collection('users').doc(userId).get()
    if (!userDoc.exists) {
      return NextResponse.json({ success: false, error: 'Usuário não encontrado' }, { status: 404 })
    }
    // Atualizar dados básicos
    const updateData: any = {}
    if (name) updateData.name = name
    if (phone) updateData.phone = phone
    if (photoURL) updateData.photoURL = photoURL
    updateData.updatedAt = new Date().toISOString()
    await adminDB.collection('users').doc(userId).update(updateData)
    // Troca de senha (opcional)
    if (currentPassword && newPassword) {
      await adminAuth.updateUser(userId, { password: newPassword })
    }
    return NextResponse.json({ success: true, message: 'Perfil atualizado com sucesso' })
  } catch (error) {
    console.error('Erro ao atualizar perfil do usuário:', error)
    return NextResponse.json({ success: false, error: 'Erro interno do servidor' }, { status: 500 })
  }
} 