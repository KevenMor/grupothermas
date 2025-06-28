import { NextRequest, NextResponse } from 'next/server'
import { adminDB } from '@/lib/firebaseAdmin'
import { Lead, ApiResponse, PaginatedResponse } from '@/lib/models'

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

// Função para validar CPF
function validateCPF(cpf: string): boolean {
  const cleanCPF = cpf.replace(/\D/g, '')
  
  if (cleanCPF.length !== 11) return false
  
  // Verificar se todos os dígitos são iguais
  if (/^(\d)\1{10}$/.test(cleanCPF)) return false
  
  // Validar primeiro dígito verificador
  let sum = 0
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (10 - i)
  }
  let remainder = (sum * 10) % 11
  if (remainder === 10 || remainder === 11) remainder = 0
  if (remainder !== parseInt(cleanCPF.charAt(9))) return false
  
  // Validar segundo dígito verificador
  sum = 0
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (11 - i)
  }
  remainder = (sum * 10) % 11
  if (remainder === 10 || remainder === 11) remainder = 0
  if (remainder !== parseInt(cleanCPF.charAt(10))) return false
  
  return true
}

// Função para buscar CEP
async function fetchCEP(cep: string): Promise<any> {
  try {
    const cleanCEP = cep.replace(/\D/g, '')
    const response = await fetch(`https://viacep.com.br/ws/${cleanCEP}/json/`)
    const data = await response.json()
    
    if (data.erro) {
      throw new Error('CEP não encontrado')
    }
    
    return {
      address: data.logradouro,
      neighborhood: data.bairro,
      city: data.localidade,
      state: data.uf
    }
  } catch (error) {
    console.error('Erro ao buscar CEP:', error)
    throw new Error('Erro ao buscar CEP')
  }
}

// GET - Listar leads com paginação
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || ''
    const departmentId = searchParams.get('departmentId') || ''
    const assignedTo = searchParams.get('assignedTo') || ''
    
    // Verificar permissão
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ success: false, error: 'Token não fornecido' }, { status: 401 })
    }
    
    const token = authHeader.replace('Bearer ', '')
    const decodedToken = await adminDB.auth().verifyIdToken(token)
    const hasPermission = await checkUserPermission(decodedToken.uid, 'crm_leads_view')
    
    if (!hasPermission) {
      return NextResponse.json({ success: false, error: 'Permissão negada' }, { status: 403 })
    }
    
    // Construir query
    let query = adminDB.collection('leads').orderBy('createdAt', 'desc')
    
    if (search) {
      query = query.where('name', '>=', search).where('name', '<=', search + '\uf8ff')
    }
    
    if (status) {
      query = query.where('status', '==', status)
    }
    
    if (departmentId) {
      query = query.where('departmentId', '==', departmentId)
    }
    
    if (assignedTo) {
      query = query.where('assignedTo', '==', assignedTo)
    }
    
    // Executar query com paginação
    const snapshot = await query.limit(limit).offset((page - 1) * limit).get()
    const totalSnapshot = await query.count().get()
    
    const leads = snapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data()
    }))
    
    const total = totalSnapshot.data().count
    
    const response: PaginatedResponse<Lead> = {
      data: leads as Lead[],
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    }
    
    return NextResponse.json({ success: true, data: response })
  } catch (error) {
    console.error('Erro ao listar leads:', error)
    return NextResponse.json({ success: false, error: 'Erro interno do servidor' }, { status: 500 })
  }
}

// POST - Criar novo lead
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ success: false, error: 'Token não fornecido' }, { status: 401 })
    }
    
    const token = authHeader.replace('Bearer ', '')
    const decodedToken = await adminDB.auth().verifyIdToken(token)
    const hasPermission = await checkUserPermission(decodedToken.uid, 'crm_leads_create')
    
    if (!hasPermission) {
      return NextResponse.json({ success: false, error: 'Permissão negada' }, { status: 403 })
    }
    
    const body = await request.json()
    const {
      name, cpf, birthDate, maritalStatus, profession,
      cep, address, neighborhood, city, state, number, complement,
      phone, email, paymentMethod, installments, totalValue, paymentDate,
      source, notes, assignedTo, departmentId
    } = body
    
    // Validações obrigatórias
    if (!name || !cpf || !birthDate || !maritalStatus || !profession ||
        !cep || !phone || !email || !paymentMethod || !installments || !totalValue || !paymentDate) {
      return NextResponse.json({ success: false, error: 'Todos os campos obrigatórios devem ser preenchidos' }, { status: 400 })
    }
    
    // Validar CPF
    if (!validateCPF(cpf)) {
      return NextResponse.json({ success: false, error: 'CPF inválido' }, { status: 400 })
    }
    
    // Verificar se CPF já existe
    const cpfCheck = await adminDB.collection('leads').where('cpf', '==', cpf).get()
    if (!cpfCheck.empty) {
      return NextResponse.json({ success: false, error: 'CPF já cadastrado' }, { status: 400 })
    }
    
    // Buscar dados do CEP se não fornecidos
    let addressData = { address, neighborhood, city, state }
    if (!address || !neighborhood || !city || !state) {
      try {
        addressData = await fetchCEP(cep)
      } catch (error) {
        return NextResponse.json({ success: false, error: 'Erro ao buscar CEP. Preencha o endereço manualmente.' }, { status: 400 })
      }
    }
    
    // Buscar dados do usuário atribuído
    let assignedToName = ''
    let departmentName = ''
    
    if (assignedTo) {
      const userDoc = await adminDB.collection('users').doc(assignedTo).get()
      if (userDoc.exists) {
        assignedToName = userDoc.data()?.name || ''
      }
    }
    
    if (departmentId) {
      const deptDoc = await adminDB.collection('departments').doc(departmentId).get()
      if (deptDoc.exists) {
        departmentName = deptDoc.data()?.name || ''
      }
    }
    
    // Criar lead
    const now = new Date().toISOString()
    const leadData: Omit<Lead, 'id'> = {
      name,
      cpf: cpf.replace(/\D/g, ''),
      birthDate,
      maritalStatus,
      profession,
      cep: cep.replace(/\D/g, ''),
      address: addressData.address,
      neighborhood: addressData.neighborhood,
      city: addressData.city,
      state: addressData.state,
      number,
      complement: complement || '',
      phone,
      email,
      paymentMethod,
      installments,
      totalValue: parseFloat(totalValue),
      paymentDate,
      status: 'novo',
      assignedTo: assignedTo || '',
      assignedToName,
      departmentId: departmentId || '',
      departmentName,
      source: source || 'formulario',
      notes: notes || '',
      createdAt: now,
      updatedAt: now,
      createdBy: decodedToken.uid,
      updatedBy: decodedToken.uid,
      uid: assignedTo || '',
      stage: 'new',
    }
    
    const leadRef = await adminDB.collection('leads').add(leadData)
    
    // Registrar auditoria
    await logAudit(decodedToken.uid, 'create', 'lead', leadRef.id, null, leadData)
    
    return NextResponse.json({ 
      success: true, 
      data: { id: leadRef.id, ...leadData },
      message: 'Lead criado com sucesso'
    })
  } catch (error) {
    console.error('Erro ao criar lead:', error)
    return NextResponse.json({ success: false, error: 'Erro interno do servidor' }, { status: 500 })
  }
} 