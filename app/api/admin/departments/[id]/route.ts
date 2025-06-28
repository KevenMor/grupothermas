import { NextRequest, NextResponse } from 'next/server'
import { adminDB } from '@/lib/firebaseAdmin'

interface Department {
  id: string
  name: string
  description?: string
  isActive: boolean
  createdAt: string
  updatedAt?: string
  responsibleAgents?: string[]
}

// GET - Buscar departamento específico
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const departmentRef = adminDB.collection('departments').doc(id)
    const doc = await departmentRef.get()

    if (!doc.exists) {
      return NextResponse.json({ 
        error: 'Departamento não encontrado' 
      }, { status: 404 })
    }

    const data = doc.data()!
    const department: Department = {
      id: doc.id,
      name: data.name,
      description: data.description,
      isActive: data.isActive ?? true,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      responsibleAgents: data.responsibleAgents || []
    }

    return NextResponse.json({ 
      success: true, 
      department 
    })
  } catch (error) {
    console.error('Erro ao buscar departamento:', error)
    return NextResponse.json({ 
      error: 'Erro interno do servidor' 
    }, { status: 500 })
  }
}

// PUT - Atualizar departamento
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { name, description, isActive } = await request.json()

    if (!name || !name.trim()) {
      return NextResponse.json({ 
        error: 'Nome do departamento é obrigatório' 
      }, { status: 400 })
    }

    const departmentRef = adminDB.collection('departments').doc(id)
    const doc = await departmentRef.get()

    if (!doc.exists) {
      return NextResponse.json({ 
        error: 'Departamento não encontrado' 
      }, { status: 404 })
    }

    // Verificar se já existe outro departamento com o mesmo nome
    const existingRef = adminDB.collection('departments')
    const existingSnapshot = await existingRef
      .where('name', '==', name.trim())
      .where('__name__', '!=', id)
      .get()
    
    if (!existingSnapshot.empty) {
      return NextResponse.json({ 
        error: 'Já existe um departamento com este nome' 
      }, { status: 400 })
    }

    const updateData = {
      name: name.trim(),
      description: description?.trim() || '',
      isActive: isActive,
      updatedAt: new Date().toISOString()
    }

    await departmentRef.update(updateData)

    // Buscar o departamento atualizado
    const updatedDoc = await departmentRef.get()
    const data = updatedDoc.data()!
    
    const updatedDepartment: Department = {
      id: updatedDoc.id,
      name: data.name,
      description: data.description,
      isActive: data.isActive,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      responsibleAgents: data.responsibleAgents || []
    }

    return NextResponse.json({ 
      success: true, 
      department: updatedDepartment,
      message: 'Departamento atualizado com sucesso' 
    })
  } catch (error) {
    console.error('Erro ao atualizar departamento:', error)
    return NextResponse.json({ 
      error: 'Erro interno do servidor' 
    }, { status: 500 })
  }
}

// DELETE - Deletar departamento
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const departmentRef = adminDB.collection('departments').doc(id)
    const doc = await departmentRef.get()

    if (!doc.exists) {
      return NextResponse.json({ 
        error: 'Departamento não encontrado' 
      }, { status: 404 })
    }

    // Verificar se há conversas usando este departamento
    const conversationsRef = adminDB.collection('conversations')
    const conversationsSnapshot = await conversationsRef
      .where('assignedDepartment', '==', id)
      .limit(1)
      .get()

    if (!conversationsSnapshot.empty) {
      return NextResponse.json({ 
        error: 'Não é possível excluir um departamento que possui conversas ativas' 
      }, { status: 400 })
    }

    await departmentRef.delete()

    return NextResponse.json({ 
      success: true, 
      message: 'Departamento excluído com sucesso' 
    })
  } catch (error) {
    console.error('Erro ao deletar departamento:', error)
    return NextResponse.json({ 
      error: 'Erro interno do servidor' 
    }, { status: 500 })
  }
} 