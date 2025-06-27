import { NextRequest, NextResponse } from 'next/server'
import { adminDB } from '@/lib/firebaseAdmin'

// PATCH /api/atendimento/chats/[phone]
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ phone: string }> }) {
  try {
    const { phone } = await params
    const body = await request.json()
    const { customerName, customerAvatar, markAsRead } = body
    
    if (!customerName && !customerAvatar && !markAsRead) {
      return NextResponse.json({ error: 'Nenhum dado para atualizar.' }, { status: 400 })
    }
    
    const updateData: any = {}
    
    if (customerName) updateData.customerName = customerName
    if (customerAvatar) updateData.customerAvatar = customerAvatar
    
    // Marcar mensagens como lidas
    if (markAsRead) {
      updateData.unreadCount = 0
      updateData.lastReadAt = new Date().toISOString()
      
      // Atualizar status das mensagens não lidas para 'read'
      const messagesRef = adminDB.collection('conversations').doc(phone).collection('messages')
      const unreadMessages = await messagesRef
        .where('status', 'in', ['sent', 'delivered'])
        .where('role', '==', 'user')
        .get()
      
      const batch = adminDB.batch()
      unreadMessages.docs.forEach((doc: any) => {
        batch.update(doc.ref, { 
          status: 'read',
          statusTimestamp: new Date().toISOString()
        })
      })
      
      if (!unreadMessages.empty) {
        await batch.commit()
      }
    }
    
    updateData.updatedAt = new Date().toISOString()
    await adminDB.collection('conversations').doc(phone).update(updateData)
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao atualizar cliente:', error)
    return NextResponse.json({ error: 'Erro ao atualizar cliente.' }, { status: 500 })
  }
} 