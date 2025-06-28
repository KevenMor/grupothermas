import { NextRequest, NextResponse } from 'next/server'
import { adminDB } from '@/lib/firebaseAdmin'
import { AuditLog, ApiResponse, PaginatedResponse } from '@/lib/models'

// Função para verificar permissões do usuário
async function checkUserPermission(userId: string, requiredPermission: string): Promise<boolean> {
  try {
    const userDoc = await adminDB.collection('users').doc(userId).get()
    if (!userDoc.exists) return false
    
    const userData = userDoc.data()
    if (!userData.isActive) return false
    
    // Admin tem todas as permissões
    if (userData.role === 'admin') return true
    
    // Verificar permissão específica
    const permissionDoc = await adminDB.collection('permissions').doc(requiredPermission).get()
    if (!permissionDoc.exists) return false
    
    return userData.permissions.includes(requiredPermission)
  } catch (error) {
    console.error('Erro ao verificar permissão:', error)
    return false
  }
}

// GET - Listar logs de auditoria
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const module = searchParams.get('module') || ''
    const action = searchParams.get('action') || ''
    const userId = searchParams.get('userId') || ''
    const startDate = searchParams.get('startDate') || ''
    const endDate = searchParams.get('endDate') || ''
    const recordId = searchParams.get('recordId') || ''
    
    // Verificar permissão
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ success: false, error: 'Token não fornecido' }, { status: 401 })
    }
    
    const token = authHeader.replace('Bearer ', '')
    const decodedToken = await adminDB.auth().verifyIdToken(token)
    const hasPermission = await checkUserPermission(decodedToken.uid, 'admin_audit_view')
    
    if (!hasPermission) {
      return NextResponse.json({ success: false, error: 'Permissão negada' }, { status: 403 })
    }
    
    // Construir query
    let query = adminDB.collection('audit_logs').orderBy('timestamp', 'desc')
    
    if (module) {
      query = query.where('module', '==', module)
    }
    
    if (action) {
      query = query.where('action', '==', action)
    }
    
    if (userId) {
      query = query.where('userId', '==', userId)
    }
    
    if (recordId) {
      query = query.where('recordId', '==', recordId)
    }
    
    // Filtros de data
    if (startDate) {
      query = query.where('timestamp', '>=', startDate)
    }
    
    if (endDate) {
      query = query.where('timestamp', '<=', endDate + 'T23:59:59.999Z')
    }
    
    // Executar query com paginação
    const snapshot = await query.limit(limit).offset((page - 1) * limit).get()
    const totalSnapshot = await query.count().get()
    
    const logs = snapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data()
    }))
    
    const total = totalSnapshot.data().count
    
    const response: PaginatedResponse<AuditLog> = {
      data: logs as AuditLog[],
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    }
    
    return NextResponse.json({ success: true, data: response })
  } catch (error) {
    console.error('Erro ao listar logs de auditoria:', error)
    return NextResponse.json({ success: false, error: 'Erro interno do servidor' }, { status: 500 })
  }
}

// POST - Registrar log de auditoria (para uso interno)
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ success: false, error: 'Token não fornecido' }, { status: 401 })
    }
    
    const token = authHeader.replace('Bearer ', '')
    const decodedToken = await adminDB.auth().verifyIdToken(token)
    
    const body = await request.json()
    const { action, module, recordId, recordType, oldValues, newValues, details } = body
    
    // Validações
    if (!action || !module) {
      return NextResponse.json({ success: false, error: 'Ação e módulo são obrigatórios' }, { status: 400 })
    }
    
    // Buscar dados do usuário
    const userDoc = await adminDB.collection('users').doc(decodedToken.uid).get()
    const userName = userDoc.exists ? userDoc.data()?.name : 'Sistema'
    
    // Criar log de auditoria
    const auditData: Omit<AuditLog, 'id'> = {
      userId: decodedToken.uid,
      userName,
      action,
      module,
      recordId,
      recordType,
      oldValues,
      newValues,
      timestamp: new Date().toISOString(),
      ipAddress: 'API',
      userAgent: 'Server',
      details
    }
    
    const logRef = await adminDB.collection('audit_logs').add(auditData)
    
    return NextResponse.json({ 
      success: true, 
      data: { id: logRef.id, ...auditData },
      message: 'Log de auditoria registrado com sucesso'
    })
  } catch (error) {
    console.error('Erro ao registrar log de auditoria:', error)
    return NextResponse.json({ success: false, error: 'Erro interno do servidor' }, { status: 500 })
  }
} 