import { NextRequest, NextResponse } from 'next/server'
import { adminDB } from '@/lib/firebaseAdmin'
import { UserProfile, ApiResponse, PaginatedResponse } from '@/lib/models'

// Função para verificar permissões do usuário
async function checkUserPermission(userId: string, requiredPermission: string): Promise<boolean> {
  try {
    const userDoc = await adminDB.collection('users').doc(userId).get()
    if (!userDoc.exists) return false
    
    const userData = userDoc.data() as UserProfile
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

// Função para registrar auditoria
async function logAudit(userId: string, action: string, module: string, recordId?: string, oldValues?: any, newValues?: any) {
  try {
    const userDoc = await adminDB.collection('users').doc(userId).get()
    const userName = userDoc.exists ? userDoc.data()?.name : 'Sistema'
    
    await adminDB.collection('audit_logs').add({
      userId,
      userName,
      action,
      module,
      recordId,
      oldValues,
      newValues,
      timestamp: new Date().toISOString(),
      ipAddress: 'API',
      userAgent: 'Server'
    })
  } catch (error) {
    console.error('Erro ao registrar auditoria:', error)
  }
}

// GET - Listar usuários com paginação
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const departmentId = searchParams.get('departmentId') || ''
    const status = searchParams.get('status') || ''
    
    // Verificar permissão
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ success: false, error: 'Token não fornecido' }, { status: 401 })
    }
    
    const token = authHeader.replace('Bearer ', '')
    const decodedToken = await adminDB.auth().verifyIdToken(token)
    const hasPermission = await checkUserPermission(decodedToken.uid, 'admin_users_view')
    
    if (!hasPermission) {
      return NextResponse.json({ success: false, error: 'Permissão negada' }, { status: 403 })
    }
    
    // Construir query
    let query = adminDB.collection('users').orderBy('createdAt', 'desc')
    
    if (search) {
      query = query.where('name', '>=', search).where('name', '<=', search + '\uf8ff')
    }
    
    if (departmentId) {
      query = query.where('departmentId', '==', departmentId)
    }
    
    if (status) {
      query = query.where('isActive', '==', status === 'active')
    }
    
    // Executar query com paginação
    const snapshot = await query.limit(limit).offset((page - 1) * limit).get()
    const totalSnapshot = await query.count().get()
    
    const users = snapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data()
    }))
    
    const total = totalSnapshot.data().count
    
    const response: PaginatedResponse<UserProfile> = {
      data: users as UserProfile[],
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    }
    
    return NextResponse.json({ success: true, data: response })
  } catch (error) {
    console.error('Erro ao listar usuários:', error)
    return NextResponse.json({ success: false, error: 'Erro interno do servidor' }, { status: 500 })
  }
}

// POST - Criar novo usuário
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ success: false, error: 'Token não fornecido' }, { status: 401 })
    }
    
    const token = authHeader.replace('Bearer ', '')
    const decodedToken = await adminDB.auth().verifyIdToken(token)
    const hasPermission = await checkUserPermission(decodedToken.uid, 'admin_users_create')
    
    if (!hasPermission) {
      return NextResponse.json({ success: false, error: 'Permissão negada' }, { status: 403 })
    }
    
    const body = await request.json()
    const { name, email, phone, departmentId, role, permissions } = body
    
    // Validações
    if (!name || !email || !phone || !departmentId || !role) {
      return NextResponse.json({ success: false, error: 'Todos os campos obrigatórios devem ser preenchidos' }, { status: 400 })
    }
    
    // Verificar se email já existe
    const emailCheck = await adminDB.collection('users').where('email', '==', email).get()
    if (!emailCheck.empty) {
      return NextResponse.json({ success: false, error: 'E-mail já cadastrado' }, { status: 400 })
    }
    
    // Verificar se departamento existe
    const deptDoc = await adminDB.collection('departments').doc(departmentId).get()
    if (!deptDoc.exists) {
      return NextResponse.json({ success: false, error: 'Departamento não encontrado' }, { status: 400 })
    }
    
    const deptData = deptDoc.data()
    
    // Criar usuário
    const now = new Date().toISOString()
    const userData: Omit<UserProfile, 'id'> = {
      name,
      email,
      phone,
      departmentId,
      departmentName: deptData?.name || '',
      role,
      permissions: permissions || [],
      isActive: true,
      createdAt: now,
      updatedAt: now,
      createdBy: decodedToken.uid
    }
    
    const userRef = await adminDB.collection('users').add(userData)
    
    // Registrar auditoria
    await logAudit(decodedToken.uid, 'create', 'user', userRef.id, null, userData)
    
    return NextResponse.json({ 
      success: true, 
      data: { id: userRef.id, ...userData },
      message: 'Usuário criado com sucesso'
    })
  } catch (error) {
    console.error('Erro ao criar usuário:', error)
    return NextResponse.json({ success: false, error: 'Erro interno do servidor' }, { status: 500 })
  }
} 