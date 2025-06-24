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