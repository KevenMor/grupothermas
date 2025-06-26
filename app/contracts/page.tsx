'use client'
export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { onAuthStateChanged } from 'firebase/auth'
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore'
import { auth, db } from '@/lib/firebase'
import { Contract } from '@/lib/models'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Eye, Filter } from 'lucide-react'

export default function ContractsPage() {
  const [contracts, setContracts] = useState<Contract[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const router = useRouter()

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push('/login' as any)
        return
      }
      await loadContracts(user.uid)
    })

    return () => unsubscribe()
  }, [router])

  const loadContracts = async (uid: string) => {
    try {
      const contractsRef = collection(db, 'contracts')
      const q = query(
        contractsRef,
        where('uid', '==', uid),
        orderBy('createdAt', 'desc')
      )
      const querySnapshot = await getDocs(q)
      
      const contractsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
      })) as Contract[]
      
      setContracts(contractsData)
    } catch (error) {
      console.error('Error loading contracts:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredContracts = contracts.filter(contract => 
    statusFilter === 'all' || contract.status === statusFilter
  )

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'created': return 'bg-blue-100 text-blue-800'
      case 'signed': return 'bg-green-100 text-green-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'paid': return 'bg-green-100 text-green-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'created': return 'Criado'
      case 'signed': return 'Assinado'
      case 'pending': return 'Pendente'
      case 'paid': return 'Pago'
      case 'cancelled': return 'Cancelado'
      default: return status
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center">
              <Button
                variant="ghost"
                onClick={() => router.push('/dashboard' as any)}
                className="mr-4"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar
              </Button>
              <h1 className="text-2xl font-bold text-gray-900">Gestão de Contratos</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="all">Todos os Status</option>
                <option value="created">Criado</option>
                <option value="signed">Assinado</option>
                <option value="pending">Pendente</option>
                <option value="paid">Pago</option>
                <option value="cancelled">Cancelado</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Contracts List */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredContracts.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <p className="text-gray-500">Nenhum contrato encontrado</p>
                </CardContent>
              </Card>
            ) : (
              filteredContracts.map((contract) => (
                <Card key={contract.id}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-4 mb-2">
                          <h3 className="text-lg font-semibold">{contract.customer.name}</h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(contract.status)}`}>
                            {getStatusLabel(contract.status)}
                          </span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm text-gray-600">
                          <div>
                            <p className="font-medium">CPF:</p>
                            <p>{contract.customer.cpf}</p>
                          </div>
                          <div>
                            <p className="font-medium">Valor:</p>
                            <p>R$ {contract.sale.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                          </div>
                          <div>
                            <p className="font-medium">Pagamento:</p>
                            <p>{contract.sale.paymentMethod}</p>
                          </div>
                          <div>
                            <p className="font-medium">Data:</p>
                            <p>{contract.createdAt?.toLocaleDateString('pt-BR')}</p>
                          </div>
                        </div>
                      </div>
                      <div className="ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => alert('Modal de visualização em desenvolvimento')}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          Visualizar
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
} 