import { ChatMessage, ChatStatus } from '@/lib/models'
import { cn } from '@/lib/utils'
import { Check, CheckCheck, Clock, AlertCircle, Reply, Edit, Trash2, Info, MoreVertical, FileText, ExternalLink, User, MapPin, X, Play, Pause, Loader2 } from 'lucide-react'
import { format, isToday, isYesterday } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { useState, useEffect, useRef, useMemo, memo } from 'react'
import { MessageReactions } from '@/components/MessageReactions'
import { ReactionPicker } from '@/components/ReactionPicker'

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
  onReaction?: (messageId: string, emoji: string) => void
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

export function ChatMessageItemComponent({ message, avatarUrl, contactName, showAvatar = true, showName = true, isFirstOfDay = false, onReply, onEdit, onDelete, onInfo, onReaction, messages }: ChatMessageItemProps) {
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

  // Função para renderizar texto com quebras de linha como <br />
  const renderMessageWithBreaks = (text: string) =>
    text.split(/\r?\n/).map((line, idx, arr) => (
      <span key={idx}>
        {line}
        {idx < arr.length - 1 && <br />}
      </span>
    ))

  // Obter URL completa para mídia
  const getFullUrl = (url?: string) => {
    if (!url) return ''
    if (url.startsWith('http')) return url
    if (url.startsWith('/api/media/')) return `${window.location.origin}${url}`
    return `${window.location.origin}/api/media/${encodeURIComponent(url)}`
  }

  // Função para validar URL de mídia
  const validateMediaUrl = async (url: string): Promise<boolean> => {
    try {
      const fullUrl = getFullUrl(url)
      const response = await fetch(fullUrl, { method: 'HEAD' })
      return response.ok
    } catch (error) {
      console.error('Erro ao validar URL de mídia:', url, error)
      return false
    }
  }

  // Função para tratar erro de carregamento de mídia
  const handleMediaError = (mediaType: string, url: string, element: HTMLElement) => {
    console.error(`Erro ao carregar ${mediaType}:`, url)
    
    // Log detalhado para troubleshooting
    console.log('Detalhes do erro:', {
      mediaType,
      originalUrl: url,
      fullUrl: getFullUrl(url),
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      element: element.tagName
    })
    
    // Ocultar elemento com erro
    element.style.display = 'none'
    
    // Mostrar mensagem de erro amigável
    const errorDiv = document.createElement('div')
    errorDiv.className = 'p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg'
    errorDiv.innerHTML = `
      <div class="flex items-center gap-2 text-red-700 dark:text-red-300">
        <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path>
        </svg>
        <span class="text-sm">Erro ao carregar ${mediaType}</span>
      </div>
      <p class="text-xs text-red-600 dark:text-red-400 mt-1">
        O arquivo pode ter sido removido ou a URL está inválida.
      </p>
    `
    
    element.parentNode?.insertBefore(errorDiv, element.nextSibling)
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

  // Log temporário para debug
  if (typeof window !== 'undefined') {
    console.debug('[ChatMessageItem] Mensagem recebida:', message)
  }
  // Sempre renderizar o balão, mesmo se não houver texto
  const isEmptyText = !message.content || message.content.trim() === '' || message.content === '[Mensagem sem texto]';

  return (
    <>
      {isFirstOfDay && (
        <div className="flex justify-center my-6">
          <div className="bg-blue-50 dark:bg-gray-800 text-blue-700 dark:text-gray-200 text-xs px-4 py-1 rounded-full shadow-sm font-semibold">
            {formatDate(dateObj)}
          </div>
        </div>
      )}
      {/* Balão da mensagem principal */}
      <div className={`flex gap-2 mb-2 ${isFromAgent ? 'justify-end' : isFromCustomer ? 'justify-start' : 'justify-center'}`} id={`msg-${message.id}`}>
        {/* Avatar apenas para cliente */}
        {!isFromAgent && isFromCustomer && showAvatar && (
          <Avatar className="w-8 h-8 flex-shrink-0 mt-auto">
            <AvatarImage src={avatar} />
            <AvatarFallback className="text-xs">
              {isAI ? '🤖' : isSystem ? '⚙️' : isAgent ? '👤' : (contactName?.charAt(0) || '?')}
            </AvatarFallback>
          </Avatar>
        )}
        <div className={`max-w-[70%] flex flex-col ${isFromAgent ? 'items-end' : isFromCustomer ? 'items-start' : 'items-center'} w-full`}>
          {/* Balão visual */}
          <div 
            className={`relative group px-4 py-3 max-w-full rounded-2xl shadow-sm
              ${isFromAgent ? 'bg-blue-600 text-white rounded-br-md' :
                isFromCustomer ? 'bg-white text-[#2563eb] border border-[#dbeafe] rounded-bl-md' :
                'bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-100 border border-gray-200 dark:border-gray-700 rounded-xl text-center'}
              ${isSystem ? 'mx-auto' : ''}
            `}
            onMouseEnter={() => setShowActions(true)}
            onMouseLeave={() => setShowActions(false)}
            style={{ minWidth: 80 }}
          >
            {/* Nome em negrito no topo para sistema/atendente */}
            {(!isFromCustomer && (isAgent || isAI || isSystem)) && (
              <div className={`font-bold text-sm mb-1 ${isFromAgent ? 'text-white' : 'text-gray-800 dark:text-gray-100'} text-left`}>
                {displayName}
              </div>
            )}
            {/* Conteúdo da mensagem */}
            <div className="space-y-2">
              {/* Texto principal */}
              {(!message.mediaType) && (
                <div className={isFromAgent ? 'text-white' : 'text-black'}>
                  {isEmptyText
                    ? <span className="italic opacity-60">Mensagem em branco</span>
                    : renderMessageWithBreaks(message.content || '')}
                </div>
              )}
              {/* Imagem */}
              {message.mediaType === 'image' && message.mediaUrl && (
                <div className="space-y-1">
                  <img 
                    src={getFullUrl(message.mediaUrl)}
                    alt="Imagem enviada"
                    className="max-w-48 max-h-48 rounded-lg cursor-pointer hover:opacity-90 transition-opacity border border-gray-300"
                    onClick={handleImageClick}
                    onError={(e) => {
                      handleMediaError('imagem', message.mediaUrl!, e.currentTarget)
                    }}
                    onLoad={() => {
                      console.log('Imagem carregada com sucesso:', message.mediaUrl)
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
                        onError={(e) => {
                          console.error('Erro ao carregar imagem no popup:', message.mediaUrl)
                          e.currentTarget.style.display = 'none'
                          alert('Erro ao carregar imagem. Tente novamente.')
                        }}
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
                          handleMediaError('documento', message.mediaUrl!, e.currentTarget)
                        }}
                        onLoad={() => {
                          console.log('Documento carregado com sucesso:', message.mediaUrl)
                        }}
                      />
                    </div>
                  </div>
                </div>
              )}
              {/* Áudio - Layout customizado estilo WhatsApp */}
              {message.mediaType === 'audio' && message.mediaUrl && (
                <div className="audio-msg-box flex items-center gap-3 p-3 rounded-2xl min-w-[200px] bg-white shadow border border-gray-200 relative">
                  {/* Menu de opções (três pontinhos SVG) */}
                  <div className="audio-menu absolute top-2 right-2 cursor-pointer opacity-80 hover:opacity-100">
                    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                      <circle cx="11" cy="5.5" r="1.5" fill="#888"/>
                      <circle cx="11" cy="11" r="1.5" fill="#888"/>
                      <circle cx="11" cy="16.5" r="1.5" fill="#888"/>
                    </svg>
                  </div>
                  {/* Player de áudio */}
                  <audio controls className="w-full max-w-xs">
                    <source src={getFullUrl(message.mediaUrl)} type="audio/mp3" />
                    Seu navegador não suporta áudio.
                  </audio>
                  {/* Data/hora do envio */}
                  <div className="flex flex-col items-end ml-2">
                    <span className="text-xs text-gray-400">{formatDateString(message.timestamp)}</span>
                    <span className="text-xs text-gray-400">{formatTime(message.timestamp)}</span>
                  </div>
                </div>
              )}
            </div>
            {/* Hora discreta abaixo do balão */}
            <div className="flex justify-end mt-2">
              <span className={`text-xs flex items-center gap-1 ${isFromAgent ? 'text-white/80' : 'text-gray-400 dark:text-gray-500'}`}> 
                <MessageStatus status={message.status} />
                {['delivered','read'].includes(message.status) && message.statusTimestamp
                  ? formatTime(message.statusTimestamp)
                  : formatTime(message.timestamp)}
              </span>
            </div>
            {/* Reações da mensagem */}
            {message.reactions && message.reactions.length > 0 && (
              <MessageReactions
                reactions={message.reactions}
                isFromAgent={isFromAgent}
                className="mt-1"
              />
            )}
            {/* Botão de reação (apenas para mensagens do cliente) */}
            {isFromCustomer && onReaction && (
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <ReactionPicker
                  onReactionSelect={(emoji) => onReaction(message.id, emoji)}
                  className="bg-white/90 dark:bg-gray-800/90 shadow-lg"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

// Otimizar com React.memo para evitar re-renderizações desnecessárias
export const ChatMessageItem = memo(ChatMessageItemComponent, (prevProps, nextProps) => {
  // Comparação customizada para determinar se deve re-renderizar
  return (
    prevProps.message.id === nextProps.message.id &&
    prevProps.message.content === nextProps.message.content &&
    prevProps.message.status === nextProps.message.status &&
    prevProps.message.timestamp === nextProps.message.timestamp &&
    prevProps.avatarUrl === nextProps.avatarUrl &&
    prevProps.contactName === nextProps.contactName &&
    prevProps.isFirstOfDay === nextProps.isFirstOfDay &&
    JSON.stringify(prevProps.message.reactions) === JSON.stringify(nextProps.message.reactions)
  )
}) 