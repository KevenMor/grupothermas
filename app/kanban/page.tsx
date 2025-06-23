'use client'

import { useState, useEffect } from 'react'
import { AppLayout } from '@/components/layout/app-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar } from '@/components/ui/avatar'
import { 
  MessageSquare, 
  Clock, 
  User,
  Bot,
  Zap,
  Calendar,
  CreditCard,
  HeadphonesIcon,
  ArrowRight,
  Phone,
  Mail,
  MoreVertical,
  Eye
} from 'lucide-react'
import Link from 'next/link'

interface Conversation {
  id: string
  customerName: string
  customerPhone: string
  customerEmail?: string
  lastMessage: string
  timestamp: Date
  status: 'new' | 'in_progress' | 'waiting_customer' | 'resolved'
  priority: 'low' | 'medium' | 'high'
  unreadCount: number
  aiActive: boolean
  lastWebhook?: string
  tags: string[]
  assignedTo?: string
}

const mockConversations: Conversation[] = [
  {
    id: '1',
    customerName: 'Maria Silva',
    customerPhone: '+55 11 99999-9999',
    customerEmail: 'maria@email.com',
    lastMessage: 'Gostaria de saber sobre pacotes para Caldas Novas',
    timestamp: new Date(Date.now() - 5 * 60 * 1000),
    status: 'new',
    priority: 'high',
    unreadCount: 3,
    aiActive: true,
    lastWebhook: 'leadCapture',
    tags: ['lead', 'caldas-novas'],
    assignedTo: 'IA Thermas'
  },
  {
    id: '2',
    customerName: 'João Santos',
    customerPhone: '+55 11 88888-8888',
    lastMessage: 'Preciso cancelar minha reserva',
    timestamp: new Date(Date.now() - 15 * 60 * 1000),
    status: 'in_progress',
    priority: 'medium',
    unreadCount: 1,
    aiActive: false,
    lastWebhook: 'supportTicket',
    tags: ['cancelamento', 'urgente'],
    assignedTo: 'Carlos Atendente'
  },
  {
    id: '3',
    customerName: 'Ana Costa',
    customerPhone: '+55 11 77777-7777',
    lastMessage: 'Quero fechar o pacote que conversamos',
    timestamp: new Date(Date.now() - 30 * 60 * 1000),
    status: 'waiting_customer',
    priority: 'high',
    unreadCount: 0,
    aiActive: true,
    lastWebhook: 'paymentProcess',
    tags: ['hot-lead', 'fechamento'],
    assignedTo: 'IA Thermas'
  },
  {
    id: '4',
    customerName: 'Pedro Oliveira',
    customerPhone: '+55 11 66666-6666',
    customerEmail: 'pedro@email.com',
    lastMessage: 'Obrigado pelo atendimento!',
    timestamp: new Date(Date.now() - 60 * 60 * 1000),
    status: 'resolved',
    priority: 'low',
    unreadCount: 0,
    aiActive: true,
    tags: ['satisfeito'],
    assignedTo: 'IA Thermas'
  }
]

const statusConfig = {
  new: {
    title: 'Novas Conversas',
    color: 'bg-blue-50 border-blue-200',
    headerColor: 'bg-blue-100',
    icon: MessageSquare,
    iconColor: 'text-blue-600'
  },
  in_progress: {
    title: 'Em Atendimento',
    color: 'bg-yellow-50 border-yellow-200',
    headerColor: 'bg-yellow-100',
    icon: Clock,
    iconColor: 'text-yellow-600'
  },
  waiting_customer: {
    title: 'Aguardando Cliente',
    color: 'bg-purple-50 border-purple-200',
    headerColor: 'bg-purple-100',
    icon: User,
    iconColor: 'text-purple-600'
  },
  resolved: {
    title: 'Resolvidas',
    color: 'bg-green-50 border-green-200',
    headerColor: 'bg-green-100',
    icon: MessageSquare,
    iconColor: 'text-green-600'
  }
}

export default function KanbanPage() {
  const [conversations, setConversations] = useState<Conversation[]>(mockConversations)
  const [filter, setFilter] = useState<'all' | 'ai' | 'human'>('all')

  const filteredConversations = conversations.filter(conv => {
    if (filter === 'ai') return conv.aiActive
    if (filter === 'human') return !conv.aiActive
    return true
  })

  const getConversationsByStatus = (status: string) => {
    return filteredConversations.filter(conv => conv.status === status)
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low': return 'bg-green-100 text-green-800 border-green-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getWebhookIcon = (webhook: string) => {
    switch (webhook) {
      case 'leadCapture': return <Zap className="w-3 h-3" />
      case 'appointmentBooking': return <Calendar className="w-3 h-3" />
      case 'paymentProcess': return <CreditCard className="w-3 h-3" />
      case 'supportTicket': return <HeadphonesIcon className="w-3 h-3" />
      case 'humanHandoff': return <ArrowRight className="w-3 h-3" />
      default: return null
    }
  }

  const getTimeAgo = (timestamp: Date) => {
    const now = new Date()
    const diff = now.getTime() - timestamp.getTime()
    const minutes = Math.floor(diff / 60000)
    
    if (minutes < 1) return 'agora'
    if (minutes < 60) return `${minutes}m`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h`
    const days = Math.floor(hours / 24)
    return `${days}d`
  }

  return (
    <AppLayout>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Kanban de Conversas
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Gerencie todas as conversas do WhatsApp com IA integrada
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <Button
                variant={filter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('all')}
              >
                Todas ({conversations.length})
              </Button>
              <Button
                variant={filter === 'ai' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('ai')}
                className="flex items-center space-x-1"
              >
                <Bot className="w-4 h-4" />
                <span>IA ({conversations.filter(c => c.aiActive).length})</span>
              </Button>
              <Button
                variant={filter === 'human' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('human')}
                className="flex items-center space-x-1"
              >
                <User className="w-4 h-4" />
                <span>Humano ({conversations.filter(c => !c.aiActive).length})</span>
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Object.entries(statusConfig).map(([status, config]) => {
            const statusConversations = getConversationsByStatus(status)
            const StatusIcon = config.icon

            return (
              <div key={status} className="flex flex-col">
                <div className={`${config.headerColor} p-3 rounded-t-lg border-b`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <StatusIcon className={`w-5 h-5 ${config.iconColor}`} />
                      <h3 className="font-medium text-gray-900">{config.title}</h3>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {statusConversations.length}
                    </Badge>
                  </div>
                </div>

                <div className={`${config.color} p-3 rounded-b-lg border border-t-0 min-h-[500px] space-y-3`}>
                  {statusConversations.map((conversation) => (
                    <Card key={conversation.id} className="bg-white shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center space-x-2">
                            <Avatar className="w-8 h-8">
                              <div className="w-full h-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-sm font-medium">
                                {conversation.customerName.charAt(0)}
                              </div>
                            </Avatar>
                            <div className="min-w-0 flex-1">
                              <h4 className="text-sm font-medium text-gray-900 truncate">
                                {conversation.customerName}
                              </h4>
                              <div className="flex items-center space-x-1 text-xs text-gray-500">
                                <Phone className="w-3 h-3" />
                                <span className="truncate">{conversation.customerPhone}</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-1">
                            {conversation.aiActive ? (
                              <Bot className="w-4 h-4 text-purple-500" title="IA Ativa" />
                            ) : (
                              <User className="w-4 h-4 text-blue-500" title="Atendimento Humano" />
                            )}
                            <Button variant="ghost" size="icon" className="w-6 h-6">
                              <MoreVertical className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>

                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                          {conversation.lastMessage}
                        </p>

                        <div className="flex items-center justify-between mb-3">
                          <Badge className={`text-xs ${getPriorityColor(conversation.priority)}`}>
                            {conversation.priority}
                          </Badge>
                          <span className="text-xs text-gray-400">
                            {getTimeAgo(conversation.timestamp)}
                          </span>
                        </div>

                        {conversation.lastWebhook && (
                          <div className="flex items-center space-x-1 mb-3 p-2 bg-gray-50 rounded text-xs">
                            {getWebhookIcon(conversation.lastWebhook)}
                            <span className="text-gray-600">
                              Último webhook: {conversation.lastWebhook}
                            </span>
                          </div>
                        )}

                        <div className="flex flex-wrap gap-1 mb-3">
                          {conversation.tags.map((tag) => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>

                        {conversation.unreadCount > 0 && (
                          <div className="flex items-center justify-between mb-3">
                            <Badge variant="destructive" className="text-xs">
                              {conversation.unreadCount} não lidas
                            </Badge>
                          </div>
                        )}

                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">
                            {conversation.assignedTo}
                          </span>
                          <Link href={`/atendimento?customer=${conversation.id}`}>
                            <Button size="sm" variant="outline" className="text-xs">
                              <Eye className="w-3 h-3 mr-1" />
                              Abrir
                            </Button>
                          </Link>
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  {statusConversations.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <StatusIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Nenhuma conversa</p>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Estatísticas Rápidas */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Bot className="w-5 h-5 text-purple-500" />
                <div>
                  <p className="text-sm font-medium">IA Ativa</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {conversations.filter(c => c.aiActive).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Zap className="w-5 h-5 text-yellow-500" />
                <div>
                  <p className="text-sm font-medium">Webhooks Hoje</p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {conversations.filter(c => c.lastWebhook).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Clock className="w-5 h-5 text-orange-500" />
                <div>
                  <p className="text-sm font-medium">Tempo Médio</p>
                  <p className="text-2xl font-bold text-orange-600">8min</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <MessageSquare className="w-5 h-5 text-green-500" />
                <div>
                  <p className="text-sm font-medium">Taxa Resolução</p>
                  <p className="text-2xl font-bold text-green-600">94%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  )
} 