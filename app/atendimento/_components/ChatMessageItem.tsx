import { ChatMessage, ChatStatus } from '@/lib/models'
import { cn } from '@/lib/utils'
import { Check, CheckCheck, Clock, AlertCircle, Reply, Edit, Trash2, Info, MoreVertical, FileText, ExternalLink, User, MapPin, X } from 'lucide-react'
import { format, isToday, isYesterday } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { useState } from 'react'

interface ChatMessageItemProps {
  message: ChatMessage
  avatarUrl?: string
  contactName?: string
  showAvatar?: boolean
  showName?: boolean
  isFirstOfDay?: boolean
  onReply?: (message: ChatMessage) => void
  onEdit?: (message: ChatMessage) => void
  onDelete?: (messageId: string) => void
  onInfo?: (message: ChatMessage) => void
}

const MessageStatus = ({ status }: { status: ChatStatus }) => {
  switch (status) {
    case 'sending':
      return <Clock className="w-3 h-3 text-white/60" />
    case 'sent':
      return <Check className="w-3 h-3 text-white/80" />
    case 'delivered':
      return <CheckCheck className="w-3 h-3 text-white/80" />
    case 'read':
      return <CheckCheck className="w-3 h-3 text-blue-200" />
    case 'failed':
      return <AlertCircle className="w-3 h-3 text-red-300" />
    default:
      return null
  }
}

const formatDate = (date: Date) => {
  if (isToday(date)) return 'Hoje'
  if (isYesterday(date)) return 'Ontem'
  return format(date, 'dd/MM/yyyy', { locale: ptBR })
}

export function ChatMessageItem({ message, avatarUrl, contactName, showAvatar = true, showName = true, isFirstOfDay = false, onReply, onEdit, onDelete, onInfo }: ChatMessageItemProps) {
  const [showImagePopup, setShowImagePopup] = useState(false)
  const [showActions, setShowActions] = useState(false)
  const [showInfo, setShowInfo] = useState(false)

  const isUser = message.role === 'user'
  const isAgent = message.role === 'agent'
  const isAI = message.role === 'ai'
  const isSystem = message.role === 'system'
  
  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatDateString = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const handleImageClick = () => {
    if (message.mediaType === 'image' && message.mediaUrl) {
      setShowImagePopup(true)
    }
  }

  const handleDocumentClick = () => {
    if (message.mediaType === 'document' && message.mediaUrl) {
      // Abrir documento em nova aba
      const fullUrl = message.mediaUrl.startsWith('http') 
        ? message.mediaUrl 
        : `${window.location.origin}${message.mediaUrl}`
      window.open(fullUrl, '_blank')
    }
  }

  // Mensagens do atendente/agente ficam do lado direito
  const isFromAgent = message.role === 'agent' || message.role === 'ai'
  const isFromCustomer = message.role === 'user'
  
  const isFailed = message.status === 'failed'
  
  // Avatar e nome baseado no tipo de mensagem
  let avatar = avatarUrl
  let displayName = contactName || 'Cliente'
  
  if (isFromCustomer) {
    // Para clientes, usar o avatar e nome fornecidos
    displayName = contactName || 'Cliente'
  } else if (isAI) {
    // Para IA, usar avatar padrão e nome específico
    displayName = 'IA Assistente'
  } else if (isAgent) {
    // Para agentes humanos, mostrar o nome do usuário se disponível
    displayName = message.agentName || message.userName || 'Atendente'
  }
  
  const dateObj = new Date(message.timestamp)

  return (
    <>
      {isFirstOfDay && (
        <div className="flex justify-center my-4">
          <div className="bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs px-3 py-1 rounded-full">
            {formatDate(dateObj)}
          </div>
        </div>
      )}
      
      {'replyToContent' in message && message.replyToContent && (
        <div className="mb-1 px-2 py-1 rounded bg-blue-100 border-l-4 border-blue-400 text-xs text-blue-900">
          <span className="font-semibold">Respondendo:</span> {message.replyToContent}
        </div>
      )}
      
      <div className={`flex gap-2 mb-3 ${isFromAgent ? 'justify-end' : 'justify-start'}`}>
        {!isFromAgent && showAvatar && (
          <Avatar className="w-8 h-8 flex-shrink-0">
            <AvatarImage src={avatar} />
            <AvatarFallback className="text-xs">
              {isAI ? '🤖' : isSystem ? '⚙️' : isAgent ? '👤' : (contactName?.charAt(0) || '?')}
            </AvatarFallback>
          </Avatar>
        )}
        
        <div className={`max-w-[70%] ${isFromAgent ? 'items-end' : 'items-start'} flex flex-col`}>
          {!isFromAgent && showName && (
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1 px-1">
              {isAI ? 'IA Assistente' : isAgent ? 'Atendente' : isSystem ? 'Sistema' : contactName}
            </div>
          )}
          
          <div 
            className={`relative group rounded-2xl px-3 py-2 max-w-full ${
              isFromAgent 
                ? 'bg-blue-500 text-white rounded-br-md' 
                : isFromCustomer
                  ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-bl-md'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-bl-md'
            }`}
            onMouseEnter={() => setShowActions(true)}
            onMouseLeave={() => setShowActions(false)}
          >
            {/* Conteúdo da mensagem */}
            <div className="space-y-2">
              {/* Imagem */}
              {message.mediaType === 'image' && message.mediaUrl && (
                <div className="space-y-1">
                  <img 
                    src={message.mediaUrl.startsWith('http') ? message.mediaUrl : `${window.location.origin}${message.mediaUrl}`}
                    alt="Imagem enviada"
                    className="max-w-48 max-h-48 rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={handleImageClick}
                    onError={(e) => {
                      console.error('Erro ao carregar imagem:', message.mediaUrl)
                      e.currentTarget.style.display = 'none'
                    }}
                  />
                  {message.mediaInfo?.caption && (
                    <p className="text-xs opacity-75">
                      {message.mediaInfo.caption}
                    </p>
                  )}
                </div>
              )}
              
              {/* Áudio */}
              {message.mediaType === 'audio' && message.mediaUrl && (
                <div className="space-y-1">
                  <audio controls className="max-w-48">
                    <source 
                      src={message.mediaUrl.startsWith('http') ? message.mediaUrl : `${window.location.origin}${message.mediaUrl}`}
                      type={message.mediaInfo?.mimeType || 'audio/mpeg'} 
                    />
                    Seu navegador não suporta áudio.
                  </audio>
                </div>
              )}
              
              {/* Vídeo */}
              {message.mediaType === 'video' && message.mediaUrl && (
                <div className="space-y-1">
                  <video controls className="max-w-48 max-h-48 rounded-lg">
                    <source 
                      src={message.mediaUrl.startsWith('http') ? message.mediaUrl : `${window.location.origin}${message.mediaUrl}`}
                    />
                  </video>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}