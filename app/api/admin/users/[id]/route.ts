import { NextRequest, NextResponse } from 'next/server'
import { adminDB } from '@/lib/firebaseAdmin'
import { UserProfile } from '@/lib/models'

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

// Utilitário para extrair o id da URL
function getIdFromRequest(request: NextRequest): string {
  const parts = request.nextUrl.pathname.split('/')
  return parts[parts.length - 2] // .../users/[id]/route.ts
}

// GET - Buscar usuário por ID
export async function GET(request: NextRequest) {
  try {
    const id = getIdFromRequest(request)
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
    const userDoc = await adminDB.collection('users').doc(id).get()
    if (!userDoc.exists) {
      return NextResponse.json({ success: false, error: 'Usuário não encontrado' }, { status: 404 })
    }
    const userData = { id: userDoc.id, ...userDoc.data() } as UserProfile
    return NextResponse.json({ success: true, data: userData })
  } catch (error) {
    console.error('Erro ao buscar usuário:', error)
    return NextResponse.json({ success: false, error: 'Erro interno do servidor' }, { status: 500 })
  }
}

// PUT - Atualizar usuário
export async function PUT(request: NextRequest) {
  try {
    const id = getIdFromRequest(request)
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ success: false, error: 'Token não fornecido' }, { status: 401 })
    }
    const token = authHeader.replace('Bearer ', '')
    const decodedToken = await adminDB.auth().verifyIdToken(token)
    const hasPermission = await checkUserPermission(decodedToken.uid, 'admin_users_edit')
    if (!hasPermission) {
      return NextResponse.json({ success: false, error: 'Permissão negada' }, { status: 403 })
    }
    const body = await request.json()
    const { name, email, phone, role, permissions, isActive } = body
    // Buscar usuário atual
    const userDoc = await adminDB.collection('users').doc(id).get()
    if (!userDoc.exists) {
      return NextResponse.json({ success: false, error: 'Usuário não encontrado' }, { status: 404 })
    }
    const oldUserData = userDoc.data() as UserProfile
    // Validações
    if (!name || !email || !phone || !role) {
      return NextResponse.json({ success: false, error: 'Todos os campos obrigatórios devem ser preenchidos' }, { status: 400 })
    }
    // Verificar se email já existe (exceto para o próprio usuário)
    if (email !== oldUserData.email) {
      const emailCheck = await adminDB.collection('users').where('email', '==', email).get()
      if (!emailCheck.empty) {
        return NextResponse.json({ success: false, error: 'E-mail já cadastrado' }, { status: 400 })
      }
    }
    // Atualizar usuário
    const updateData = {
      name,
      email,
      phone,
      role,
      permissions: permissions || [],
      isActive: isActive !== undefined ? isActive : oldUserData.isActive,
      updatedAt: new Date().toISOString()
    }
    await adminDB.collection('users').doc(id).update(updateData)
    // Registrar auditoria
    await logAudit(decodedToken.uid, 'update', 'user', id, oldUserData, updateData)
    return NextResponse.json({ 
      success: true, 
      data: { id, ...updateData },
      message: 'Usuário atualizado com sucesso'
    })
  } catch (error) {
    console.error('[API][PUT /admin/users/[id]] Erro ao atualizar usuário:', {
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined,
      body: await request.text()
    })
    return NextResponse.json({ success: false, error: 'Erro interno do servidor', details: error instanceof Error ? error.message : error }, { status: 500 })
  }
}

// DELETE - Deletar usuário (soft delete)
export async function DELETE(request: NextRequest) {
  try {
    const id = getIdFromRequest(request)
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ success: false, error: 'Token não fornecido' }, { status: 401 })
    }
    const token = authHeader.replace('Bearer ', '')
    const decodedToken = await adminDB.auth().verifyIdToken(token)
    const hasPermission = await checkUserPermission(decodedToken.uid, 'admin_users_delete')
    if (!hasPermission) {
      return NextResponse.json({ success: false, error: 'Permissão negada' }, { status: 403 })
    }
    // Verificar se não está tentando deletar a si mesmo
    if (id === decodedToken.uid) {
      return NextResponse.json({ success: false, error: 'Não é possível deletar seu próprio usuário' }, { status: 400 })
    }
    // Buscar usuário
    const userDoc = await adminDB.collection('users').doc(id).get()
    if (!userDoc.exists) {
      return NextResponse.json({ success: false, error: 'Usuário não encontrado' }, { status: 404 })
    }
    const oldUserData = userDoc.data() as UserProfile
    // Soft delete - apenas desativar
    await adminDB.collection('users').doc(id).update({
      isActive: false,
      updatedAt: new Date().toISOString()
    })
    // Registrar auditoria
    await logAudit(decodedToken.uid, 'delete', 'user', id, oldUserData, { isActive: false })
    return NextResponse.json({ 
      success: true, 
      message: 'Usuário desativado com sucesso'
    })
  } catch (error) {
    console.error('[API][DELETE /admin/users/[id]] Erro ao deletar usuário:', {
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined,
      body: await request.text()
    })
    return NextResponse.json({ success: false, error: 'Erro interno do servidor', details: error instanceof Error ? error.message : error }, { status: 500 })
  }
} 