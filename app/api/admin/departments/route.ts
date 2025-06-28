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

// GET - Listar todos os departamentos
export async function GET() {
  try {
    const departmentsRef = adminDB.collection('departments')
    const snapshot = await departmentsRef.orderBy('createdAt', 'desc').get()
    
    const departments: Department[] = []
    snapshot.forEach((doc: any) => {
      const data = doc.data()
      departments.push({
        id: doc.id,
        name: data.name,
        description: data.description,
        isActive: data.isActive ?? true,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
        responsibleAgents: data.responsibleAgents || []
      })
    })

    return NextResponse.json({ 
      success: true, 
      departments 
    })
  } catch (error) {
    console.error('Erro ao listar departamentos:', error)
    return NextResponse.json({ 
      error: 'Erro interno do servidor' 
    }, { status: 500 })
  }
}

// POST - Criar novo departamento
export async function POST(request: NextRequest) {
  try {
    const { name, description, isActive = true } = await request.json()

    if (!name || !name.trim()) {
      return NextResponse.json({ 
        error: 'Nome do departamento é obrigatório' 
      }, { status: 400 })
    }

    // Verificar se já existe um departamento com o mesmo nome
    const existingRef = adminDB.collection('departments')
    const existingSnapshot = await existingRef.where('name', '==', name.trim()).get()
    
    if (!existingSnapshot.empty) {
      return NextResponse.json({ 
        error: 'Já existe um departamento com este nome' 
      }, { status: 400 })
    }

    const now = new Date().toISOString()
    const departmentData = {
      name: name.trim(),
      description: description?.trim() || '',
      isActive: isActive,
      createdAt: now,
      updatedAt: now,
      responsibleAgents: []
    }

    const docRef = await adminDB.collection('departments').add(departmentData)
    
    const newDepartment: Department = {
      id: docRef.id,
      ...departmentData
    }

    return NextResponse.json({ 
      success: true, 
      department: newDepartment,
      message: 'Departamento criado com sucesso' 
    })
  } catch (error) {
    console.error('Erro ao criar departamento:', error)
    return NextResponse.json({ 
      error: 'Erro interno do servidor' 
    }, { status: 500 })
  }
} 