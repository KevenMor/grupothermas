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

// Interfaces para o sistema de Atendimento / Chat
export type ChatStatus = 'sending' | 'sent' | 'delivered' | 'read' | 'failed'

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
}

export interface ChatMessage {
  id: string
  chatId?: string
  content: string
  timestamp: string
  role: 'user' | 'agent' | 'system' | 'ai'
  sender?: 'user' | 'agent' // for legacy
  status: ChatStatus
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
} 