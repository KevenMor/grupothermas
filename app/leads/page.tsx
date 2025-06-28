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
  UserPlus, 
  Search, 
  Filter, 
  MoreVertical, 
  Edit, 
  Trash2, 
  Eye, 
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
  Clock,
  User,
  Building,
  PhoneCall,
  Mail as MailIcon,
  MapPin as MapPinIcon,
  CalendarDays,
  FileText,
  FileCheck,
  FileX,
  FileClock,
  ArrowRight,
  DollarSign,
  MessageSquare,
  Zap
} from 'lucide-react'
import { Toaster, toast } from 'sonner'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import { useAuth } from '@/components/auth/AuthProvider'
import { authFetch } from '@/lib/api'

interface Lead {
  id: string
  name: string
  email: string
  phone: string
  company?: string
  position?: string
  source: string
  status: 'new' | 'contacted' | 'qualified' | 'proposal' | 'converted' | 'lost'
  priority: 'low' | 'medium' | 'high'
  notes?: string
  assignedTo?: string
  assignedToName?: string
  createdAt: string
  updatedAt: string
  lastContact?: string
  nextFollowUp?: string
  budget?: number
  timeline?: string
  interests?: string[]
}

const leadSources = [
  { id: 'website', name: 'Website', icon: Building },
  { id: 'social_media', name: 'Redes Sociais', icon: Users },
  { id: 'referral', name: 'Indicação', icon: User },
  { id: 'cold_call', name: 'Cold Call', icon: PhoneCall },
  { id: 'email', name: 'E-mail Marketing', icon: Mail },
  { id: 'event', name: 'Evento', icon: CalendarDays },
  { id: 'other', name: 'Outro', icon: MoreVertical },
]

const leadStatuses = [
  { id: 'new', name: 'Novo', color: 'bg-blue-500', icon: FileClock },
  { id: 'contacted', name: 'Contactado', color: 'bg-yellow-500', icon: Phone },
  { id: 'qualified', name: 'Qualificado', color: 'bg-purple-500', icon: CheckCircle },
  { id: 'proposal', name: 'Proposta Enviada', color: 'bg-orange-500', icon: FileText },
  { id: 'converted', name: 'Convertido', color: 'bg-green-500', icon: DollarSign },
  { id: 'lost', name: 'Perdido', color: 'bg-red-500', icon: XCircle },
]

const priorities = [
  { id: 'low', name: 'Baixa', color: 'bg-gray-500' },
  { id: 'medium', name: 'Média', color: 'bg-yellow-500' },
  { id: 'high', name: 'Alta', color: 'bg-red-500' },
]

const interests = [
  'Produto A',
  'Produto B', 
  'Serviço X',
  'Consultoria',
  'Treinamento',
  'Suporte',
  'Outro'
]

export default function LeadsPage() {
  const { user } = useAuth()
  const [leads, setLeads] = useState<Lead[]>([])
  const [filteredLeads, setFilteredLeads] = useState<Lead[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [priorityFilter, setPriorityFilter] = useState<string>('all')
  const [sourceFilter, setSourceFilter] = useState<string>('all')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditDrawer, setShowEditDrawer] = useState(false)
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [nextFollowUpDate, setNextFollowUpDate] = useState<Date>()

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    position: '',
    source: '',
    status: 'new' as Lead['status'],
    priority: 'medium' as Lead['priority'],
    notes: '',
    budget: 0,
    timeline: '',
    interests: [] as string[]
  })

  // Load leads
  useEffect(() => {
    fetchLeads()
  }, [])

  // Filter leads
  useEffect(() => {
    let filtered = leads

    if (searchTerm) {
      filtered = filtered.filter(lead => 
        lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.phone.includes(searchTerm) ||
        lead.company?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(lead => lead.status === statusFilter)
    }

    if (priorityFilter !== 'all') {
      filtered = filtered.filter(lead => lead.priority === priorityFilter)
    }

    if (sourceFilter !== 'all') {
      filtered = filtered.filter(lead => lead.source === sourceFilter)
    }

    setFilteredLeads(filtered)
  }, [leads, searchTerm, statusFilter, priorityFilter, sourceFilter])

  const fetchLeads = async () => {
    try {
      setIsLoading(true)
      if (!user) throw new Error('Usuário não autenticado')
      const response = await authFetch('/api/admin/leads', {}, user)
      if (!response.ok) throw new Error('Erro ao carregar leads')
      const data = await response.json()
      setLeads(data.data?.data || data.data || [])
    } catch (error) {
      console.error('Erro ao carregar leads:', error)
      toast.error('Erro ao carregar leads')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateLead = async () => {
    try {
      setIsSubmitting(true)
      if (!user) throw new Error('Usuário não autenticado')
      const response = await authFetch('/api/admin/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      }, user)
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erro ao criar lead')
      }
      toast.success('Lead criado com sucesso!')
      setShowCreateModal(false)
      resetForm()
      fetchLeads()
    } catch (error) {
      console.error('Erro ao criar lead:', error)
      toast.error(error instanceof Error ? error.message : 'Erro ao criar lead')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUpdateLead = async () => {
    if (!selectedLead) return
    try {
      setIsSubmitting(true)
      if (!user) throw new Error('Usuário não autenticado')
      const response = await authFetch(`/api/admin/leads/${selectedLead.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      }, user)
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erro ao atualizar lead')
      }
      toast.success('Lead atualizado com sucesso!')
      setShowEditDrawer(false)
      setSelectedLead(null)
      resetForm()
      fetchLeads()
    } catch (error) {
      console.error('Erro ao atualizar lead:', error)
      toast.error(error instanceof Error ? error.message : 'Erro ao atualizar lead')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteLead = async (leadId: string) => {
    if (!confirm('Tem certeza que deseja excluir este lead?')) return
    try {
      if (!user) throw new Error('Usuário não autenticado')
      const response = await authFetch(`/api/admin/leads/${leadId}`, {
        method: 'DELETE'
      }, user)
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erro ao excluir lead')
      }
      toast.success('Lead excluído com sucesso!')
      fetchLeads()
    } catch (error) {
      console.error('Erro ao excluir lead:', error)
      toast.error(error instanceof Error ? error.message : 'Erro ao excluir lead')
    }
  }

  const handleEditLead = (lead: Lead) => {
    setSelectedLead(lead)
    setFormData({
      name: lead.name,
      email: lead.email,
      phone: lead.phone,
      company: lead.company || '',
      position: lead.position || '',
      source: lead.source,
      status: lead.status,
      priority: lead.priority,
      notes: lead.notes || '',
      budget: lead.budget || 0,
      timeline: lead.timeline || '',
      interests: lead.interests || []
    })
    setShowEditDrawer(true)
  }

  const handleConvertToSale = (lead: Lead) => {
    // Redirecionar para a página de vendas com os dados do lead
    toast.success('Redirecionando para cadastro de venda...')
    // Aqui você pode implementar a navegação para a página de vendas
  }

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      company: '',
      position: '',
      source: '',
      status: 'new',
      priority: 'medium',
      notes: '',
      budget: 0,
      timeline: '',
      interests: []
    })
    setNextFollowUpDate(undefined)
  }

  const toggleInterest = (interest: string) => {
    setFormData(prev => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest]
    }))
  }

  const getStatusInfo = (status: string) => {
    return leadStatuses.find(s => s.id === status) || leadStatuses[0]
  }

  const getPriorityInfo = (priority: string) => {
    return priorities.find(p => p.id === priority) || priorities[1]
  }

  const getSourceInfo = (source: string) => {
    return leadSources.find(s => s.id === source) || leadSources[0]
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

  // Dashboard stats
  const totalLeads = leads.length
  const newLeads = leads.filter(l => l.status === 'new').length
  const convertedLeads = leads.filter(l => l.status === 'converted').length
  const conversionRate = totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0
  const highPriorityLeads = leads.filter(l => l.priority === 'high').length

  return (
    <AppLayout>
      <Toaster richColors position="top-right" />
      
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Gestão de Leads</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Gerencie leads, qualifique oportunidades e converta em vendas
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={fetchLeads}
              disabled={isLoading}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
            
            <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
              <DialogTrigger asChild>
                <Button onClick={() => resetForm()}>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Novo Lead
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <UserPlus className="w-5 h-5" />
                    Cadastrar Novo Lead
                  </DialogTitle>
                </DialogHeader>
                
                <Tabs defaultValue="basic" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="basic">Informações</TabsTrigger>
                    <TabsTrigger value="details">Detalhes</TabsTrigger>
                    <TabsTrigger value="notes">Observações</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="basic" className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium">Nome Completo *</label>
                        <Input
                          value={formData.name}
                          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="Digite o nome completo"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">E-mail *</label>
                        <Input
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                          placeholder="lead@email.com"
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium">Telefone *</label>
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
                        <label className="text-sm font-medium">Empresa</label>
                        <Input
                          value={formData.company}
                          onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
                          placeholder="Nome da empresa"
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium">Cargo</label>
                        <Input
                          value={formData.position}
                          onChange={(e) => setFormData(prev => ({ ...prev, position: e.target.value }))}
                          placeholder="Cargo/função"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Origem *</label>
                        <Select value={formData.source} onValueChange={(value) => setFormData(prev => ({ ...prev, source: value }))}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione a origem" />
                          </SelectTrigger>
                          <SelectContent>
                            {leadSources.map(source => {
                              const SourceIcon = source.icon
                              return (
                                <SelectItem key={source.id} value={source.id}>
                                  <div className="flex items-center gap-2">
                                    <SourceIcon className="w-4 h-4" />
                                    {source.name}
                                  </div>
                                </SelectItem>
                              )
                            })}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="details" className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium">Status</label>
                        <Select value={formData.status} onValueChange={(value: Lead['status']) => setFormData(prev => ({ ...prev, status: value }))}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {leadStatuses.map(status => {
                              const StatusIcon = status.icon
                              return (
                                <SelectItem key={status.id} value={status.id}>
                                  <div className="flex items-center gap-2">
                                    <div className={`w-3 h-3 rounded-full ${status.color}`} />
                                    <StatusIcon className="w-4 h-4" />
                                    {status.name}
                                  </div>
                                </SelectItem>
                              )
                            })}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="text-sm font-medium">Prioridade</label>
                        <Select value={formData.priority} onValueChange={(value: Lead['priority']) => setFormData(prev => ({ ...prev, priority: value }))}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {priorities.map(priority => (
                              <SelectItem key={priority.id} value={priority.id}>
                                <div className="flex items-center gap-2">
                                  <div className={`w-3 h-3 rounded-full ${priority.color}`} />
                                  {priority.name}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium">Orçamento Estimado</label>
                        <Input
                          type="number"
                          value={formData.budget}
                          onChange={(e) => setFormData(prev => ({ ...prev, budget: parseFloat(e.target.value) || 0 }))}
                          placeholder="0,00"
                          step="0.01"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Timeline</label>
                        <Select value={formData.timeline} onValueChange={(value) => setFormData(prev => ({ ...prev, timeline: value }))}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="immediate">Imediato</SelectItem>
                            <SelectItem value="1_month">1 mês</SelectItem>
                            <SelectItem value="3_months">3 meses</SelectItem>
                            <SelectItem value="6_months">6 meses</SelectItem>
                            <SelectItem value="1_year">1 ano</SelectItem>
                            <SelectItem value="undefined">Indefinido</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium mb-2 block">Interesses</label>
                      <div className="grid grid-cols-2 gap-2">
                        {interests.map(interest => (
                          <div
                            key={interest}
                            className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-colors ${
                              formData.interests.includes(interest)
                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                            }`}
                            onClick={() => toggleInterest(interest)}
                          >
                            <input
                              type="checkbox"
                              checked={formData.interests.includes(interest)}
                              onChange={() => toggleInterest(interest)}
                              className="w-4 h-4 text-blue-600"
                            />
                            <span className="text-sm">{interest}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="notes" className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">Observações</label>
                      <textarea
                        value={formData.notes}
                        onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                        placeholder="Digite observações sobre o lead..."
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
                    onClick={handleCreateLead}
                    disabled={isSubmitting || !formData.name || !formData.email || !formData.phone || !formData.source}
                  >
                    {isSubmitting ? 'Salvando...' : 'Salvar Lead'}
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
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total de Leads</p>
                  <p className="text-2xl font-bold">{totalLeads}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                  <FileClock className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Leads Novos</p>
                  <p className="text-2xl font-bold">{newLeads}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                  <DollarSign className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Convertidos</p>
                  <p className="text-2xl font-bold">{convertedLeads}</p>
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
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Buscar</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Nome, email, telefone ou empresa..."
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
                    {leadStatuses.map(status => (
                      <SelectItem key={status.id} value={status.id}>
                        {status.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">Prioridade</label>
                <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    {priorities.map(priority => (
                      <SelectItem key={priority.id} value={priority.id}>
                        {priority.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">Origem</label>
                <Select value={sourceFilter} onValueChange={setSourceFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    {leadSources.map(source => (
                      <SelectItem key={source.id} value={source.id}>
                        {source.name}
                      </SelectItem>
                    ))}
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

        {/* Leads Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Leads ({filteredLeads.length})</span>
              <Badge variant="secondary">
                {highPriorityLeads} alta prioridade
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="w-6 h-6 animate-spin text-blue-500" />
                <span className="ml-2">Carregando leads...</span>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Lead</TableHead>
                    <TableHead>Contato</TableHead>
                    <TableHead>Origem</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Prioridade</TableHead>
                    <TableHead>Último Contato</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLeads.map((lead) => {
                    const statusInfo = getStatusInfo(lead.status)
                    const priorityInfo = getPriorityInfo(lead.priority)
                    const sourceInfo = getSourceInfo(lead.source)
                    const StatusIcon = statusInfo.icon
                    const SourceIcon = sourceInfo.icon
                    
                    return (
                      <TableRow key={lead.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{lead.name}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {lead.company || 'Sem empresa'}
                            </p>
                            {lead.position && (
                              <p className="text-xs text-gray-500">{lead.position}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center gap-1 text-sm">
                              <Phone className="w-3 h-3" />
                              {formatPhone(lead.phone)}
                            </div>
                            <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                              <Mail className="w-3 h-3" />
                              {lead.email}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <SourceIcon className="w-4 h-4" />
                            <span className="text-sm">{sourceInfo.name}</span>
                          </div>
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
                          <Badge 
                            variant="outline" 
                            className="flex items-center gap-1 w-fit"
                          >
                            <div className={`w-2 h-2 rounded-full ${priorityInfo.color}`} />
                            {priorityInfo.name}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {lead.lastContact ? (
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              {format(new Date(lead.lastContact), 'dd/MM/yyyy', { locale: ptBR })}
                            </span>
                          ) : (
                            <span className="text-sm text-gray-400">Nunca</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditLead(lead)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            {lead.status !== 'converted' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleConvertToSale(lead)}
                                title="Converter em venda"
                              >
                                <ArrowRight className="w-4 h-4" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteLead(lead.id)}
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

      {/* Edit Lead Drawer */}
      <Drawer open={showEditDrawer} onOpenChange={setShowEditDrawer}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle className="flex items-center gap-2">
              <Edit className="w-5 h-5" />
              Editar Lead
            </DrawerTitle>
            <DrawerDescription>
              Atualize as informações do lead {selectedLead?.name}
            </DrawerDescription>
          </DrawerHeader>
          
          <div className="px-4 py-6">
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="basic">Informações</TabsTrigger>
                <TabsTrigger value="details">Detalhes</TabsTrigger>
                <TabsTrigger value="notes">Observações</TabsTrigger>
              </TabsList>
              
              <TabsContent value="basic" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Nome Completo</label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Digite o nome completo"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">E-mail</label>
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="lead@email.com"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Telefone</label>
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
                    <label className="text-sm font-medium">Empresa</label>
                    <Input
                      value={formData.company}
                      onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
                      placeholder="Nome da empresa"
                    />
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="details" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Status</label>
                    <Select value={formData.status} onValueChange={(value: Lead['status']) => setFormData(prev => ({ ...prev, status: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {leadStatuses.map(status => {
                          const StatusIcon = status.icon
                          return (
                            <SelectItem key={status.id} value={status.id}>
                              <div className="flex items-center gap-2">
                                <div className={`w-3 h-3 rounded-full ${status.color}`} />
                                <StatusIcon className="w-4 h-4" />
                                {status.name}
                              </div>
                            </SelectItem>
                          )
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Prioridade</label>
                    <Select value={formData.priority} onValueChange={(value: Lead['priority']) => setFormData(prev => ({ ...prev, priority: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {priorities.map(priority => (
                          <SelectItem key={priority.id} value={priority.id}>
                            <div className="flex items-center gap-2">
                              <div className={`w-3 h-3 rounded-full ${priority.color}`} />
                              {priority.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="notes" className="space-y-4 mt-4">
                <div>
                  <label className="text-sm font-medium">Observações</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Digite observações sobre o lead..."
                    className="w-full min-h-[120px] p-3 border border-gray-300 dark:border-gray-600 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </TabsContent>
            </Tabs>
          </div>
          
          <DrawerFooter>
            <Button
              onClick={handleUpdateLead}
              disabled={isSubmitting || !formData.name || !formData.email || !formData.phone}
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