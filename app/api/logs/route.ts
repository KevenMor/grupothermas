import { NextRequest, NextResponse } from 'next/server'
import { adminDB } from '@/lib/firebaseAdmin'

interface LogEntry {
  id: string
  timestamp: string
  level: 'info' | 'warn' | 'error' | 'debug'
  category: 'audio' | 'media' | 'webhook' | 'zapi' | 'openai' | 'system'
  message: string
  details?: any
  userAgent?: string
  phone?: string
  messageId?: string
}

export async function POST(request: NextRequest) {
  try {
    const { level, category, message, details, phone, messageId }: Omit<LogEntry, 'id' | 'timestamp'> = await request.json()
    
    const logEntry: LogEntry = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      level: level || 'info',
      category: category || 'system',
      message,
      details,
      userAgent: request.headers.get('user-agent') || undefined,
      phone,
      messageId
    }
    
    // Salvar log no Firestore
    await adminDB.collection('system_logs').doc(logEntry.id).set(logEntry)
    
    console.log(`[${logEntry.level.toUpperCase()}] [${logEntry.category}] ${logEntry.message}`)
    
    return NextResponse.json({ success: true, logId: logEntry.id })
  } catch (error) {
    console.error('Erro ao salvar log:', error)
    return NextResponse.json({ error: 'Failed to save log' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const level = searchParams.get('level')
    const category = searchParams.get('category')
    const limit = parseInt(searchParams.get('limit') || '100')
    const phone = searchParams.get('phone')
    
    let query = adminDB.collection('system_logs').orderBy('timestamp', 'desc').limit(limit)
    
    if (level) {
      query = query.where('level', '==', level) as any
    }
    
    if (category) {
      query = query.where('category', '==', category) as any
    }
    
    if (phone) {
      query = query.where('phone', '==', phone) as any
    }
    
    const snapshot = await query.get()
    const logs = snapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data()
    }))
    
    return NextResponse.json({ logs })
  } catch (error) {
    console.error('Erro ao buscar logs:', error)
    return NextResponse.json({ error: 'Failed to fetch logs' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const olderThan = searchParams.get('olderThan') // dias
    
    if (!olderThan) {
      return NextResponse.json({ error: 'olderThan parameter is required' }, { status: 400 })
    }
    
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - parseInt(olderThan))
    
    const snapshot = await adminDB.collection('system_logs')
      .where('timestamp', '<', cutoffDate.toISOString())
      .get()
    
    const batch = adminDB.batch()
    snapshot.docs.forEach((doc: any) => {
      batch.delete(doc.ref)
    })
    
    await batch.commit()
    
    return NextResponse.json({ 
      success: true, 
      deletedCount: snapshot.docs.length 
    })
  } catch (error) {
    console.error('Erro ao limpar logs:', error)
    return NextResponse.json({ error: 'Failed to clear logs' }, { status: 500 })
  }
} 