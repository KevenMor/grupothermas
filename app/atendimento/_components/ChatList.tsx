import { Chat } from '@/lib/models'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Archive, ListFilter, Loader2, Search, Plus, Bot, BotOff, User, CheckCircle, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { format, isToday, isYesterday } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useState, useEffect } from 'react'

interface ChatListProps {
  chats: Chat[]
  selectedChat: Chat | null
  onSelectChat: (chat: Chat) => void
  isLoading: boolean
}

const formatTimestamp = (timestamp: string) => {
  const date = new Date(timestamp)
  if (isToday(date)) {
    return format(date, 'HH:mm')
  }
  if (isYesterday(date)) {
    return 'Ontem'
  }
  return format(date, 'dd/MM/yy', { locale: ptBR })
}

// Badge visual de não lidas
const UnreadBadge = ({ count }: { count: number }) => (
  count > 0 ? (
    <span className="ml-2 min-w-[22px] h-[22px] px-2 flex items-center justify-center text-xs font-bold bg-blue-600 text-white rounded-full shadow border-2 border-white/80 animate-bounce">
      {count}
    </span>
  ) : null
)

const ChatListItem = ({ chat, isSelected, onSelectChat }: { chat: Chat, isSelected: boolean, onSelectChat: (chat: Chat) => void }) => {
  const getStatusIcon = () => {
    switch (chat.conversationStatus) {
      case 'waiting':
        return <div title="Aguardando"><Clock className="w-4 h-4 text-yellow-500" /></div>
      case 'ai_active':
        return <div title="IA Ativa"><Bot className="w-4 h-4 text-blue-500" /></div>
      case 'agent_assigned':
        return <div title="Em Atendimento"><User className="w-4 h-4 text-green-500" /></div>
      case 'resolved':
        return <div title="Resolvido"><CheckCircle className="w-4 h-4 text-gray-500" /></div>
      default:
        return null
    }
  }

  const getStatusColor = () => {
    switch (chat.conversationStatus) {
      case 'waiting': return 'border-l-yellow-500'
      case 'ai_active': return 'border-l-blue-500'
      case 'agent_assigned': return 'border-l-green-500'
      case 'resolved': return 'border-l-gray-400'
      default: return 'border-l-gray-200 dark:border-l-gray-700'
    }
  }

  return (
    <div
      className={`flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all rounded-lg ${isSelected ? 'bg-blue-100 dark:bg-blue-800/40' : ''}`}
      onClick={() => onSelectChat(chat)}
    >
      <div className="flex items-center gap-3">
        <div className="relative">
          <Avatar className="w-12 h-12 border-2 border-transparent">
            <AvatarImage src={chat.customerAvatar} />
            <AvatarFallback className="text-lg bg-gray-200 dark:bg-gray-700">
              {chat.customerName.charAt(0)}
            </AvatarFallback>
          </Avatar>
          {chat.unreadCount > 0 && (
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white dark:border-gray-800 animate-pulse"></div>
          )}
        </div>
        <div className="flex-grow truncate border-b border-gray-200 dark:border-gray-700 pb-3">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <h3 className={cn(
                "font-semibold text-sm truncate flex items-center gap-2",
                chat.unreadCount > 0 ? "text-gray-900 dark:text-gray-100 font-bold" : "text-gray-800 dark:text-gray-100"
              )}>
                {chat.customerName}
              </h3>
              {getStatusIcon()}
              {chat.aiEnabled && !chat.aiPaused && (
                <div title="IA Ativa"><Bot className="w-3 h-3 text-blue-400" /></div>
              )}
              {chat.aiPaused && (
                <div title="IA Pausada"><BotOff className="w-3 h-3 text-gray-400" /></div>
              )}
            </div>
            <div className="flex flex-col items-end gap-1">
              <span className="text-xs text-gray-500 dark:text-gray-400">{formatTimestamp(chat.timestamp)}</span>
            </div>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{chat.customerPhone}</p>
          <p className={cn(
            "text-sm truncate",
            chat.unreadCount > 0 ? "text-gray-900 dark:text-gray-100 font-medium" : "text-gray-500 dark:text-gray-400"
          )}>
            {chat.lastMessage}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <UnreadBadge count={chat.unreadCount} />
      </div>
    </div>
  )
}

export function ChatList(props: ChatListProps) {
  console.debug('[ChatList] props:', props)
  const [searchTerm, setSearchTerm] = useState('')
  const [showAddContact, setShowAddContact] = useState(false)
  const [newContact, setNewContact] = useState({ name: '', phone: '' })
  const [isSaving, setIsSaving] = useState(false)

  // Calcular total de mensagens não lidas
  const totalUnread = props.chats.reduce((sum, chat) => sum + chat.unreadCount, 0)
  const unreadChats = props.chats.filter(chat => chat.unreadCount > 0).length

  // Filtrar chats por status
  const chatsByStatus = {
    waiting: props.chats.filter(chat => chat.conversationStatus === 'waiting'),
    ai_active: props.chats.filter(chat => chat.conversationStatus === 'ai_active'),
    agent_assigned: props.chats.filter(chat => chat.conversationStatus === 'agent_assigned'),
    resolved: props.chats.filter(chat => chat.conversationStatus === 'resolved')
  }

  // Filtrar por termo de busca
  const filteredChats = props.chats.filter(chat =>
    chat.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    chat.customerPhone.includes(searchTerm) ||
    chat.lastMessage.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const filteredChatsByStatus = {
    waiting: filteredChats.filter(chat => chat.conversationStatus === 'waiting'),
    ai_active: filteredChats.filter(chat => chat.conversationStatus === 'ai_active'),
    agent_assigned: filteredChats.filter(chat => chat.conversationStatus === 'agent_assigned'),
    resolved: filteredChats.filter(chat => chat.conversationStatus === 'resolved')
  }

  const handleAddContact = async () => {
    if (!newContact.name.trim() || !newContact.phone.trim()) return
    setIsSaving(true)
    try {
      // Chame a API para criar o contato/conversa
      await fetch('/api/atendimento/chats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newContact.name, phone: newContact.phone })
      })
      setShowAddContact(false)
      setNewContact({ name: '', phone: '' })
      // Opcional: poderia forçar um refresh dos chats aqui
    } finally {
      setIsSaving(false)
    }
  }

  useEffect(() => {
    if (totalUnread > 0) {
      const audio = new Audio('https://cdn.pixabay.com/audio/2022/07/26/audio_124bfa1c82.mp3')
      audio.play().catch(() => {})
    }
  }, [totalUnread])

  return (
    <div className="w-[380px] border-r border-gray-200 dark:border-gray-700 flex flex-col bg-gray-50 dark:bg-gray-800/50">
      {/* Botão fixo para adicionar contato */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-gray-700 dark:text-gray-100 text-lg">Conversas</span>
          {/* Indicador de mensagens pendentes */}
          {totalUnread > 0 && (
            <div className="flex items-center gap-1 px-2 py-1 bg-red-100 dark:bg-red-900/30 rounded-full">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              <span className="text-xs font-medium text-red-700 dark:text-red-300">
                {totalUnread} não lida{totalUnread > 1 ? 's' : ''}
              </span>
            </div>
          )}
        </div>
        <Button variant="outline" size="icon" className="border-green-600 text-green-600 hover:bg-green-50" onClick={() => setShowAddContact(true)}>
          <Plus className="w-6 h-6" />
        </Button>
      </div>
      
      <Tabs defaultValue="chats" className="flex-grow flex flex-col">
        <TabsList className="px-4 grid grid-cols-4">
          <TabsTrigger value="chats" className="text-xs relative">
            Chats ({chatsByStatus.waiting.length})
            {chatsByStatus.waiting.some(chat => chat.unreadCount > 0) && (
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
            )}
          </TabsTrigger>
          <TabsTrigger value="ia" className="text-xs relative">
            IA ({chatsByStatus.ai_active.length})
            {chatsByStatus.ai_active.some(chat => chat.unreadCount > 0) && (
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
            )}
          </TabsTrigger>
          <TabsTrigger value="andamento" className="text-xs relative">
            Andamento ({chatsByStatus.agent_assigned.length})
            {chatsByStatus.agent_assigned.some(chat => chat.unreadCount > 0) && (
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
            )}
          </TabsTrigger>
          <TabsTrigger value="resolvidos" className="text-xs">
            Resolvidos ({chatsByStatus.resolved.length})
          </TabsTrigger>
        </TabsList>

        <div className="flex-grow overflow-y-auto">
          {/* Aba Chats - Conversas aguardando */}
          <TabsContent value="chats" className="m-0">
            {props.isLoading ? (
              <div className="flex justify-center items-center h-full p-8">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
              </div>
            ) : (
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredChatsByStatus.waiting.map((chat) => (
                  <ChatListItem
                    key={chat.id}
                    chat={chat}
                    isSelected={props.selectedChat?.id === chat.id}
                    onSelectChat={props.onSelectChat}
                  />
                ))}
                {filteredChatsByStatus.waiting.length === 0 && (
                  <div className="p-8 text-center text-gray-500">
                    <p>Nenhuma conversa aguardando</p>
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          {/* Aba IA - Conversas com IA ativa */}
          <TabsContent value="ia" className="m-0">
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredChatsByStatus.ai_active.map((chat) => (
                <ChatListItem
                  key={chat.id}
                  chat={chat}
                  isSelected={props.selectedChat?.id === chat.id}
                  onSelectChat={props.onSelectChat}
                />
              ))}
              {filteredChatsByStatus.ai_active.length === 0 && (
                <div className="p-8 text-center text-gray-500">
                  <p>Nenhuma conversa com IA ativa</p>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Aba Andamento - Conversas com agentes */}
          <TabsContent value="andamento" className="m-0">
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredChatsByStatus.agent_assigned.map((chat) => (
                <ChatListItem
                  key={chat.id}
                  chat={chat}
                  isSelected={props.selectedChat?.id === chat.id}
                  onSelectChat={props.onSelectChat}
                />
              ))}
              {filteredChatsByStatus.agent_assigned.length === 0 && (
                <div className="p-8 text-center text-gray-500">
                  <p>Nenhuma conversa em andamento</p>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Aba Resolvidos */}
          <TabsContent value="resolvidos" className="m-0">
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredChatsByStatus.resolved.map((chat) => (
                <ChatListItem
                  key={chat.id}
                  chat={chat}
                  isSelected={props.selectedChat?.id === chat.id}
                  onSelectChat={props.onSelectChat}
                />
              ))}
              {filteredChatsByStatus.resolved.length === 0 && (
                <div className="p-8 text-center text-gray-500">
                  <p>Nenhuma conversa resolvida</p>
                </div>
              )}
            </div>
          </TabsContent>
        </div>
        
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <Button variant="ghost" className="w-full justify-start text-gray-600 dark:text-gray-300">
            <Archive className="w-4 h-4 mr-3" />
            Conversas arquivadas
          </Button>
        </div>
      </Tabs>
      {/* Modal de adicionar contato */}
      {showAddContact && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded-lg p-6 w-96 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Adicionar Contato</h3>
              <Button size="sm" variant="ghost" onClick={() => setShowAddContact(false)}>
                X
              </Button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Nome</label>
                <Input
                  value={newContact.name}
                  onChange={e => setNewContact(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Nome do contato"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Telefone</label>
                <Input
                  value={newContact.phone}
                  onChange={e => setNewContact(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="Ex: 5511999999999"
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleAddContact} className="flex-1" disabled={isSaving}>
                  {isSaving ? 'Salvando...' : 'Adicionar'}
                </Button>
                <Button variant="outline" onClick={() => setShowAddContact(false)} className="flex-1">
                  Cancelar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 