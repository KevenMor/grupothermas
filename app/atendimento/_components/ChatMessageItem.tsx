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
  const isAgent = message.role === 'agent'
  const isFailed = message.status === 'failed'
  const avatar = isAgent ? '/agent-avatar.png' : avatarUrl || '/user-avatar.png'
  const displayName = isAgent ? 'Você' : contactName || 'Cliente'
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
        isAgent ? "justify-end" : "justify-start"
      )}>
        {!isAgent && showAvatar && (
          <Avatar className="w-8 h-8">
            <AvatarImage src={avatar} />
            <AvatarFallback>{displayName.charAt(0)}</AvatarFallback>
          </Avatar>
        )}
        <div className={cn(
          "rounded-lg px-3 py-2 max-w-lg lg:max-w-xl shadow-sm",
          isAgent 
            ? "bg-blue-500 text-white" 
            : "bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100",
          isFailed && "border border-red-500"
        )}>
          {showName && !isAgent && (
            <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">{displayName}</div>
          )}
          <p className="text-sm" style={{ whiteSpace: 'pre-wrap' }}>
            {message.content}
          </p>
          <div className="flex items-center justify-end gap-2 mt-1">
            <span className={cn(
              "text-xs",
              isAgent ? "text-blue-100" : "text-gray-500 dark:text-gray-400"
            )}>
              {format(dateObj, 'HH:mm')}
            </span>
            {isAgent && <MessageStatus status={message.status} />}
            {isFailed && (
              <span className="text-xs text-red-500 ml-2">Erro</span>
            )}
          </div>
        </div>
        {isAgent && showAvatar && (
          <Avatar className="w-8 h-8">
            <AvatarImage src={avatar} />
            <AvatarFallback>{displayName.charAt(0)}</AvatarFallback>
          </Avatar>
        )}
      </div>
    </>
  )
} 