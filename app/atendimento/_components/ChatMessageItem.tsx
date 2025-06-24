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
      return <Clock className="w-4 h-4 text-gray-400" />
    case 'sent':
      return <Check className="w-4 h-4 text-gray-400" />
    case 'delivered':
      return <CheckCheck className="w-4 h-4 text-gray-400" />
    case 'read':
      return <CheckCheck className="w-4 h-4 text-blue-500" />
    case 'failed':
      return <AlertCircle className="w-4 h-4 text-red-500" />
    default:
      return null
  }
}

const formatDate = (date: Date) => {
  if (isToday(date)) return 'Hoje'
  if (isYesterday(date)) return 'Ontem'
  return format(date, "dd/MM/yyyy", { locale: ptBR })
}

export function ChatMessageItem({ message, avatarUrl, contactName, showAvatar = true, showName = true, isFirstOfDay = false, onReply, onEdit, onDelete, onInfo }: ChatMessageItemProps) {
  const [showImagePopup, setShowImagePopup] = useState(false)
  const [showActions, setShowActions] = useState(false)
  const [showInfo, setShowInfo] = useState(false)

  const isUser = message.role === 'user'
  const isAgent = message.role === 'agent'
  const isAI = message.role === 'ai' || message.role === 'assistant'
  
  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString('pt-BR', {
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

  // Mensagens da empresa (IA ou agente) ficam do lado esquerdo
  const isFromCompany = message.role === 'agent' || message.role === 'ai'
  const isFromCustomer = message.role === 'user'
  
  const isFailed = message.status === 'failed'
  
  // Avatar e nome baseado no tipo de mensagem
  const avatar = isFromCompany ? (isAI ? '/bot-avatar.png' : '/agent-avatar.png') : (avatarUrl || '/user-avatar.png')
  
  // Nome a ser exibido
  let displayName = contactName || 'Cliente'
  if (isAI) {
    displayName = '🤖 Assistente IA'
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
      
      <div className={`flex gap-2 mb-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
        {!isUser && showAvatar && (
          <Avatar className="w-8 h-8 flex-shrink-0">
            <AvatarImage src={avatar} />
            <AvatarFallback className="text-xs">
              {isAI ? '🤖' : (contactName?.charAt(0) || '?')}
            </AvatarFallback>
          </Avatar>
        )}
        
        <div className={`max-w-[70%] ${isUser ? 'order-first' : ''}`}>
          {!isUser && showName && (
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1 px-1">
              {isAI ? 'IA Assistente' : isAgent ? 'Atendente' : contactName}
            </div>
          )}
          
          <div 
            className={`relative group rounded-lg px-3 py-2 ${
              isUser 
                ? 'bg-blue-500 text-white' 
                : isAI 
                  ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-900 dark:text-purple-100'
                  : isAgent
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-900 dark:text-green-100'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100'
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
                      type={message.mediaInfo?.mimeType || 'video/mp4'} 
                    />
                    Seu navegador não suporta vídeo.
                  </video>
                  {message.mediaInfo?.caption && (
                    <p className="text-xs opacity-75">
                      {message.mediaInfo.caption}
                    </p>
                  )}
                </div>
              )}
              
              {/* Documento */}
              {message.mediaType === 'document' && message.mediaUrl && (
                <div className="space-y-1">
                  <div 
                    className="flex items-center gap-2 p-2 bg-white/10 rounded cursor-pointer hover:bg-white/20 transition-colors"
                    onClick={handleDocumentClick}
                  >
                    <FileText className="w-6 h-6 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {message.mediaInfo?.filename || message.mediaInfo?.title || 'Documento'}
                      </p>
                      {message.mediaInfo?.pageCount && (
                        <p className="text-xs opacity-75">
                          {message.mediaInfo.pageCount} páginas
                        </p>
                      )}
                    </div>
                    <ExternalLink className="w-4 h-4 flex-shrink-0" />
                  </div>
                </div>
              )}
              
              {/* Contato */}
              {message.mediaType === 'contact' && message.mediaInfo && (
                <div className="space-y-1">
                  <div className="flex items-center gap-2 p-2 bg-white/10 rounded">
                    <User className="w-6 h-6 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium">
                        {message.mediaInfo.displayName}
                      </p>
                      <p className="text-xs opacity-75">Contato compartilhado</p>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Localização */}
              {message.mediaType === 'location' && message.mediaInfo && (
                <div className="space-y-1">
                  <div className="flex items-center gap-2 p-2 bg-white/10 rounded">
                    <MapPin className="w-6 h-6 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium">Localização</p>
                      {message.mediaInfo.address && (
                        <p className="text-xs opacity-75">{message.mediaInfo.address}</p>
                      )}
                      <p className="text-xs opacity-75">
                        {message.mediaInfo.latitude}, {message.mediaInfo.longitude}
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Texto da mensagem */}
              {message.content && !message.content.startsWith('[') && (
                <p className="text-sm whitespace-pre-wrap break-words">
                  {message.content}
                </p>
              )}
            </div>
            
            {/* Timestamp */}
            <div className={`text-xs mt-1 ${isUser ? 'text-blue-100' : 'opacity-60'}`}>
              {formatTime(message.timestamp)}
              {message.status === 'sent' && isUser && (
                <span className="ml-1">✓</span>
              )}
              {message.status === 'delivered' && isUser && (
                <span className="ml-1">✓✓</span>
              )}
              {message.status === 'read' && isUser && (
                <span className="ml-1 text-blue-200">✓✓</span>
              )}
            </div>
            
            {/* Actions menu */}
            {showActions && (onReply || onEdit || onDelete || onInfo) && (
              <div className={`absolute top-0 ${isUser ? 'left-0 -translate-x-full' : 'right-0 translate-x-full'} flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity`}>
                {onReply && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="w-6 h-6 bg-white dark:bg-gray-800 shadow-md hover:bg-gray-50 dark:hover:bg-gray-700"
                    onClick={() => onReply(message)}
                    title="Responder"
                  >
                    <Reply className="w-3 h-3" />
                  </Button>
                )}
                
                {onEdit && !isUser && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="w-6 h-6 bg-white dark:bg-gray-800 shadow-md hover:bg-gray-50 dark:hover:bg-gray-700"
                    onClick={() => onEdit(message)}
                    title="Editar"
                  >
                    <Edit className="w-3 h-3" />
                  </Button>
                )}
                
                {onDelete && !isUser && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="w-6 h-6 bg-white dark:bg-gray-800 shadow-md hover:bg-gray-50 dark:hover:bg-gray-700 text-red-500 hover:text-red-600"
                    onClick={() => onDelete(message.id)}
                    title="Deletar"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                )}
                
                {onInfo && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="w-6 h-6 bg-white dark:bg-gray-800 shadow-md hover:bg-gray-50 dark:hover:bg-gray-700"
                    onClick={() => onInfo(message)}
                    title="Informações"
                  >
                    <Info className="w-3 h-3" />
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
        
        {isUser && showAvatar && (
          <Avatar className="w-8 h-8 flex-shrink-0">
            <AvatarImage src={avatar} />
            <AvatarFallback className="text-xs">
              {contactName?.charAt(0) || 'U'}
            </AvatarFallback>
          </Avatar>
        )}
      </div>
      
      {/* Popup de imagem */}
      {showImagePopup && message.mediaType === 'image' && message.mediaUrl && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 cursor-pointer"
          onClick={() => setShowImagePopup(false)}
        >
          <div className="relative max-w-4xl max-h-4xl p-4">
            <img 
              src={message.mediaUrl.startsWith('http') ? message.mediaUrl : `${window.location.origin}${message.mediaUrl}`}
              alt="Imagem ampliada"
              className="max-w-full max-h-full object-contain"
            />
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 text-white hover:bg-white/20"
              onClick={() => setShowImagePopup(false)}
            >
              <X className="w-6 h-6" />
            </Button>
          </div>
        </div>
      )}
    </>
  )
} 