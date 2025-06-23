import { ChatMessage, ChatStatus } from '@/lib/models'
import { cn } from '@/lib/utils'
import { Check, CheckCheck, Clock, AlertCircle } from 'lucide-react'
import { format } from 'date-fns'

interface ChatMessageItemProps {
  message: ChatMessage
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

export function ChatMessageItem({ message }: ChatMessageItemProps) {
  const isAgent = message.role === 'agent'

  return (
    <div className={cn(
      "flex items-end gap-2",
      isAgent ? "justify-end" : "justify-start"
    )}>
      <div className={cn(
        "rounded-lg px-3 py-2 max-w-lg lg:max-w-xl shadow-sm",
        isAgent 
          ? "bg-blue-500 text-white" 
          : "bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100"
      )}>
        <p className="text-sm" style={{ whiteSpace: 'pre-wrap' }}>
          {message.content}
        </p>
        <div className="flex items-center justify-end gap-2 mt-1">
          <span className={cn(
            "text-xs",
            isAgent ? "text-blue-100" : "text-gray-500 dark:text-gray-400"
          )}>
            {format(new Date(message.timestamp), 'HH:mm')}
          </span>
          {isAgent && <MessageStatus status={message.status} />}
        </div>
      </div>
    </div>
  )
} 