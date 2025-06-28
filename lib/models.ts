export interface User {
  uid: string
  email: string
  name: string
  role: 'admin' | 'corretor'
  createdAt: Date
}

export interface Customer {
  name: string
  cpf: string
  birthDate: string
  maritalStatus: 'Solteiro(a)' | 'Casado(a)' | 'Divorciado(a)' | 'Viúvo(a)'
  profession: string
  address: {
    cep: string
    street: string
    number: string
    complement?: string
    neighborhood: string
    city: string
    state: string
  }
  phone: string
  email: string
}

export interface Sale {
  id: string
  customerName: string
  customerEmail: string
  customerPhone: string
  customerCpf: string
  products: {
    id: string
    name: string
    price: number
    quantity: number
  }[]
  totalValue: number
  status: 'pending' | 'completed' | 'cancelled'
  paymentMethod: 'pix' | 'credit_card' | 'debit_card' | 'bank_transfer' | 'cash'
  notes: string
  createdAt: string
  updatedAt: string
  createdBy: string
  isActive: boolean
  // Campos legados para compatibilidade
  installments?: number
  paymentDate?: string
  saleId?: string
  contractNumber?: string
  saleDate?: string
  commission?: number
  commissionValue?: number
  paymentStatus?: 'pendente' | 'pago' | 'atrasado' | 'cancelado'
  paymentHistory?: PaymentHistory[]
}

export interface Contract {
  id?: string
  uid: string // ID do corretor
  customer: Customer
  sale: Sale
  status: 'created' | 'signed' | 'pending' | 'paid' | 'cancelled'
  lgpdConsent: boolean
  createdAt: Date
  updatedAt: Date
}

export interface Lead {
  id: string
  uid: string
  name: string
  phone: string
  email?: string
  stage: 'new' | 'proposal' | 'waiting_signature' | 'completed'
  createdAt: string
  updatedAt: string
  cpf: string
  birthDate: string
  maritalStatus: 'solteiro' | 'casado' | 'divorciado' | 'viuvo'
  profession: string
  cep: string
  address: string
  neighborhood: string
  city: string
  state: string
  number: string
  complement?: string
  paymentMethod: 'pix' | 'cartao_credito'
  installments: number
  totalValue: number
  paymentDate: string
  status: 'novo' | 'em_atendimento' | 'proposta_enviada' | 'fechado' | 'perdido'
  assignedTo?: string
  assignedToName?: string
  departmentId?: string
  departmentName?: string
  source: string
  notes?: string
  createdBy: string
  updatedBy: string
}

export interface DashboardMetrics {
  contractsCreated: number
  contractsSigned: number
  contractsPending: number
  contractsPaid: number
  contractsOpen: number
}

// Tipos para o sistema de Atendimento / Chat
export type ChatStatus = 'sending' | 'sent' | 'delivered' | 'read' | 'failed'
export type ConversationStatus = 'waiting' | 'ai_active' | 'agent_assigned' | 'resolved'

// Sistema de reações de mensagens (igual WhatsApp)
export interface Reaction {
  emoji: string
  by: string // Nome de quem reagiu
  byPhone?: string // Telefone de quem reagiu
  fromMe: boolean // Se foi reagido pelo próprio usuário
  timestamp: string
  agentId?: string // ID do agente se foi reagido por um agente
}

// Novo enum para departamentos
export interface Department {
  id: string
  name: string
  description?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
  createdBy: string
}

// Sistema de usuários com departamentos
export interface SystemUser {
  id: string
  name: string
  email: string
  role: 'admin' | 'agent' | 'supervisor'
  departmentId?: string
  permissions: {
    canViewAllChats: boolean
    canManageUsers: boolean
    canManageDepartments: boolean
    canAccessReports: boolean
  }
  isActive: boolean
  createdAt: Date
  lastLogin?: Date
}

export interface Chat {
  id: string
  customerName: string
  customerPhone: string
  customerAvatar?: string
  lastMessage: string
  timestamp: string
  unreadCount: number
  status: 'open' | 'pending' | 'closed' | 'archived'
  agentId?: string
  // Campos de controle de IA e fluxo
  aiEnabled: boolean
  aiPaused: boolean
  conversationStatus: ConversationStatus
  assignedAgent?: string
  assignedDepartment?: string // ID do departamento atribuído
  departmentName?: string // Nome do departamento para exibição
  pausedAt?: string
  pausedBy?: string
  resolvedAt?: string
  resolvedBy?: string
  // Histórico de transferências
  transferHistory?: {
    from: 'ai' | 'agent'
    to: 'ai' | 'agent'
    agentId?: string
    departmentId?: string // ID do departamento de destino
    departmentName?: string // Nome do departamento de destino
    timestamp: string
    reason?: string
  }[]
}

export interface ChatMessage {
  id: string
  chatId?: string
  content: string
  timestamp: string
  role: 'user' | 'agent' | 'system' | 'ai'
  sender?: 'user' | 'agent' // for legacy
  status: ChatStatus
  // Campos para identificar o agente
  agentId?: string
  agentName?: string
  userName?: string // Nome do usuário logado que enviou a mensagem
  // Campos para mídia
  mediaType?: 'image' | 'audio' | 'video' | 'document' | 'contact' | 'location'
  mediaUrl?: string
  mediaInfo?: {
    type: string
    url?: string
    caption?: string
    title?: string
    filename?: string
    mimeType?: string
    displayName?: string
    vcard?: string
    latitude?: number
    longitude?: number
    address?: string
    pageCount?: number
  }
  // Novo campo para reply
  replyTo?: {
    id: string
    text: string
    author: 'agent' | 'customer'
  }
  // Sistema de reações (igual WhatsApp)
  reactions?: Reaction[]
  // Novo campo para timestamp de status (entregue/lido)
  statusTimestamp?: string
  // Auditoria
  origin?: 'panel' | 'device' | 'system' | 'unknown'
  fromMe?: boolean
  customerPhone?: string
  // Adicionado para integração Z-API
  zapiMessageId?: string
}

export interface ChatCustomer {
  id: string // phone number
  name: string
  phone: string
  email?: string
  lastMessage: string
  timestamp: Date | string // string for firestore
  status: 'waiting' | 'in_progress' | 'resolved' | 'active'
  unreadCount: number
  priority: 'low' | 'medium' | 'high'
  tags: string[]
  // Campos de controle de IA e departamento
  aiEnabled: boolean
  aiPaused: boolean
  conversationStatus: ConversationStatus
  assignedAgent?: string
  assignedDepartment?: string
  pausedAt?: Date | string
  pausedBy?: string
  resolvedAt?: Date | string
  resolvedBy?: string
}

// ===== SISTEMA DE GESTÃO DE USUÁRIOS E PERMISSÕES =====

export interface Permission {
  id: string
  name: string
  description: string
  module: string // 'admin' | 'atendimento' | 'crm' | 'vendas' | 'financeiro' | 'relatorios'
  action: string // 'view' | 'create' | 'edit' | 'delete' | 'approve' | 'audit'
  isActive: boolean
}

export interface UserProfile {
  id: string
  name: string
  email: string
  phone: string
  departmentId: string
  departmentName: string
  role: string // 'admin' | 'gerente' | 'atendimento' | 'comercial' | 'financeiro'
  permissions: string[] // Array de IDs de permissões
  isActive: boolean
  createdAt: string
  updatedAt: string
  createdBy: string
  lastLogin?: string
}

export interface AuditLog {
  id: string
  userId: string
  userName: string
  action: string // 'create' | 'update' | 'delete' | 'login' | 'logout' | 'permission_change'
  module: string // 'user' | 'department' | 'lead' | 'sale' | 'permission'
  recordId?: string // ID do registro afetado
  recordType?: string // Tipo do registro
  oldValues?: any
  newValues?: any
  ipAddress?: string
  userAgent?: string
  timestamp: string
  details?: string
}

// ===== CRM DE LEADS E VENDAS =====

export interface PaymentHistory {
  id: string
  amount: number
  date: string
  method: string
  status: 'pending' | 'completed' | 'failed'
  transactionId?: string
  notes?: string
}

// ===== PERMISSÕES PREDEFINIDAS =====

export const DEFAULT_PERMISSIONS: Omit<Permission, 'id'>[] = [
  // Admin
  { name: 'Visualizar Dashboard', description: 'Acesso ao dashboard principal', module: 'admin', action: 'view', isActive: true },
  { name: 'Gerenciar Usuários', description: 'Criar, editar e excluir usuários', module: 'admin', action: 'create', isActive: true },
  { name: 'Gerenciar Departamentos', description: 'Criar, editar e excluir departamentos', module: 'admin', action: 'create', isActive: true },
  { name: 'Gerenciar Permissões', description: 'Configurar permissões de usuários', module: 'admin', action: 'create', isActive: true },
  { name: 'Visualizar Auditoria', description: 'Acesso aos logs de auditoria', module: 'admin', action: 'audit', isActive: true },
  
  // Atendimento
  { name: 'Acesso ao Chat', description: 'Usar sistema de atendimento', module: 'atendimento', action: 'view', isActive: true },
  { name: 'Assumir Atendimentos', description: 'Assumir conversas do chat', module: 'atendimento', action: 'create', isActive: true },
  { name: 'Gerenciar IA', description: 'Configurar treinamento da IA', module: 'atendimento', action: 'edit', isActive: true },
  
  // CRM
  { name: 'Visualizar Leads', description: 'Ver lista de leads', module: 'crm', action: 'view', isActive: true },
  { name: 'Criar Leads', description: 'Cadastrar novos leads', module: 'crm', action: 'create', isActive: true },
  { name: 'Editar Leads', description: 'Modificar dados de leads', module: 'crm', action: 'edit', isActive: true },
  { name: 'Excluir Leads', description: 'Remover leads do sistema', module: 'crm', action: 'delete', isActive: true },
  { name: 'Atribuir Leads', description: 'Atribuir leads a usuários', module: 'crm', action: 'edit', isActive: true },
  
  // Vendas
  { name: 'Visualizar Vendas', description: 'Ver histórico de vendas', module: 'vendas', action: 'view', isActive: true },
  { name: 'Registrar Vendas', description: 'Cadastrar novas vendas', module: 'vendas', action: 'create', isActive: true },
  { name: 'Editar Vendas', description: 'Modificar dados de vendas', module: 'vendas', action: 'edit', isActive: true },
  { name: 'Aprovar Vendas', description: 'Aprovar vendas pendentes', module: 'vendas', action: 'approve', isActive: true },
  
  // Relatórios
  { name: 'Relatórios de Vendas', description: 'Acesso a relatórios de vendas', module: 'relatorios', action: 'view', isActive: true },
  { name: 'Relatórios de Atendimento', description: 'Acesso a relatórios de chat', module: 'relatorios', action: 'view', isActive: true },
  { name: 'Relatórios Financeiros', description: 'Acesso a relatórios financeiros', module: 'relatorios', action: 'view', isActive: true },
]

export const DEFAULT_DEPARTMENTS: Omit<Department, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>[] = [
  { name: 'Administração', description: 'Departamento administrativo', isActive: true },
  { name: 'Atendimento', description: 'Atendimento ao cliente', isActive: true },
  { name: 'Comercial', description: 'Vendas e prospecção', isActive: true },
  { name: 'Financeiro', description: 'Controle financeiro', isActive: true },
  { name: 'TI', description: 'Tecnologia da informação', isActive: true },
]

// ===== TIPOS DE PERFIL =====

export const USER_ROLES = {
  ADMIN: 'admin',
  GERENTE: 'gerente',
  ATENDIMENTO: 'atendimento',
  COMERCIAL: 'comercial',
  FINANCEIRO: 'financeiro',
} as const

export type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES]

// ===== UTILITÁRIOS =====

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
} 