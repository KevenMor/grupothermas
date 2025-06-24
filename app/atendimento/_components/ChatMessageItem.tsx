import { ChatMessage, ChatStatus } from '@/lib/models'
import { cn } from '@/lib/utils'
import { Check, CheckCheck, Clock, AlertCircle, Reply, Edit, Trash2, Info, MoreVertical } from 'lucide-react'
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
  const [showActions, setShowActions] = useState(false)
  // Mensagens da empresa (IA ou agente) ficam do lado esquerdo
  const isFromCompany = message.role === 'agent' || message.role === 'ai'
  const isFromCustomer = message.role === 'user'
  const isAI = message.role === 'ai'
  const isAgent = message.role === 'agent'
  
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
        <div className="flex justify-center my-2">
          <span className="bg-gray-200 dark:bg-gray-700 text-xs text-gray-600 dark:text-gray-300 rounded-full px-3 py-1">
            {formatDate(dateObj)}
          </span>
        </div>
      )}
      <div className={cn(
        "flex items-end gap-2",
        isFromCustomer ? "justify-start" : "justify-end"
      )}>
        {/* Avatar do lado esquerdo para cliente */}
        {isFromCustomer && showAvatar && (
          <Avatar className="w-8 h-8">
            <AvatarImage src={avatar} />
            <AvatarFallback>{displayName.charAt(0)}</AvatarFallback>
          </Avatar>
        )}
        
        <div 
          className={cn(
            "rounded-lg px-3 py-2 max-w-lg lg:max-w-xl shadow-sm relative group",
            isFromCustomer 
              ? "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100" 
                          : isAI 
            ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 border border-green-200 dark:border-green-700"
            : "bg-blue-500 text-white",
            isFailed && "border border-red-500"
          )}
          onMouseEnter={() => setShowActions(true)}
          onMouseLeave={() => setShowActions(false)}
        >
          {/* Menu de ações */}
          {showActions && (
            <div className={cn(
              "absolute top-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity",
              isFromCustomer ? "-right-20" : "-left-20"
            )}>
              <Button
                variant="ghost"
                size="icon"
                className="w-6 h-6 bg-white dark:bg-gray-800 shadow-md hover:bg-gray-100 dark:hover:bg-gray-700"
                onClick={() => onReply?.(message)}
                title="Responder"
              >
                <Reply className="w-3 h-3 text-gray-600 dark:text-gray-400" />
              </Button>
              
              <Button
                variant="ghost"
                size="icon"
                className="w-6 h-6 bg-white dark:bg-gray-800 shadow-md hover:bg-gray-100 dark:hover:bg-gray-700"
                onClick={() => onInfo?.(message)}
                title="Informações"
              >
                <Info className="w-3 h-3 text-gray-600 dark:text-gray-400" />
              </Button>
              
              {isFromCompany && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="w-6 h-6 bg-white dark:bg-gray-800 shadow-md hover:bg-gray-100 dark:hover:bg-gray-700"
                    onClick={() => onEdit?.(message)}
                    title="Editar"
                  >
                    <Edit className="w-3 h-3 text-gray-600 dark:text-gray-400" />
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="icon"
                    className="w-6 h-6 bg-white dark:bg-gray-800 shadow-md hover:bg-red-100 dark:hover:bg-red-900/20"
                    onClick={() => onDelete?.(message.id)}
                    title="Excluir"
                  >
                    <Trash2 className="w-3 h-3 text-red-600 dark:text-red-400" />
                  </Button>
                </>
              )}
            </div>
          )}

          {/* Mostrar nome para mensagens da empresa */}
          {showName && isFromCompany && (
            <div className={cn(
              "text-xs font-semibold mb-1",
              isAI ? "text-green-700 dark:text-green-300" : "text-blue-100"
            )}>
              {displayName}
            </div>
          )}
          
          {/* Renderizar conteúdo baseado no tipo */}
          {message.mediaType ? (
            <div className="space-y-2">
              {/* Renderizar mídia baseado no tipo */}
              {message.mediaType === 'image' && message.mediaUrl && (
                <div className="space-y-1">
                  <img 
                    src={message.mediaUrl} 
                    alt={message.mediaInfo?.caption || 'Imagem'} 
                    className="max-w-48 max-h-48 rounded-lg object-cover cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => {
                      // Criar popup para visualizar imagem
                      const popup = window.open('', '_blank', 'width=800,height=600,scrollbars=yes,resizable=yes')
                      if (popup) {
                        popup.document.write(`
                          <html>
                            <head><title>Visualizar Imagem</title></head>
                            <body style="margin:0; padding:20px; background:#000; display:flex; justify-content:center; align-items:center; min-height:100vh;">
                              <img src="${message.mediaUrl}" style="max-width:100%; max-height:100%; object-fit:contain;" />
                            </body>
                          </html>
                        `)
                        popup.document.close()
                      }
                    }}
                  />
                  {message.mediaInfo?.caption && (
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {message.mediaInfo.caption}
                    </p>
                  )}
                </div>
              )}
              
              {message.mediaType === 'audio' && message.mediaUrl && (
                <div className="space-y-1">
                  <audio controls className="max-w-48">
                    <source src={message.mediaUrl} type={message.mediaInfo?.mimeType || 'audio/mpeg'} />
                    Seu navegador não suporta áudio.
                  </audio>
                </div>
              )}
              
              {message.mediaType === 'video' && message.mediaUrl && (
                <div className="space-y-1">
                  <video controls className="max-w-48 max-h-48 rounded-lg">
                    <source src={message.mediaUrl} type={message.mediaInfo?.mimeType || 'video/mp4'} />
                    Seu navegador não suporta vídeo.
                  </video>
                  {message.mediaInfo?.caption && (
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {message.mediaInfo.caption}
                    </p>
                  )}
                </div>
              )}
              
              {message.mediaType === 'document' && message.mediaUrl && (
                <div className="flex items-center gap-2 p-2 border rounded-lg bg-gray-50 dark:bg-gray-800">
                  <div className="w-8 h-8 bg-red-100 dark:bg-red-900/30 rounded flex items-center justify-center">
                    <span className="text-xs font-bold text-red-600 dark:text-red-400">PDF</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {message.mediaInfo?.title || 'Documento'}
                    </p>
                    {message.mediaInfo?.mimeType && (
                      <p className="text-xs text-gray-500">
                        {message.mediaInfo.mimeType}
                      </p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => window.open(message.mediaUrl, '_blank')}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    Abrir
                  </Button>
                </div>
              )}
              
              {message.mediaType === 'contact' && message.mediaInfo && (
                <div className="flex items-center gap-2 p-2 border rounded-lg bg-gray-50 dark:bg-gray-800">
                  <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                    <span className="text-sm">👤</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      {message.mediaInfo.displayName}
                    </p>
                    <p className="text-xs text-gray-500">Contato compartilhado</p>
                  </div>
                </div>
              )}
              
              {message.mediaType === 'location' && message.mediaInfo && (
                <div className="space-y-1">
                  <div className="flex items-center gap-2 p-2 border rounded-lg bg-gray-50 dark:bg-gray-800">
                    <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                      <span className="text-sm">📍</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Localização</p>
                      {message.mediaInfo.address && (
                        <p className="text-xs text-gray-500">{message.mediaInfo.address}</p>
                      )}
                    </div>
                    {message.mediaInfo.latitude && message.mediaInfo.longitude && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open(`https://maps.google.com/?q=${message.mediaInfo?.latitude},${message.mediaInfo?.longitude}`, '_blank')}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        Ver no Maps
                      </Button>
                    )}
                  </div>
                </div>
              )}
              
              {/* Texto da mensagem (se houver) */}
              {message.content && !message.content.startsWith('📷') && !message.content.startsWith('🎤') && !message.content.startsWith('🎬') && !message.content.startsWith('📄') && !message.content.startsWith('👤') && !message.content.startsWith('📍') && (
                <p className="text-sm" style={{ whiteSpace: 'pre-wrap' }}>
                  {message.content}
                </p>
              )}
            </div>
          ) : (
            <p className="text-sm" style={{ whiteSpace: 'pre-wrap' }}>
              {message.content}
            </p>
          )}
          
          <div className="flex items-center justify-end gap-2 mt-1">
            <span className={cn(
              "text-xs",
              isFromCustomer ? "text-gray-500 dark:text-gray-400" : isAI ? "text-green-600 dark:text-green-400" : "text-blue-100"
            )}>
              {format(dateObj, 'HH:mm')}
            </span>
            {isFromCompany && <MessageStatus status={message.status} />}
            {isFailed && (
              <span className="text-xs text-red-500 ml-2">Erro</span>
            )}
          </div>
        </div>
        
        {/* Avatar do lado direito para empresa (IA/Agente) */}
        {isFromCompany && showAvatar && (
          <Avatar className="w-8 h-8">
            <AvatarImage src={avatar} />
            <AvatarFallback>
              {isAI ? '🤖' : displayName.charAt(0)}
            </AvatarFallback>
          </Avatar>
        )}
      </div>
    </>
  )
} 