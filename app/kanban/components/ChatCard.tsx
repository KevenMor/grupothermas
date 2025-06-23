'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface Chat {
  id: string
  customerName: string
  customerPhone: string
  lastMessage: string
  unreadCount: number
  status: 'ai' | 'waiting' | 'human'
  assignedTo?: string
  updatedAt: Date
  avatar?: string
  workspaceId: string
}

interface ChatCardProps {
  chat: Chat
  onClick?: () => void
  isDragging?: boolean
}

export function ChatCard({ chat, onClick, isDragging }: ChatCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: chat.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  // Status colors and icons
  const statusConfig = {
    ai: { color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200', icon: '🤖' },
    waiting: { color: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200', icon: '⏳' },
    human: { color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200', icon: '👤' }
  }

  const config = statusConfig[chat.status]

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        "bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 cursor-pointer transition-all duration-200 hover:shadow-md hover:border-thermas-blue-300 dark:hover:border-thermas-blue-600",
        (isDragging || isSortableDragging) && "opacity-50 shadow-lg scale-105",
        "touch-manipulation select-none" // Mobile optimizations
      )}
      onClick={onClick}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <Avatar className="h-10 w-10 flex-shrink-0">
            <AvatarImage src={chat.avatar} alt={chat.customerName} />
            <AvatarFallback className="text-sm">
              {chat.customerName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-gray-900 dark:text-white text-sm truncate">
              {chat.customerName}
            </h4>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
              {chat.customerPhone}
            </p>
          </div>
        </div>

        {chat.unreadCount > 0 && (
          <Badge variant="destructive" className="ml-2 flex-shrink-0 min-w-[20px] h-5 text-xs">
            {chat.unreadCount > 99 ? '99+' : chat.unreadCount}
          </Badge>
        )}
      </div>

      {/* Last Message */}
      <div className="mb-3">
        <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2 leading-relaxed">
          {chat.lastMessage}
        </p>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between">
        <div className={cn("flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium", config.color)}>
          <span>{config.icon}</span>
          <span className="capitalize">{chat.status === 'ai' ? 'IA' : chat.status === 'waiting' ? 'Espera' : 'Humano'}</span>
        </div>
        
        <time className="text-xs text-gray-400 dark:text-gray-500">
          {formatDistanceToNow(chat.updatedAt, { 
            addSuffix: true, 
            locale: ptBR 
          })}
        </time>
      </div>

      {/* Drag handle indicator (mobile) */}
      <div className="md:hidden absolute top-2 right-2 text-gray-400">
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
        </svg>
      </div>
    </div>
  )
} 