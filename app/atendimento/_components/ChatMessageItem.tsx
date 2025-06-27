import { ChatMessage, ChatStatus } from '@/lib/models'
import { cn } from '@/lib/utils'
import { Check, CheckCheck, Clock, AlertCircle, Reply, Edit, Trash2, Info, MoreVertical, FileText, ExternalLink, User, MapPin, X, Play, Pause } from 'lucide-react'
import { format, isToday, isYesterday } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { useState, useEffect, useRef, useMemo } from 'react'

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
  messages?: ChatMessage[]
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

export function ChatMessageItem({ message, avatarUrl, contactName, showAvatar = true, showName = true, isFirstOfDay = false, onReply, onEdit, onDelete, onInfo, messages }: ChatMessageItemProps) {
  const [showImagePopup, setShowImagePopup] = useState(false)
  const [showDocumentPopup, setShowDocumentPopup] = useState(false)
  const [showActions, setShowActions] = useState(false)
  const [showInfo, setShowInfo] = useState(false)
  const audioRef = useRef<HTMLAudioElement>(null)
  const [audioLoaded, setAudioLoaded] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [audioDuration, setAudioDuration] = useState(0)
  const [audioCurrentTime, setAudioCurrentTime] = useState(0)

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

  // Obter URL completa para mídia
  const getFullUrl = (url?: string) => {
    if (!url) return ''
    if (url.startsWith('data:')) return url
    return url.startsWith('http') ? url : `${window.location.origin}${url}`
  }

  // Não fazer autoplay - usuário controla reprodução manualmente
  
  // Controles de áudio
  const toggleAudioPlayback = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause()
      } else {
        audioRef.current.play()
      }
    }
  }

  const formatAudioTime = (seconds: number) => {
    if (!seconds || isNaN(seconds) || !isFinite(seconds)) {
      return '0:00'
    }
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handleImageClick = () => {
    if (message.mediaType === 'image' && message.mediaUrl) {
      setShowImagePopup(true)
    }
  }

  const handleDocumentClick = () => {
    if (message.mediaType === 'document' && message.mediaUrl) {
      // Verificar se é um PDF para mostrar no iframe
      const fileName = message.mediaInfo?.filename?.toLowerCase() || ''
      const isPdf = fileName.endsWith('.pdf') || 
                   (message.mediaInfo?.mimeType && message.mediaInfo.mimeType.includes('pdf'))
      
      if (isPdf) {
        setShowDocumentPopup(true)
      } else {
        // Para outros tipos de documentos, abrir em nova aba
        const fullUrl = getFullUrl(message.mediaUrl)
        console.log('Abrindo documento:', fullUrl)
        window.open(fullUrl, '_blank')
      }
    } else {
      console.error('Documento sem URL válida:', message)
      alert('Erro: Documento não encontrado ou URL inválida')
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

  // Mini-bubble de reply visual
  const handleReplyBubbleClick = () => {
    if (message.replyTo?.id && messages) {
      const el = document.getElementById(`msg-${message.replyTo.id}`)
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' })
        el.classList.add('ring-2', 'ring-blue-400')
        setTimeout(() => el.classList.remove('ring-2', 'ring-blue-400'), 1000)
      }
    }
  }

  return (
    <>
      {isFirstOfDay && (
        <div className="flex justify-center my-4">
          <div className="bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs px-3 py-1 rounded-full">
            {formatDate(dateObj)}
          </div>
        </div>
      )}
      
      {/* Balão da mensagem principal */}
      <div className={`flex gap-2 mb-3 ${isFromAgent ? 'justify-end' : 'justify-start'}`} id={`msg-${message.id}`}>
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
          
          {/* Mini-bubble de reply visual */}
          {message.replyTo && (
            <div
              className="mb-2 px-2 py-1 rounded bg-blue-100/80 dark:bg-blue-900/20 border-l-4 border-blue-500/80 dark:border-blue-400/70 text-xs shadow-sm flex flex-col gap-1 cursor-pointer hover:bg-blue-200/80 dark:hover:bg-blue-800/40 transition"
              aria-label="Mensagem citada"
              onClick={handleReplyBubbleClick}
            >
              <span className="flex items-center gap-1 font-semibold text-blue-700 dark:text-blue-200" style={{fontSize:'0.95em'}}>
                ↩
                {message.replyTo.author === 'agent' ? 'Você' : (contactName || 'Cliente')}
              </span>
              <span className="text-gray-700 dark:text-gray-200 truncate" style={{display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden'}}>
                {message.replyTo.text ? (message.replyTo.text.length > 45 ? message.replyTo.text.slice(0, 45) + '…' : message.replyTo.text) : 'Mensagem removida'}
              </span>
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
                    src={getFullUrl(message.mediaUrl)}
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
                        src={getFullUrl(message.mediaUrl)}
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
                    <span className="font-medium text-sm text-blue-700 dark:text-blue-300 underline">
                      {message.mediaInfo?.filename || 'Documento'}
                    </span>
                    <span className="text-xs text-gray-500">Clique para abrir</span>
                  </div>
                </div>
              )}
              {/* Popup de documento (PDF) */}
              {showDocumentPopup && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70" onClick={() => setShowDocumentPopup(false)}>
                  <div className="bg-white rounded-lg shadow-lg w-[90vw] h-[90vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center justify-between p-3 border-b">
                      <h3 className="font-semibold text-gray-800">
                        {message.mediaInfo?.filename || 'Documento'}
                      </h3>
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => window.open(getFullUrl(message.mediaUrl), '_blank')}
                        >
                          <ExternalLink className="w-4 h-4 mr-1" /> Abrir
                        </Button>
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          onClick={() => setShowDocumentPopup(false)}
                        >
                          <X className="w-5 h-5" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex-1 bg-gray-100">
                      <iframe 
                        src={getFullUrl(message.mediaUrl)} 
                        className="w-full h-full"
                        title={message.mediaInfo?.filename || 'Documento'}
                        onError={(e) => {
                          console.error('Erro ao carregar PDF:', message.mediaUrl)
                          e.currentTarget.style.display = 'none'
                          // Mostrar mensagem de erro
                          const errorDiv = document.createElement('div')
                          errorDiv.innerHTML = `
                            <div class="flex flex-col items-center justify-center h-full text-center p-4">
                              <p class="text-red-500 mb-2">Erro ao carregar PDF</p>
                              <p class="text-sm text-gray-600 mb-4">O documento pode não estar disponível ou a URL está inválida.</p>
                              <button onclick="window.open('${getFullUrl(message.mediaUrl)}', '_blank')" 
                                      class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
                                Tentar abrir em nova aba
                              </button>
                            </div>
                          `
                          e.currentTarget.parentNode?.appendChild(errorDiv)
                        }}
                      />
                    </div>
                  </div>
                </div>
              )}
              {/* Áudio - Layout customizado estilo WhatsApp */}
              {message.mediaType === 'audio' && message.mediaUrl && (
                <div className={`flex items-center gap-3 p-3 rounded-2xl min-w-[200px] ${
                  isFromAgent 
                    ? 'bg-blue-600/20' 
                    : 'bg-gray-200 dark:bg-gray-600'
                }`}>
                  {/* Botão Play/Pause */}
                  <Button
                    onClick={toggleAudioPlayback}
                    size="icon"
                    className={`w-10 h-10 rounded-full ${
                      isFromAgent 
                        ? 'bg-white/20 hover:bg-white/30 text-white' 
                        : 'bg-blue-500 hover:bg-blue-600 text-white'
                    }`}
                  >
                    {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
                  </Button>
                  
                  {/* Visualizador de onda sonora */}
                  <div className="flex-1 flex items-center gap-1">
                    {[12, 8, 16, 14, 10, 18, 16, 12, 14, 8, 16, 12].map((height, i) => (
                      <div
                        key={i}
                        className={`w-1 rounded-full ${
                          isFromAgent ? 'bg-white/40' : 'bg-gray-400'
                        }`}
                        style={{ height: `${height}px` }}
                      />
                    ))}
                  </div>
                  
                  {/* Duração */}
                  <span className={`text-xs font-mono ${
                    isFromAgent ? 'text-white/80' : 'text-gray-600 dark:text-gray-300'
                  }`}>
                    {isPlaying ? formatAudioTime(audioCurrentTime) : formatAudioTime(audioDuration || 0)}
                  </span>
                  
                  {/* Elemento audio oculto */}
                  <audio 
                    ref={audioRef}
                    src={getFullUrl(message.mediaUrl)}
                    onLoadedMetadata={() => {
                      setAudioLoaded(true)
                      if (audioRef.current && audioRef.current.duration) {
                        setAudioDuration(audioRef.current.duration)
                      }
                    }}
                    onDurationChange={() => {
                      if (audioRef.current && audioRef.current.duration) {
                        setAudioDuration(audioRef.current.duration)
                      }
                    }}
                    onTimeUpdate={() => {
                      if (audioRef.current) {
                        setAudioCurrentTime(audioRef.current.currentTime)
                      }
                    }}
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                    onEnded={() => {
                      setIsPlaying(false)
                      setAudioCurrentTime(0)
                    }}
                    onError={(e) => {
                      console.error('Erro ao carregar áudio:', message.mediaUrl, e);
                    }}
                    style={{ display: 'none' }}
                  />
                </div>
              )}
              {/* Conteúdo textual */}
              {message.content && !message.mediaType && (
                <div 
                  className="break-words"
                >
                  {message.content}
                </div>
              )}
              {!message.content && !message.mediaType ? <span style={{color: 'red'}}>[Sem conteúdo]</span> : null}
            </div>
            {/* Status da mensagem */}
            <div className="flex justify-end mt-1">
              <span className="text-xs text-gray-300 dark:text-gray-500 flex items-center gap-1">
                <MessageStatus status={message.status} />
                {['delivered','read'].includes(message.status) && message.statusTimestamp
                  ? formatTime(message.statusTimestamp)
                  : formatTime(message.timestamp)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  )
} 