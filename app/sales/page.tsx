'use client'

import { useState, useEffect } from 'react'
import { AppLayout } from '@/components/layout/app-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger 
} from '@/components/ui/dialog'
import { 
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { 
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import { 
  Calendar,
} from '@/components/ui/calendar'
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { 
  DollarSign, 
  UserPlus, 
  Search, 
  Filter, 
  MoreVertical, 
  Edit, 
  Trash2, 
  Eye, 
  FileText, 
  Phone, 
  Mail, 
  MapPin, 
  Calendar as CalendarIcon,
  CheckCircle,
  XCircle,
  AlertCircle,
  Download,
  RefreshCw,
  Plus,
  TrendingUp,
  Users,
  Target,
  BarChart3,
  CreditCard,
  QrCode,
  Clock,
  User,
  Building,
  PhoneCall,
  Mail as MailIcon,
  MapPin as MapPinIcon,
  CalendarDays,
  CreditCard as CreditCardIcon,
  Receipt,
  FileCheck,
  FileX,
  FileClock
} from 'lucide-react'
import { Toaster, toast } from 'sonner'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { cn } from '@/lib/utils'

interface Sale {
  id: string
  customerName: string
  cpf: string
  birthDate: string
  maritalStatus: string
  profession: string
  cep: string
  address: string
  neighborhood: string
  city: string
  state: string
  number: string
  complement: string
  phone: string
  email: string
  paymentMethod: string
  installments: number
  totalValue: number
  paymentDate: string
  status: 'new' | 'in_progress' | 'completed' | 'cancelled'
  sellerId: string
  sellerName: string
  createdAt: string
  updatedAt: string
  notes?: string
}

const maritalStatusOptions = [
  { id: 'solteiro', name: 'Solteiro(a)' },
  { id: 'casado', name: 'Casado(a)' },
  { id: 'divorciado', name: 'Divorciado(a)' },
  { id: 'viuvo', name: 'Viúvo(a)' },
  { id: 'uniao_estavel', name: 'União Estável' },
]

const paymentMethods = [
  { id: 'pix', name: 'PIX', icon: QrCode },
  { id: 'credit_card', name: 'Cartão de Crédito', icon: CreditCard },
]

const installmentsOptions = Array.from({ length: 12 }, (_, i) => ({
  id: i + 1,
  name: `${i + 1}x`
}))

const statusOptions = [
  { id: 'new', name: 'Novo', color: 'bg-blue-500', icon: FileClock },
  { id: 'in_progress', name: 'Em Andamento', color: 'bg-yellow-500', icon: Clock },
  { id: 'completed', name: 'Finalizado', color: 'bg-green-500', icon: CheckCircle },
  { id: 'cancelled', name: 'Cancelado', color: 'bg-red-500', icon: XCircle },
]

export default function SalesPage() {
  const [sales, setSales] = useState<Sale[]>([])
  const [filteredSales, setFilteredSales] = useState<Sale[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [dateFilter, setDateFilter] = useState<string>('all')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditDrawer, setShowEditDrawer] = useState(false)
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date>()
  const [paymentDate, setPaymentDate] = useState<Date>()

  // Form states
  const [formData, setFormData] = useState({
    customerName: '',
    cpf: '',
    birthDate: '',
    maritalStatus: '',
    profession: '',
    cep: '',
    address: '',
    neighborhood: '',
    city: '',
    state: '',
    number: '',
    complement: '',
    phone: '',
    email: '',
    paymentMethod: '',
    installments: 1,
    totalValue: 0,
    paymentDate: '',
    notes: ''
  })

  // Load sales
  useEffect(() => {
    fetchSales()
  }, [])

  // Filter sales
  useEffect(() => {
    let filtered = sales

    if (searchTerm) {
      filtered = filtered.filter(sale => 
        sale.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sale.cpf.includes(searchTerm) ||
        sale.phone.includes(searchTerm) ||
        sale.email.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(sale => sale.status === statusFilter)
    }

    if (dateFilter !== 'all') {
      const today = new Date()
      const filterDate = new Date()
      
      switch (dateFilter) {
        case 'today':
          filtered = filtered.filter(sale => {
            const saleDate = new Date(sale.createdAt)
            return saleDate.toDateString() === today.toDateString()
          })
          break
        case 'week':
          filterDate.setDate(today.getDate() - 7)
          filtered = filtered.filter(sale => {
            const saleDate = new Date(sale.createdAt)
            return saleDate >= filterDate
          })
          break
        case 'month':
          filterDate.setMonth(today.getMonth() - 1)
          filtered = filtered.filter(sale => {
            const saleDate = new Date(sale.createdAt)
            return saleDate >= filterDate
          })
          break
      }
    }

    setFilteredSales(filtered)
  }, [sales, searchTerm, statusFilter, dateFilter])

  const fetchSales = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/admin/sales')
      if (!response.ok) throw new Error('Erro ao carregar vendas')
      
      const data = await response.json()
      setSales(data)
    } catch (error) {
      console.error('Erro ao carregar vendas:', error)
      toast.error('Erro ao carregar vendas')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateSale = async () => {
    try {
      setIsSubmitting(true)
      const response = await fetch('/api/admin/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erro ao criar venda')
      }

      toast.success('Venda criada com sucesso!')
      setShowCreateModal(false)
      resetForm()
      fetchSales()
    } catch (error) {
      console.error('Erro ao criar venda:', error)
      toast.error(error instanceof Error ? error.message : 'Erro ao criar venda')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUpdateSale = async () => {
    if (!selectedSale) return

    try {
      setIsSubmitting(true)
      const response = await fetch(`/api/admin/sales/${selectedSale.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erro ao atualizar venda')
      }

      toast.success('Venda atualizada com sucesso!')
      setShowEditDrawer(false)
      setSelectedSale(null)
      resetForm()
      fetchSales()
    } catch (error) {
      console.error('Erro ao atualizar venda:', error)
      toast.error(error instanceof Error ? error.message : 'Erro ao atualizar venda')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteSale = async (saleId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta venda?')) return

    try {
      const response = await fetch(`/api/admin/sales/${saleId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erro ao excluir venda')
      }

      toast.success('Venda excluída com sucesso!')
      fetchSales()
    } catch (error) {
      console.error('Erro ao excluir venda:', error)
      toast.error(error instanceof Error ? error.message : 'Erro ao excluir venda')
    }
  }

  const handleEditSale = (sale: Sale) => {
    setSelectedSale(sale)
    setFormData({
      customerName: sale.customerName,
      cpf: sale.cpf,
      birthDate: sale.birthDate,
      maritalStatus: sale.maritalStatus,
      profession: sale.profession,
      cep: sale.cep,
      address: sale.address,
      neighborhood: sale.neighborhood,
      city: sale.city,
      state: sale.state,
      number: sale.number,
      complement: sale.complement,
      phone: sale.phone,
      email: sale.email,
      paymentMethod: sale.paymentMethod,
      installments: sale.installments,
      totalValue: sale.totalValue,
      paymentDate: sale.paymentDate,
      notes: sale.notes || ''
    })
    setShowEditDrawer(true)
  }

  const resetForm = () => {
    setFormData({
      customerName: '',
      cpf: '',
      birthDate: '',
      maritalStatus: '',
      profession: '',
      cep: '',
      address: '',
      neighborhood: '',
      city: '',
      state: '',
      number: '',
      complement: '',
      phone: '',
      email: '',
      paymentMethod: '',
      installments: 1,
      totalValue: 0,
      paymentDate: '',
      notes: ''
    })
    setSelectedDate(undefined)
    setPaymentDate(undefined)
  }

  const handleCepSearch = async (cep: string) => {
    if (cep.length !== 8) return

    try {
      const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`)
      const data = await response.json()

      if (!data.erro) {
        setFormData(prev => ({
          ...prev,
          address: data.logradouro,
          neighborhood: data.bairro,
          city: data.localidade,
          state: data.uf
        }))
      }
    } catch (error) {
      console.error('Erro ao buscar CEP:', error)
    }
  }

  const formatCPF = (cpf: string) => {
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
  }

  const formatPhone = (phone: string) => {
    return phone.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const getStatusInfo = (status: string) => {
    return statusOptions.find(s => s.id === status) || statusOptions[0]
  }

  const getPaymentMethodInfo = (method: string) => {
    return paymentMethods.find(p => p.id === method) || paymentMethods[0]
  }

  const getMaritalStatusName = (status: string) => {
    return maritalStatusOptions.find(s => s.id === status)?.name || status
  }

  // Dashboard stats
  const totalSales = sales.length
  const completedSales = sales.filter(s => s.status === 'completed').length
  const totalRevenue = sales
    .filter(s => s.status === 'completed')
    .reduce((sum, sale) => sum + sale.totalValue, 0)
  const conversionRate = totalSales > 0 ? (completedSales / totalSales) * 100 : 0

  return (
    <AppLayout>
      <Toaster richColors position="top-right" />
      
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Gestão de Vendas</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Gerencie vendas, leads e contratos do sistema
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={fetchSales}
              disabled={isLoading}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
            
            <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
              <DialogTrigger asChild>
                <Button onClick={() => resetForm()}>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Nova Venda
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <UserPlus className="w-5 h-5" />
                    Cadastrar Nova Venda
                  </DialogTitle>
                </DialogHeader>
                
                <Tabs defaultValue="customer" className="w-full">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="customer">Cliente</TabsTrigger>
                    <TabsTrigger value="address">Endereço</TabsTrigger>
                    <TabsTrigger value="payment">Pagamento</TabsTrigger>
                    <TabsTrigger value="notes">Observações</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="customer" className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium">Nome Completo *</label>
                        <Input
                          value={formData.customerName}
                          onChange={(e) => setFormData(prev => ({ ...prev, customerName: e.target.value }))}
                          placeholder="Digite o nome completo"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">CPF *</label>
                        <Input
                          value={formData.cpf}
                          onChange={(e) => {
                            const cpf = e.target.value.replace(/\D/g, '')
                            setFormData(prev => ({ ...prev, cpf }))
                          }}
                          placeholder="000.000.000-00"
                          maxLength={11}
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="text-sm font-medium">Data de Nascimento *</label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full justify-start text-left font-normal",
                                !selectedDate && "text-muted-foreground"
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {selectedDate ? format(selectedDate, "dd/MM/yyyy") : "Selecione a data"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              mode="single"
                              selected={selectedDate}
                              onSelect={(date) => {
                                setSelectedDate(date)
                                if (date) {
                                  setFormData(prev => ({ 
                                    ...prev, 
                                    birthDate: format(date, 'yyyy-MM-dd') 
                                  }))
                                }
                              }}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                      <div>
                        <label className="text-sm font-medium">Estado Civil *</label>
                        <Select value={formData.maritalStatus} onValueChange={(value) => setFormData(prev => ({ ...prev, maritalStatus: value }))}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                          <SelectContent>
                            {maritalStatusOptions.map(status => (
                              <SelectItem key={status.id} value={status.id}>
                                {status.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="text-sm font-medium">Profissão *</label>
                        <Input
                          value={formData.profession}
                          onChange={(e) => setFormData(prev => ({ ...prev, profession: e.target.value }))}
                          placeholder="Digite a profissão"
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium">Telefone WhatsApp *</label>
                        <Input
                          value={formData.phone}
                          onChange={(e) => {
                            const phone = e.target.value.replace(/\D/g, '')
                            setFormData(prev => ({ ...prev, phone }))
                          }}
                          placeholder="(00) 00000-0000"
                          maxLength={11}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">E-mail *</label>
                        <Input
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                          placeholder="cliente@email.com"
                        />
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="address" className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium">CEP *</label>
                        <Input
                          value={formData.cep}
                          onChange={(e) => {
                            const cep = e.target.value.replace(/\D/g, '')
                            setFormData(prev => ({ ...prev, cep }))
                            if (cep.length === 8) {
                              handleCepSearch(cep)
                            }
                          }}
                          placeholder="00000-000"
                          maxLength={8}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Número *</label>
                        <Input
                          value={formData.number}
                          onChange={(e) => setFormData(prev => ({ ...prev, number: e.target.value }))}
                          placeholder="123"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium">Endereço *</label>
                      <Input
                        value={formData.address}
                        onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                        placeholder="Rua, Avenida, etc."
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium">Bairro *</label>
                        <Input
                          value={formData.neighborhood}
                          onChange={(e) => setFormData(prev => ({ ...prev, neighborhood: e.target.value }))}
                          placeholder="Nome do bairro"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Complemento</label>
                        <Input
                          value={formData.complement}
                          onChange={(e) => setFormData(prev => ({ ...prev, complement: e.target.value }))}
                          placeholder="Apartamento, bloco, etc."
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium">Cidade *</label>
                        <Input
                          value={formData.city}
                          onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                          placeholder="Nome da cidade"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Estado *</label>
                        <Input
                          value={formData.state}
                          onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value }))}
                          placeholder="UF"
                          maxLength={2}
                        />
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="payment" className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium">Forma de Pagamento *</label>
                        <Select value={formData.paymentMethod} onValueChange={(value) => setFormData(prev => ({ ...prev, paymentMethod: value }))}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                          <SelectContent>
                            {paymentMethods.map(method => (
                              <SelectItem key={method.id} value={method.id}>
                                <div className="flex items-center gap-2">
                                  <method.icon className="w-4 h-4" />
                                  {method.name}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="text-sm font-medium">Quantidade de Parcelas *</label>
                        <Select value={formData.installments.toString()} onValueChange={(value) => setFormData(prev => ({ ...prev, installments: parseInt(value) }))}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {installmentsOptions.map(installment => (
                              <SelectItem key={installment.id} value={installment.id.toString()}>
                                {installment.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium">Valor Total do Contrato *</label>
                        <Input
                          type="number"
                          value={formData.totalValue}
                          onChange={(e) => setFormData(prev => ({ ...prev, totalValue: parseFloat(e.target.value) || 0 }))}
                          placeholder="0,00"
                          step="0.01"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Data de Pagamento *</label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full justify-start text-left font-normal",
                                !paymentDate && "text-muted-foreground"
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {paymentDate ? format(paymentDate, "dd/MM/yyyy") : "Selecione a data"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              mode="single"
                              selected={paymentDate}
                              onSelect={(date) => {
                                setPaymentDate(date)
                                if (date) {
                                  setFormData(prev => ({ 
                                    ...prev, 
                                    paymentDate: format(date, 'yyyy-MM-dd') 
                                  }))
                                }
                              }}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>
                    
                    {formData.paymentMethod && formData.totalValue > 0 && (
                      <Card>
                        <CardContent className="pt-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">Resumo do Pagamento</p>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {getPaymentMethodInfo(formData.paymentMethod).name} • {formData.installments}x
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-lg">{formatCurrency(formData.totalValue)}</p>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {formatCurrency(formData.totalValue / formData.installments)} por parcela
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="notes" className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">Observações</label>
                      <textarea
                        value={formData.notes}
                        onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                        placeholder="Digite observações adicionais sobre a venda..."
                        className="w-full min-h-[120px] p-3 border border-gray-300 dark:border-gray-600 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </TabsContent>
                </Tabs>
                
                <div className="flex justify-end gap-3 pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => setShowCreateModal(false)}
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleCreateSale}
                    disabled={isSubmitting || !formData.customerName || !formData.cpf || !formData.paymentMethod || formData.totalValue <= 0}
                  >
                    {isSubmitting ? 'Salvando...' : 'Salvar Venda'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Dashboard Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                  <DollarSign className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total de Vendas</p>
                  <p className="text-2xl font-bold">{totalSales}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Vendas Finalizadas</p>
                  <p className="text-2xl font-bold">{completedSales}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Receita Total</p>
                  <p className="text-2xl font-bold">{formatCurrency(totalRevenue)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
                  <Target className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Taxa de Conversão</p>
                  <p className="text-2xl font-bold">{conversionRate.toFixed(1)}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Buscar</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Nome, CPF, telefone ou email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">Status</label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {statusOptions.map(status => (
                      <SelectItem key={status.id} value={status.id}>
                        {status.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">Período</label>
                <Select value={dateFilter} onValueChange={setDateFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="today">Hoje</SelectItem>
                    <SelectItem value="week">Última Semana</SelectItem>
                    <SelectItem value="month">Último Mês</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-end">
                <Button variant="outline" className="w-full">
                  <Download className="w-4 h-4 mr-2" />
                  Exportar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sales Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Vendas ({filteredSales.length})</span>
              <Badge variant="secondary">
                {formatCurrency(totalRevenue)} total
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="w-6 h-6 animate-spin text-blue-500" />
                <span className="ml-2">Carregando vendas...</span>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Contato</TableHead>
                    <TableHead>Pagamento</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSales.map((sale) => {
                    const statusInfo = getStatusInfo(sale.status)
                    const paymentInfo = getPaymentMethodInfo(sale.paymentMethod)
                    const StatusIcon = statusInfo.icon
                    
                    return (
                      <TableRow key={sale.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{sale.customerName}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {formatCPF(sale.cpf)}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center gap-1 text-sm">
                              <Phone className="w-3 h-3" />
                              {formatPhone(sale.phone)}
                            </div>
                            <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                              <Mail className="w-3 h-3" />
                              {sale.email}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <paymentInfo.icon className="w-4 h-4" />
                            <span className="text-sm">
                              {paymentInfo.name} • {sale.installments}x
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <p className="font-medium">{formatCurrency(sale.totalValue)}</p>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant="outline" 
                            className="flex items-center gap-1 w-fit"
                          >
                            <StatusIcon className="w-3 h-3" />
                            {statusInfo.name}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {format(new Date(sale.createdAt), 'dd/MM/yyyy', { locale: ptBR })}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditSale(sale)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteSale(sale.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Edit Sale Drawer */}
      <Drawer open={showEditDrawer} onOpenChange={setShowEditDrawer}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle className="flex items-center gap-2">
              <Edit className="w-5 h-5" />
              Editar Venda
            </DrawerTitle>
            <DrawerDescription>
              Atualize as informações da venda de {selectedSale?.customerName}
            </DrawerDescription>
          </DrawerHeader>
          
          <div className="px-4 py-6">
            <Tabs defaultValue="customer" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="customer">Cliente</TabsTrigger>
                <TabsTrigger value="address">Endereço</TabsTrigger>
                <TabsTrigger value="payment">Pagamento</TabsTrigger>
                <TabsTrigger value="notes">Observações</TabsTrigger>
              </TabsList>
              
              <TabsContent value="customer" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Nome Completo</label>
                    <Input
                      value={formData.customerName}
                      onChange={(e) => setFormData(prev => ({ ...prev, customerName: e.target.value }))}
                      placeholder="Digite o nome completo"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">CPF</label>
                    <Input
                      value={formData.cpf}
                      onChange={(e) => {
                        const cpf = e.target.value.replace(/\D/g, '')
                        setFormData(prev => ({ ...prev, cpf }))
                      }}
                      placeholder="000.000.000-00"
                      maxLength={11}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Telefone WhatsApp</label>
                    <Input
                      value={formData.phone}
                      onChange={(e) => {
                        const phone = e.target.value.replace(/\D/g, '')
                        setFormData(prev => ({ ...prev, phone }))
                      }}
                      placeholder="(00) 00000-0000"
                      maxLength={11}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">E-mail</label>
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="cliente@email.com"
                    />
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="payment" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Forma de Pagamento</label>
                    <Select value={formData.paymentMethod} onValueChange={(value) => setFormData(prev => ({ ...prev, paymentMethod: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {paymentMethods.map(method => (
                          <SelectItem key={method.id} value={method.id}>
                            <div className="flex items-center gap-2">
                              <method.icon className="w-4 h-4" />
                              {method.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Valor Total</label>
                    <Input
                      type="number"
                      value={formData.totalValue}
                      onChange={(e) => setFormData(prev => ({ ...prev, totalValue: parseFloat(e.target.value) || 0 }))}
                      placeholder="0,00"
                      step="0.01"
                    />
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="notes" className="space-y-4 mt-4">
                <div>
                  <label className="text-sm font-medium">Observações</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Digite observações adicionais..."
                    className="w-full min-h-[120px] p-3 border border-gray-300 dark:border-gray-600 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </TabsContent>
            </Tabs>
          </div>
          
          <DrawerFooter>
            <Button
              onClick={handleUpdateSale}
              disabled={isSubmitting || !formData.customerName || !formData.cpf || !formData.paymentMethod || formData.totalValue <= 0}
              className="w-full"
            >
              {isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
            <DrawerClose asChild>
              <Button variant="outline" className="w-full">Cancelar</Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </AppLayout>
  )
} 