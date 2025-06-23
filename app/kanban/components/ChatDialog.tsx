'use client'

import { useState, useEffect, useRef } from 'react'
import { X, Send, Paperclip, Phone, MoreVertical } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { collection, onSnapshot, query, orderBy, addDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/components/auth/AuthProvider'
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

interface Message {
  id: string
  chatId: string
  content: string
  type: 'text' | 'image' | 'audio'
  sender: 'customer' | 'agent' | 'ai'
  timestamp: Date
  agentName?: string
}

interface ChatDialogProps {
  chat: Chat
  onClose: () => void
  isEmbedded?: boolean
}

export function ChatDialog({ chat, onClose, isEmbedded = false }: ChatDialogProps) {
  const { user } = useAuth()
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Listen to messages in real-time
  useEffect(() => {
    // Se não há dados reais, usar mensagens mock
    if (!user) {
      const mockMessages: Message[] = [
        {
          id: '1',
          chatId: chat.id,
          content: 'Olá, gostaria de mais informações sobre os pacotes',
          type: 'text',
          sender: 'customer',
          timestamp: new Date(Date.now() - 3600000),
        },
        {
          id: '2',
          chatId: chat.id,
          content: 'Olá! Claro, posso te ajudar com informações sobre nossos pacotes. Temos várias opções disponíveis.',
          type: 'text',
          sender: 'ai',
          timestamp: new Date(Date.now() - 3500000),
        },
        {
          id: '3',
          chatId: chat.id,
          content: 'Qual seria o melhor para uma família de 4 pessoas?',
          type: 'text',
          sender: 'customer',
          timestamp: new Date(Date.now() - 3000000),
        },
        {
          id: '4',
          chatId: chat.id,
          content: 'Para uma família de 4 pessoas, recomendo nosso Pacote Família Premium que inclui hospedagem, café da manhã e acesso completo às termas.',
          type: 'text',
          sender: 'agent',
          timestamp: new Date(Date.now() - 2500000),
          agentName: 'João - Atendente'
        }
      ]
      setMessages(mockMessages)
      return
    }

    const messagesQuery = query(
      collection(db, 'messages', chat.id, 'messages'),
      orderBy('timestamp', 'asc')
    )

    const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
      const messagesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate() || new Date()
      })) as Message[]

      setMessages(messagesData)
    })

    return unsubscribe
  }, [chat.id, user])

  // Send message
  const handleSendMessage = async () => {
    if (!newMessage.trim() || isLoading) return

    setIsLoading(true)
    try {
      // Se não há usuário real, simular envio
      if (!user) {
        const mockMessage: Message = {
          id: Date.now().toString(),
          chatId: chat.id,
          content: newMessage,
          type: 'text',
          sender: 'agent',
          timestamp: new Date(),
          agentName: 'Demo - Atendente'
        }
        setMessages(prev => [...prev, mockMessage])
        setNewMessage('')
        textareaRef.current?.focus()
        setIsLoading(false)
        return
      }

      // Send via API to GPT Maker
      const response = await fetch('/api/gptmaker/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chatId: chat.id,
          content: newMessage,
          type: 'text'
        })
      })

      if (!response.ok) {
        throw new Error('Failed to send message')
      }

      // Add to Firestore for real-time updates
      await addDoc(collection(db, 'messages', chat.id, 'messages'), {
        chatId: chat.id,
        content: newMessage,
        type: 'text',
        sender: 'agent',
        timestamp: new Date(),
        agentName: user?.displayName || user?.email || 'Agente'
      })

      setNewMessage('')
      textareaRef.current?.focus()
    } catch (error) {
      console.error('Error sending message:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Handle textarea auto-resize
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNewMessage(e.target.value)
    const textarea = e.target
    textarea.style.height = 'auto'
    textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`
  }

  // Handle Enter key
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const chatContent = (
    <div className="h-full flex flex-col bg-white dark:bg-gray-900">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={cn(
              "flex gap-3",
              message.sender === 'customer' ? 'justify-start' : 'justify-end'
            )}
          >
            {message.sender === 'customer' && (
              <Avatar className="h-8 w-8 flex-shrink-0">
                <AvatarImage src={chat.avatar} alt={chat.customerName} />
                <AvatarFallback className="text-xs">
                  {chat.customerName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            )}
            
            <div className={cn(
              "max-w-[80%] rounded-2xl px-4 py-2",
              message.sender === 'customer'
                ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white'
                : message.sender === 'ai'
                ? 'bg-blue-500 text-white'
                : 'bg-thermas-blue-500 text-white'
            )}>
              <p className="text-sm leading-relaxed whitespace-pre-wrap">
                {message.content}
              </p>
              <div className="flex items-center justify-between mt-1">
                <span className={cn(
                  "text-xs opacity-70",
                  message.sender === 'customer' ? 'text-gray-500 dark:text-gray-400' : 'text-white/70'
                )}>
                  {formatDistanceToNow(message.timestamp, { 
                    addSuffix: true, 
                    locale: ptBR 
                  })}
                </span>
                {message.sender !== 'customer' && (
                  <span className="text-xs opacity-70 text-white/70 ml-2">
                    {message.sender === 'ai' ? 'IA' : message.agentName || 'Agente'}
                  </span>
                )}
              </div>
            </div>

            {message.sender !== 'customer' && (
              <Avatar className="h-8 w-8 flex-shrink-0">
                <AvatarFallback className="text-xs bg-thermas-blue-500 text-white">
                  {message.sender === 'ai' ? 'IA' : 'AG'}
                </AvatarFallback>
              </Avatar>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="border-t border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-end gap-3">
          <Button variant="ghost" size="sm" className="h-10 w-10 p-0 flex-shrink-0">
            <Paperclip className="h-4 w-4" />
          </Button>
          
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={newMessage}
              onChange={handleTextareaChange}
              onKeyDown={handleKeyDown}
              placeholder="Digite uma mensagem..."
              className="w-full resize-none rounded-2xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-3 pr-12 text-sm focus:border-thermas-blue-500 focus:outline-none focus:ring-1 focus:ring-thermas-blue-500 dark:text-white"
              rows={1}
              style={{ minHeight: '44px', maxHeight: '120px' }}
            />
            <Button
              onClick={handleSendMessage}
              disabled={!newMessage.trim() || isLoading}
              size="sm"
              className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0 rounded-full bg-thermas-blue-500 hover:bg-thermas-blue-600 disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )

  if (isEmbedded) {
    return chatContent
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="w-full h-full sm:h-[90vh] sm:max-w-2xl sm:rounded-lg bg-white dark:bg-gray-900 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 sm:rounded-t-lg">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={chat.avatar} alt={chat.customerName} />
              <AvatarFallback>
                {chat.customerName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">
                {chat.customerName}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {chat.customerPhone}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
              <Phone className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
              <MoreVertical className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" className="h-9 w-9 p-0" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {chatContent}
      </div>
    </div>
  )
} 