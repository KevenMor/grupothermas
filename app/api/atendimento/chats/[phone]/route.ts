import { NextRequest, NextResponse } from 'next/server'
import { adminDB } from '@/lib/firebaseAdmin'

// PATCH /api/atendimento/chats/[phone]
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ phone: string }> }) {
  try {
    const { phone } = await params
    const { customerName, customerAvatar } = await request.json()
    if (!customerName && !customerAvatar) {
      return NextResponse.json({ error: 'Nenhum dado para atualizar.' }, { status: 400 })
    }
    const updateData: any = {}
    if (customerName) updateData.customerName = customerName
    if (customerAvatar) updateData.customerAvatar = customerAvatar
    updateData.updatedAt = new Date().toISOString()
    await adminDB.collection('conversations').doc(phone).update(updateData)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao atualizar cliente:', error)
    return NextResponse.json({ error: 'Erro ao atualizar cliente.' }, { status: 500 })
  }
} 