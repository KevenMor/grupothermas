'use client'

import { useState, useEffect } from 'react'
import { AppLayout } from '@/components/layout/app-layout'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar } from '@/components/ui/avatar'
import { 
  MessageSquare, 
  Clock, 
  User,
  Bot,
  Phone,
  MoreVertical,
  Eye,
  CheckCircle,
  AlertCircle,
  PlayCircle,
  UserCheck
} from 'lucide-react'
import Link from 'next/link'
import { Chat } from '@/lib/models'
import toast from 'react-hot-toast'

// Configuração das colunas do Kanban
const KANBAN_COLUMNS = {
  waiting: {
    title: 'Aguardando',
    color: 'bg-blue-50 border-blue-200',
    headerColor: 'bg-blue-500',
    icon: Clock,
    textColor: 'text-blue-600'
  },
  ai_active: {
    title: 'IA Ativa',
    color: 'bg-purple-50 border-purple-200', 
    headerColor: 'bg-purple-500',
    icon: Bot,
    textColor: 'text-purple-600'
  },
  agent_assigned: {
    title: 'Com Agente',
    color: 'bg-yellow-50 border-yellow-200',
    headerColor: 'bg-yellow-500',
    icon: UserCheck,
    textColor: 'text-yellow-600'
  },
  resolved: {
    title: 'Resolvidas',
    color: 'bg-green-50 border-green-200',
    headerColor: 'bg-green-500',
    icon: CheckCircle,
    textColor: 'text-green-600'
  }
}

interface KanbanChat extends Chat {
  conversationStatus: keyof typeof KANBAN_COLUMNS
}

export default function KanbanPage() {
  const [chats, setChats] = useState<KanbanChat[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [draggedItem, setDraggedItem] = useState<KanbanChat | null>(null)
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null)

  // Buscar chats do Firebase
  const fetchChats = async () => {
    try {
      const response = await fetch('/api/atendimento/chats')
      if (!response.ok) throw new Error('Failed to fetch chats')
      
      const data: Chat[] = await response.json()
      
      // Converter para KanbanChat com status padrão
      const kanbanChats: KanbanChat[] = data.map(chat => ({
        ...chat,
        conversationStatus: (chat.conversationStatus as keyof typeof KANBAN_COLUMNS) || 'waiting'
      }))
      
      setChats(kanbanChats)
    } catch (error) {
      console.error('Erro ao carregar chats:', error)
      toast.error('Erro ao carregar conversas')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchChats()
    
    // Polling para atualizar dados a cada 10 segundos
    const interval = setInterval(fetchChats, 10000)
    return () => clearInterval(interval)
  }, [])

  // Agrupar chats por status
  const getChatsByStatus = (status: keyof typeof KANBAN_COLUMNS) => {
    return chats.filter(chat => chat.conversationStatus === status)
  }

  // Atualizar status do chat
  const updateChatStatus = async (chatId: string, newStatus: keyof typeof KANBAN_COLUMNS) => {
    try {
      const response = await fetch('/api/atendimento/ai-control', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chatId,
          action: getActionForStatus(newStatus),
          agentId: 'current-agent'
        })
      })

      if (!response.ok) throw new Error('Falha ao atualizar status')

      // Atualizar localmente
      setChats(prev => prev.map(chat => 
        chat.id === chatId 
          ? { ...chat, conversationStatus: newStatus }
          : chat
      ))

      toast.success('Status atualizado com sucesso!')
    } catch (error) {
      console.error('Erro ao atualizar status:', error)
      toast.error('Erro ao atualizar status')
    }
  }

  // Mapear status para ações da API
  const getActionForStatus = (status: keyof typeof KANBAN_COLUMNS): string => {
    switch (status) {
      case 'waiting': return 'reopen_chat'
      case 'ai_active': return 'activate_ai'
      case 'agent_assigned': return 'assume_chat'
      case 'resolved': return 'mark_resolved'
      default: return 'reopen_chat'
    }
  }

  // Drag and Drop handlers
  const handleDragStart = (e: React.DragEvent, chat: KanbanChat) => {
    setDraggedItem(chat)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent, columnStatus: string) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverColumn(columnStatus)
  }

  const handleDragLeave = () => {
    setDragOverColumn(null)
  }

  const handleDrop = (e: React.DragEvent, targetStatus: keyof typeof KANBAN_COLUMNS) => {
    e.preventDefault()
    setDragOverColumn(null)
    
    if (draggedItem && draggedItem.conversationStatus !== targetStatus) {
      updateChatStatus(draggedItem.id, targetStatus)
    }
    
    setDraggedItem(null)
  }

  // Formatação de tempo
  const getTimeAgo = (timestamp: string) => {
    const now = new Date()
    const time = new Date(timestamp)
    const diff = now.getTime() - time.getTime()
    const minutes = Math.floor(diff / 60000)
    
    if (minutes < 1) return 'agora'
    if (minutes < 60) return `${minutes}m`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h`
    const days = Math.floor(hours / 24)
    return `${days}d`
  }

  if (isLoading) {
    return (
      <AppLayout>
        <div className="p-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-64 mb-4"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-96 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Kanban de Conversas
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Arraste os cards entre as colunas para alterar o status
            </p>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button onClick={fetchChats} variant="outline" size="sm">
              Atualizar
            </Button>
            <Badge variant="secondary">
              {chats.length} conversas
            </Badge>
          </div>
        </div>

        {/* Kanban Board */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 overflow-x-auto">
          {Object.entries(KANBAN_COLUMNS).map(([status, config]) => {
            const columnChats = getChatsByStatus(status as keyof typeof KANBAN_COLUMNS)
            const StatusIcon = config.icon
            const isDragOver = dragOverColumn === status

            return (
              <div 
                key={status}
                className={`flex flex-col min-h-[600px] rounded-lg border-2 transition-all ${
                  isDragOver 
                    ? 'border-blue-400 bg-blue-50 scale-105' 
                    : config.color
                }`}
                onDragOver={(e) => handleDragOver(e, status)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, status as keyof typeof KANBAN_COLUMNS)}
              >
                {/* Column Header */}
                <div className={`${config.headerColor} text-white p-4 rounded-t-lg flex items-center justify-between`}>
                  <div className="flex items-center space-x-2">
                    <StatusIcon className="w-5 h-5" />
                    <h3 className="font-semibold">{config.title}</h3>
                  </div>
                  <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                    {columnChats.length}
                  </Badge>
                </div>

                {/* Cards Container */}
                <div className="flex-1 p-3 space-y-3 overflow-y-auto">
                  {columnChats.map((chat) => (
                    <Card 
                      key={chat.id}
                      className="bg-white shadow-sm hover:shadow-lg transition-all cursor-move border hover:border-gray-300"
                      draggable
                      onDragStart={(e) => handleDragStart(e, chat)}
                    >
                      <CardContent className="p-4">
                        {/* Header com Avatar e Nome */}
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center space-x-3 flex-1 min-w-0">
                            <Avatar className="w-10 h-10 flex-shrink-0">
                              <div className="w-full h-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-sm font-medium">
                                {chat.customerName.charAt(0)}
                              </div>
                            </Avatar>
                            <div className="min-w-0 flex-1">
                              <h4 className="text-sm font-semibold text-gray-900 truncate">
                                {chat.customerName}
                              </h4>
                              <div className="flex items-center space-x-1 text-xs text-gray-500">
                                <Phone className="w-3 h-3" />
                                <span className="truncate">{chat.customerPhone}</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-1 flex-shrink-0">
                            {chat.aiEnabled && !chat.aiPaused ? (
                              <span title="IA Ativa">
                                <Bot className="w-4 h-4 text-purple-500" />
                              </span>
                            ) : (
                              <span title="Atendimento Humano">
                                <User className="w-4 h-4 text-blue-500" />
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Última Mensagem */}
                        <p className="text-sm text-gray-600 mb-3 line-clamp-2 leading-relaxed">
                          {chat.lastMessage}
                        </p>

                        {/* Badges e Tempo */}
                        <div className="flex items-center justify-between mb-3">
                          {chat.unreadCount > 0 && (
                            <Badge variant="destructive" className="text-xs">
                              {chat.unreadCount} não lida{chat.unreadCount > 1 ? 's' : ''}
                            </Badge>
                          )}
                          <span className="text-xs text-gray-400 ml-auto">
                            {getTimeAgo(chat.timestamp)}
                          </span>
                        </div>

                        {/* Ações */}
                        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                          <div className="flex items-center space-x-2">
                            {chat.assignedAgent && (
                              <span className="text-xs text-gray-500 truncate">
                                {chat.assignedAgent}
                              </span>
                            )}
                          </div>
                          
                          <Link href={`/atendimento?phone=${chat.customerPhone}`}>
                            <Button size="sm" variant="outline" className="text-xs h-7">
                              <Eye className="w-3 h-3 mr-1" />
                              Abrir
                            </Button>
                          </Link>
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  {/* Empty State */}
                  {columnChats.length === 0 && (
                    <div className="text-center py-12 text-gray-400">
                      <StatusIcon className="w-12 h-12 mx-auto mb-3 opacity-30" />
                      <p className="text-sm">Nenhuma conversa</p>
                      <p className="text-xs mt-1">
                        Arraste cards aqui para alterar o status
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Estatísticas */}
        <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm">Total</p>
                  <p className="text-2xl font-bold">{chats.length}</p>
                </div>
                <MessageSquare className="w-8 h-8 text-blue-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm">IA Ativa</p>
                  <p className="text-2xl font-bold">
                    {chats.filter(c => c.aiEnabled && !c.aiPaused).length}
                  </p>
                </div>
                <Bot className="w-8 h-8 text-purple-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm">Com Agente</p>
                  <p className="text-2xl font-bold">
                    {getChatsByStatus('agent_assigned').length}
                  </p>
                </div>
                <UserCheck className="w-8 h-8 text-blue-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm">Resolvidas</p>
                  <p className="text-2xl font-bold">
                    {getChatsByStatus('resolved').length}
                  </p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-200" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  )
} 