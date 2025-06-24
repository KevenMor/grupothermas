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
  paymentMethod: 'PIX' | 'Cartão de Crédito'
  installments: number
  totalValue: number
  firstPaymentDate: string
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
  id?: string
  uid: string
  name: string
  phone: string
  email?: string
  stage: 'new' | 'proposal' | 'waiting_signature' | 'completed'
  notes?: string
  createdAt: Date
  updatedAt: Date
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

// Novo enum para departamentos
export interface Department {
  id: string
  name: string
  description?: string
  isActive: boolean
  createdAt: Date
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
  assignedDepartment?: string // Novo campo para departamento
  pausedAt?: string
  pausedBy?: string
  resolvedAt?: string
  resolvedBy?: string
  // Histórico de transferências
  transferHistory?: {
    from: 'ai' | 'agent'
    to: 'ai' | 'agent'
    agentId?: string
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
  // Campos para reply
  replyTo?: string
  replyToContent?: string
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