'use client'

import { useState, useEffect, useRef } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Send, 
  Search, 
  Phone, 
  MoreVertical, 
  MessageSquare,
  User,
  Clock,
  Check,
  CheckCheck
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { EmptyState } from './EmptyState'
import { MessageInput } from './MessageInput'

interface WhatsAppContact {
  id: string
  phone: string
  name: string
  lastMessage: string
  lastMessageTime: Date
  unreadCount: number
  messageCount: number
}

interface WhatsAppMessage {
  id: string
  sessionId: string
  from: string
  to: string
  body: string
  type: string
  timestamp: Date
  fromMe: boolean
  status: 'sent' | 'delivered' | 'read'
}

interface WhatsAppChatProps {
  sessionId: string
  sessionName: string
}

export function WhatsAppChat({ sessionId, sessionName }: WhatsAppChatProps) {
  const [contacts, setContacts] = useState<WhatsAppContact[]>([])
  const [selectedContact, setSelectedContact] = useState<WhatsAppContact | null>(null)
  const [messages, setMessages] = useState<WhatsAppMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Load contacts
  useEffect(() => {
    loadContacts()
  }, [sessionId])

  // Load messages when contact is selected
  useEffect(() => {
    if (selectedContact) {
      loadMessages(selectedContact.phone)
    }
  }, [selectedContact, sessionId])

  const loadContacts = async () => {
    try {
      const response = await fetch(`/api/whatsapp/sessions/${sessionId}/contacts`)
      if (response.ok) {
        const data = await response.json()
        setContacts(data.contacts || [])
      }
    } catch (error) {
      console.error('Erro ao carregar contatos:', error)
    }
  }

  const loadSampleData = async () => {
    try {
      const response = await fetch(`/api/whatsapp/sessions/${sessionId}/seed`, {
        method: 'POST'
      })
      if (response.ok) {
        await loadContacts() // Recarregar contatos após adicionar dados
      }
    } catch (error) {
      console.error('Erro ao carregar dados de exemplo:', error)
    }
  }

  const loadMessages = async (contactPhone: string) => {
    try {
      const response = await fetch(`/api/whatsapp/sessions/${sessionId}/messages?contact=${contactPhone}`)
      if (response.ok) {
        const data = await response.json()
        setMessages(data.messages || [])
      }
    } catch (error) {
      console.error('Erro ao carregar mensagens:', error)
    }
  }

  const sendMessage = async (messageText: string) => {
    if (!selectedContact || isLoading) return

    setIsLoading(true)
    try {
      const response = await fetch(`/api/whatsapp/sessions/${sessionId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: selectedContact.phone,
          message: messageText,
          type: 'text'
        })
      })

      if (response.ok) {
        const sentMessage = await response.json()
        setMessages(prev => [...prev, sentMessage])
        loadContacts() // Recarregar contatos para atualizar última mensagem
      }
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const filteredContacts = contacts.filter(contact =>
    contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.phone.includes(searchTerm)
  )

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'read':
        return <CheckCheck className="w-4 h-4 text-blue-500" />
      case 'delivered':
        return <CheckCheck className="w-4 h-4 text-gray-400" />
      case 'sent':
        return <Check className="w-4 h-4 text-gray-400" />
      default:
        return <Clock className="w-4 h-4 text-gray-400" />
    }
  }

  return (
    <div className="flex h-[calc(100vh-200px)] bg-white dark:bg-gray-900 rounded-lg border">
      {/* Lista de Contatos */}
      <div className="w-1/3 border-r border-gray-200 dark:border-gray-700 flex flex-col">
        <CardHeader className="border-b border-gray-200 dark:border-gray-700">
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            {sessionName}
          </CardTitle>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Buscar contatos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardHeader>

        <div className="flex-1 overflow-y-auto">
          {filteredContacts.length === 0 ? (
            <EmptyState 
              type="no-contacts" 
              onAction={loadSampleData}
            />
          ) : (
            filteredContacts.map((contact) => (
              <div
                key={contact.id}
                className={`p-4 border-b border-gray-100 dark:border-gray-800 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
                  selectedContact?.id === contact.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                }`}
                onClick={() => setSelectedContact(contact)}
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-blue-500 text-white">
                      {contact.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-gray-900 dark:text-white truncate">
                        {contact.name}
                      </h3>
                      {contact.unreadCount > 0 && (
                        <Badge variant="destructive" className="ml-2">
                          {contact.unreadCount}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                      {contact.lastMessage}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                      {formatDistanceToNow(contact.lastMessageTime, { 
                        addSuffix: true, 
                        locale: ptBR 
                      })}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Área de Chat */}
      <div className="flex-1 flex flex-col">
        {selectedContact ? (
          <>
            {/* Header do Chat */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-blue-500 text-white">
                    {selectedContact.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white">
                    {selectedContact.name}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {selectedContact.phone}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm">
                  <Phone className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Mensagens */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.fromMe ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    message.fromMe 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-200 text-gray-900 dark:bg-gray-700 dark:text-gray-100'
                  }`}>
                    <div className="text-sm">{message.body}</div>
                    <div className={`flex items-center justify-between mt-1 ${
                      message.fromMe ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'
                    }`}>
                      <span className="text-xs">
                        {formatDistanceToNow(message.timestamp, { 
                          addSuffix: true, 
                          locale: ptBR 
                        })}
                      </span>
                      {message.fromMe && (
                        <span className="ml-2">
                          {getStatusIcon(message.status)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input de Mensagem */}
            <MessageInput
              onSendMessage={sendMessage}
              isLoading={isLoading}
              disabled={!selectedContact}
            />
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500 dark:text-gray-400">
            <div className="text-center">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Selecione um contato para iniciar uma conversa</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 