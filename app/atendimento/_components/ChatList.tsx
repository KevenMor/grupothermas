import { Chat } from '@/lib/models'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Archive, ListFilter, Loader2, Search, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { format, isToday, isYesterday } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useState } from 'react'

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

const ChatListItem = ({ chat, isSelected, onSelectChat }: { chat: Chat, isSelected: boolean, onSelectChat: (chat: Chat) => void }) => (
  <button
    onClick={() => onSelectChat(chat)}
    className={cn(
      "w-full text-left flex items-start p-3 gap-3 transition-colors",
      isSelected ? "bg-white dark:bg-gray-800" : "hover:bg-gray-100 dark:hover:bg-gray-700/50"
    )}
  >
    <Avatar className="w-12 h-12 border-2 border-transparent">
      <AvatarImage src={chat.customerAvatar} />
      <AvatarFallback className="text-lg bg-gray-200 dark:bg-gray-700">
        {chat.customerName.charAt(0)}
      </AvatarFallback>
    </Avatar>
    <div className="flex-grow truncate border-b border-gray-200 dark:border-gray-700 pb-3">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="font-semibold text-sm text-gray-800 dark:text-gray-100 truncate">{chat.customerName}</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{chat.customerPhone}</p>
        </div>
        <span className="text-xs text-gray-500 dark:text-gray-400">{formatTimestamp(chat.timestamp)}</span>
      </div>
      <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{chat.lastMessage}</p>
      {chat.unreadCount > 0 && (
        <div className="flex justify-end">
          <Badge className="bg-green-500 text-white rounded-full h-5 w-5 flex items-center justify-center p-0 mt-1">
            {chat.unreadCount}
          </Badge>
        </div>
      )}
    </div>
  </button>
)

export function ChatList({ chats, selectedChat, onSelectChat, isLoading }: ChatListProps) {
  const [showAddContact, setShowAddContact] = useState(false)
  const [newContact, setNewContact] = useState({ name: '', phone: '' })
  const [isSaving, setIsSaving] = useState(false)

  // TODO: Implement filtering logic for tabs
  const filteredChats = chats

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

  return (
    <div className="w-[380px] border-r border-gray-200 dark:border-gray-700 flex flex-col bg-gray-50 dark:bg-gray-800/50">
      {/* Botão fixo para adicionar contato */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 sticky top-0 z-10">
        <span className="font-semibold text-gray-700 dark:text-gray-100 text-lg">Conversas</span>
        <Button variant="outline" size="icon" className="border-green-600 text-green-600 hover:bg-green-50" onClick={() => setShowAddContact(true)}>
          <Plus className="w-6 h-6" />
        </Button>
      </div>
      
      <Tabs defaultValue="chats" className="flex-grow flex flex-col">
        <TabsList className="px-4">
          <TabsTrigger value="chats" className="flex-1">Chats ({filteredChats.length})</TabsTrigger>
          <TabsTrigger value="espera" className="flex-1">Espera (0)</TabsTrigger>
          <TabsTrigger value="andamento" className="flex-1">Andamento (0)</TabsTrigger>
        </TabsList>

        <div className="flex-grow overflow-y-auto">
          <TabsContent value="chats" className="m-0">
            {isLoading ? (
              <div className="flex justify-center items-center h-full p-8">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
              </div>
            ) : (
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                 {filteredChats.map((chat) => (
                    <ChatListItem
                      key={chat.id}
                      chat={chat}
                      isSelected={selectedChat?.id === chat.id}
                      onSelectChat={onSelectChat}
                    />
                  ))}
              </div>
            )}
          </TabsContent>
          {/* TODO: Add content for other tabs */}
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