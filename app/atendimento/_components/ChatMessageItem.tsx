import { ChatMessage, ChatStatus } from '@/lib/models'
import { cn } from '@/lib/utils'
import { Check, CheckCheck, Clock, AlertCircle } from 'lucide-react'
import { format, isToday, isYesterday } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

interface ChatMessageItemProps {
  message: ChatMessage
  avatarUrl?: string
  contactName?: string
  showAvatar?: boolean
  showName?: boolean
  isFirstOfDay?: boolean
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

export function ChatMessageItem({ message, avatarUrl, contactName, showAvatar = true, showName = true, isFirstOfDay = false }: ChatMessageItemProps) {
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
        isFromCustomer ? "justify-end" : "justify-start"
      )}>
        {/* Avatar do lado esquerdo para empresa (IA/Agente) */}
        {isFromCompany && showAvatar && (
          <Avatar className="w-8 h-8">
            <AvatarImage src={avatar} />
            <AvatarFallback>
              {isAI ? '🤖' : displayName.charAt(0)}
            </AvatarFallback>
          </Avatar>
        )}
        
        <div className={cn(
          "rounded-lg px-3 py-2 max-w-lg lg:max-w-xl shadow-sm",
          isFromCustomer 
            ? "bg-blue-500 text-white" 
            : isAI 
            ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 border border-green-200 dark:border-green-700"
            : "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100",
          isFailed && "border border-red-500"
        )}>
          {/* Mostrar nome para mensagens da empresa */}
          {showName && isFromCompany && (
            <div className={cn(
              "text-xs font-semibold mb-1",
              isAI ? "text-green-700 dark:text-green-300" : "text-gray-700 dark:text-gray-300"
            )}>
              {displayName}
            </div>
          )}
          
          <p className="text-sm" style={{ whiteSpace: 'pre-wrap' }}>
            {message.content}
          </p>
          
          <div className="flex items-center justify-end gap-2 mt-1">
            <span className={cn(
              "text-xs",
              isFromCustomer ? "text-blue-100" : isAI ? "text-green-600 dark:text-green-400" : "text-gray-500 dark:text-gray-400"
            )}>
              {format(dateObj, 'HH:mm')}
            </span>
            {isFromCustomer && <MessageStatus status={message.status} />}
            {isFailed && (
              <span className="text-xs text-red-500 ml-2">Erro</span>
            )}
          </div>
        </div>
        
        {/* Avatar do lado direito para cliente */}
        {isFromCustomer && showAvatar && (
          <Avatar className="w-8 h-8">
            <AvatarImage src={avatar} />
            <AvatarFallback>{displayName.charAt(0)}</AvatarFallback>
          </Avatar>
        )}
      </div>
    </>
  )
} 