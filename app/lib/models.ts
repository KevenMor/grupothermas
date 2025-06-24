// Tipos para o sistema de Atendimento / Chat
export type ChatStatus = 'sending' | 'sent' | 'delivered' | 'read' | 'failed'
export type ConversationStatus = 'waiting' | 'ai_active' | 'agent_assigned' | 'resolved'

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
  aiEnabled: boolean
  aiPaused: boolean
  conversationStatus: ConversationStatus
  assignedAgent?: string
  assignedDepartment?: string
  pausedAt?: string
  pausedBy?: string
  resolvedAt?: string
  resolvedBy?: string
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
  content: string
  timestamp: string
  role: string
  status: ChatStatus
  userName?: string
  agentId?: string
  agentName?: string
  mediaType?: 'image' | 'audio' | 'video' | 'document'
  mediaUrl?: string
  mediaInfo?: any
  replyTo?: string
  replyToContent?: string
} 