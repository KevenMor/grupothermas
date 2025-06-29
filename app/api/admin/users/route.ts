import { NextRequest, NextResponse } from 'next/server'
import { adminDB, adminAuth } from '@/lib/firebaseAdmin'
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

// 1. Definir um mapa de permissões por role (ex: admin, manager, agent, viewer)
const ROLE_PERMISSIONS = {
  admin: [
    'users_manage', 'sales_view', 'sales_manage',
    'leads_view', 'leads_manage', 'chats_view', 'chats_manage',
    'reports_view', 'settings_manage'
  ],
  manager: [
    'users_manage', 'sales_view', 'sales_manage',
    'leads_view', 'leads_manage', 'chats_view', 'chats_manage',
    'reports_view'
  ],
  agent: [
    'chats_view', 'chats_manage', 'leads_view', 'leads_manage'
  ],
  viewer: [
    'chats_view', 'leads_view', 'sales_view', 'reports_view'
  ]
}

// GET - Listar usuários com paginação
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || ''
    
    // Verificar permissão
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ success: false, error: 'Token não fornecido' }, { status: 401 })
    }
    
    const token = authHeader.replace('Bearer ', '')
    if (!adminAuth) {
      return NextResponse.json({ success: false, error: 'adminAuth não inicializado' }, { status: 500 })
    }
    const decodedToken = await adminAuth.verifyIdToken(token)
    const hasPermission = await checkUserPermission(decodedToken.uid, 'admin_users_view')
    
    if (!hasPermission) {
      return NextResponse.json({ success: false, error: 'Permissão negada' }, { status: 403 })
    }

    // Listar usuários do Firebase Auth
    if (!adminAuth) throw new Error('adminAuth não inicializado')
    const authUsers = await adminAuth.listUsers(1000)
    console.log('[API] Usuários do Firebase Auth:', authUsers.users.length)

    // Buscar dados extras do Firestore
    const usersCollection = await adminDB.collection('users').get()
    const firestoreUsers = usersCollection.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }))
    const firestoreMap = new Map(firestoreUsers.map((u: any) => [u.email, u]))

    // Mesclar dados do Auth e Firestore
    const mergedUsers = authUsers.users.map(authUser => {
      const extra: any = firestoreMap.get(authUser.email) || {};
      return {
        uid: authUser.uid,
        email: authUser.email,
        name: authUser.displayName || extra.name || '',
        phone: authUser.phoneNumber || extra.phone || '',
        role: extra.role || 'user',
        isActive: extra.isActive !== undefined ? extra.isActive : true,
        createdAt: authUser.metadata.creationTime || extra.createdAt || '',
        lastLogin: authUser.metadata.lastSignInTime || extra.lastLogin || '',
        ...extra
      }
    })

    // Filtro de busca
    let filtered = mergedUsers
    if (search) {
      filtered = filtered.filter(u =>
        (u.name && u.name.toLowerCase().includes(search.toLowerCase())) ||
        (u.email && u.email.toLowerCase().includes(search.toLowerCase()))
      )
    }
    if (status) {
      filtered = filtered.filter(u => status === 'active' ? u.isActive : !u.isActive)
    }

    // Paginação
    const total = filtered.length
    const totalPages = Math.ceil(total / limit)
    const paginated = filtered.slice((page - 1) * limit, page * limit)

    const response: PaginatedResponse<UserProfile> = {
      data: paginated as UserProfile[],
      total,
      page,
      limit,
      totalPages
    }
    return NextResponse.json({ success: true, data: response })
  } catch (error: any) {
    console.error('Erro ao listar usuários:', error)
    return NextResponse.json({ success: false, error: 'Erro interno do servidor', details: error?.message }, { status: 500 })
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
    if (!adminAuth) {
      return NextResponse.json({ success: false, error: 'adminAuth não inicializado' }, { status: 500 })
    }
    const decodedToken = await adminAuth.verifyIdToken(token)
    const hasPermission = await checkUserPermission(decodedToken.uid, 'admin_users_create')
    
    if (!hasPermission) {
      return NextResponse.json({ success: false, error: 'Permissão negada' }, { status: 403 })
    }
    
    const body = await request.json()
    const { name, email, phone, role } = body
    
    // Validações
    if (!name || !email || !phone || !role) {
      return NextResponse.json({ success: false, error: 'Todos os campos obrigatórios devem ser preenchidos' }, { status: 400 })
    }
    
    // Verificar se email já existe
    const emailCheck = await adminDB.collection('users').where('email', '==', email).get()
    if (!emailCheck.empty) {
      return NextResponse.json({ success: false, error: 'E-mail já cadastrado' }, { status: 400 })
    }
    
    // Criar usuário
    const now = new Date().toISOString()
    const userData: Omit<UserProfile, 'id'> = {
      name,
      email,
      phone,
      role,
      permissions: (ROLE_PERMISSIONS as any)[role] || [],
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