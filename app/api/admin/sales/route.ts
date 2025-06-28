import { NextRequest, NextResponse } from 'next/server'
import { adminDB } from '@/lib/firebaseAdmin'
import { Sale } from '@/lib/models'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || ''
    const startDate = searchParams.get('startDate') || ''
    const endDate = searchParams.get('endDate') || ''

    let query = adminDB.collection('sales').orderBy('createdAt', 'desc')

    // Aplicar filtros
    if (search) {
      query = query.where('customerName', '>=', search).where('customerName', '<=', search + '\uf8ff')
    }

    if (status) {
      query = query.where('status', '==', status)
    }

    if (startDate && endDate) {
      query = query.where('createdAt', '>=', startDate).where('createdAt', '<=', endDate)
    }

    // Paginação
    const offset = (page - 1) * limit
    const snapshot = await query.limit(limit).offset(offset).get()
    const totalSnapshot = await query.count().get()

    const sales: Sale[] = []
    snapshot.forEach((doc: any) => {
      sales.push({
        id: doc.id,
        ...doc.data()
      } as Sale)
    })

    return NextResponse.json({
      success: true,
      data: {
        data: sales,
        total: totalSnapshot.data().count,
        page,
        limit,
        totalPages: Math.ceil(totalSnapshot.data().count / limit)
      }
    })
  } catch (error) {
    console.error('Erro ao buscar vendas:', error)
    return NextResponse.json({ 
      error: 'Erro interno do servidor' 
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      customerName,
      customerEmail,
      customerPhone,
      customerCpf,
      products,
      totalValue,
      status,
      paymentMethod,
      notes
    } = body

    // Validações
    if (!customerName || !customerPhone) {
      return NextResponse.json({ 
        error: 'Nome e telefone do cliente são obrigatórios' 
      }, { status: 400 })
    }

    if (!products || products.length === 0) {
      return NextResponse.json({ 
        error: 'Pelo menos um produto deve ser adicionado' 
      }, { status: 400 })
    }

    if (!totalValue || totalValue <= 0) {
      return NextResponse.json({ 
        error: 'Valor total deve ser maior que zero' 
      }, { status: 400 })
    }

    // Criar venda
    const saleData: Omit<Sale, 'id'> = {
      customerName,
      customerEmail: customerEmail || '',
      customerPhone,
      customerCpf: customerCpf || '',
      products,
      totalValue,
      status: status || 'pending',
      paymentMethod: paymentMethod || 'pix',
      notes: notes || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: 'system', // TODO: Pegar do usuário logado
      isActive: true
    }

    const docRef = await adminDB.collection('sales').add(saleData)

    // Log de auditoria
    await adminDB.collection('audit_logs').add({
      action: 'CREATE',
      entity: 'sale',
      entityId: docRef.id,
      userId: 'system', // TODO: Pegar do usuário logado
      details: {
        customerName,
        totalValue,
        status
      },
      timestamp: new Date().toISOString(),
      ip: request.headers.get('x-forwarded-for') || 'unknown'
    })

    return NextResponse.json({
      success: true,
      message: 'Venda registrada com sucesso',
      data: {
        id: docRef.id,
        ...saleData
      }
    })
  } catch (error) {
    console.error('Erro ao criar venda:', error)
    return NextResponse.json({ 
      error: 'Erro interno do servidor' 
    }, { status: 500 })
  }
} 