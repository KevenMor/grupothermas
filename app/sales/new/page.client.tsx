'use client'
export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Plus, Trash2, Save, DollarSign, User, Package } from 'lucide-react'
import { toast } from 'sonner'

interface Product {
  id: string
  name: string
  price: number
  quantity: number
}

interface SaleForm {
  customerName: string
  customerEmail: string
  customerPhone: string
  customerCpf: string
  products: Product[]
  totalValue: number
  status: 'pending' | 'completed' | 'cancelled'
  paymentMethod: 'pix' | 'credit_card' | 'debit_card' | 'bank_transfer' | 'cash'
  notes: string
}

const PRODUCTS = [
  { id: '1', name: 'Pacote Básico - 1 Mês', price: 99.90 },
  { id: '2', name: 'Pacote Premium - 3 Meses', price: 249.90 },
  { id: '3', name: 'Pacote Enterprise - 6 Meses', price: 449.90 },
  { id: '4', name: 'Consultoria Personalizada', price: 199.90 },
  { id: '5', name: 'Suporte Premium', price: 79.90 },
]

const PAYMENT_METHODS = [
  { value: 'pix', label: 'PIX' },
  { value: 'credit_card', label: 'Cartão de Crédito' },
  { value: 'debit_card', label: 'Cartão de Débito' },
  { value: 'bank_transfer', label: 'Transferência Bancária' },
  { value: 'cash', label: 'Dinheiro' },
]

export default function NewSalePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<SaleForm>({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    customerCpf: '',
    products: [],
    totalValue: 0,
    status: 'pending',
    paymentMethod: 'pix',
    notes: ''
  })

  const addProduct = () => {
    setFormData(prev => ({
      ...prev,
      products: [...prev.products, { id: '', name: '', price: 0, quantity: 1 }]
    }))
  }

  const removeProduct = (index: number) => {
    setFormData(prev => ({
      ...prev,
      products: prev.products.filter((_, i) => i !== index)
    }))
  }

  const updateProduct = (index: number, field: keyof Product, value: any) => {
    setFormData(prev => {
      const newProducts = [...prev.products]
      newProducts[index] = { ...newProducts[index], [field]: value }
      
      // Se o produto foi selecionado, preencher nome e preço
      if (field === 'id' && value) {
        const selectedProduct = PRODUCTS.find(p => p.id === value)
        if (selectedProduct) {
          newProducts[index] = {
            ...newProducts[index],
            name: selectedProduct.name,
            price: selectedProduct.price
          }
        }
      }
      
      // Calcular total
      const total = newProducts.reduce((sum, product) => sum + (product.price * product.quantity), 0)
      
      return {
        ...prev,
        products: newProducts,
        totalValue: total
      }
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.customerName || !formData.customerPhone) {
      toast.error('Nome e telefone do cliente são obrigatórios')
      return
    }

    if (formData.products.length === 0) {
      toast.error('Adicione pelo menos um produto')
      return
    }

    setLoading(true)
    
    try {
      const response = await fetch('/api/admin/sales', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          customerName: formData.customerName,
          customerEmail: formData.customerEmail,
          customerPhone: formData.customerPhone,
          customerCpf: formData.customerCpf,
          products: formData.products,
          totalValue: formData.totalValue,
          status: formData.status,
          paymentMethod: formData.paymentMethod,
          notes: formData.notes
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erro ao registrar venda')
      }

      const data = await response.json()
      toast.success('Venda registrada com sucesso!')
      router.push('/dashboard')
    } catch (error) {
      console.error('Erro ao registrar venda:', error)
      toast.error(error instanceof Error ? error.message : 'Erro ao registrar venda')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center py-6">
            <Button
              variant="ghost"
              onClick={() => router.push('/dashboard' as any)}
              className="mr-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
            <h1 className="text-2xl font-bold text-gray-900">Registrar Nova Venda</h1>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Dados do Cliente */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Dados do Cliente
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="customerName">Nome Completo *</Label>
                    <Input
                      id="customerName"
                      value={formData.customerName}
                      onChange={(e) => setFormData(prev => ({ ...prev, customerName: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="customerEmail">E-mail</Label>
                    <Input
                      id="customerEmail"
                      type="email"
                      value={formData.customerEmail}
                      onChange={(e) => setFormData(prev => ({ ...prev, customerEmail: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="customerPhone">Telefone *</Label>
                    <Input
                      id="customerPhone"
                      value={formData.customerPhone}
                      onChange={(e) => setFormData(prev => ({ ...prev, customerPhone: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="customerCpf">CPF</Label>
                    <Input
                      id="customerCpf"
                      value={formData.customerCpf}
                      onChange={(e) => setFormData(prev => ({ ...prev, customerCpf: e.target.value }))}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Informações da Venda */}
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="w-5 h-5" />
                    Informações da Venda
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="status">Status</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, status: value as 'pending' | 'completed' | 'cancelled' }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pendente</SelectItem>
                        <SelectItem value="completed">Concluída</SelectItem>
                        <SelectItem value="cancelled">Cancelada</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="paymentMethod">Forma de Pagamento</Label>
                    <Select
                      value={formData.paymentMethod}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, paymentMethod: value as any }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a forma de pagamento" />
                      </SelectTrigger>
                      <SelectContent>
                        {PAYMENT_METHODS.map(method => (
                          <SelectItem key={method.value} value={method.value}>
                            {method.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="notes">Observações</Label>
                    <Textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Produtos e Total */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="w-5 h-5" />
                    Produtos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {formData.products.map((product, index) => (
                      <div key={index} className="flex gap-4 p-4 border rounded-lg">
                        <div className="flex-1">
                          <Label>Produto</Label>
                          <Select
                            value={product.id}
                            onValueChange={(value) => updateProduct(index, 'id', value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione um produto" />
                            </SelectTrigger>
                            <SelectContent>
                              {PRODUCTS.map(p => (
                                <SelectItem key={p.id} value={p.id}>
                                  {p.name} - R$ {p.price.toFixed(2)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="w-24">
                          <Label>Qtd</Label>
                          <Input
                            type="number"
                            min="1"
                            value={product.quantity}
                            onChange={(e) => updateProduct(index, 'quantity', parseInt(e.target.value) || 1)}
                          />
                        </div>
                        <div className="w-32">
                          <Label>Preço</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={product.price}
                            onChange={(e) => updateProduct(index, 'price', parseFloat(e.target.value) || 0)}
                          />
                        </div>
                        <div className="w-32">
                          <Label>Subtotal</Label>
                          <div className="p-2 bg-gray-50 rounded text-sm font-medium">
                            R$ {(product.price * product.quantity).toFixed(2)}
                          </div>
                        </div>
                        <div className="flex items-end">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeProduct(index)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}

                    <Button
                      type="button"
                      variant="outline"
                      onClick={addProduct}
                      className="w-full"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Adicionar Produto
                    </Button>

                    {/* Total */}
                    <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                      <div className="flex justify-between items-center text-lg font-bold">
                        <span>Total da Venda:</span>
                        <span className="text-blue-600">R$ {formData.totalValue.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Botões de Ação */}
              <div className="flex justify-end gap-4 mt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push('/dashboard' as any)}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {loading ? 'Registrando...' : 'Registrar Venda'}
                </Button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
} 