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
      
      {(message as any).replyToContent && (
        <div className="mb-1 px-2 py-1 rounded bg-blue-100 border-l-4 border-blue-400 text-xs text-blue-900">
          <span className="font-semibold">Respondendo:</span> {(message as any).replyToContent}
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
            {/* Menu de ações */}
            {showActions && (
              <div className={`absolute -top-9 ${isFromAgent ? 'right-2' : 'left-2'} flex gap-1 z-30 bg-white/90 dark:bg-gray-800/90 rounded shadow p-1`}>
                <Button size="icon" variant="ghost" onClick={() => onReply && onReply(message)} title="Responder"><Reply className="w-4 h-4" /></Button>
                {isFromAgent && (
                  <Button size="icon" variant="ghost" onClick={() => onEdit && onEdit(message)} title="Editar"><Edit className="w-4 h-4" /></Button>
                )}
                {isFromAgent && (
                  <Button size="icon" variant="ghost" onClick={() => onDelete && onDelete(message.id)} title="Excluir"><Trash2 className="w-4 h-4" /></Button>
                )}
                <Button size="icon" variant="ghost" onClick={() => onInfo && onInfo(message)} title="Info"><Info className="w-4 h-4" /></Button>
              </div>
            )}
            {/* Conteúdo da mensagem */}
            <div className="space-y-2">
              {/* Imagem */}
              {message.mediaType === 'image' && message.mediaUrl && (
                <div className="space-y-1">
                  <img 
                    src={message.mediaUrl.startsWith('http') ? message.mediaUrl : `${window.location.origin}${message.mediaUrl}`}
                    alt="Imagem enviada"
                    className="max-w-48 max-h-48 rounded-lg cursor-pointer hover:opacity-90 transition-opacity border border-gray-300"
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
                  {/* Popup de imagem */}
                  {showImagePopup && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70" onClick={() => setShowImagePopup(false)}>
                      <img
                        src={message.mediaUrl.startsWith('http') ? message.mediaUrl : `${window.location.origin}${message.mediaUrl}`}
                        alt="Imagem ampliada"
                        className="max-w-[90vw] max-h-[90vh] rounded-lg shadow-lg border-4 border-white"
                        onClick={e => e.stopPropagation()}
                      />
                      <Button className="absolute top-4 right-4 z-60" size="icon" variant="ghost" onClick={() => setShowImagePopup(false)}>
                        <X className="w-6 h-6 text-white" />
                      </Button>
                    </div>
                  )}
                </div>
              )}
              {/* Documento */}
              {message.mediaType === 'document' && message.mediaUrl && (
                <div className="flex items-center gap-2 p-2 bg-gray-100 dark:bg-gray-700 rounded cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600" onClick={handleDocumentClick}>
                  <FileText className="w-6 h-6 text-gray-500" />
                  <div className="flex flex-col">
                    <span className="font-medium text-sm text-blue-700 underline">{message.mediaInfo?.filename || 'Documento'}</span>
                    <span className="text-xs text-gray-500">Clique para abrir</span>
                  </div>
                </div>
              )}
              {/* Áudio */}
              {message.mediaType === 'audio' && message.mediaUrl && (
                <div className="flex items-center gap-2 p-2 bg-gray-100 dark:bg-gray-700 rounded">
                  <audio controls src={message.mediaUrl.startsWith('http') ? message.mediaUrl : `${window.location.origin}${message.mediaUrl}`}
                    className="max-w-full"
                  >
                    Seu navegador não suporta o elemento de áudio.
                  </audio>
                  <span className="text-xs text-gray-400 ml-1">Áudio enviado</span>
                </div>
              )}
              {/* Conteúdo textual */}
              <div>
                {message.content && !message.mediaType ? message.content : null}
                {!message.content && !message.mediaType ? <span style={{color: 'red'}}>[Sem conteúdo]</span> : null}
                {/* Para mídia, mostrar label amigável */}
                {message.mediaType === 'image' && <span className="text-xs text-gray-400 ml-1">Imagem enviada</span>}
                {message.mediaType === 'document' && <span className="text-xs text-gray-400 ml-1">Documento enviado</span>}
                {message.mediaType === 'audio' && <span className="text-xs text-gray-400 ml-1">Áudio enviado</span>}
                {message.mediaType === 'video' && <span className="text-xs text-gray-400 ml-1">Vídeo enviado</span>}
              </div>
            </div>
            {/* Status da mensagem */}
            <div className="flex justify-end mt-1">
              <span className="text-xs text-gray-300 dark:text-gray-500 flex items-center gap-1">
                <MessageStatus status={message.status} />
                {formatTime(message.timestamp)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}