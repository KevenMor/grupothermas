'use client'

import { Contract } from '@/lib/models'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { X, FileText, User, CreditCard } from 'lucide-react'

interface ContractModalProps {
  contract: Contract | null
  isOpen: boolean
  onClose: () => void
}

export default function ContractModal({ contract, isOpen, onClose }: ContractModalProps) {
  if (!isOpen || !contract) return null

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
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div 
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" 
          onClick={onClose}
        />

        {/* Modal panel */}
        <div className="inline-block w-full max-w-4xl p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-lg">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <FileText className="w-6 h-6" />
              Contrato #{contract.id?.slice(-8)}
            </h2>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>

          <div className="space-y-6">
            {/* Status */}
            <div className="flex items-center gap-4">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(contract.status)}`}>
                {getStatusLabel(contract.status)}
              </span>
              <span className="text-sm text-gray-500">
                Criado em {contract.createdAt?.toLocaleDateString('pt-BR')}
              </span>
            </div>

            {/* Customer Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Dados do Cliente
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Nome</label>
                    <p className="mt-1 text-sm text-gray-900">{contract.customer.name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">CPF</label>
                    <p className="mt-1 text-sm text-gray-900">{contract.customer.cpf}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Data de Nascimento</label>
                    <p className="mt-1 text-sm text-gray-900">{contract.customer.birthDate}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Estado Civil</label>
                    <p className="mt-1 text-sm text-gray-900">{contract.customer.maritalStatus}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Profissão</label>
                    <p className="mt-1 text-sm text-gray-900">{contract.customer.profession}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Telefone</label>
                    <p className="mt-1 text-sm text-gray-900">{contract.customer.phone}</p>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700">E-mail</label>
                    <p className="mt-1 text-sm text-gray-900">{contract.customer.email}</p>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700">Endereço</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {contract.customer.address.street}, {contract.customer.address.number}
                      {contract.customer.address.complement && `, ${contract.customer.address.complement}`}
                      <br />
                      {contract.customer.address.neighborhood}, {contract.customer.address.city} - {contract.customer.address.state}
                      <br />
                      CEP: {contract.customer.address.cep}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Sale Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Dados da Venda
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Forma de Pagamento</label>
                    <p className="mt-1 text-sm text-gray-900">{contract.sale.paymentMethod}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Parcelas</label>
                    <p className="mt-1 text-sm text-gray-900">{contract.sale.installments}x</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Valor Total</label>
                    <p className="mt-1 text-sm text-gray-900 font-semibold">
                      R$ {contract.sale.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Data do 1º Pagamento</label>
                    <p className="mt-1 text-sm text-gray-900">{contract.sale.paymentDate}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* LGPD Consent */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${contract.lgpdConsent ? 'bg-green-500 border-green-500' : 'border-gray-300'}`}>
                    {contract.lgpdConsent && <span className="text-white text-xs">✓</span>}
                  </div>
                  <p className="text-sm text-gray-700">
                    Consentimento LGPD: {contract.lgpdConsent ? 'Concedido' : 'Não concedido'}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-end gap-4 mt-8 pt-6 border-t border-gray-200">
            <Button variant="outline" onClick={onClose}>
              Fechar
            </Button>
            <Button onClick={() => window.print()}>
              Imprimir Contrato
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
} 